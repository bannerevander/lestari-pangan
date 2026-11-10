# Progres Lestari Pangan

Papan pelacakan proyek. Perbarui setiap selesai satu pekerjaan: ubah status di tabel, tambahkan baris di §5.

Status: ✅ selesai · 🟡 sebagian · ⬜ belum · ⛔ menunggu keputusan

## 1 Ringkasan

| Area | Status | Catatan |
| --- | --- | --- |
| Requirement dan desain | ✅ | [REQUIREMENTS.md](REQUIREMENTS.md), [design.md](design.md) |
| Prototipe (126 layar Stitch, mode demo) | ✅ | Dipisah ke folder `prototype/` (selalu demo, ada pemilih peran). Aplikasi utama tidak punya mode demo lagi |
| Arsitektur | ✅ | [architecture.md](architecture.md) v0.3, AR-01 s.d. AR-12 |
| Backend Supabase (skema, RLS, RPC, job) | ✅ | 9 migrasi (termasuk data awal, Realtime, tiket bantuan, promosi), 70 asersi tes lulus ([supabase/README.md](../supabase/README.md)) |
| Keamanan | 🟡 | Kode selesai dan teruji; **langkah manual dashboard belum** ([SECURITY.md](SECURITY.md) §3) |
| Sambungan front end ke Supabase | ✅ | Semua kelompok layar aplikasi dan konsol admin tersambung (§2); **menunggu pengecekan pengguna** dengan akun nyata |
| Hosting Vercel | ✅ | https://lestari-pangan.vercel.app (proyek `lestari-pangan`). Deploy otomatis setiap push ke `main` di GitHub (Root Directory `lestari-pangan-frontend`) |
| Repo GitHub | ✅ | https://github.com/bannerevander/lestari-pangan (**private**; LOGICODIX mewajibkan public saat submission) |
| Resep suara (Edge Function) | ⛔ | Menunggu AO-04 (penyedia speech-to-speech) |
| Pembayaran | 🟡 | Transfer manual ke SeaBank 901335870147 a.n. BANNER EVANDER SALIM (instruksi + kode referensi di aplikasi), divalidasi admin keuangan. QRIS menyusul |

## 2 Sambungan layar ke backend

| Kelompok layar | Service | Status |
| --- | --- | --- |
| Pengenalan, masuk, daftar, kode OTP, peran, profil, bukti (U02–U10) | `auth.ts`, `identity.ts` | ✅ Diuji pengguna dengan email nyata (13 Okt 2026) |
| Akun, profil, verifikasi, pengaturan (A01–A12) | `identity.ts` | ✅ Profil, kebutuhan, lokasi, pilih area, verifikasi, preferensi notifikasi + kurangi gerakan (`identity_set_pref`) |
| Penawaran pemberi (D01–D05) | `donation.ts` | ✅ Terbit, ubah, tutup, daftar, terbit dari catatan pangan (`p_record_id`). Draf penawaran dan unggah foto belum ada di UI |
| Cari pangan dan permintaan (D06–D08, Q01–Q06) | `donation.ts` | ✅ Tersambung (cari, ajukan, setujui/tolak, usul penyesuaian, tanggapi, batalkan) |
| Penyaluran, serah terima, distribusi, kendala (L01–L10, C06) | `fulfillment.ts`, `issues.ts` | ✅ Jadwal baru, cara penyaluran, persiapan, serah terima, terima, laporan distribusi, lapor kendala, keberatan |
| Catat Pangan (C01–C05) | `inventory.ts` | ✅ Tambah, pergerakan, koreksi, riwayat; penerimaan otomatis jadi catatan (server) |
| Tugas kurir (K01–K04) | `fulfillment.ts` | ✅ Daftar tugas, ambil, serahkan, lapor kendala; akun kurir diarahkan ke `/tugas` |
| Notifikasi (L09) + Realtime | `notify.ts` | ✅ Daftar, tandai dibaca; notifikasi baru (Realtime) memuat ulang data |
| Tips dan resep teks (T01–T02, R) | `engagement.ts` | ✅ Konten dari tabel `contents` (data awal dari katalog demo), simpan tips/resep, catat bahan terpakai |
| Challenge, reward, apresiasi (E) | `engagement.ts` | ✅ Ikut challenge, progres server, ajukan pemeriksaan, klaim reward, setujui/minta revisi materi |
| Dukungan, transparansi dana (F) | `funding.ts` | ✅ Dukungan, riwayat, bukti, barang/jasa, pengingat rutin, transparansi dari `funding_summary` |
| Dashboard dampak (I) | data penyaluran | ✅ Dihitung dari penyaluran live per satuan (view `v_impact_*` belum dipakai) |
| Konsol admin (AD01–AD22) | `admin.ts`, `adminActions.ts` | ✅ Masuk OTP (peran admin), verifikasi + buka berkas, kendala, kurir, konten (+ foto sampul), challenge, capaian, reward, klaim, apresiasi (+ gambar), buku kas, program, laporan, audit |
| Promosi (banner Beranda, Tips, Resep, Reward, Dukung) | `promotions.ts` | ✅ Admin konten unggah banner sesuai template 1200×400, atur periode, wilayah kab/kota, tautan |
| Tiket bantuan + permintaan hapus data (A10, A12) | `support.ts` | ✅ Pengguna kirim tiket; admin ops membalas; balasan masuk notifikasi dan Pusat bantuan |
| Lokasi | `lib/area.ts`, `AreaField` | ✅ 514 kab/kota, 38 provinsi (Kepmendagri 2025) + kecamatan opsional; penawaran sekota tampil lebih dulu |

## 3 Utang teknis

| Hal | Rencana |
| --- | --- |
| Berkas front end besar dengan banyak layar: `components/ui.tsx` (±920 baris), `pages/Activities.tsx` (±950), `Learn.tsx` (±740), `Support.tsx` (±780), `Settings.tsx` (±640), `state/AppState.tsx` (±620), `admin/pages/Operations.tsx` (±610), `admin/pages/Programs.tsx` (±560), `services/admin.ts` (±330). Disambungkan tanpa dipecah agar sambungan selesai dulu | Dipecah ke `pages/<fitur>/` saat layarnya disambungkan ke backend ([CONVENTIONS.md](CONVENTIONS.md) §1). |
| Bundle utama 1.076 kB (gzip 272 kB) | Pemecahan per rute (`lazy()`) setelah layar dipecah. |
| State demo (`AppState`) dan data Supabase hidup berdampingan | Dihapus bertahap per kelompok layar; mode demo tetap ada selama env kosong. |
| Peran kurir belum ada di state aplikasi | Ditangani saat layar kurir disambungkan (komentar `shortcut:` di `pages/auth/useFinishSignIn.ts`). |
| Kewajiban verifikasi sebelum berkegiatan | Menunggu AO-09 (komentar `shortcut:` di migrasi donation). |
| Uji konkurensi AT-01 paralel sungguhan | Sebelum pilot. |
| Setiap pembaruan memuat ulang semua data akun (bukan per tabel) | Cukup untuk pilot; pecah per modul bila data membesar. Konsol admin belum Realtime (muat ulang saat tab aktif dan setelah aksi). |
| Daftar penawaran/permintaan/penyaluran dibatasi 200 baris tanpa paginasi (juga konsol admin) | Paginasi bila data membesar (`shortcut:` di `services/donation.ts`, `services/admin.ts`). |
| Lingkup admin eksklusif (`ops`/`keuangan`/`konten`): satu akun hanya bisa menjalankan aksi lingkupnya; aksi lain ditolak server | Buat satu akun staf per lingkup (lihat [supabase/README.md](../supabase/README.md) §Akun admin). |
| Laporan terbuka admin menampilkan semua periode (filter periode belum ada di mode live) | Tambah filter periode bila dibutuhkan juri/sponsor. |

## 4 Keputusan yang menunggu Anda

Lihat [architecture.md](architecture.md) §11: AO-04 (suara), AO-05 (pembayaran), AO-06 (push web), AO-08 (OD-01 s.d. OD-05), AO-09 (verifikasi sebelum berkegiatan). AO-07 (format lomba) terjawab oleh guidebook LOGICODIX 2026: aplikasi Web ter-deploy + repo GitHub public + video YouTube 3–5 menit + surat orisinalitas, code freeze 14 Nov 2026 23.59 WIB.

## 5 Log

| Tanggal | Pekerjaan |
| --- | --- |
| 8 Okt 2026 | Requirement v0.1, design.md, catatan keputusan produk. |
| 9 Okt 2026 | Ekspor 126 layar Google Stitch; layar dicocokkan. |
| 10 Okt 2026 | Front end lengkap (mode demo) + konsol admin terpisah. |
| 12 Okt 2026 | Arsitektur disetujui (Supabase free tier, modular monolith, PWA, email OTP, SMTP Gmail, Vercel). Skema + RPC seluruh modul diterapkan; 60 asersi tes lulus. Pengamanan: kolom privat profil, batas berkas storage, pengaman env build, header CSP/HSTS. Front end: lapisan `lib/supabase` + `services`, alur masuk/daftar dipecah per layar dan tersambung ke Supabase. Dokumen SECURITY, CONVENTIONS, PROGRESS, supabase/README. |
| 13 Okt 2026 | Deploy produksi ke Vercel (https://lestari-pangan.vercel.app) via CLI; env hanya URL + publishable key; header CSP/HSTS/XFO terverifikasi di produksi; file env tidak ikut terunggah (`.vercelignore`). Diagnosa SMTP: Gmail menolak kredensial. |
| 13 Okt 2026 | Lingkup admin `semua` (migrasi `admin_scope_all`); akun bannerevander26@gmail.com jadi admin semua lingkup (USR-29). Diagnosa: email pendaftaran pertama (template Confirm signup) hanya berisi tautan, bukan kode. |
| 13 Okt 2026 | Deploy produksi versi tanpa mode demo ke https://lestari-pangan.vercel.app (Vercel CLI); header CSP/HSTS dan env Supabase terverifikasi di bundle produksi. |
| 13 Okt 2026 | Mode demo dipindah ke `prototype/`; aplikasi utama hanya Supabase (tanpa env → layar konfigurasi). Data contoh, katalog statis, dan tombol pura-pura (telepon/arah kurir, unduh sertifikat, email demo, lupa akses) diganti fungsi nyata. Info transfer SeaBank. Lokasi seluruh Indonesia. Migrasi `tickets_promotions` (tiket, promosi, bucket `media`) + tes 10 asersi. Admin: halaman Promosi dan Tiket bantuan, unggah sampul konten dan gambar apresiasi. |
| 13 Okt 2026 | Skenario demo dihapus: pemilih peran Pemberi/Penerima, panel samping, tombol atur ulang data demo, dan semua label "Data demo". Peran hanya dari profil akun. |
| 13 Okt 2026 | Sambungan selesai untuk seluruh layar: penyaluran, Catat Pangan, kendala, notifikasi + Realtime, kurir, tips/resep, challenge, reward, apresiasi, dukungan dana, transparansi, preferensi, pilih area, dan konsol admin (OTP + RPC `admin_*`). Migrasi `engagement_seed_realtime` (konten, challenge, reward awal; notifikasi masuk publikasi Realtime). Tes engagement diperbarui agar tidak bentrok dengan data awal; 60 asersi lulus. Semua query PostgREST diperiksa terhadap Supabase. |
| 13 Okt 2026 | Hanya tema terang (mode gelap/sistem dihapus). Profil asli di semua layar (`useProfile` + `MyProfileProvider`), simpan profil dan unggah verifikasi lewat RPC. Lapisan data live: `LiveDataProvider` (hydrate) + `useCommand` (aksi → RPC). Alur penawaran, cari pangan, dan permintaan tersambung. `Donasi.tsx`, `Requests.tsx`, `OfferForm.tsx` dipecah per layar. |
| 10 Nov 2026 | Repo git dipindah ke root (monorepo: front end, supabase, prototype, docs); riwayat front end lama dipertahankan. Repo GitHub private `bannerevander/lestari-pangan`. Proyek Vercel disambungkan ke GitHub: push ke `main` = deploy produksi otomatis. |
