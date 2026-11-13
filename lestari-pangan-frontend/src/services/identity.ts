import { supabase } from '../lib/supabase/client'
import type { Database } from '../lib/supabase/database.types'
import { AppError, toAppError } from '../lib/supabase/errors'

type ProfileRow = Database['public']['Tables']['profiles']['Row']
type ContactRow = Database['public']['Tables']['profile_contacts']['Row']

/** Hasil identity_me(): profil sendiri + kontak privat, tanpa user_id. */
export type MyProfile = Omit<ProfileRow, 'user_id'> & { contact: Omit<ContactRow, 'profile_id'> }

export interface OnboardingInput {
  role: 'pemberi' | 'penerima'
  orgName: string
  orgType: string
  area: string
  pic: string
  phone: string
  address: string
  capacity?: string
  storage?: string
}

/** null = sudah login tetapi belum menyelesaikan onboarding. */
export async function fetchMyProfile(): Promise<MyProfile | null> {
  const { data, error } = await supabase.rpc('identity_me')
  if (error) throw toAppError(error)
  return data as unknown as MyProfile | null
}

export async function completeOnboarding(input: OnboardingInput): Promise<void> {
  const { error } = await supabase.rpc('identity_complete_onboarding', {
    p_role: input.role,
    p_org_name: input.orgName,
    p_org_type: input.orgType,
    p_area: input.area,
    p_pic: input.pic,
    p_phone: input.phone,
    p_address: input.address,
    p_capacity: input.capacity,
    p_storage: input.storage,
  })
  if (error) throw toAppError(error)
}

/** Kolom profil yang boleh diubah pengguna sendiri (identity_save_profile). */
export type ProfileUpdate = Partial<Record<'org_name' | 'area' | 'hours' | 'capacity' | 'storage' | 'pic' | 'phone' | 'address', string>> & {
  /** Titik peta titik temu; null menghapus titik. */
  lat?: number | null
  lng?: number | null
}

export async function saveProfile(fields: ProfileUpdate): Promise<void> {
  const { error } = await supabase.rpc('identity_save_profile', { p_fields: fields })
  if (error) throw toAppError(error)
}

const VERIFICATION_TYPES = ['application/pdf', 'image/jpeg', 'image/png']
export const VERIFICATION_MAX_BYTES = 5 * 1024 * 1024

/** Unggah bukti ke folder milik pengguna di bucket privat, lalu ajukan verifikasi. */
export async function submitVerification(file: File): Promise<void> {
  // Batas yang sama juga ditegakkan bucket di server; cek ini hanya untuk pesan yang jelas.
  if (!VERIFICATION_TYPES.includes(file.type) || file.size > VERIFICATION_MAX_BYTES) {
    throw new AppError('DATA_TIDAK_VALID', 'Gunakan PDF, JPG, atau PNG maksimal 5 MB.')
  }
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) throw new AppError('TIDAK_BERHAK', 'Sesi berakhir. Masuk kembali.')
  const ext = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'pdf'
  const path = `${auth.user.id}/${crypto.randomUUID()}.${ext}` // nama asli berkas tidak disimpan
  const upload = await supabase.storage.from('verification-docs').upload(path, file, { contentType: file.type })
  if (upload.error) throw toAppError(upload.error)
  const { error } = await supabase.rpc('identity_submit_verification', { p_doc_path: path })
  if (error) throw toAppError(error)
}
