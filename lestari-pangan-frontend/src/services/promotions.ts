import { supabase } from '../lib/supabase/client'
import { AppError, toAppError } from '../lib/supabase/errors'
import { asset } from '../lib/format'

/** Promosi dan gambar unggahan admin (tabel promotions, bucket publik `media`). */

export type Placement = 'beranda' | 'tips' | 'resep' | 'reward' | 'dukung'

/** Peran yang melihat promosi. */
export type Audience = 'semua' | 'pemberi' | 'penerima'
export const AUDIENCES: Record<Audience, string> = { semua: 'Semua pengguna', pemberi: 'Pemberi saja', penerima: 'Penerima saja' }

/** Ukuran template per penempatan; admin mengunggah gambar sesuai rasio ini. */
export const PLACEMENTS: Record<Placement, { label: string; width: number; height: number }> = {
  beranda: { label: 'Banner Beranda', width: 1200, height: 675 },
  tips: { label: 'Banner Tips', width: 1200, height: 675 },
  resep: { label: 'Banner Resep', width: 1200, height: 675 },
  reward: { label: 'Banner Reward', width: 1200, height: 675 },
  dukung: { label: 'Banner Dukung Lestari Pangan', width: 1200, height: 675 },
}

export interface Promotion {
  id: string
  dbId: number
  title: string
  placement: Placement
  imagePath: string
  image: string
  link?: string
  area?: string
  startsOn?: string
  endsOn?: string
  active: boolean
  sort: number
  audience: Audience
  /** Tulisan di atas foto; kosong = gambar sudah berisi tulisan sendiri. */
  headline?: string
  body?: string
  cta?: string
}

interface PromotionRow {
  id: number
  code: string
  title: string
  placement: Placement
  image_path: string
  link: string | null
  area: string | null
  starts_on: string | null
  ends_on: string | null
  active: boolean
  sort: number
  audience: Audience
  headline: string | null
  body: string | null
  cta: string | null
}

/** URL publik gambar: aset bawaan ("img/…") atau unggahan admin di bucket media. */
export const mediaUrl = (path: string) => (path.startsWith('img/') ? asset(path) : supabase.storage.from('media').getPublicUrl(path).data.publicUrl)

const toPromotion = (r: PromotionRow): Promotion => ({
  id: r.code,
  dbId: r.id,
  title: r.title,
  placement: r.placement,
  imagePath: r.image_path,
  image: mediaUrl(r.image_path),
  link: r.link ?? undefined,
  area: r.area ?? undefined,
  startsOn: r.starts_on ?? undefined,
  endsOn: r.ends_on ?? undefined,
  active: r.active,
  sort: r.sort,
  audience: r.audience ?? 'semua',
  headline: r.headline ?? undefined,
  body: r.body ?? undefined,
  cta: r.cta ?? undefined,
})

/** Pengguna: RLS hanya mengembalikan promosi aktif dalam periodenya. Admin: semua promosi. */
export async function loadPromotions(): Promise<Promotion[]> {
  // shortcut: tabel baru belum ada di database.types.ts; perbarui tipe hasil generate lalu hapus cast.
  const { data, error } = await supabase
    .from('promotions' as never)
    .select('id, code, title, placement, image_path, link, area, starts_on, ends_on, active, sort, audience, headline, body, cta')
    .order('sort')
    .order('id', { ascending: false })
  if (error) throw toAppError(error)
  return (data as unknown as PromotionRow[]).map(toPromotion)
}

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MEDIA_MAX_BYTES = 2 * 1024 * 1024

/** Unggah gambar admin ke bucket media; mengembalikan path, mis. "promo/uuid.jpg". */
export async function uploadMedia(folder: 'promo' | 'konten' | 'apresiasi', file: File): Promise<string> {
  // Batas yang sama ditegakkan bucket di server; cek ini hanya untuk pesan yang jelas.
  if (!IMAGE_TYPES.includes(file.type) || file.size > MEDIA_MAX_BYTES) {
    throw new AppError('DATA_TIDAK_VALID', 'Gunakan gambar JPG, PNG, atau WebP maksimal 2 MB.')
  }
  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `${folder}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from('media').upload(path, file, { contentType: file.type })
  if (error) throw toAppError(error)
  return path
}
