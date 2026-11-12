import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase/client'
import { toAppError } from '../lib/supabase/errors'

/** Asisten Dapur AI (AR-21): Edge Function ai-chat memanggil Gemini; kunci API tidak pernah ada di klien. */

export interface ChatTurn {
  role: 'user' | 'assistant'
  text: string
  /** false = jawaban baku karena pertanyaan di luar topik makanan. */
  onTopic?: boolean
}

/** Mengirim percakapan (12 giliran terakhir) + bahan Catat Pangan sebagai konteks. */
export async function askAssistant(turns: ChatTurn[], pantry: string[]): Promise<{ reply: string; onTopic: boolean }> {
  const { data, error } = await supabase.functions.invoke<{ reply: string; onTopic: boolean }>('ai-chat', {
    body: { messages: turns.slice(-12).map(({ role, text }) => ({ role, text })), pantry },
  })
  if (error) {
    const code = error instanceof FunctionsHttpError ? ((await error.context.json().catch(() => ({}))) as { error?: string }).error : undefined
    throw toAppError({ message: code ?? 'AI_SIBUK' })
  }
  return data!
}
