import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase/client'
import { toAppError } from '../lib/supabase/errors'

/** Asisten Dapur AI (AR-21): Edge Function ai-chat memanggil Gemini; kunci API tidak pernah ada di klien. */

export interface ChatTurn {
  role: 'user' | 'assistant'
  text: string
  /** false = jawaban baku karena pertanyaan di luar topik makanan. */
  onTopic?: boolean
  /** true = pengguna menekan "Berhenti" sebelum jawaban selesai. */
  stopped?: boolean
}

// Jaring pengaman klien saja: server sudah mengatur batas waktu per model. Bila tidak ada data sama sekali selama ini, koneksi dianggap putus.
const SILENCE_MS = 70_000

/**
 * Mengirim percakapan (12 giliran terakhir) + bahan Catat Pangan sebagai konteks, lalu menerima jawaban mengalir.
 * onText dipanggil dengan teks jawaban sejauh ini (bisa mengecil bila server berganti model di tengah jalan).
 * onBusy dipanggil bila server AI padat dan model cadangan sedang dicoba (jawaban mungkin perlu beberapa detik lagi).
 * Batalkan dengan signal (tombol "Berhenti"); teks yang sudah diterima tetap dikembalikan lewat onText.
 */
export async function askAssistant(
  turns: ChatTurn[],
  pantry: string[],
  onText: (text: string) => void,
  signal: AbortSignal,
  onBusy?: () => void,
  /** true = mode suara: server meminta jawaban bergaya obrolan untuk didengar. */
  voice = false,
): Promise<{ reply: string; onTopic: boolean }> {
  // Pasangan tanya-jawab yang ditolak (di luar topik) tidak ikut jadi konteks: AI cenderung meniru penolakan itu untuk pertanyaan berikutnya.
  const history = turns.filter((t, i) => t.onTopic !== false && !(t.role === 'user' && turns[i + 1]?.onTopic === false))
  const { data, error } = await supabase.functions.invoke<Response>('ai-chat', {
    body: { messages: history.slice(-12).map(({ role, text }) => ({ role, text })), pantry, stream: true, voice },
    signal,
  })
  if (error) {
    if (signal.aborted) throw new DOMException('Dihentikan', 'AbortError')
    const code = error instanceof FunctionsHttpError ? ((await error.context.json().catch(() => ({}))) as { error?: string }).error : undefined
    throw toAppError({ message: code ?? 'AI_SIBUK' })
  }
  if (!data?.body) throw toAppError({ message: 'AI_SIBUK' })

  const reader = data.body.pipeThrough(new TextDecoderStream()).getReader()
  let watchdog = setTimeout(() => void reader.cancel(), SILENCE_MS)
  let text = ''
  let buf = ''
  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      clearTimeout(watchdog)
      watchdog = setTimeout(() => void reader.cancel(), SILENCE_MS)
      buf += value
      const events = buf.split('\n\n')
      buf = events.pop() ?? ''
      for (const ev of events) {
        if (!ev.startsWith('data: ')) continue
        const msg = JSON.parse(ev.slice(6)) as { d?: string; reset?: boolean; status?: string; done?: boolean; onTopic?: boolean; error?: string }
        if (msg.status === 'padat') onBusy?.()
        if (msg.reset) text = ''
        if (msg.d) text += msg.d
        if (msg.reset || msg.d) onText(text)
        if (msg.error) throw toAppError({ message: msg.error })
        if (msg.done) return { reply: text.trim(), onTopic: msg.onTopic !== false }
      }
    }
  } finally {
    clearTimeout(watchdog)
  }
  if (signal.aborted) throw new DOMException('Dihentikan', 'AbortError')
  // Aliran putus tanpa tanda selesai (jaringan HP terputus).
  throw toAppError({ message: 'AI_TERPUTUS' })
}
