import { supabase } from '../lib/supabase/client'
import { AppError, toAppError } from '../lib/supabase/errors'
import { shrinkImage } from '../lib/image'

/**
 * Perkecil lalu unggah foto ke folder milik pengguna (<auth.uid()>/…); mengembalikan path.
 * offer-photos publik (foto penawaran); issue-photos privat (hanya pelapor dan admin ops).
 */
export async function uploadPhoto(bucket: 'offer-photos' | 'issue-photos', file: File): Promise<string> {
  let blob: Blob
  try {
    blob = await shrinkImage(file)
  } catch {
    throw new AppError('DATA_TIDAK_VALID', 'Foto tidak bisa dibaca. Pilih foto JPG atau PNG.')
  }
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) throw new AppError('TIDAK_BERHAK', 'Sesi berakhir. Masuk kembali.')
  const path = `${auth.user.id}/${crypto.randomUUID()}.jpg` // nama asli berkas tidak disimpan
  const { error } = await supabase.storage.from(bucket).upload(path, blob, { contentType: 'image/jpeg' })
  if (error) throw toAppError(error)
  return path
}
