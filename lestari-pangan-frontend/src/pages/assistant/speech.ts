/**
 * Suara memakai Web Speech API bawaan browser (gratis), bukan Whisper:
 * - Ucapan → teks: SpeechRecognition id-ID. Di Chrome/Edge audio diproses layanan suara Google/Microsoft; tidak lewat server Lestari Pangan.
 * - Teks → ucapan: speechSynthesis dengan suara Bahasa Indonesia perempuan bila tersedia.
 */

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

export interface Speaker {
  /** Teks jawaban sejauh ini (boleh dipanggil berulang saat jawaban mengalir); kalimat yang sudah lengkap langsung dibacakan. */
  push(text: string): void
  /** Jawaban selesai: sisa teks dibacakan, lalu onEnd dipanggil setelah kalimat terakhir. */
  finish(text: string): void
  stop(): void
}

/** Pembaca bertahap: mulai bicara sejak kalimat pertama datang, tidak menunggu jawaban selesai. */
export function createSpeaker(onEnd: () => void): Speaker {
  if (!canSpeak) {
    return { push() {}, finish: () => onEnd(), stop() {} }
  }
  const synth = window.speechSynthesis
  synth.cancel()
  let consumed = 0
  let queued = 0
  let finished = false
  let stopped = false
  let gen = 0 // naik saat teks diulang dari awal; ucapan generasi lama diabaikan
  let chain: Promise<unknown> = indonesianVoice()

  const check = () => {
    if (!stopped && finished && queued === 0) {
      stopped = true
      onEnd()
    }
  }
  const say = (sentence: string) => {
    queued++
    const g = gen
    chain = chain.then(async () => {
      const voice = await indonesianVoice()
      if (stopped || g !== gen) return
      const u = new SpeechSynthesisUtterance(sentence)
      u.lang = voice?.lang ?? 'id-ID'
      if (voice) u.voice = voice
      u.rate = 1
      u.pitch = 1
      u.onend = u.onerror = () => {
        if (g !== gen) return
        queued--
        check()
      }
      synth.speak(u)
    })
  }
  const take = (text: string, all: boolean) => {
    if (stopped) return
    if (text.length < consumed) {
      // Server berganti model di tengah jawaban: mulai baca ulang dari awal teks baru.
      gen++
      synth.cancel()
      queued = 0
      consumed = 0
    }
    const rest = text.slice(consumed)
    const end = all ? rest.length : lastBoundary(rest)
    if (!end) return
    consumed += end
    split(rest.slice(0, end)).forEach(say)
  }
  return {
    push: (text) => take(text, false),
    finish(text) {
      take(text, true)
      finished = true
      void chain.then(check)
    },
    stop() {
      stopped = true
      synth.cancel()
    },
  }
}

/** Membacakan seluruh teks. Mengembalikan fungsi berhenti. */
export function speak(text: string, onEnd: () => void): () => void {
  const s = createSpeaker(onEnd)
  s.finish(text)
  return () => s.stop()
}
