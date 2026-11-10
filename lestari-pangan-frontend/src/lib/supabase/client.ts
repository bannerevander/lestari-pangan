import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

/** false = env Supabase belum diisi; main.tsx menampilkan layar konfigurasi, bukan aplikasi. */
export const configured = Boolean(url && key)

/**
 * Klien Supabase tunggal. Keamanan data ditegakkan di database (RLS + RPC), bukan di sini (docs/SECURITY.md).
 * Mode demo ada di folder ../prototype, bukan di aplikasi ini.
 */
export const supabase = createClient<Database>(url || 'https://belum-dikonfigurasi.invalid', key || 'belum-dikonfigurasi', {
  // Login memakai kode OTP, bukan tautan; token tidak pernah dibaca dari URL.
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
})
