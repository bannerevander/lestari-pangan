/** Kode galat dari RPC (architecture.md §9.7) dan Supabase Auth, diterjemahkan untuk UI. */

const RPC_MESSAGES: Record<string, string> = {
  TIDAK_BERHAK: 'Akun Anda tidak memiliki akses ke data atau aksi ini.',
  STATUS_TIDAK_SESUAI: 'Data sudah berubah. Muat ulang halaman lalu coba lagi.',
  STOK_TIDAK_CUKUP: 'Jumlah tersedia tidak mencukupi.',
  KUOTA_HABIS: 'Kuota reward sudah habis.',
  SALDO_TIDAK_CUKUP: 'Saldo dana tujuan tidak mencukupi.',
  DATA_TIDAK_VALID: 'Isian belum sesuai. Periksa kembali.',
  BELUM_TERVERIFIKASI: 'Kegiatan ini memerlukan akun terverifikasi.',
}

export class AppError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message)
  }
}

type RawError = { message?: string; status?: number; name?: string } | null | undefined

/** Pesan untuk UI dari galat apa pun yang tertangkap. */
export function messageOf(e: unknown): string {
  return e instanceof AppError ? e.message : toAppError(e as RawError).message
}

/** Pesan teknis tidak pernah ditampilkan apa adanya ke pengguna. */
export function toAppError(e: RawError): AppError {
  const message = e?.message ?? ''
  if (RPC_MESSAGES[message]) return new AppError(message, RPC_MESSAGES[message])
  if (e?.status === 429 || /rate limit|too many/i.test(message)) {
    return new AppError('BATAS_PERMINTAAN', 'Terlalu sering mencoba. Tunggu beberapa menit lalu coba lagi.')
  }
  if (/not authorized/i.test(message)) {
    // SMTP bawaan Supabase hanya mengirim ke anggota tim; pasang SMTP sendiri (docs/SECURITY.md §3).
    return new AppError('EMAIL_DITOLAK', 'Email ini belum bisa menerima kode. Hubungi pengelola Lestari Pangan.')
  }
  if (/email/i.test(message) && /invalid/i.test(message)) {
    return new AppError('EMAIL_TIDAK_VALID', 'Alamat email tidak valid. Periksa kembali penulisannya.')
  }
  if (/expired|invalid/i.test(message) && /token|otp|code/i.test(message)) {
    return new AppError('KODE_SALAH', 'Kode salah atau sudah kedaluwarsa. Minta kode baru.')
  }
  if (/fetch|network/i.test(message) || e?.name === 'AuthRetryableFetchError') {
    return new AppError('JARINGAN', 'Tidak dapat terhubung. Periksa koneksi internet lalu coba lagi.')
  }
  return new AppError('LAINNYA', 'Terjadi kendala. Coba lagi beberapa saat lagi.')
}
