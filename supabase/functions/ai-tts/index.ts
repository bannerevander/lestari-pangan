// Suara Asisten Dapur: teks → audio WAV lewat Gemini TTS (AR-24). Kunci Gemini sama dengan ai-chat (secret berawalan
// GEMINI_API_KEY). Klien memanggil lewat supabase.functions.invoke('ai-tts'); bila gagal, klien memakai suara browser.
import { createClient } from 'jsr:@supabase/supabase-js@2'

const ORIGINS = ['https://lestari-pangan.vercel.app', 'http://localhost:5173', 'http://localhost:4173']
const KEYS = Object.entries(Deno.env.toObject())
  .filter(([name, value]) => name.startsWith('GEMINI_API_KEY') && value)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([, value]) => value)
const API = 'https://generativelanguage.googleapis.com/v1beta'
const MAX_CHARS = 600 // klien memotong jawaban per beberapa kalimat
// Diukur 13 Nov 2026 (±250 huruf): 3.8 Flash paling jelas ±8 dtk; 3.8 Flash Lite ±3,7 dtk, kalimat pendek ±2,8 dtk.
const CLEAR = Deno.env.get('GEMINI_TTS_MODEL') ?? 'gemini-3.8-flash-tts'
const FAST = Deno.env.get('GEMINI_TTS_FAST_MODEL') ?? 'gemini-3.8-flash-lite-tts'
const VOICE = Deno.env.get('GEMINI_TTS_VOICE') ?? 'Sulafat' // suara perempuan hangat
const BUDGET_MS = 20_000

// Model 3.x menolak systemInstruction dan ikut membacakan awalan biasa (terukur 13 Nov 2026), jadi arahan gaya
// ditulis sebagai profil suara + catatan sutradara; hanya bagian TRANSCRIPT yang dibacakan.
const prompt = (text: string) => `# AUDIO PROFILE: Asisten Dapur Lestari
Perempuan muda Indonesia, hangat, ramah, dan santai, seperti teman yang membantu memasak di dapur.

### DIRECTOR'S NOTES
Gaya: tersenyum saat bicara, intonasi hidup dan ekspresif, terdengar tulus dan bersemangat membantu.
Tempo: sedang, jeda alami di antara kalimat.
Aksen: Bahasa Indonesia standar yang jelas.

#### TRANSCRIPT
${text}`

const cors = (origin: string | null) => ({
  'Access-Control-Allow-Origin': origin && ORIGINS.includes(origin) ? origin : ORIGINS[0],
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  Vary: 'Origin',
})

/** PCM 16-bit mono dari Gemini → berkas WAV yang bisa diputar langsung oleh browser. */
function wav(pcm: Uint8Array, rate: number): ArrayBuffer {
  const out = new Uint8Array(44 + pcm.length)
  const v = new DataView(out.buffer)
  const str = (o: number, s: string) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)))
  str(0, 'RIFF'); v.setUint32(4, 36 + pcm.length, true); str(8, 'WAVE')
  str(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true)
  v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true)
  str(36, 'data'); v.setUint32(40, pcm.length, true)
  out.set(pcm, 44)
  return out.buffer
}

Deno.serve(async (req) => {
  const headers = cors(req.headers.get('origin'))
  const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { ...headers, 'Content-Type': 'application/json' } })
  if (req.method === 'OPTIONS') return new Response('ok', { headers })
  if (req.method !== 'POST') return reply(405, { error: 'DATA_TIDAK_VALID' })
  if (!KEYS.length) return reply(503, { error: 'AI_BELUM_SIAP' })

  let text: string
  let fast: boolean
  try {
    const body = await req.json()
    text = String(body.text ?? '').trim()
    fast = body.fast === true
  } catch {
    return reply(400, { error: 'DATA_TIDAK_VALID' })
  }
  if (!text || text.length > MAX_CHARS) return reply(400, { error: 'DATA_TIDAK_VALID' })

  // Kuota per akun (terpisah dari chat); juga memastikan pemanggil sudah masuk sebagai pemberi/penerima.
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    auth: { persistSession: false },
  })
  const quota = await db.rpc('ai_take_tts_quota')
  if (quota.error) {
    const code = quota.error.message === 'BATAS_AI' ? 'BATAS_AI' : 'TIDAK_BERHAK'
    return reply(code === 'BATAS_AI' ? 429 : 401, { error: code })
  }

  const payload = JSON.stringify({
    contents: [{ parts: [{ text: prompt(text) }] }],
    generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE } } } },
  })
  // Batas kuota gratis TTS per menit per kunci per model (terukur 13 Nov 2026): model dan kunci diselang-seling.
  const models = fast ? [FAST, CLEAR] : [CLEAR, FAST]
  const attempts = KEYS.flatMap((_, round) => models.map((model, m) => ({ model, k: (round + m) % KEYS.length })))
  const skip = new Set<string>()
  const started = Date.now()

  for (const { model, k } of attempts) {
    const left = BUDGET_MS - (Date.now() - started)
    if (left < 2_000) break
    if (skip.has(model)) continue
    const t0 = Date.now()
    let res: Response
    try {
      res = await fetch(`${API}/models/${model}:generateContent`, {
        method: 'POST',
        headers: { 'x-goog-api-key': KEYS[k], 'Content-Type': 'application/json' },
        body: payload,
        signal: AbortSignal.timeout(Math.min(15_000, left)),
      })
    } catch {
      console.error('tts', model, `kunci#${k + 1}`, 'waktu habis', Date.now() - t0, 'ms')
      continue
    }
    if (!res.ok) {
      console.error('tts', model, `kunci#${k + 1}`, res.status, (await res.text()).slice(0, 160))
      if (res.status === 404) skip.add(model)
      continue // 429 batas per menit, 503 padat: percobaan berikutnya
    }
    const data = await res.json()
    const part = data.candidates?.[0]?.content?.parts?.find((p: { inlineData?: { data: string } }) => p.inlineData)
    if (!part) continue
    const rate = Number(/rate=(\d+)/.exec(part.inlineData.mimeType ?? '')?.[1] ?? 24000)
    const pcm = Uint8Array.from(atob(part.inlineData.data), (c) => c.charCodeAt(0))
    console.log('tts', model, VOICE, `kunci#${k + 1}`, `${Date.now() - t0} ms`, `${text.length} huruf`)
    // octet-stream: supabase-js mengembalikan Blob apa adanya; klien menandainya audio/wav.
    return new Response(wav(pcm, rate), { headers: { ...headers, 'Content-Type': 'application/octet-stream' } })
  }
  return reply(503, { error: 'AI_SIBUK' })
})
