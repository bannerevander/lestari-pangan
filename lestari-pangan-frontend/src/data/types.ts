export type Role = 'pemberi' | 'penerima'

export interface Contact {
  pic: string
  phone: string
  address: string
}

export type FoodCategory = 'Makanan matang' | 'Bahan pangan' | 'Produk kemasan'

export type Unit = 'porsi' | 'kg' | 'kemasan' | 'bungkus' | 'unit'

export type OfferStatus = 'Draf' | 'Tersedia' | 'Ditutup'

export interface Offer {
  id: string
  name: string
  category: FoodCategory
  unit: Unit
  /** Jumlah awal yang ditawarkan. */
  initial: number
  /** Jumlah yang masih dapat diminta. Berbeda dari jumlah awal (design.md §11.1). */
  available: number
  reserved: number
  handedOver: number
  estimate: boolean
  photo?: string
  storage: string
  preparedAt?: string
  labelDate?: string
  /** null berarti "Belum diketahui oleh pemberi" (design.md §10.3). */
  allergens: string | null
  description?: string
  donorName: string
  donorType: string
  donorVerified: boolean
  area: string
  pickupDate: string
  pickupStart: string
  pickupEnd: string
  methods: Array<'Ambil sendiri' | 'Antar pemberi' | 'Mitra pengiriman'>
  /** Batas jumlah per penerima (opsional). */
  maxPerRecipient?: number
  status: OfferStatus
  createdAt: string
}

export type RequestStatus = 'Diajukan' | 'Menunggu penyesuaian' | 'Disetujui' | 'Ditolak' | 'Dibatalkan'

export interface FoodRequest {
  id: string
  offerId: string
  recipientName: string
  recipientType: string
  capacity: string
  quantity: number
  unit: Unit
  method: 'Ambil sendiri' | 'Antar pemberi' | 'Mitra pengiriman'
  pickupTime: string
  note?: string
  status: RequestStatus
  reason?: string
  createdAt: string
  /** Usulan penyesuaian jumlah dari pemberi (Q05); menunggu jawaban penerima. */
  proposal?: { quantity: number; reason: string; at: string }
  /** Batas tanggapan (2 jam) saat Diajukan/Menunggu penyesuaian, mis. "12 Okt 2026, 16.30 WIB". */
  deadline?: string
}

export type TransferStatus =
  | 'Terjadwal'
  | 'Diserahkan'
  | 'Menunggu verifikasi'
  | 'Diterima penuh'
  | 'Diterima sebagian'
  | 'Ditolak'

export interface TimelineEvent {
  label: string
  at: string
  by: string
  note?: string
}

export interface Transfer {
  id: string
  requestId: string
  offerId: string
  foodName: string
  photo?: string
  donorName: string
  /** Area umum penawaran dan alamat lengkap pemberi (hanya untuk pihak penyaluran). */
  area?: string
  donorAddress?: string
  /** Kontak koordinasi pihak penyaluran; terbaca hanya oleh pihak terkait (RLS). */
  donorContact?: Contact
  recipientName: string
  recipientContact?: Contact
  agreed: number
  handedOver?: number
  received?: number
  rejected?: number
  unit: Unit
  method: 'Ambil sendiri' | 'Antar pemberi' | 'Mitra pengiriman'
  date: string
  timeStart: string
  timeEnd: string
  status: TransferStatus
  distributionReported: boolean
  distribution?: { distributed: number; used: number; wasted: number }
  timeline: TimelineEvent[]
  /** Usulan jadwal baru dari pemberi (D04); kesepakatan lama berlaku sampai penerima setuju. */
  pendingSchedule?: { date: string; timeStart: string; timeEnd: string; reason?: string }
  /** Daftar periksa persiapan yang sudah dicentang pemberi (L04). */
  prep?: string[]
  /** Penerimaan sebagian/penolakan yang menunggu verifikasi staf (OD-03). */
  pendingReceipt?: { received: number; reason: string }
  /** Pembayar ongkir mitra pengiriman; feeRequest = penerima meminta pemberi menanggung (OD-04). */
  feePayer: 'penerima' | 'pemberi'
  feeRequest: boolean
}

export type IssueStatus = 'Dikirim' | 'Sedang ditinjau' | 'Selesai' | 'Keberatan diajukan'

export interface Issue {
  id: string
  transferId: string
  role: Role
  category: string
  description: string
  status: IssueStatus
  at: string
  timeline: TimelineEvent[]
  resolution?: string
}

export type RecordStatus = 'Masih tersedia' | 'Ditawarkan' | 'Digunakan' | 'Didistribusikan' | 'Terbuang'

export interface FoodRecord {
  id: string
  owner: Role
  name: string
  category: FoodCategory
  quantity: number
  unit: Unit
  estimate: boolean
  date: string
  storage: string
  status: RecordStatus
  source?: string
  /** Riwayat pergerakan dan koreksi (C03–C05); saldo = quantity. */
  history?: { label: string; delta: number; at: string; note?: string; kind: 'masuk' | 'keluar' | 'koreksi' }[]
}

export interface Notification {
  id: string
  role: Role
  title: string
  body: string
  at: string
  read: boolean
  to: string
  kind: 'Kegiatan' | 'Reward' | 'Sistem'
  /** Label tautan di kartu notifikasi. */
  cta?: string
}

export interface Tip {
  id: string
  title: string
  summary: string
  category: string
  minutes: number
  photo?: string
  body: string[]
  reviewed: string
}
