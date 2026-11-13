import { supabase } from '../lib/supabase/client'
import { toAppError } from '../lib/supabase/errors'
import { rpc } from '../lib/supabase/rpc'
import type { Issue, Role } from '../data/types'
import { idFromCode, stampLabel } from './mappers'
import { uploadPhoto } from './photos'

/** Modul issues: laporan kendala dan keberatan (RPC issues_*). */

const ISSUE_SELECT =
  'code, category, description, status, resolution, created_at, transfer:transfers!issues_transfer_id_fkey(code), reporter:profiles!issues_reporter_id_fkey(role), events:issue_events(label, at, note, actor:profiles!issue_events_actor_id_fkey(org_name))'

interface IssueRow {
  code: string
  category: string
  description: string
  status: string
  resolution: string | null
  created_at: string
  transfer: { code: string } | null
  reporter: { role: string } | null
  events: { label: string; at: string; note: string | null; actor: { org_name: string } | null }[]
}

export async function loadIssues(): Promise<Issue[]> {
  const { data, error } = await supabase.from('issues').select(ISSUE_SELECT).order('created_at', { ascending: false }).limit(100)
  if (error) throw toAppError(error)
  return (data as unknown as IssueRow[]).map((r) => ({
    id: r.code,
    transferId: r.transfer?.code ?? '',
    role: (r.reporter?.role ?? 'penerima') as Role,
    category: r.category,
    description: r.description,
    status: r.status as Issue['status'],
    at: stampLabel(r.created_at),
    resolution: r.resolution ?? undefined,
    timeline: [...r.events]
      .sort((a, b) => a.at.localeCompare(b.at))
      .map((e) => ({ label: e.label, at: stampLabel(e.at), by: e.actor?.org_name ?? 'Tim Lestari Pangan', note: e.note ?? undefined })),
  }))
}

/** Unggah foto kondisi (bucket privat: hanya pelapor dan admin ops); mengembalikan path untuk reportIssue. */
export const uploadIssuePhoto = (file: File) => uploadPhoto('issue-photos', file)

/** Mengembalikan kode laporan baru (mis. "ISS-12"). */
export const reportIssue = async (clientId: string, transferCode: string, category: string, description: string, photoPath?: string) =>
  (await rpc<{ code: string }>('issues_report', { p_client_id: clientId, p_transfer_id: idFromCode(transferCode), p_category: category, p_description: description, p_photo_path: photoPath }))!.code

export const objectIssue = (code: string, note: string) => rpc('issues_object', { p_id: idFromCode(code), p_note: note })
