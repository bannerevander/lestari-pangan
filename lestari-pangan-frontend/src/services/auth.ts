import { supabase } from '../lib/supabase/client'
import { toAppError } from '../lib/supabase/errors'

/**
 * Login email + OTP (AR-05). Masuk dan daftar memakai jalur yang sama: akun dibuat saat
 * kode pertama diminta, sehingga respons tidak membocorkan email mana yang sudah terdaftar.
 */

export async function sendEmailOtp(email: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({ email: email.trim().toLowerCase(), options: { shouldCreateUser: true } })
  if (error) throw toAppError(error)
}

export async function verifyEmailOtp(email: string, token: string): Promise<void> {
  const { error } = await supabase.auth.verifyOtp({ email: email.trim().toLowerCase(), token, type: 'email' })
  if (error) throw toAppError(error)
}

/** Metode masuk kedua: kata sandi. Pengguna yang mendaftar lewat kode membuatnya di Pengaturan → Keamanan akses. */
export async function signInWithPassword(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password })
  if (error) throw toAppError(error)
}

/** Membuat atau mengganti kata sandi akun yang sedang masuk. */
export async function setPassword(password: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password })
  if (error) throw toAppError(error)
}

/** Akun uji juri memakai domain cadangan example.com yang tidak menerima email (docs/AKUN-UJI.md). */
export const isDemoEmail = (email: string) => /@example\.com$/i.test(email.trim())

/** "Kirim kode" untuk akun uji langsung masuk: Edge Function demo-login memberi token sekali pakai. */
export async function demoSignIn(email: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke<{ token_hash: string }>('demo-login', { body: { email: email.trim() } })
  if (error || !data?.token_hash) throw toAppError({ message: 'TIDAK_BERHAK' })
  const res = await supabase.auth.verifyOtp({ token_hash: data.token_hash, type: 'email' })
  if (res.error) throw toAppError(res.error)
}

export async function hasSession(): Promise<boolean> {
  const { data } = await supabase.auth.getSession()
  return data.session !== null
}

/** Email akun yang sedang masuk (dari sesi Supabase). */
export async function currentEmail(): Promise<string> {
  const { data } = await supabase.auth.getSession()
  return data.session?.user.email ?? ''
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut()
}

/** Dipanggil setiap ada sesi masuk baru, termasuk ganti akun tanpa keluar dulu. */
export function onSignedIn(callback: () => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_IN') callback()
  })
  return () => data.subscription.unsubscribe()
}

/** Dipanggil saat sesi berakhir di tab lain atau token tidak bisa diperbarui. */
export function onSignedOut(callback: () => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') callback()
  })
  return () => data.subscription.unsubscribe()
}
