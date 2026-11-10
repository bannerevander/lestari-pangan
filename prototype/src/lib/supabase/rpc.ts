import { supabase } from './client'
import { toAppError } from './errors'

/** Panggil RPC Supabase; galat diubah menjadi AppError. Mode demo: tanpa efek, hasil undefined. */
export async function rpc<T = unknown>(fn: string, args: Record<string, unknown>): Promise<T | undefined> {
  if (!supabase) return undefined
  // Nama fungsi dicek di tes database; tipe generik supabase-js terlalu ketat untuk nama dinamis.
  const { data, error } = await supabase.rpc(fn as never, args as never)
  if (error) throw toAppError(error)
  return data as T
}
