import type { Contact, FoodCategory, FoodRequest, Offer, Transfer, Unit } from '../data/types'
import { isoToLabel, labelToIso, nowLabel } from '../lib/format'
import { supabase } from '../lib/supabase/client'

/**
 * Pemeta baris Supabase ke bentuk data yang sudah dipakai layar (data/types.ts).
 * ID di UI = kode tampil (mis. "PGR-17"); ID database diambil dari angka di belakangnya.
 */

export const idFromCode = (code: string) => Number(code.slice(code.lastIndexOf('-') + 1))

const pad = (n: number) => String(n).padStart(2, '0')
/** "2026-10-12T09:30:00Z" → "12 Okt 2026" (zona waktu perangkat). */
export const dateLabel = (ts: string) => {
  const d = new Date(ts)
  return isoToLabel(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`)
}
/** → "16.30" */
export const timeOf = (ts: string) => {
  const d = new Date(ts)
  return `${pad(d.getHours())}.${pad(d.getMinutes())}`
}
/** "12 Okt 2026" + "16.30" → Date (zona waktu perangkat); kebalikan dateLabel + timeOf. */
export const fromLabels = (date: string, time: string) => new Date(`${labelToIso(date)}T${time.replace('.', ':')}`)

/** → "12 Okt 2026, 16.30 WIB" */
export const stampLabel = (ts: string) => nowLabel(new Date(ts))

const photoUrl = (path: string | null) => (path ? supabase.storage.from('offer-photos').getPublicUrl(path).data.publicUrl : undefined)

// ---- Penawaran ----

export const OFFER_SELECT =
  'code, name, category, unit, initial, available, reserved, handed_over, estimate, photo_path, storage, prepared_at, label_date, allergens, description, area, pickup_start, pickup_end, methods, max_per_recipient, status, created_at, donor:profiles!offers_donor_id_fkey(org_name, org_type, verification_status)'

export interface OfferRow {
  code: string
  name: string
  category: string
  unit: string
  initial: number
  available: number
  reserved: number
  handed_over: number
  estimate: boolean
  photo_path: string | null
  storage: string
  prepared_at: string | null
  label_date: string | null
  allergens: string | null
  description: string | null
  area: string
  pickup_start: string
  pickup_end: string
  methods: string[]
  max_per_recipient: number | null
  status: string
  created_at: string
  donor: { org_name: string; org_type: string; verification_status: string } | null
}

export const toOffer = (r: OfferRow): Offer => ({
  id: r.code,
  name: r.name,
  category: r.category as FoodCategory,
  unit: r.unit as Unit,
  initial: r.initial,
  available: r.available,
  reserved: r.reserved,
  handedOver: r.handed_over,
  estimate: r.estimate,
  photo: photoUrl(r.photo_path),
  storage: r.storage,
  preparedAt: r.prepared_at ? stampLabel(r.prepared_at) : undefined,
  labelDate: r.label_date ? isoToLabel(r.label_date) : undefined,
  allergens: r.allergens,
  description: r.description ?? undefined,
  donorName: r.donor?.org_name ?? 'Pemberi',
  donorType: r.donor?.org_type ?? '',
  donorVerified: r.donor?.verification_status === 'Terverifikasi',
  area: r.area,
  pickupDate: dateLabel(r.pickup_start),
  pickupStart: timeOf(r.pickup_start),
  pickupEnd: timeOf(r.pickup_end),
  methods: r.methods as Offer['methods'],
  maxPerRecipient: r.max_per_recipient ?? undefined,
  status: r.status as Offer['status'],
  createdAt: stampLabel(r.created_at),
})

// ---- Permintaan ----

export const REQUEST_SELECT =
  'code, quantity, unit, method, pickup_at, note, status, reason, proposal_quantity, proposal_reason, proposal_at, created_at, offer:offers!requests_offer_id_fkey(code), recipient:profiles!requests_recipient_id_fkey(org_name, org_type, capacity)'

export interface RequestRow {
  code: string
  quantity: number
  unit: string
  method: string
  pickup_at: string
  note: string | null
  status: string
  reason: string | null
  proposal_quantity: number | null
  proposal_reason: string | null
  proposal_at: string | null
  created_at: string
  offer: { code: string } | null
  recipient: { org_name: string; org_type: string; capacity: string | null } | null
}

export const toRequest = (r: RequestRow): FoodRequest => ({
  id: r.code,
  offerId: r.offer?.code ?? '',
  recipientName: r.recipient?.org_name ?? 'Penerima',
  recipientType: r.recipient?.org_type ?? '',
  capacity: r.recipient?.capacity ?? '',
  quantity: r.quantity,
  unit: r.unit as Unit,
  method: r.method as FoodRequest['method'],
  pickupTime: `${dateLabel(r.pickup_at)}, ${timeOf(r.pickup_at)} WIB`,
  note: r.note ?? undefined,
  status: r.status as FoodRequest['status'],
  reason: r.reason ?? undefined,
  createdAt: stampLabel(r.created_at),
  proposal: r.proposal_quantity
    ? { quantity: r.proposal_quantity, reason: r.proposal_reason ?? '', at: r.proposal_at ? stampLabel(r.proposal_at) : '' }
    : undefined,
  deadline:
    r.status === 'Diajukan' ? plus2h(r.created_at) : r.status === 'Menunggu penyesuaian' && r.proposal_at ? plus2h(r.proposal_at) : undefined,
})

/** Batas tanggapan permintaan: 2 jam (job server membatalkan setelahnya). */
const plus2h = (ts: string) => stampLabel(new Date(new Date(ts).getTime() + 2 * 3600_000).toISOString())

// ---- Penyaluran ----

export const TRANSFER_SELECT =
  'code, agreed, handed_over, received, rejected, unit, method, window_start, window_end, status, pending_schedule, pending_receipt, fee_payer, fee_request, prep, distributed, used, wasted, distribution_reported_at, offer:offers!transfers_offer_id_fkey(code, name, photo_path, area), request:requests!transfers_request_id_fkey(code), donor:profiles!transfers_donor_id_fkey(org_name, contact:profile_contacts(pic, phone, address)), recipient:profiles!transfers_recipient_id_fkey(org_name, contact:profile_contacts(pic, phone, address)), events:transfer_events(label, at, note, actor:profiles!transfer_events_actor_id_fkey(org_name))'

export interface TransferRow {
  code: string
  agreed: number
  handed_over: number | null
  received: number | null
  rejected: number | null
  unit: string
  method: string
  window_start: string
  window_end: string
  status: string
  pending_schedule: { start: string; end: string; reason?: string | null } | null
  pending_receipt: { received: number; reason: string } | null
  fee_payer: 'penerima' | 'pemberi'
  fee_request: boolean
  prep: string[]
  distributed: number | null
  used: number | null
  wasted: number | null
  distribution_reported_at: string | null
  offer: { code: string; name: string; photo_path: string | null; area: string } | null
  request: { code: string } | null
  // Kontak hanya terbaca oleh pihak penyaluran (RLS profile_contacts).
  donor: { org_name: string; contact: Contact | null } | null
  recipient: { org_name: string; contact: Contact | null } | null
  events: { label: string; at: string; note: string | null; actor: { org_name: string } | null }[]
}

export const toTransfer = (r: TransferRow): Transfer => ({
  id: r.code,
  requestId: r.request?.code ?? '',
  offerId: r.offer?.code ?? '',
  foodName: r.offer?.name ?? 'Pangan',
  photo: photoUrl(r.offer?.photo_path ?? null),
  donorName: r.donor?.org_name ?? 'Pemberi',
  area: r.offer?.area,
  donorAddress: r.donor?.contact?.address,
  donorContact: r.donor?.contact ?? undefined,
  recipientName: r.recipient?.org_name ?? 'Penerima',
  recipientContact: r.recipient?.contact ?? undefined,
  agreed: r.agreed,
  handedOver: r.handed_over ?? undefined,
  received: r.received ?? undefined,
  rejected: r.rejected ?? undefined,
  unit: r.unit as Unit,
  method: r.method as Transfer['method'],
  date: dateLabel(r.window_start),
  timeStart: timeOf(r.window_start),
  timeEnd: timeOf(r.window_end),
  status: r.status as Transfer['status'],
  distributionReported: r.distribution_reported_at !== null,
  distribution:
    r.distribution_reported_at !== null ? { distributed: r.distributed ?? 0, used: r.used ?? 0, wasted: r.wasted ?? 0 } : undefined,
  timeline: [...r.events]
    .sort((a, b) => a.at.localeCompare(b.at))
    .map((e) => ({ label: e.label, at: stampLabel(e.at), by: e.actor?.org_name ?? 'Sistem', note: e.note ?? undefined })),
  pendingSchedule: r.pending_schedule
    ? {
        date: dateLabel(r.pending_schedule.start),
        timeStart: timeOf(r.pending_schedule.start),
        timeEnd: timeOf(r.pending_schedule.end),
        reason: r.pending_schedule.reason ?? undefined,
      }
    : undefined,
  prep: r.prep,
  pendingReceipt: r.pending_receipt ? { received: Number(r.pending_receipt.received), reason: r.pending_receipt.reason } : undefined,
  feePayer: r.fee_payer,
  feeRequest: r.fee_request,
})
