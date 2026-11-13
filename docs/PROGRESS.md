# Progres Lestari Pangan

Papan pelacakan proyek. Perbarui setiap selesai satu pekerjaan: ubah status di tabel, tambahkan baris di §5.

Status: ✅ selesai · 🟡 sebagian · ⬜ belum · ⛔ menunggu keputusan

## 1 Ringkasan

| Area | Status | Catatan |
| --- | --- | --- |
| Requirement dan desain | ✅ | [REQUIREMENTS.md](REQUIREMENTS.md), [design.md](design.md) |
| Prototipe (126 layar Stitch, mode demo) | ✅ | Dipisah ke folder `prototype/` (selalu demo, ada pemilih peran). Aplikasi utama tidak punya mode demo lagi |
| Arsitektur | ✅ | [architecture.md](architecture.md) v0.3, AR-01 s.d. AR-12 |
| Backend Supabase (skema, RLS, RPC, job) | ✅ | 13 migrasi diterapkan; 6 berkas tes, 95 asersi lulus; Edge Function `ai-chat` ([supabase/README.md](../supabase/README.md)) |
| Keamanan | 🟡 | Kode selesai dan teruji; **langkah manual dashboard belum** ([SECURITY.md](SECURITY.md) §3) |
| Sambungan front end ke Supabase | ✅ | Semua kelompok layar aplikasi dan konsol admin tersambung (§2); **menunggu pengecekan pengguna** dengan akun nyata |
| Hosting Vercel | ✅ | https://lestari-pangan.vercel.app (proyek `lestari-pangan`). Deploy otomatis setiap push ke `main` di GitHub (Root Directory `lestari-pangan-frontend`) |
| Repo GitHub | ✅ | https://github.com/bannerevander/lestari-pangan (**private**; LOGICODIX mewajibkan public saat submission) |
| Asisten Dapur AI (chat + suara) | 🟡 | Layar `/asisten`, tombol "Tanya AI" di semua tab, Edge Function `ai-chat` ter-deploy (AR-21). Kunci Gemini terpasang; jawaban asli lulus uji (resep, keamanan pangan, tolak di luar topik dan "abaikan instruksi"). Jawaban mengalir (kata pertama ±1 dtk) dengan tombol Berhenti; suara Indonesia perempuan dipilih otomatis. Suara asli belum diuji di HP |
| Akun uji juri | ✅ | Pemberi, penerima, kurir, admin semua lingkup; metode Kode verifikasi langsung masuk (`demo-login`) atau Kata sandi ([AKUN-UJI.md](AKUN-UJI.md)). Hapus `demo-login` dan akun setelah penjurian |
| Pembayaran | 🟡 | Transfer manual ke SeaBank 901335870147 a.n. BANNER EVANDER SALIM (instruksi + kode referensi di aplikasi), divalidasi admin keuangan. QRIS tidak dikerjakan untuk lomba (AR-14) |

## 2 Sambungan layar ke backend

| Kelompok layar | Service | Status |
| --- | --- | --- |
| Pengenalan, masuk, daftar, kode OTP, peran, profil, bukti (U02–U10) | `auth.ts`, `identity.ts` | ✅ Diuji pengguna dengan email nyata (13 Okt 2026) |
| Akun, profil, verifikasi, pengaturan (A01–A12) | `identity.ts` | ✅ Profil, kebutuhan, lokasi, pilih area, verifikasi, preferensi notifikasi + kurangi gerakan (`identity_set_pref`) |
| Penawaran pemberi (D01–D05) | `donation.ts` | ✅ Terbit, ubah, tutup, daftar, terbit dari catatan pangan (`p_record_id`), foto pangan (diperkecil di perangkat, EXIF dibuang; diganti hanya dengan terbit ulang). Draf penawaran belum ada di UI |
| Cari pangan dan permintaan (D06–D08, Q01–Q06) | `donation.ts` | ✅ Tersambung (cari, ajukan, setujui/tolak, usul penyesuaian, tanggapi, batalkan) |
| Penyaluran, serah terima, distribusi, kendala (L01–L10, C06) | `fulfillment.ts`, `issues.ts` | ✅ Jadwal baru, cara penyaluran (termasuk mitra pengiriman), persiapan, serah terima, terima, laporan distribusi, lapor kendala + foto kondisi (privat), keberatan, koordinasi kontak terbatas (Telepon/WhatsApp ke pihak lawan, OD-09) |
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
| 13 Nov 2026 | Dua metode masuk untuk semua pengguna (Kode verifikasi / Kata sandi) di aplikasi dan konsol admin, tanpa jalur khusus juri. Baris Kata sandi di Pengaturan → Keamanan akses (`updateUser`; dikunci untuk akun uji). Edge Function `demo-login`: akun uji `@example.com` yang memilih kode langsung masuk. Diuji di localhost: penerima dan admin lewat kode, kurir lewat kata sandi, pesan kata sandi salah. |
| 13 Nov 2026 | Konsol admin di HP: 14 tabel admin berubah jadi kartu bertumpuk di bawah 768 px (label kolom lewat `data-label`, satu perubahan di `admin/ui.tsx` `Table`/`td`); desktop tetap tabel. Teks halaman Reward diperbarui ke sistem poin. Diperiksa di 375 px dan 1280 px. |
| 13 Nov 2026 | Asisten Dapur AI dibuat seperti chat LLM: `ai-chat` mengalirkan jawaban (SSE) dan hanya membatasi waktu diam (15 dtk kata pertama, 20 dtk jeda), menggantikan batas 6 dtk/percobaan yang memutus resep panjang lalu menampilkan "sibuk" (terlihat di log: 3× timeout 6.000 ms). Penanda `[LUAR_TOPIK]` menggantikan JSON `on_topic`; prompt diperjelas agar semua resep dianggap dalam topik. Klien lama tetap menerima JSON. Layar chat: satu tombol aksi (Bicara / Kirim / Berhenti) menggantikan tombol mikrofon + Bicara, jawaban tampil bertahap, Berhenti menyimpan potongan jawaban. Suara: daftar suara ditunggu (`voiceschanged`) sebelum memilih suara Indonesia perempuan (sebelumnya terpilih suara Inggris bawaan), mode suara mulai membaca sejak kalimat pertama, peringatan bila perangkat tidak punya suara Indonesia. Deploy `ai-chat` v10. Diuji di localhost: resep panjang selesai (STOP), 2 pertanyaan di luar topik ditolak, 3 pertanyaan makanan dijawab, Berhenti, pemilihan suara Chrome/Edge/Android. |
| 13 Nov 2026 | `ai-chat` v11: uji di build produksi (header CSP Vercel) menemukan saat Gemini padat tiga model diam 15 dtk berturut-turut, pengguna menunggu ±45 dtk hanya melihat spinner. Kini model cadangan dijalankan bersamaan bila belum ada kata dalam 5 dtk (yang lebih dulu menulis dipakai), header SSE dikirim seketika, dan layar menampilkan "Layanan AI sedang padat, mencoba jalur cadangan…". CSP produksi tidak memblokir chat maupun API suara. Uji 3 pertanyaan di build produksi: kata pertama 1,4–4,5 dtk; jalur cadangan belum terpicu karena server sedang tidak padat. |
| 13 Nov 2026 | APK Android (TWA) dibuat lewat PWABuilder: paket `app.vercel.lestari_pangan.twa` v1.0.0, minSdk 24, potret. Manifest dilengkapi (`id`, `scope`, `lang`, `orientation`, `categories`, ikon 192 px, ikon `any`/`maskable` terpisah). `public/.well-known/assetlinks.json` ditambahkan (sidik jari cocok dengan sertifikat APK, dicek dengan keytool). Kunci tanda tangan + APK/AAB di `android-release/` (diabaikan git). Panduan: [ANDROID.md](ANDROID.md). Belum diuji di HP sungguhan; bilah alamat hilang setelah assetlinks ter-deploy. |
| 13 Nov 2026 | Audit alur semua peran: semua layar "belum tersedia" ditutup. Foto penawaran di form (D02, `PhotoPicker` + `lib/image.ts` memperkecil ke ≤ 1280 px JPEG, EXIF/GPS terbuang, `services/photos.ts`). Migrasi `issue_photos`: kolom `issues.photo_path`, bucket privat `issue-photos`, `issues_report(..., p_photo_path)`; foto kondisi di Laporkan masalah (pengguna) dan kendala tugas (kurir), tampil di detail kasus admin (tautan 5 menit). Koordinasi (L08) = kontak terbatas: PIC, HP, alamat pihak lawan + tombol Telepon/WhatsApp, dipindah ke `pages/activities/Coordination.tsx`. Metode Mitra pengiriman bisa dipilih di layar Metode; teks "biaya belum tersedia" diganti. Admin Laporan terbuka: Ekspor CSV buku kas + Cetak/simpan PDF (menu disembunyikan saat cetak). Placeholder foto di Eco Challenge dan Catat Pangan dihapus (tidak ada di alur). Diuji di localhost: unggah 1280×853 JPEG 135 KB, foto kendala ditolak untuk akun lain dan URL publik, terbuka untuk pemilik dan admin; penawaran uji PGR-9 terbit dengan foto lalu ditutup. Koordinasi belum diuji dengan penyaluran nyata (akun uji belum punya penyaluran). |
| 13 Nov 2026 | Aset demo dari ChatGPT dimasukkan (22 WebP: `assets/foto-demo/penawaran/`, `assets/konten/`, `assets/promosi/`). Banner dan sampul diunggah ke bucket `media` (`promo/…`, `konten/…`) sehingga semua perangkat memuat gambar dari database + storage, dan admin bisa menggantinya tanpa deploy. 5 promosi PRM-7…11 dibuat lewat `admin_save_promotion` (tercatat di audit); 7 sampul diisi lewat SQL `photo_path` (RPC konten mengembalikan status ke Draf). Migrasi `promotion_audience`: target peran promosi (semua/pemberi/penerima), banner "Tawarkan pangan" hanya untuk pemberi. Sampul resep kini tampil di detail, daftar, dan hasil pencarian resep. UX admin untuk orang awam: pembuat banner (pilih foto + judul/kalimat/tombol dengan batas huruf, pratinjau selebar HP, hasil 1200×400 JPEG otomatis), mode banner jadi, pemilih gambar admin otomatis memotong tengah + mengecilkan (tidak ada lagi tolakan 2 MB/rasio), bahasa form diganti, jadwal/wilayah/urutan di Pengaturan lanjutan. Atribusi gambar AI di README. |
