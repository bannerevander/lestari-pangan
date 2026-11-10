import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

/**
 * Prototipe: selalu mode demo. Tidak pernah tersambung ke Supabase, meskipun ada env,
 * sehingga semua data berasal dari src/data/mock.ts dan disimpan di perangkat.
 */
export const supabase: SupabaseClient<Database> | null = null

export const isLive = false
