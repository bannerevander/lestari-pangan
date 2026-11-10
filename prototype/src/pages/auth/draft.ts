/**
 * Draf alur masuk/daftar (U03–U10) di sessionStorage agar muat ulang tidak menghapus isian.
 * Hanya data yang diketik pengguna; tidak ada token atau kode di sini.
 */

export type Draft = {
  email: string
  /** register = dari halaman Daftar; login = dari halaman Masuk. */
  mode: 'register' | 'login'
  name?: string
  /** Jenis usaha/lembaga yang dipilih di layar peran. */
  kind?: string
  verified?: boolean
}

const KEY = 'lestari-pangan-signup'

export function readDraft(): Draft | null {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) ?? 'null')
  } catch {
    return null
  }
}

export function writeDraft(d: Draft | null) {
  try {
    if (d) sessionStorage.setItem(KEY, JSON.stringify(d))
    else sessionStorage.removeItem(KEY)
  } catch {
    /* penyimpanan tidak tersedia */
  }
}

export const isEmail = (v: string) => /^\S+@\S+\.\S+$/.test(v.trim())
