import { supabase } from '../lib/supabase/client'
import { toAppError } from '../lib/supabase/errors'
import { rpc } from '../lib/supabase/rpc'
import { stampLabel } from './mappers'

/** Tiket bantuan dan permintaan penghapusan data (A10, A12; RPC support_create_ticket). */

export interface Ticket {
  id: string
  kind: 'Bantuan' | 'Hapus data'
  topic: string
  related?: string
  message: string
  status: 'Dikirim' | 'Ditangani' | 'Selesai'
  reply?: string
  at: string
}

interface TicketRow {
  code: string
  kind: Ticket['kind']
  topic: string
  related: string | null
  message: string
  status: Ticket['status']
  reply: string | null
  created_at: string
}

export const TICKET_SELECT = 'code, kind, topic, related, message, status, reply, created_at'

export const toTicket = (t: TicketRow): Ticket => ({
  id: t.code,
  kind: t.kind,
  topic: t.topic,
  related: t.related ?? undefined,
  message: t.message,
  status: t.status,
  reply: t.reply ?? undefined,
  at: stampLabel(t.created_at),
})

/** Tiket milik akun ini (RLS). shortcut: tabel baru belum ada di database.types.ts; perbarui tipe hasil generate lalu hapus cast. */
export async function loadTickets(): Promise<Ticket[]> {
  const { data, error } = await supabase.from('support_tickets' as never).select(TICKET_SELECT).order('created_at', { ascending: false }).limit(50)
  if (error) throw toAppError(error)
  return (data as unknown as TicketRow[]).map(toTicket)
}

/** Mengembalikan kode tiket baru (mis. "TKT-3"). */
export const createTicket = async (clientId: string, kind: Ticket['kind'], topic: string, message: string, related?: string) =>
  (await rpc<{ code: string }>('support_create_ticket', { p_client_id: clientId, p_kind: kind, p_topic: topic, p_message: message, p_related: related })).code
