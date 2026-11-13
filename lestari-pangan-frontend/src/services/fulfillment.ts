import { supabase } from '../lib/supabase/client'
import { toAppError } from '../lib/supabase/errors'
import { rpc } from '../lib/supabase/rpc'
import type { Transfer } from '../data/types'
import { idFromCode, toTransfer, TRANSFER_SELECT, type TransferRow } from './mappers'

/** Modul fulfillment: penyaluran, serah terima, distribusi (architecture.md §9, RPC fulfillment_*). */

/** Penyaluran yang melibatkan pengguna ini (RLS memfilter di server). */
export async function loadTransfers(): Promise<Transfer[]> {
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

export const requestFee = (code: string) => rpc('fulfillment_request_fee', { p_id: idFromCode(code) })

export const respondFee = (code: string, accept: boolean) => rpc('fulfillment_respond_fee', { p_id: idFromCode(code), p_accept: accept })

export const setMethod = (code: string, method: string) => rpc('fulfillment_set_method', { p_id: idFromCode(code), p_method: method })

export const setPrep = (code: string, checks: string[]) => rpc('fulfillment_set_prep', { p_id: idFromCode(code), p_checks: checks })
