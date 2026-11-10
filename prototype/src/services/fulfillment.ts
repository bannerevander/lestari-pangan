import { supabase } from '../lib/supabase/client'
import { toAppError } from '../lib/supabase/errors'
import { rpc } from '../lib/supabase/rpc'
import type { Transfer } from '../data/types'
import type { CourierTask } from '../state/AppState'
import { dateLabel, idFromCode, stampLabel, timeOf, toTransfer, TRANSFER_SELECT, type TransferRow } from './mappers'

/** Modul fulfillment: penyaluran, serah terima, distribusi (architecture.md §9, RPC fulfillment_*). */

/** Penyaluran yang melibatkan pengguna ini (RLS memfilter di server). */
export async function loadTransfers(): Promise<Transfer[]> {
  if (!supabase) return []
  const { data, error } = await supabase.from('transfers').select(TRANSFER_SELECT).order('created_at', { ascending: false }).limit(200)
  if (error) throw toAppError(error)
  return (data as unknown as TransferRow[]).map(toTransfer)
}

export const handover = (code: string, quantity: number, note?: string) =>
  rpc('fulfillment_handover', { p_id: idFromCode(code), p_quantity: quantity, p_note: note })

export const receive = (code: string, received: number, reason?: string, note?: string) =>
  rpc('fulfillment_receive', { p_id: idFromCode(code), p_received: received, p_reason: reason, p_note: note })

export const reportDistribution = (code: string, distributed: number, used: number, wasted: number) =>
  rpc('fulfillment_report_distribution', { p_id: idFromCode(code), p_distributed: distributed, p_used: used, p_wasted: wasted })

export const respondSchedule = (code: string, accept: boolean) => rpc('fulfillment_respond_schedule', { p_id: idFromCode(code), p_accept: accept })

export const setMethod = (code: string, method: string) => rpc('fulfillment_set_method', { p_id: idFromCode(code), p_method: method })

export const setPrep = (code: string, checks: string[]) => rpc('fulfillment_set_prep', { p_id: idFromCode(code), p_checks: checks })

// ---- Tugas kurir (K01–K04) ----

const PARTY = 'org_name, contact:profile_contacts(pic, address)'
const TASK_SELECT = `code, cost, payer, status, picked, delivered, transfer:transfers!courier_tasks_transfer_id_fkey(code, agreed, unit, window_start, window_end, offer:offers!transfers_offer_id_fkey(name), donor:profiles!transfers_donor_id_fkey(${PARTY}), recipient:profiles!transfers_recipient_id_fkey(${PARTY}), events:transfer_events(label, at, note))`

type Party = { org_name: string; contact: { pic: string; address: string } | null } | null
interface TaskRow {
  code: string
  cost: number
  payer: string
  status: string
  picked: number | null
  delivered: number | null
  transfer: {
    code: string
    agreed: number
    unit: string
    window_start: string
    window_end: string
    offer: { name: string } | null
    donor: Party
    recipient: Party
    events: { label: string; at: string; note: string | null }[]
  }
}

const stop = (p: Party) => ({ name: p?.org_name ?? '—', pic: p?.contact?.pic ?? '', address: p?.contact?.address ?? '', note: '' })

/** Tugas yang ditetapkan ke kurir ini. */
export async function loadTasks(courierId: number): Promise<CourierTask[]> {
  if (!supabase) return []
  const { data, error } = await supabase.from('courier_tasks').select(TASK_SELECT).eq('courier_id', courierId).order('created_at', { ascending: false }).limit(100)
  if (error) throw toAppError(error)
  return (data as unknown as TaskRow[]).map((r) => ({
    id: r.code,
    transferId: r.transfer.code,
    food: r.transfer.offer?.name ?? 'Pangan',
    agreed: Number(r.transfer.agreed),
    unit: r.transfer.unit,
    from: stop(r.transfer.donor),
    to: stop(r.transfer.recipient),
    window: `${dateLabel(r.transfer.window_start)}, ${timeOf(r.transfer.window_start)}–${timeOf(r.transfer.window_end)} WIB`,
    cost: r.cost > 0 ? `Rp${r.cost.toLocaleString('id-ID')} (ditanggung ${r.payer})` : 'Rp0 (relawan mandiri)',
    status: r.status as CourierTask['status'],
    picked: r.picked ?? undefined,
    delivered: r.delivered ?? undefined,
    timeline: [...r.transfer.events].sort((a, b) => a.at.localeCompare(b.at)).map((e) => ({ label: e.label, at: stampLabel(e.at), note: e.note ?? undefined })),
  }))
}

export const taskPickup = (code: string, quantity: number) => rpc('fulfillment_task_pickup', { p_task_id: idFromCode(code), p_quantity: quantity })
export const taskDeliver = (code: string, quantity: number) => rpc('fulfillment_task_deliver', { p_task_id: idFromCode(code), p_quantity: quantity })
export const taskFail = (code: string, reason: string) => rpc('fulfillment_task_fail', { p_task_id: idFromCode(code), p_reason: reason })
