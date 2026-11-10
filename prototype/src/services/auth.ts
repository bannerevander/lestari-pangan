import { supabase } from '../lib/supabase/client'
import { toAppError } from '../lib/supabase/errors'

/**
 * Login email + OTP (AR-05). Masuk dan daftar memakai jalur yang sama: akun dibuat saat
 * kode pertama diminta, sehingga respons tidak membocorkan email mana yang sudah terdaftar.
 * Di mode demo semua fungsi langsung berhasil.
 */

export async function sendEmailOtp(email: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.auth.signInWithOtp({ email: email.trim().toLowerCase(), options: { shouldCreateUser: true } })
  if (error) throw toAppError(error)
}

export async function verifyEmailOtp(email: string, token: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.auth.verifyOtp({ email: email.trim().toLowerCase(), token, type: 'email' })
  if (error) throw toAppError(error)
}

export async function hasSession(): Promise<boolean> {
  if (!supabase) return true
  const { data } = await supabase.auth.getSession()
  return data.session !== null
}

export async function signOut(): Promise<void> {
  if (!supabase) return
  await supabase.auth.signOut()
}

/** Dipanggil saat sesi berakhir di tab lain atau token tidak bisa diperbarui. */
export function onSignedOut(callback: () => void): () => void {
  if (!supabase) return () => {}
  const { data } = supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') callback()
  })
  return () => data.subscription.unsubscribe()
}
