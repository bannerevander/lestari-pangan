import { supabase } from '../lib/supabase/client'
import { toAppError } from '../lib/supabase/errors'
import { uploadPhoto } from './photos'
import { rpc } from '../lib/supabase/rpc'
import type { FoodRequest, Offer } from '../data/types'
import { idFromCode, OFFER_SELECT, REQUEST_SELECT, toOffer, toRequest, type OfferRow, type RequestRow } from './mappers'

/** Modul donation: penawaran dan permintaan (architecture.md §9, RPC donation_*). */

const LIMIT = 200 // shortcut: tanpa paginasi; cukup untuk pilot. Tambah paginasi bila data membesar.

/** Penawaran dan permintaan yang boleh dilihat pengguna ini (RLS memfilter di server). */
export async function loadDonationData(): Promise<{ offers: Offer[]; requests: FoodRequest[] }> {
  const [offers, requests] = await Promise.all([
    supabase.from('offers').select(OFFER_SELECT).order('created_at', { ascending: false }).limit(LIMIT),
    supabase.from('requests').select(REQUEST_SELECT).order('created_at', { ascending: false }).limit(LIMIT),
  ])
  if (offers.error) throw toAppError(offers.error)
  if (requests.error) throw toAppError(requests.error)
  return {
    offers: (offers.data as unknown as OfferRow[]).map(toOffer),
    requests: (requests.data as unknown as RequestRow[]).map(toRequest),
  }
}

export interface PublishOfferInput {
  clientId: string
  name: string
  category: string
  unit: string
  quantity: number
  storage: string
  area: string
  pickupStart: Date
  pickupEnd: Date
  methods: string[]
  estimate: boolean
  preparedAt?: Date
  labelDate?: string // YYYY-MM-DD
  allergens: string | null
  description?: string
  /** Kode catatan pangan asal (mis. "CP-12"); catatan ditandai Ditawarkan. */
  recordCode?: string
  /** Batas jumlah per penerima; kosong = tanpa batas. */
  maxPerRecipient?: number
  /** Path hasil uploadOfferPhoto; kosong = tanpa foto. */
  photoPath?: string
}

/** Unggah foto penawaran (bucket publik); mengembalikan path untuk publishOffer. */
export const uploadOfferPhoto = (file: File) => uploadPhoto('offer-photos', file)

export const publishOffer = (i: PublishOfferInput) =>
  rpc('donation_publish_offer', {
    p_client_id: i.clientId,
    p_name: i.name,
    p_category: i.category,
    p_unit: i.unit,
    p_quantity: i.quantity,
    p_storage: i.storage,
    p_area: i.area,
    p_pickup_start: i.pickupStart.toISOString(),
    p_pickup_end: i.pickupEnd.toISOString(),
    p_methods: i.methods,
    p_estimate: i.estimate,
    p_prepared_at: i.preparedAt?.toISOString(),
    p_label_date: i.labelDate,
    p_allergens: i.allergens,
    p_description: i.description,
    p_record_id: i.recordCode ? idFromCode(i.recordCode) : undefined,
    p_max_per_recipient: i.maxPerRecipient,
    p_photo_path: i.photoPath,
  })

export const updateOffer = (code: string, c: { pickupStart: Date; pickupEnd: Date; available: number; storage?: string; description?: string; reason?: string }) =>
  rpc('donation_update_offer', {
    p_id: idFromCode(code),
    p_pickup_start: c.pickupStart.toISOString(),
    p_pickup_end: c.pickupEnd.toISOString(),
    p_available: c.available,
    p_storage: c.storage,
    p_description: c.description,
    p_reason: c.reason,
  })

export const closeOffer = (code: string) => rpc('donation_close_offer', { p_id: idFromCode(code) })

export const submitRequest = (i: { clientId: string; offerCode: string; quantity: number; method: string; pickupAt: Date; note?: string }) =>
  rpc('donation_submit_request', {
    p_client_id: i.clientId,
    p_offer_id: idFromCode(i.offerCode),
    p_quantity: i.quantity,
    p_method: i.method,
    p_pickup_at: i.pickupAt.toISOString(),
    p_note: i.note,
  })

export const decideRequest = (code: string, decision: 'approve' | 'reject', reason?: string) =>
  rpc('donation_decide_request', { p_id: idFromCode(code), p_decision: decision, p_reason: reason })

export const cancelRequest = (code: string, reason: string) => rpc('donation_cancel_request', { p_id: idFromCode(code), p_reason: reason })

export const proposeAdjustment = (code: string, quantity: number, reason: string) =>
  rpc('donation_propose_adjustment', { p_id: idFromCode(code), p_quantity: quantity, p_reason: reason })

export const respondAdjustment = (code: string, accept: boolean) =>
  rpc('donation_respond_adjustment', { p_id: idFromCode(code), p_accept: accept })
