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

/** Hanya untuk akun uji juri yang dibuat dengan kata sandi (docs/AKUN-UJI.md); akun biasa tetap OTP. */
export async function signInWithPassword(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password })
  if (error) throw toAppError(error)
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
