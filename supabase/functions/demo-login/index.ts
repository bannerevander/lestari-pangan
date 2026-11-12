// Masuk instan akun uji juri lewat metode "Kode verifikasi" (docs/AKUN-UJI.md): alamat @example.com tidak bisa
// menerima email, jadi server membuat token sekali pakai. Hanya untuk 4 alamat di bawah; hapus fungsi ini setelah penjurian.
import { createClient } from 'jsr:@supabase/supabase-js@2'

const DEMO = ['pemberi@example.com', 'penerima@example.com', 'kurir@example.com', 'admin@example.com']
const ORIGINS = ['https://lestari-pangan.vercel.app', 'http://localhost:5173', 'http://localhost:4173']

Deno.serve(async (req) => {
  const origin = req.headers.get('origin')
  const headers = {
    'Access-Control-Allow-Origin': origin && ORIGINS.includes(origin) ? origin : ORIGINS[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  }
  const reply = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers: { ...headers, 'Content-Type': 'application/json' } })
  if (req.method === 'OPTIONS') return new Response('ok', { headers })
  if (req.method !== 'POST') return reply(405, { error: 'DATA_TIDAK_VALID' })

  const { email } = await req.json().catch(() => ({ email: '' }))
  const target = String(email ?? '').trim().toLowerCase()
  if (!DEMO.includes(target)) return reply(403, { error: 'TIDAK_BERHAK' })

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  // generateLink tidak mengirim email; klien menukar token_hash menjadi sesi lewat verifyOtp.
  const { data, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email: target })
  if (error || !data.properties?.hashed_token) {
    console.error('demo-login', target, error?.message)
    return reply(500, { error: 'DATA_TIDAK_VALID' })
  }
  return reply(200, { token_hash: data.properties.hashed_token })
})
