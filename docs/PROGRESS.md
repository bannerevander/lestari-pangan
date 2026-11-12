# Progres Lestari Pangan

Papan pelacakan proyek. Perbarui setiap selesai satu pekerjaan: ubah status di tabel, tambahkan baris di §5.

Status: ✅ selesai · 🟡 sebagian · ⬜ belum · ⛔ menunggu keputusan

## 1 Ringkasan

| Area | Status | Catatan |
| --- | --- | --- |
| Requirement dan desain | ✅ | [REQUIREMENTS.md](REQUIREMENTS.md), [design.md](design.md) |
| Prototipe (126 layar Stitch, mode demo) | ✅ | Dipisah ke folder `prototype/` (selalu demo, ada pemilih peran). Aplikasi utama tidak punya mode demo lagi |
| Arsitektur | ✅ | [architecture.md](architecture.md) v0.3, AR-01 s.d. AR-12 |
| Backend Supabase (skema, RLS, RPC, job) | ✅ | 12 migrasi diterapkan; 6 berkas tes, 95 asersi lulus; Edge Function `ai-chat` ([supabase/README.md](../supabase/README.md)) |
| Keamanan | 🟡 | Kode selesai dan teruji; **langkah manual dashboard belum** ([SECURITY.md](SECURITY.md) §3) |
| Sambungan front end ke Supabase | ✅ | Semua kelompok layar aplikasi dan konsol admin tersambung (§2); **menunggu pengecekan pengguna** dengan akun nyata |
| Hosting Vercel | ✅ | https://lestari-pangan.vercel.app (proyek `lestari-pangan`). Deploy otomatis setiap push ke `main` di GitHub (Root Directory `lestari-pangan-frontend`) |
| Repo GitHub | ✅ | https://github.com/bannerevander/lestari-pangan (**private**; LOGICODIX mewajibkan public saat submission) |
| Asisten Dapur AI (chat + suara) | 🟡 | Layar `/asisten`, tombol "Tanya AI" di semua tab, Edge Function `ai-chat` ter-deploy (AR-21). Kunci Gemini terpasang; jawaban asli lulus uji (resep, keamanan pangan, tolak di luar topik dan "abaikan instruksi"). Tier gratis sering padat: 3–12 detik, sesekali gagal (pesan "sibuk" + Coba lagi). Suara asli belum diuji di HP |
| Akun uji juri | ✅ | Pemberi, penerima, kurir, admin semua lingkup; masuk dengan kata sandi ([AKUN-UJI.md](AKUN-UJI.md)). Ganti/hapus setelah penjurian |
| Pembayaran | 🟡 | Transfer manual ke SeaBank 901335870147 a.n. BANNER EVANDER SALIM (instruksi + kode referensi di aplikasi), divalidasi admin keuangan. QRIS tidak dikerjakan untuk lomba (AR-14) |

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
| Uji konkurensi AT-01 paralel sungguhan | Sebelum pilot. |
| Setiap pembaruan memuat ulang semua data akun (bukan per tabel) | Cukup untuk pilot; pecah per modul bila data membesar. Konsol admin belum Realtime (muat ulang saat tab aktif dan setelah aksi). |
| Daftar penawaran/permintaan/penyaluran dibatasi 200 baris tanpa paginasi (juga konsol admin) | Paginasi bila data membesar (`shortcut:` di `services/donation.ts`, `services/admin.ts`). |
| Lingkup admin eksklusif (`ops`/`keuangan`/`konten`): satu akun hanya bisa menjalankan aksi lingkupnya; aksi lain ditolak server | Buat satu akun staf per lingkup (lihat [supabase/README.md](../supabase/README.md) §Akun admin). |
| Laporan terbuka admin menampilkan semua periode (filter periode belum ada di mode live) | Tambah filter periode bila dibutuhkan juri/sponsor. |

## 4 Keputusan yang menunggu Anda

Semua keputusan arsitektur terjawab (AO-04 → AR-21 pada 12 Nov 2026). AO-08 terjawab 11 Nov 2026 (AR-16 s.d. AR-20). Terjawab 10 Nov 2026: AO-05 transfer manual (AR-14), AO-06 push web ditunda (AR-15), AO-09 boleh berkegiatan sebelum verifikasi (AR-13). AO-07 (format lomba) terjawab oleh guidebook LOGICODIX 2026: aplikasi Web ter-deploy + repo GitHub public + video YouTube 3–5 menit + surat orisinalitas, code freeze 14 Nov 2026 23.59 WIB.

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
| 10 Nov 2026 | Keputusan AO-05, AO-06, AO-09 dicatat sebagai AR-13 s.d. AR-15. Perilaku server sudah sesuai (tanpa cek verifikasi); komentar `shortcut:` AO-09 di migrasi donation yang sudah diterapkan dibiarkan agar migrasi tidak berubah. |
| 11 Nov 2026 | Keputusan OD-01 s.d. OD-05 (AR-16 s.d. AR-20): migrasi `product_decisions` + tes 19 asersi; tes lama disesuaikan. Front end: batas per penerima dan data wajib per kategori di form penawaran, batas tanggapan 2 jam di permintaan, status `Menunggu verifikasi` + panel verifikasi admin, ajukan/tanggapi ongkir, saldo poin dan tukar poin di Reward, poin di editor challenge/paket admin, daftar tanpa langkah bukti. Migrasi diterapkan ke proyek; 90 asersi lulus; advisor tanpa temuan baru selain peringatan RPC yang disengaja. `database.types.ts` di-generate ulang. Tes dana dibuat aman terhadap data asli (saldo dibanding saldo awal). |
| 12 Nov 2026 | Akun uji juri per peran (`*@example.com`, dibuat lewat SQL dengan kata sandi) + tombol "Masuk dengan kata sandi" di layar masuk aplikasi dan konsol admin (`signInWithPassword`). Diuji: login API keempat akun + login UI pemberi dan admin di localhost. |
| 12 Nov 2026 | Asisten Dapur AI (AR-21): migrasi `ai_assistant` (kuota 40 pesan/jam, tes 5 asersi), Edge Function `ai-chat` (Gemini, jawaban terstruktur `on_topic` agar hanya topik makanan, katalog resep terkurasi + Catat Pangan sebagai konteks), layar chat dengan mode suara (Web Speech API: dengar, pikir, bicara, sela, ulangi, ketik), tombol mengambang "Tanya AI" di semua tab, kartu di Resep dan Semua fitur. Perbaikan: profil dimuat ulang saat ganti akun tanpa keluar (`onSignedIn`). |
| 13 Nov 2026 | `ai-chat`: dukung beberapa kunci (`GEMINI_API_KEY*`), urutan model bisa diatur lewat `GEMINI_MODEL`, model dan kunci diselang-seling saat padat (6 dtk/percobaan, total ≤20 dtk), log waktu per percobaan. Uji 6 pertanyaan: 5 berhasil (3–12 dtk), 1 gagal karena semua model padat. 3.8 Flash ditolak 503 di semua percobaan awal. |
