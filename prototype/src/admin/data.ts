import type { AuditEntry } from './store'
import type { ChallengeMetric } from '../data/engagement'

/**
 * Data demo konsol admin (AD01–AD22). Angka mengikuti ekspor Stitch 9 Okt 2026
 * dan selaras dengan data aplikasi (PGR-8821, LP-DEMO-01). Bukan data nyata.
 */

export interface Org {
  id: string
  name: string
  email: string
  role: 'Pemberi' | 'Penerima'
  type: string
  area: string
  pic: string
  phone: string
  doc: string
  docMeta: string
  status: string
  submitted: string
  /** Mode live: berkas verifikasi terbaru (bucket privat) dan ID-nya untuk keputusan. */
  docPath?: string
  verificationId?: number
}

export const orgs: Org[] = [
  { id: 'ORG-WK', name: 'Warung Kebun', email: 'warung.kebun@example.invalid', role: 'Pemberi', type: 'UMKM', area: 'Kec. Coblong, Bandung', pic: 'Rina Kusuma', phone: '0812 0000 0000', doc: 'surat_keterangan_operasional.pdf', docMeta: '1,2 MB · diajukan 8 Okt', status: 'Menunggu pemeriksaan', submitted: '8 Okt 2026, 14.20 WIB' },
  { id: 'ORG-KB', name: 'Komunitas Berbagi', email: 'komunitas.berbagi@example.invalid', role: 'Penerima', type: 'Komunitas', area: 'Kec. Coblong, Bandung', pic: 'Dimas Pratama', phone: '0813 0000 0000', doc: 'sk_komunitas.pdf', docMeta: 'Tervalidasi 1 Okt 2026', status: 'Terverifikasi', submitted: '30 Sep 2026, 10.05 WIB' },
  { id: 'ORG-DS', name: 'Dapur Sosial Dhuafa', email: 'dapur.sosial@example.invalid', role: 'Penerima', type: 'Panti dan dhuafa', area: 'Kec. Coblong, Bandung', pic: 'Ahmad Rahmat', phone: '0812 0000 0001', doc: 'keterangan_panti.pdf', docMeta: 'Tervalidasi 3 Okt 2026', status: 'Terverifikasi', submitted: '2 Okt 2026, 09.40 WIB' },
  { id: 'ORG-TB', name: 'Toko Berkah', email: 'toko.berkah@example.invalid', role: 'Pemberi', type: 'Toko kelontong', area: 'Kec. Sukasari, Bandung', pic: 'Sari Wulandari', phone: '0812 0000 0002', doc: 'nib_toko.pdf', docMeta: 'Tervalidasi 28 Sep 2026', status: 'Terverifikasi', submitted: '27 Sep 2026, 15.12 WIB' },
]

export interface Issue {
  id: string
  transferId: string
  food: string
  reporter: string
  reporterRole: string
  reported: string
  reportedRole: string
  category: 'Kondisi makanan' | 'Jumlah selisih' | 'Keterlambatan' | 'Logistik'
  summary: string
  age: string
  priority: 'Tinggi' | 'Sedang' | 'Rendah'
  status: string
  resolution?: string
  timeline?: { title: string; detail: string }[]
}

export const issues: Issue[] = [
  { id: 'ISS-8821-01', transferId: 'LP-DEMO-01', food: 'Nasi kotak ayam dan sayur', reporter: 'Komunitas Berbagi', reporterRole: 'Penerima', reported: 'Warung Kebun', reportedRole: 'Pemberi', category: 'Kondisi makanan', summary: '2 kotak kemasan rusak saat pengambilan (selisih 2 porsi).', age: '45 mnt', priority: 'Tinggi', status: 'Menunggu peninjauan' },
  { id: 'ISS-8819-02', transferId: 'LP-DEMO-04', food: 'Beras putih kemasan', reporter: 'Toko Berkah', reporterRole: 'Pemberi', reported: 'Relawan mandiri', reportedRole: 'Penjemput', category: 'Keterlambatan', summary: 'Penjemput belum tiba melewati 45 menit dari jadwal.', age: '1 jam', priority: 'Sedang', status: 'Menunggu peninjauan' },
  { id: 'ISS-8810-03', transferId: 'LP-DEMO-03', food: 'Roti manis aneka isi', reporter: 'Dapur Sosial Dhuafa', reporterRole: 'Penerima', reported: 'Dapur Roti Sehat', reportedRole: 'Pemberi', category: 'Jumlah selisih', summary: 'Diterima 18 dari 20 bungkus yang disepakati.', age: '3 jam', priority: 'Rendah', status: 'Sedang ditinjau' },
  { id: 'ISS-8790-04', transferId: 'LP-DEMO-00', food: 'Sayur lodeh dan tahu', reporter: 'Komunitas Berbagi', reporterRole: 'Penerima', reported: 'Warung Kebun', reportedRole: 'Pemberi', category: 'Kondisi makanan', summary: 'Kuah tumpah pada 2 porsi; sisanya layak.', age: '3 hari', priority: 'Rendah', status: 'Selesai' },
]

export interface Delivery {
  id: string
  transferId: string
  load: string
  from: string
  to: string
  method: 'Ambil sendiri' | 'Kurir bersponsor' | 'Antar pemberi'
  cost: number
  courier?: string
  status: string
  transferDbId?: number
}

export const deliveries: Delivery[] = [
  { id: 'DEL-2026-081', transferId: 'LP-DEMO-01', load: '12 porsi nasi kotak', from: 'Warung Kebun (Coblong)', to: 'Komunitas Berbagi (Sekeloa)', method: 'Ambil sendiri', cost: 0, courier: 'Relawan penerima', status: 'Selesai' },
  { id: 'DEL-2026-084', transferId: 'LP-DEMO-04', load: '10 kg beras', from: 'Toko Berkah (Sukasari)', to: 'Dapur Sosial Dhuafa (Coblong)', method: 'Kurir bersponsor', cost: 25000, courier: 'Andi (relawan kurir)', status: 'Dalam pengantaran' },
  { id: 'DEL-2026-085', transferId: 'LP-DEMO-05', load: '20 bungkus roti', from: 'Dapur Roti Sehat (Dago)', to: 'Panti Asuhan Harapan (Coblong)', method: 'Kurir bersponsor', cost: 20000, status: 'Menunggu kurir' },
  { id: 'DEL-2026-079', transferId: 'LP-DEMO-00', load: '10 porsi sayur lodeh', from: 'Warung Kebun (Coblong)', to: 'Komunitas Berbagi (Sekeloa)', method: 'Antar pemberi', cost: 0, courier: 'Warung Kebun', status: 'Selesai' },
]

export interface Content {
  id: string
  kind: 'Tips' | 'Resep'
  title: string
  category: string
  version: string
  updated: string
  author: string
  status: string
  points: string[]
  dbId?: number
  summary?: string
  body?: unknown
}

export const contents: Content[] = [
  { id: 'ART-T01-01', kind: 'Tips', title: 'Cara tepat menyimpan sayur berdaun', category: 'Penyimpanan', version: 'v1.0', updated: '6 Okt 2026', author: 'Tim Edukasi', status: 'Terbit', points: ['Air sisa cucian memicu kelembapan yang mempercepat pembusukan.', 'Alas tisu menyerap embun secara merata.', 'Suhu laci sayur 3–5°C menjaga daun tetap segar.'] },
  { id: 'ART-T01-02', kind: 'Tips', title: 'Mulai dari catatan sederhana', category: 'Perencanaan', version: 'v1.1', updated: '1 Okt 2026', author: 'Tim Edukasi', status: 'Terbit', points: ['Catat bahan sebelum belanja.', 'Tandai jumlah perkiraan.', 'Pakai catatan saat menawarkan surplus.'] },
  { id: 'RSP-R02-04', kind: 'Resep', title: 'Nasi goreng sayur dari nasi kemarin', category: 'Olahan nasi', version: 'v0.3', updated: '9 Okt 2026', author: 'Kontributor komunitas', status: 'Menunggu review', points: ['Pastikan nasi disimpan tertutup di kulkas.', 'Panaskan hingga matang merata.', 'Habiskan dalam satu kali makan.'] },
  { id: 'ART-T03-01', kind: 'Tips', title: 'Label donasi yang jelas', category: 'Donasi', version: 'v0.2', updated: '9 Okt 2026', author: 'Tim Edukasi', status: 'Menunggu review', points: ['Tulis waktu masak.', 'Sebutkan bahan alergen yang diketahui.', 'Pisahkan sambal atau kuah.'] },
  { id: 'RSP-R01-01', kind: 'Resep', title: 'Bubur roti tawar', category: 'Olahan roti', version: 'v1.0', updated: '20 Sep 2026', author: 'Tim Edukasi', status: 'Draf', points: ['Gunakan roti yang belum berjamur.', 'Rebus dengan susu hingga lembut.'] },
]

export interface Challenge {
  id: string
  title: string
  period: string
  roles: string
  target: string
  participants: number
  status: 'Aktif' | 'Draf' | 'Arsip'
  dbId?: number
  description?: string
  periodStart?: string
  periodEnd?: string
  metric?: ChallengeMetric
  targetCount?: number
}

export const challenges: Challenge[] = [
  { id: 'CHL-2026-Q4-01', title: 'Catat Pangan tiga hari rutin', period: '1–31 Okt 2026', roles: 'Pemberi dan penerima', target: '3 sesi Catat Pangan terpisah', participants: 14, status: 'Aktif' },
  { id: 'CHL-2026-Q4-02', title: 'Label donasi lengkap', period: '1–31 Okt 2026', roles: 'Pemberi', target: '2 penawaran dengan info alergen', participants: 10, status: 'Aktif' },
  { id: 'CHL-2026-Q4-03', title: 'Laporan distribusi tepat waktu', period: '1–30 Nov 2026', roles: 'Penerima', target: 'Laporan dalam 24 jam setelah penerimaan', participants: 0, status: 'Draf' },
  { id: 'CHL-2026-Q3-02', title: 'Simpan sayur lebih lama', period: '1–30 Sep 2026', roles: 'Pemberi dan penerima', target: '2 tips dibaca dan 1 catatan', participants: 21, status: 'Arsip' },
]

export const achievementEvidence = [
  { id: 'CP-0821', at: '8 Okt 2026, 14.20 WIB', text: 'Beras sisa stok (0,5 kg) disimpan di suhu ruang.' },
  { id: 'CP-0792', at: '7 Okt 2026, 17.00 WIB', text: 'Tumis buncis 6 porsi, ditawarkan sebagai PGR-8845.' },
  { id: 'CP-0765', at: '6 Okt 2026, 15.40 WIB', text: 'Wortel 2 kg disimpan di kulkas.' },
]

export interface RewardPack {
  id: string
  title: string
  detail: string
  sponsor: string
  quota: number
  claimed: number
  dbId?: number
}

export const rewardPacks: RewardPack[] = [
  { id: 'RWD-APRES-01', title: 'Paket apresiasi mitra', detail: 'Sertifikat dan publikasi', sponsor: 'Platform Lestari Pangan', quota: 25, claimed: 4 },
  { id: 'RWD-LOGIS-02', title: 'Wadah besek higienis', detail: '10 besek, kantong higienis, label', sponsor: 'Mitra Peduli Pangan', quota: 30, claimed: 9 },
  { id: 'RWD-DAPUR-03', title: 'Bahan pokok dapur komunitas', detail: 'Beras 5 kg dan minyak nabati', sponsor: 'Sponsor Komunitas Bandung', quota: 20, claimed: 5 },
]

export interface Claim {
  id: string
  org: string
  challenge: string
  pack: string
  at: string
  status: string
}

export const claims: Claim[] = [
  { id: 'CLM-2026-09', org: 'Warung Kebun', challenge: 'CHK-8801', pack: 'RWD-APRES-01', at: '9 Okt 2026, 10.12 WIB', status: 'Siap disalurkan' },
  { id: 'CLM-2026-08', org: 'Komunitas Berbagi', challenge: 'CHK-8795', pack: 'RWD-DAPUR-03', at: '8 Okt 2026, 16.40 WIB', status: 'Diserahkan' },
  { id: 'CLM-2026-07', org: 'Toko Berkah', challenge: 'CHK-8790', pack: 'RWD-LOGIS-02', at: '7 Okt 2026, 11.05 WIB', status: 'Diserahkan' },
]

export interface Txn {
  id: string
  date: string
  kind: 'Masuk' | 'Keluar' | 'Barang'
  purpose: string
  source: string
  amount: number
  /** Untuk bantuan barang: jumlah fisik, tidak dikonversi ke rupiah. */
  goods?: string
  linked?: string
  status: string
  dbId?: number
}

export const txns: Txn[] = [
  { id: 'TRX-2026-F01-8821', date: '8 Okt 2026, 16.20 WIB', kind: 'Masuk', purpose: 'Subsidi ongkir', source: 'Warung Kebun', amount: 50000, linked: 'LP-DEMO-01', status: 'Tervalidasi' },
  { id: 'TRX-2026-F01-8800', date: '1 Okt 2026, 09.00 WIB', kind: 'Masuk', purpose: 'Program PRG-2026-BDG-01', source: 'Mitra Komunitas Bandung', amount: 950000, status: 'Tervalidasi' },
  { id: 'TRX-2026-K01-0412', date: '8 Okt 2026, 18.05 WIB', kind: 'Keluar', purpose: 'Ongkir dan bahan bakar relawan', source: '14 trip penjemputan', amount: 360000, status: 'Tervalidasi' },
  { id: 'TRX-2026-K01-0409', date: '5 Okt 2026, 13.30 WIB', kind: 'Keluar', purpose: 'Wadah bersih dan label alergen', source: 'Pengadaan pos transit', amount: 240000, status: 'Tervalidasi' },
  { id: 'INK-2026-0031', date: '4 Okt 2026, 10.00 WIB', kind: 'Barang', purpose: 'Wadah ramah lingkungan', source: 'Mitra katering', amount: 0, goods: '50 wadah', status: 'Dicatat fisik' },
  { id: 'INK-2026-0030', date: '2 Okt 2026, 15.00 WIB', kind: 'Barang', purpose: 'Chiller posko', source: 'Warga Coblong', amount: 0, goods: '1 unit (dipinjamkan)', status: 'Dicatat fisik' },
]

export interface Program {
  id: string
  title: string
  sponsor: string
  period: string
  budget: number
  used: number
  portions: number
  transfers: number
  status: string
  dbId?: number
}

export const programs: Program[] = [
  { id: 'PRG-2026-BDG-01', title: 'Distribusi pangan dhuafa Coblong', sponsor: 'Mitra Komunitas Bandung', period: '1–31 Okt 2026', budget: 1000000, used: 600000, portions: 220, transfers: 12, status: 'Aktif' },
  { id: 'PRG-2026-BDG-02', title: 'Wadah higienis pos Cidadap', sponsor: 'Mitra Peduli Pangan', period: '15 Okt–15 Nov 2026', budget: 0, used: 0, portions: 0, transfers: 0, status: 'Menunggu dana' },
]

export const auditSeed: AuditEntry[] = [
  { id: 'AUD-0004', at: '8 Okt 2026, 16.38 WIB', actor: 'Staf Ops Coblong', target: 'LP-DEMO-01', before: 'Disepakati 12 porsi', after: 'Diterima 10 porsi (2 rusak)', reason: 'Penyesuaian serah terima sesuai konfirmasi penerimaan.' },
  { id: 'AUD-0003', at: '8 Okt 2026, 16.20 WIB', actor: 'Staf Keuangan', target: 'TRX-2026-F01-8821', before: 'Belum divalidasi', after: 'Tervalidasi Rp50.000', reason: 'Bukti transfer sesuai mutasi.' },
  { id: 'AUD-0002', at: '8 Okt 2026, 14.30 WIB', actor: 'Sistem', target: 'ORG-WK', before: 'Berkas diunggah', after: 'Menunggu pemeriksaan', reason: 'Masuk antrean peninjau wilayah Coblong.' },
  { id: 'AUD-0001', at: '7 Okt 2026, 17.05 WIB', actor: 'Komunitas Berbagi', target: 'CP-0792', before: '6 porsi tersedia', after: '6 porsi ditawarkan', reason: 'Catatan dihubungkan ke penawaran PGR-8845.' },
]

export interface OpOffer {
  id: string
  name: string
  donor: string
  area: string
  published: string
  deadline: string
  initial: number
  reserved: number
  available: number
  unit: string
  status: 'Aktif' | 'Selesai'
  requests: { id: string; org: string; asked: number; proposed?: number; time: string; method: string; status: string; transferId?: string }[]
}

export const opOffers: OpOffer[] = [
  {
    id: 'PGR-8821', name: 'Nasi kotak ayam dan sayur', donor: 'Warung Kebun', area: 'Kec. Coblong, Bandung', published: '8 Okt 2026, 11.30 WIB', deadline: '8 Okt, 18.00 WIB',
    initial: 20, reserved: 12, available: 8, unit: 'porsi', status: 'Aktif',
    requests: [
      { id: 'REQ-300', org: 'Komunitas Berbagi', asked: 12, time: '8 Okt, 16.30 WIB', method: 'Ambil sendiri', status: 'Disetujui', transferId: 'LP-DEMO-01' },
      { id: 'REQ-301', org: 'Dapur Sosial Dhuafa', asked: 10, proposed: 8, time: '8 Okt, 17.00 WIB', method: 'Ambil sendiri', status: 'Menunggu penyesuaian' },
    ],
  },
  {
    id: 'PGR-8834', name: 'Beras putih kemasan', donor: 'Toko Berkah', area: 'Kec. Sukasari, Bandung', published: '7 Okt 2026, 09.10 WIB', deadline: '9 Okt, 17.00 WIB',
    initial: 10, reserved: 10, available: 0, unit: 'kg', status: 'Aktif',
    requests: [{ id: 'REQ-296', org: 'Dapur Sosial Dhuafa', asked: 10, time: '9 Okt, 10.00 WIB', method: 'Kurir bersponsor', status: 'Disetujui', transferId: 'LP-DEMO-04' }],
  },
  {
    id: 'PGR-8819', name: 'Sayur lodeh dan tahu', donor: 'Warung Kebun', area: 'Kec. Coblong, Bandung', published: '6 Okt 2026, 12.00 WIB', deadline: '6 Okt, 18.00 WIB',
    initial: 10, reserved: 0, available: 0, unit: 'porsi', status: 'Selesai',
    requests: [{ id: 'REQ-288', org: 'Komunitas Berbagi', asked: 10, time: '6 Okt, 16.00 WIB', method: 'Antar pemberi', status: 'Disetujui', transferId: 'LP-DEMO-00' }],
  },
]

/** Rantai LP-DEMO-01 (AD06): penawaran → kesepakatan → pengambilan → penerimaan → pemanfaatan. */
export interface Chain {
  id: string
  offerId: string
  status?: string
  steps: { title: string; value: string; who: string; tone: string }[]
  ledger: string[][]
}

export const chain: Chain = {
  id: 'LP-DEMO-01',
  offerId: 'PGR-8821',
  steps: [
    { title: 'Penawaran awal', value: '20 porsi', who: 'Warung Kebun (PGR-8821)', tone: 'done' },
    { title: 'Permintaan disetujui', value: '12 porsi', who: 'Komunitas Berbagi', tone: 'done' },
    { title: 'Pengambilan fisik', value: '12 porsi', who: 'Ambil sendiri (relawan)', tone: 'done' },
    { title: 'Penerimaan aktual', value: '10 layak / 2 rusak', who: 'Konfirmasi penerimaan', tone: 'warn' },
    { title: 'Pemanfaatan', value: '7 dibagikan / 1 dipakai', who: '2 porsi sisa di chiller', tone: 'done' },
  ],
  ledger: [
    ['Penawaran awal', '20 porsi', 'Input Warung Kebun saat menerbitkan penawaran'],
    ['Kesepakatan alokasi', '12 porsi', 'Disetujui untuk Komunitas Berbagi'],
    ['Diterima layak', '10 porsi', 'Pemeriksaan fisik saat serah terima'],
    ['Tidak diterima', '2 porsi', 'Kemasan sobek di perjalanan'],
    ['Dibagikan ke warga', '7 porsi', 'Laporan distribusi penerima'],
    ['Dipakai di posko', '1 porsi', 'Makan malam relawan posko'],
    ['Sisa persediaan', '2 porsi', 'Chiller posko (bukan terbuang)'],
  ],
}

/** Keikutsertaan challenge yang diperiksa admin (AD14). */
export interface Participant {
  id: string
  dbId: number
  challenge: string
  title: string
  org: string
  profileId: number
  target: number
  progress: number
  unit: string
  status: string
}

export interface Material {
  id: number
  profileId: number
  org: string
  version: number
  caption: string
  status: string
  note?: string
}

/** Seluruh data konsol: demo dari berkas ini, live dari services/admin.ts dengan bentuk yang sama. */
export interface AdminData {
  orgs: Org[]
  issues: Issue[]
  deliveries: Delivery[]
  contents: Content[]
  challenges: Challenge[]
  participants: Participant[]
  rewardPacks: RewardPack[]
  claims: Claim[]
  txns: Txn[]
  programs: Program[]
  audit: AuditEntry[]
  opOffers: OpOffer[]
  chains: Record<string, Chain>
  couriers: { id: number; name: string }[]
  partners: { id: number; name: string; area: string }[]
  materials: Material[]
  /** Dampak fisik per satuan untuk laporan terbuka (AD21); satuan tidak pernah dijumlahkan silang. */
  impact: Record<string, { offered: number; received: number; rejected: number; distributed: number }>
}

export const demoData: AdminData = {
  orgs,
  issues,
  deliveries,
  contents,
  challenges,
  participants: [{ id: 'CHK-8801', dbId: 0, challenge: 'CHL-2026-Q4-01', title: 'Catat Pangan tiga hari rutin', org: 'Warung Kebun', profileId: 0, target: 3, progress: 3, unit: 'sesi', status: 'Menunggu verifikasi' }],
  rewardPacks,
  claims,
  txns,
  programs,
  audit: auditSeed,
  opOffers,
  chains: { [chain.id]: chain },
  couriers: [{ id: 0, name: 'Andi (relawan kurir)' }],
  partners: [{ id: 0, name: 'Warung Kebun', area: 'Kec. Coblong, Bandung' }],
  materials: [],
  impact: {
    porsi: { offered: 30, received: 20, rejected: 4, distributed: 7 },
    kg: { offered: 10, received: 10, rejected: 0, distributed: 5 },
    kemasan: { offered: 0, received: 0, rejected: 0, distributed: 0 },
  },
}

/** Mode live sebelum data server termuat: kosong, bukan data demo. */
export const emptyData: AdminData = {
  orgs: [], issues: [], deliveries: [], contents: [], challenges: [], participants: [], rewardPacks: [], claims: [], txns: [],
  programs: [], audit: [], opOffers: [], chains: {}, couriers: [], partners: [], materials: [], impact: {},
}
