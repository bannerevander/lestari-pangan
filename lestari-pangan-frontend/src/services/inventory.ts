import { supabase } from '../lib/supabase/client'
import { toAppError } from '../lib/supabase/errors'
import { rpc } from '../lib/supabase/rpc'
import type { FoodCategory, FoodRecord, Role, Unit } from '../data/types'
import { idFromCode, stampLabel } from './mappers'

/** Modul inventory (Catat Pangan): catatan, pergerakan, koreksi (RPC inventory_*). */

const RECORD_SELECT =
  'code, name, category, unit, quantity, estimate, storage, status, created_at, source:transfers!food_records_source_transfer_fk(code, donor:profiles!transfers_donor_id_fkey(org_name)), moves:record_movements(kind, label, delta, note, at)'

interface RecordRow {
  code: string
  name: string
  category: string
  unit: string
  quantity: number
  estimate: boolean
  storage: string
  status: string
  created_at: string
  source: { code: string; donor: { org_name: string } | null } | null
  moves: { kind: string; label: string; delta: number; note: string | null; at: string }[]
}

const toRecord = (owner: Role) => (r: RecordRow): FoodRecord => ({
  id: r.code,
  owner,
  name: r.name,
  category: r.category as FoodCategory,
  quantity: Number(r.quantity),
  unit: r.unit as Unit,
  estimate: r.estimate,
  date: stampLabel(r.created_at),
  storage: r.storage || '—',
  status: r.status as FoodRecord['status'],
  source: r.source ? `Diterima dari ${r.source.donor?.org_name ?? 'pemberi'} (${r.source.code})` : undefined,
  // Baris "Dicatat"/"Diterima" awal sudah tampil sebagai data catatan; riwayat hanya pergerakan sesudahnya.
  history: [...r.moves]
    .sort((a, b) => a.at.localeCompare(b.at))
    .filter((m) => m.kind !== 'masuk')
    .map((m) => ({ label: m.label, delta: Number(m.delta), at: stampLabel(m.at), note: m.note ?? undefined, kind: m.kind as 'keluar' | 'koreksi' })),
})

/** Catatan pangan milik sendiri (RLS memfilter di server). */
export async function loadRecords(owner: Role): Promise<FoodRecord[]> {
  const { data, error } = await supabase.from('food_records').select(RECORD_SELECT).order('created_at', { ascending: false }).limit(200)
  if (error) throw toAppError(error)
  return (data as unknown as RecordRow[]).map(toRecord(owner))
}

export const addRecord = (clientId: string, r: { name: string; category: string; quantity: number; unit: string; storage: string; estimate: boolean }) =>
  rpc('inventory_add_record', {
    p_client_id: clientId,
    p_name: r.name,
    p_category: r.category,
    p_quantity: r.quantity,
    p_unit: r.unit,
    p_storage: r.storage === '—' ? '' : r.storage,
    p_estimate: r.estimate,
  })

export const moveRecord = (clientId: string, code: string, kind: string, quantity: number, note?: string) =>
  rpc('inventory_move_record', { p_client_id: clientId, p_id: idFromCode(code), p_kind: kind, p_quantity: quantity, p_note: note })

export const correctRecord = (clientId: string, code: string, quantity: number, reason: string) =>
  rpc('inventory_correct_record', { p_client_id: clientId, p_id: idFromCode(code), p_quantity: quantity, p_reason: reason })
