import { supabase } from '../lib/supabase/client'
import { toAppError } from '../lib/supabase/errors'
import { rpc } from '../lib/supabase/rpc'
import type { Support } from '../state/AppState'
import { stampLabel } from './mappers'

/** Modul funding: dukungan dana, barang, pengingat rutin, ringkasan transparansi (RPC funding_*). */

export type Fund = 'operasional' | 'pengiriman' | 'bantuan_langsung' | 'program'

export interface FundSummary {
  fund: Fund
  programTitle: string | null
  masuk: number
  keluar: number
  saldo: number
}

export interface FundingData {
  supports: Support[]
  recurring: { amount: number; day: number } | null
  inKind: { id: string; kind: string; amount: string; at: string; status: string }[]
  fundSummary: FundSummary[]
}

export async function loadFunding(): Promise<FundingData> {
  const [supports, recurring, inKind, summary] = await Promise.all([
    supabase.from('supports').select('code, amount, allocation, status, note, created_at').order('created_at', { ascending: false }).limit(100),
    supabase.from('recurring_supports').select('amount, day').maybeSingle(),
    supabase.from('in_kind_supports').select('code, kind, amount_text, status, created_at').order('created_at', { ascending: false }).limit(100),
    supabase.rpc('funding_summary'),
  ])
  for (const r of [supports, recurring, inKind, summary]) if (r.error) throw toAppError(r.error)
  return {
    supports: (supports.data ?? []).map((s) => ({
      id: s.code as string,
      amount: s.amount,
      allocation: s.allocation,
      at: stampLabel(s.created_at),
      status: s.status as Support['status'],
      note: s.note ?? undefined,
    })),
    recurring: recurring.data ? { amount: recurring.data.amount, day: recurring.data.day } : null,
    inKind: (inKind.data ?? []).map((k) => ({ id: k.code as string, kind: k.kind, amount: k.amount_text, at: stampLabel(k.created_at), status: k.status })),
    fundSummary: (summary.data ?? []).map((f) => ({ fund: f.fund as Fund, programTitle: f.program_title, masuk: f.masuk, keluar: f.keluar, saldo: f.saldo })),
  }
}

export const addSupport = (clientId: string, amount: number, fund: Fund, allocation: string) =>
  rpc('funding_add_support', { p_client_id: clientId, p_amount: amount, p_fund: fund, p_allocation: allocation })

/** null = hentikan pengingat. */
export const setRecurring = (value: { amount: number; day: number } | null) =>
  rpc('funding_set_recurring', value ? { p_amount: value.amount, p_day: value.day, p_fund: 'pengiriman' } : {})

export const addInKind = (clientId: string, kind: string, amount: string) =>
  rpc('funding_add_in_kind', { p_client_id: clientId, p_kind: kind, p_amount_text: amount })
