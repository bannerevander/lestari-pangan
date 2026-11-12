/**
 * Suara memakai Web Speech API bawaan browser (gratis): pengenalan suara id-ID dan pembacaan jawaban.
 * Audio tidak dikirim ke server Lestari Pangan; di Chrome pengenalan diproses layanan suara Google.
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

/** Teks untuk dibacakan: tanda format dibuang agar tidak ikut diucapkan. */
export const toSpeech = (text: string) =>
  text
    .replace(/\*\*/g, '')
    .replace(/^\s*[-*]\s+/gm, '')
    .replace(/^\s*(\d+)[.)]\s+/gm, '$1. ')
    .replace(/\(Adaptasi AI, belum ditinjau tim\)/g, '')

/** Membacakan per kalimat (Chrome memotong ucapan panjang). Mengembalikan fungsi berhenti. */
export function speak(text: string, onEnd: () => void): () => void {
  if (!canSpeak) {
    onEnd()
    return () => {}
  }
  const synth = window.speechSynthesis
  synth.cancel()
  const voice = synth.getVoices().find((v) => v.lang.toLowerCase().startsWith('id'))
  const parts = toSpeech(text).match(/[^.!?\n]+[.!?]?/g)?.map((s) => s.trim()).filter(Boolean) ?? []
  if (!parts.length) {
    onEnd()
    return () => {}
  }
  let stopped = false
  parts.forEach((part, i) => {
    const u = new SpeechSynthesisUtterance(part)
    u.lang = 'id-ID'
    if (voice) u.voice = voice
    if (i === parts.length - 1) u.onend = () => !stopped && onEnd()
    u.onerror = () => !stopped && i === parts.length - 1 && onEnd()
    synth.speak(u)
  })
  return () => {
    stopped = true
    synth.cancel()
  }
}
