/**
 * Suara memakai Web Speech API bawaan browser (gratis), bukan Whisper:
 * - Ucapan → teks: SpeechRecognition id-ID. Di Chrome/Edge audio diproses layanan suara Google/Microsoft; tidak lewat server Lestari Pangan.
 * - Teks → ucapan: suara Gemini lewat Edge Function ai-tts; cadangan speechSynthesis dengan suara Indonesia perempuan.
 */

import { synthesize } from '../../services/tts'

interface Recognition {
  lang: string
  interimResults: boolean
  continuous: boolean
  start(): void
  stop(): void
  abort(): void
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
}

const RecognitionCtor = (window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition })
  .SpeechRecognition ?? (window as unknown as { webkitSpeechRecognition?: new () => Recognition }).webkitSpeechRecognition

export const canListen = !!RecognitionCtor
export const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window

/** Satu ucapan: onText dipanggil berulang (sementara, lalu final); onEnd selalu dipanggil sekali. Mengembalikan fungsi berhenti. */
export function listen(onText: (text: string, final: boolean) => void, onEnd: (error?: string) => void): () => void {
  if (!RecognitionCtor) {
    onEnd('not-supported')
    return () => {}
  }
  const rec = new RecognitionCtor()
  rec.lang = 'id-ID'
  rec.interimResults = true
  rec.continuous = false
  let error: string | undefined
  rec.onresult = (e) => {
    let text = ''
    let final = false
    for (let i = 0; i < e.results.length; i++) {
      text += e.results[i][0].transcript
      final = e.results[i].isFinal
    }
    onText(text.trim(), final)
  }
  rec.onerror = (e) => (error = e.error)
  rec.onend = () => onEnd(error)
  rec.start()
  return () => rec.stop()
}

/* ---------- Pemilihan suara ---------- */

// Nama suara Indonesia perempuan yang dikenal: Chrome "Google Bahasa Indonesia", Edge "Microsoft Gadis Online (Natural)",
// Safari/iOS "Damayanti". Suara laki-laki Windows/Edge: Andika, Ardi.
const FEMALE = /gadis|damayanti|google bahasa indonesia|female|wanita|perempuan/i
const MALE = /\b(ardi|andika|male|pria)\b/i
const NATURAL = /natural|online|neural|enhanced|premium/i

const isIndonesian = (v: SpeechSynthesisVoice) => /^(id|in)([-_]|$)/i.test(v.lang)
const score = (v: SpeechSynthesisVoice) => (FEMALE.test(v.name) ? 4 : 0) - (MALE.test(v.name) ? 4 : 0) + (NATURAL.test(v.name) ? 2 : 0) + (v.localService ? 0 : 1)

/** Suara terbaik untuk Bahasa Indonesia (perempuan, natural) atau null bila perangkat tidak punya suara Indonesia. */
export function pickVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  return voices.filter(isIndonesian).sort((a, b) => score(b) - score(a))[0] ?? null
}

// Chrome mengisi daftar suara secara asinkron: getVoices() kosong sampai event voiceschanged.
// Versi lama memilih suara saat daftar masih kosong, sehingga browser memakai suara bawaan berlogat Inggris.
let voicePromise: Promise<SpeechSynthesisVoice | null> | null = null
export function indonesianVoice(): Promise<SpeechSynthesisVoice | null> {
  if (!canSpeak) return Promise.resolve(null)
  voicePromise ??= new Promise<SpeechSynthesisVoice | null>((resolve) => {
    const synth = window.speechSynthesis
    const now = synth.getVoices()
    if (now.length) return resolve(pickVoice(now))
    const done = () => {
      synth.removeEventListener('voiceschanged', done)
      resolve(pickVoice(synth.getVoices()))
    }
    synth.addEventListener('voiceschanged', done)
    setTimeout(done, 2000)
  }).then((v) => {
    if (!v) voicePromise = null // coba lagi lain kali: daftar suara bisa datang terlambat
    return v
  })
  return voicePromise!
}
if (canSpeak) void indonesianVoice() // muat sejak awal agar ketukan pertama "Dengarkan" sudah memakai suara Indonesia

/* ---------- Teks → ucapan ---------- */

/** Teks untuk dibacakan: tanda format, emoji, dan label internal dibuang agar tidak ikut diucapkan. */
export const toSpeech = (text: string) =>
  text
    .replace(/\*\*/g, '')
    .replace(/^\s*#+\s*/gm, '')
    .replace(/^\s*[-*•]\s+/gm, '')
    .replace(/^\s*(\d+)[.)]\s+/gm, '$1, ')
    .replace(/\((Adaptasi AI, belum ditinjau tim|Resep terkurasi)\)/g, '')
    .replace(/\p{Extended_Pictographic}/gu, '')
    .replace(/\s+/g, ' ')
    .replace(/ ([.,!?;:])/g, '$1')
    .trim()

// Chrome memotong ucapan panjang (±15 dtk): kalimat yang terlalu panjang dipecah di koma.
const chop = (s: string): string[] => {
  if (s.length <= 180) return [s]
  const out: string[] = []
  let cur = ''
  for (const part of s.split(/(?<=[,;:])\s+/)) {
    if (cur && cur.length + part.length > 180) {
      out.push(cur)
      cur = part
    } else cur = cur ? `${cur} ${part}` : part
  }
  return cur ? [...out, cur] : out
}

/** Indeks akhir kalimat lengkap dalam teks: baris baru, atau . ! ? yang diikuti spasi (kecuali nomor langkah "1. "). */
function lastBoundary(text: string): number {
  let end = 0
  let lineStart = 0
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (ch === '\n') {
      end = i + 1
      lineStart = i + 1
    } else if ('.!?'.includes(ch) && /\s/.test(text[i + 1] ?? '') && !/^\s*\d+$/.test(text.slice(lineStart, i))) {
      end = i + 1
    }
  }
  return end
}

const split = (text: string) =>
  text
    .split('\n')
    .flatMap((line) => toSpeech(line).split(/(?<=[.!?])\s+(?!\d)/))
    .map((s) => s.trim())
    .filter((s) => /[\p{L}\p{N}]/u.test(s))
    .flatMap(chop)

/**
 * Mode suara: yang dibacakan hanya pembuka sebelum daftar bahan/langkah (teks lengkap tetap tampil di layar).
 * Model ringan tidak selalu patuh pada aturan "jawab singkat untuk suara" (terukur 13 Nov 2026), jadi dipastikan di sini.
 * Selalu awalan dari teks, sehingga aman dipanggil berulang selama jawaban mengalir.
 */
export function forSpeech(text: string): { text: string; cut: boolean } {
  const lines = text.split('\n')
  const i = lines.findIndex((l) => /^\s*([-*•]|\d+[.)])\s/.test(l) || /:\s*$/.test(l.trim()))
  return i < 0 ? { text, cut: false } : { text: lines.slice(0, i).join('\n'), cut: true }
}

export const SCREEN_HINT = 'Bahan dan langkah lengkapnya sudah ada di layar, ya.'

export interface Speaker {
  /** Teks jawaban sejauh ini (boleh dipanggil berulang saat jawaban mengalir); kalimat yang sudah lengkap langsung disiapkan. */
  push(text: string): void
  /** Jawaban selesai: sisa teks dibacakan, lalu onEnd dipanggil setelah potongan terakhir. */
  finish(text: string): void
  stop(): void
}

/* ---------- Pemutar audio ---------- */

// Satu elemen audio dipakai ulang: dibuka sekali di dalam ketukan pengguna, lalu boleh diputar setelah menunggu
// jaringan (iPhone/Android memblokir audio yang dimulai tanpa ketukan).
let player: HTMLAudioElement | null = null
// WAV kosong sebagai blob: (CSP media-src hanya mengizinkan 'self' dan blob:, bukan data:).
let silent: string | null = null
const silentUrl = () =>
  (silent ??= URL.createObjectURL(new Blob([Uint8Array.from(atob('UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA='), (c) => c.charCodeAt(0))], { type: 'audio/wav' })))

/** Panggil di dalam ketukan pengguna (Bicara, Dengarkan, lingkaran suara) agar suara asisten boleh diputar. */
export function unlockAudio() {
  player ??= new Audio()
  if (player.paused) {
    player.src = silentUrl()
    void player.play().catch(() => undefined)
  }
}

/** Satu potongan dengan suara browser (cadangan). Selesai saat semua kalimatnya diucapkan atau dihentikan. */
async function browserSay(text: string, stopped: () => boolean) {
  if (!canSpeak) return
  const voice = await indonesianVoice()
  for (const part of split(text)) {
    if (stopped()) return
    await new Promise<void>((resolve) => {
      const u = new SpeechSynthesisUtterance(part)
      u.lang = voice?.lang ?? 'id-ID'
      if (voice) u.voice = voice
      // Chrome kadang tidak memanggil onend: batas waktu cadangan sesuai panjang kalimat.
      const t = window.setTimeout(resolve, 3000 + part.length * 120)
      u.onend = u.onerror = () => {
        window.clearTimeout(t)
        resolve()
      }
      window.speechSynthesis.speak(u)
    })
  }
}

const CHUNK = 280 // huruf per permintaan suara: cukup pendek untuk cepat dibuat, cukup panjang agar hemat kuota

/**
 * Pembaca bertahap dengan suara Gemini (ai-tts): kalimat pertama dibuat dengan model tercepat begitu tersedia,
 * sisanya per ±280 huruf; potongan berikutnya disiapkan selagi potongan sekarang diputar.
 * Bila satu potongan gagal, sisa jawaban memakai suara browser agar suara tidak berganti-ganti.
 */
export function createSpeaker(onEnd: () => void, onFallback?: () => void): Speaker {
  if (canSpeak) window.speechSynthesis.cancel()
  type Chunk = { text: string; fast: boolean; audio?: Promise<Blob | null> }
  const chunks: Chunk[] = []
  let pending: string[] = []
  let consumed = 0
  let index = 0
  let finished = false
  let stopped = false
  let browserOnly = false
  let wake: (() => void) | null = null
  let stopCurrent: (() => void) | null = null
  const ac = new AbortController()

  const load = (c: Chunk) =>
    (c.audio ??= browserOnly
      ? Promise.resolve(null)
      : synthesize(c.text, c.fast, ac.signal).catch(() => null))

  const play = (blob: Blob) =>
    new Promise<void>((resolve, reject) => {
      const p = (player ??= new Audio())
      const url = URL.createObjectURL(blob)
      const done = (fn: () => void) => () => {
        p.onended = p.onerror = null
        stopCurrent = null
        URL.revokeObjectURL(url)
        fn()
      }
      stopCurrent = done(() => {
        p.pause()
        resolve()
      })
      p.onended = done(resolve)
      p.onerror = done(() => reject(new Error('audio')))
      p.src = url
      p.play().catch(done(() => reject(new Error('play'))))
    })

  const addChunk = (text: string, fast: boolean) => {
    const c: Chunk = { text, fast }
    chunks.push(c)
    if (chunks.length - 1 <= index + 1) void load(c) // siapkan potongan sekarang dan berikutnya saja
    wake?.()
  }

  const group = (flush: boolean) => {
    if (!chunks.length && pending.length) addChunk(pending.shift()!, true)
    while (pending.length && (flush || pending.join(' ').length >= CHUNK)) {
      const take: string[] = []
      while (pending.length && (take.join(' ').length < CHUNK || !take.length)) take.push(pending.shift()!)
      addChunk(take.join(' '), false)
    }
  }

  const take = (text: string, all: boolean) => {
    if (stopped) return
    if (text.length < consumed) {
      // Server berganti model di tengah jawaban: teks baru dibaca dari awal.
      consumed = 0
      pending = []
    }
    const rest = text.slice(consumed)
    const end = all ? rest.length : lastBoundary(rest)
    if (end) {
      consumed += end
      pending.push(...split(rest.slice(0, end)))
    }
    group(all)
  }

  void (async () => {
    while (!stopped) {
      const c = chunks[index]
      if (!c) {
        if (finished) break
        await new Promise<void>((r) => (wake = r))
        wake = null
        continue
      }
      let blob = await load(c)
      if (chunks[index + 1]) void load(chunks[index + 1])
      if (stopped) break
      if (blob) {
        try {
          await play(blob)
        } catch {
          blob = null
        }
      }
      if (!blob && !stopped) {
        if (!browserOnly) {
          browserOnly = true
          onFallback?.()
        }
        await browserSay(c.text, () => stopped)
      }
      index++
    }
    if (!stopped) {
      stopped = true
      onEnd()
    }
  })()

  return {
    push: (text) => take(text, false),
    finish(text) {
      take(text, true)
      finished = true
      wake?.()
    },
    stop() {
      stopped = true
      ac.abort()
      stopCurrent?.()
      if (canSpeak) window.speechSynthesis.cancel()
      wake?.()
    },
  }
}

/** Membacakan seluruh teks. Mengembalikan fungsi berhenti. */
export function speak(text: string, onEnd: () => void, onFallback?: () => void): () => void {
  const s = createSpeaker(onEnd, onFallback)
  s.finish(text)
  return () => s.stop()
}
