import { supabase } from '../lib/supabase/client'

/**
 * Suara Asisten Dapur lewat Edge Function ai-tts (Gemini TTS). Mengembalikan audio WAV siap putar.
 * fast = model tercepat untuk kalimat pertama agar suara cepat mulai; sisanya model yang paling jelas.
 * Melempar galat bila gagal; pemanggil lalu memakai suara browser.
 */
export async function synthesize(text: string, fast: boolean, signal: AbortSignal): Promise<Blob> {
  const { data, error } = await supabase.functions.invoke<Blob>('ai-tts', { body: { text, fast }, signal, timeout: 22_000 })
  if (error || !(data instanceof Blob) || data.size < 1000) throw new Error('tts')
  return new Blob([data], { type: 'audio/wav' })
}
