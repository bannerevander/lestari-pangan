# Laporan uji menyeluruh — 13 Nov 2026

Uji manual alur penuh aplikasi `lestari-pangan-frontend` (dev server lokal `localhost:5173`, terhubung ke proyek Supabase produksi) plus tinjauan UI. Dokumen ini untuk direview dan sebagai daftar kerja perbaikan. Setiap temuan punya ID (`B-xx`) agar bisa dirujuk di commit.

## 1 Ringkasan

| | |
| --- | --- |
| Hasil otomatis | `tsc -b` lulus · `eslint` 0 error, 14 peringatan (`react-refresh/only-export-components`) · `test:config` 3/3 lulus · `vite build` berhasil (27 dtk) |
| Alur yang diuji | Onboarding, daftar (validasi), masuk (kode + kata sandi salah), pemberi, penerima, admin, Asisten AI, Catat Pangan, tiket bantuan |
| Alur utama pemberi → penerima → admin | **Berjalan dari awal sampai akhir** (penawaran → permintaan → setuju → persiapan → serah → terima sebagian → verifikasi admin → laporan distribusi) |
| Temuan | 3 tinggi, 5 sedang, 8 rendah, 7 catatan UI |
| Yang paling perlu diperbaiki | B-01 (form kosong setelah muat ulang), B-02 (tampilan "kosong" palsu saat data belum termuat), B-03 (angka/grafik dampak tertanam, bukan data nyata) |

### Status perbaikan (14 Nov 2026)

| ID | Status | Perubahan | Diverifikasi |
| --- | --- | --- | --- |
| B-02 | **Diperbaiki** | `MyProfile` (`ready`) dan `LiveData` (`loaded`) menandai muat pertama per akun/peran; `RequireAuth` (`App.tsx`) menampilkan "Memuat data…" sampai keduanya siap. Konsol admin: `admin/store.tsx` (`loaded`) + `AdminLayout` | Muat ulang `/notifikasi`, `/aktivitas`, `/admin`: layar tunggu lalu langsung angka final, tanpa "Belum ada notifikasi"/0 palsu |
| B-01 | **Diperbaiki** (lewat B-02) | Form baru dirender setelah data ada, jadi `useState` terisi nilai benar | Muat ulang `/donasi/kelola/PGR-12/ubah`: tanggal, jam, jumlah 3, "Kulkas" terisi; Simpan nonaktif sampai ada perubahan |
| B-03 | **Diperbaiki** | Grafik "Aktivitas sepekan" dihitung dari tanggal penerimaan di riwayat, 7 hari terakhir (`lib/impact.ts` + tes `lib/impact.test.ts`); label "Oktober 2026" → "sejak bergabung" (Home, Dampak, Riwayat dampak); Beranda hanya menjumlah satuan porsi; petunjuk "Periode Oktober 2026" di admin dihapus | Dampak pemberi: 23 porsi di "13 Nov" (10+10+3), 8–14 Nov; muat di 320 px |
| B-11 | **Ikut beres** | Kab/kota kini terisi dari profil karena profil sudah termuat saat form dibuka | Langkah 2 Tawarkan Pangan: "Kota Bandung · Coblong" terisi |

**Verifikasi di produksi** (https://lestari-pangan.vercel.app, bundle `index-D1JG7yYG.js`, commit `a0a57e8`, 14 Nov 2026, browser bawaan aplikasi):

| Uji | Hasil |
| --- | --- |
| Masuk pemberi lalu muat ulang `/notifikasi`, `/aktivitas` | Langsung "Semua (7)" dan "Riwayat 3"; tidak ada "Belum ada notifikasi"/0 sementara (sebelumnya muncul) |
| Dampak pemberi | 23 porsi di "13 Nov" (8–14 Nov), tanpa label Oktober; cocok dengan database (LP-9 10 + LP-10 10 + LP-11 3, diterima 13 Nov WIB) |
| Beranda pemberi | "23 porsi · Terkonfirmasi · sejak bergabung" |
| `/donasi/baru` dimuat penuh | Kab/kota terisi "Kota Bandung · Coblong" |
| Muat ulang `/donasi/kelola/PGR-13/ubah` | Tanggal 14 Nov, 16:00–18:00, jumlah 2, "Rak kering" terisi; Simpan nonaktif. Ubah penyimpanan → tersimpan di database, jadwal tidak berubah |
| Konsol admin: masuk dan muat ulang `/admin/penyaluran` | "Memuat data…" ±0,2 dtk lalu "Semua 5"; dashboard "0 penawaran aktif" sesuai database (5 penawaran, semua Ditutup) |

Sisa terkait B-03 yang **belum** diubah: data milik pengguna masih dicocokkan lewat nama organisasi (`Transfer` belum punya id pihak); RLS sudah membatasi baris ke kegiatan akun sendiri, jadi risikonya rendah.

Konsekuensi B-02: layar tunggu bertahan sampai kueri **paling lambat** selesai (±20 kueri paralel; di dev 2× karena StrictMode). Normal ±1,6 dtk; saat Supabase lambat (teramati ±9–10 dtk per kueri pada 14 Nov dini hari) pengguna melihat "Memuat data…" lebih lama, bukan halaman kosong. Bila perlu lebih cepat: pecah muat per layar.

Batas uji: tampilan HP diperiksa lewat pemeriksaan DOM (overflow, target sentuh) karena tangkapan layar emulasi HP di panel pratinjau terpotong; kenyamanan visual di HP sungguhan **belum** dinilai. Semua uji memakai akun uji juri dengan metode Kode verifikasi (tanpa mengetik kata sandi asli).

## 2 Hasil per alur

| Alur | Hasil | Catatan |
| --- | --- | --- |
| Onboarding 3 slide → Daftar | Lulus | Validasi nama, email, ketentuan tampil. Kirim daftar **tidak** dicoba (butuh email asli) |
| Masuk: kode verifikasi (3 akun) | Lulus | Akun uji langsung masuk (Edge Function `demo-login`) |
| Masuk: kata sandi salah | Lulus | Pesan jelas: "Email atau kata sandi salah…" |
| Keluar | Lulus | Langsung keluar tanpa konfirmasi (B-12) |
| Pemberi: Tawarkan Pangan (3 langkah) | Lulus | Validasi waktu masak, alergen, pernyataan layak, berfungsi. PGR-11 terbit |
| Pemberi: Kelola penawaran / Ubah | **Gagal setelah muat ulang** | B-01 |
| Penerima: cari, detail, ajukan permintaan | Lulus | Validasi jumlah > sisa berfungsi. REQ-18 terkirim. Ringkasan salah label (B-05) |
| Pemberi: tinjau, setujui (sheet konfirmasi) | Lulus | LP-11 terbentuk, notifikasi masuk |
| Pemberi: persiapan (daftar periksa) | Lulus dengan cacat | B-04 |
| Pemberi: catat penyerahan | Lulus | Default jumlah 0 bila halaman dimuat ulang (B-01) |
| Penerima: konfirmasi penerimaan sebagian | Lulus | 3 dari 4 + alasan → "Menunggu verifikasi staf". Default 0 setelah muat ulang (B-01) |
| Admin: setujui verifikasi penerimaan | Lulus | Status jadi "Diterima sebagian"; rantai 5 langkah benar |
| Penerima: laporan distribusi | Lulus | 2/1/0, sisa dihitung otomatis, "Laporan tersimpan" |
| Catat Pangan: buat, catat penggunaan | Lulus | CP-13 2 kg → digunakan 1 kg → sisa 1 kg, riwayat benar |
| Pilih area (penerima) | Lulus | Dipakai juga untuk memulihkan data (lihat B-16) |
| Asisten Dapur AI | Lulus | Jawaban resep tampil; pertanyaan di luar topik ditolak sopan |
| Tiket bantuan: kirim (penerima) → balas (admin) | Lulus | TKT-3 selesai |
| Keamanan: balas tiket sebagai non-admin | Lulus | Server menolak: "Akun Anda tidak memiliki akses…" (tapi lihat B-06) |
| Sapuan 60+ rute (penerima) | Lulus | Tidak ada halaman rusak; 404 tampil benar; console tanpa error aplikasi |
| Sapuan 14 rute admin (laptop dan 390 px) | Lulus | Tidak ada overflow horizontal; tabel jadi kartu di HP |
| Overflow 390 px dan 320 px (≈25 rute pengguna) | Lulus | `scrollWidth` = lebar layar di semua rute |

### Belum diuji (kandidat putaran berikutnya)

- Kirim pendaftaran akun baru (OTP email asli), unggah berkas verifikasi, unggah foto penawaran/kendala.
- Tolak permintaan, Ajukan penyesuaian, Batalkan permintaan, Tutup penawaran, batal otomatis 2 jam, ongkir ditanggung pemberi.
- Lapor masalah (kirim) dan Antrean kendala admin; penyaluran "Tidak datang".
- Eco Challenge sampai lolos + klaim reward (butuh 3 hari berbeda), Dukung/Transparansi kirim bukti, Apresiasi, permintaan hapus data.
- Admin: editor konten (terbit), promosi, program, buku kas, laporan CSV/PDF.
- Suara Asisten (TTS), GPS di Lokasi, PWA/offline, APK Android, build produksi di Vercel, uji beban/konkurensi, audit axe.

## 3 Temuan fungsional

Tingkat: **Tinggi** = data/alur salah atau menyesatkan, perbaiki sebelum penjurian · **Sedang** · **Rendah**.

### Tinggi

**B-01 Form terisi sebelum data termuat → kosong setelah muat ulang / buka tautan langsung.**
Bukti: muat ulang `/donasi/kelola/PGR-11/ubah` → tanggal, jam, jumlah (0), penyimpanan kosong dan tombol **Simpan perubahan** aktif. `/aktivitas/LP-11/serahkan` → "Jumlah diserahkan 0" (seharusnya 4). `/aktivitas/LP-11/terima` → "Diterima 0 porsi". Lewat navigasi di dalam aplikasi semuanya benar.
Penyebab: `useState(() => ...)` dihitung sekali saat render pertama, padahal `state.offers/transfers` baru terisi setelah `hydrate` (`state/LiveData.tsx`). Terverifikasi: `pages/donation/OfferEdit.tsx:19`, `pages/Activities.tsx:449` (Handover/Receive). Pola sama di `pages/Delivery.tsx:27`, `pages/Pangan.tsx:371`, `pages/Settings.tsx:271`, `pages/Support.tsx:621` (belum dicoba satu per satu).
Dampak: pengguna bisa tak sengaja menyimpan jumlah 0 / jadwal kosong, atau menyerahkan 0 porsi.
Saran: tampilkan layar tunggu sampai data pertama termuat (lihat B-02), lalu render form dengan `key={offer.id}` atau seed state di `useEffect` saat data tiba.

**B-02 Tidak ada status "memuat": layar menampilkan keadaan kosong/error palsu sampai data tiba.**
Bukti (muat ulang): `/aktivitas/LP-11/ubah` → "Kegiatan tidak tersedia"; `/notifikasi` → "Belum ada notifikasi" padahal badge lonceng 4 (data muncul ±2 dtk kemudian); `/aktivitas` → Perlu tindakan 0/Berjalan 0/Riwayat 0, lalu terisi; Dashboard admin → "0 penawaran aktif · Tidak ada antrean" beberapa detik.
Dampak: terkesan data hilang, terutama di koneksi lambat; penyebab utama B-01.
Saran: flag `loaded` di `LiveDataProvider`; `NotAvailable` dan `StatePanel` kosong hanya dirender setelah `loaded`, selainnya skeleton.

**B-03 Dampak: angka dan label tertanam, bukan dari data nyata.**
- `pages/Explore.tsx:144-147`: grafik **"Aktivitas sepekan"** berisi tanggal tetap 6–9 Okt; seluruh total diterima (20 porsi) ditaruh di "7 Okt" berlabel "Terkonfirmasi", hari lain 0/"Belum dicatat". Penerimaan sebenarnya 13 Nov.
- Label **"Oktober 2026"** tertanam di `pages/Home.tsx:168` dan `:238`, `Explore.tsx:170`, `Learn.tsx:671`, `admin/pages/Programs.tsx:179`; angka di Beranda (`Home.tsx:113-115`, `:186-188`) menjumlahkan **semua** kegiatan, tanpa filter bulan dan tanpa memisah satuan (selalu ditulis "porsi", padahal kg/kemasan ikut dijumlah). Bertentangan dengan prinsip "satuan tidak dijumlahkan" di teks aplikasi sendiri.
- `Home.tsx` mencocokkan data milik pengguna lewat nama (`t.donorName === profile.name`), bukan id; dua akun bernama sama akan tertukar di sisi tampilan.
Saran: hitung grafik dari tanggal penerimaan 7 hari terakhir, turunkan label periode dari tanggal hari ini, kelompokkan per satuan, cocokkan lewat id profil.

### Sedang

**B-04 Daftar periksa persiapan: lambat dan ketukan cepat saling menimpa** (`pages/Delivery.tsx:117-118`). Tiap centang memanggil RPC dengan array lama dan UI baru berubah setelah putaran server (±850 ms diukur). Mengetuk 4 kotak berurutan hanya mencatat 1–2. Saran: pembaruan optimistik + kirim array terbaru (atau satu RPC per item).

**B-05 Sisa istilah "Mitra pengiriman / ongkir" setelah peran kurir dihentikan (AR-22).**
- Tinjau permintaan (`pages/requests/RequestForm.tsx:118-119`): "Cara: Mitra pengiriman", "Biaya pengiriman: Belum tersedia", padahal form memilih "Ojek online".
- Admin detail rantai: "Penyerahan fisik · Mitra pengiriman". Dashboard admin: kartu "Kas subsidi ongkir"; layar kendala: "…dan pengantaran".
- `pages/Delivery.tsx:192` menampilkan "Biaya pengiriman: Rp0"; detail penyaluran pemberi: "Ojek online · pangan Rp0" — design.md melarang menyamakan "belum ada biaya" dengan Rp0.
- `pages/donation/SearchFood.tsx:119` memetakan nilai mentah `'Mitra pengiriman'` untuk filter (label di layar belum dicek).
Saran: pakai `methodLabel()` (`lib/format.ts:42`) di semua tempat tersebut.

**B-06 Antarmuka admin terbuka untuk akun non-admin.** Dengan sesi penerima, `/admin/masuk` langsung mengarah ke dashboard dan semua menu terbuka (daftar organisasi, tiket sendiri, dana). Server menolak aksi (balasan tiket ditolak) dan data pribadi pihak lain tampak tersaring, jadi **tidak ada kebocoran yang terlihat**, tetapi lapisan klien tidak memeriksa peran. Saran: gerbang peran di `AdminApp` (arahkan ke `/` atau tampilkan "bukan staf") sebagai pertahanan berlapis.
Penyebab (ditemukan 14 Nov): status masuk admin disimpan sendiri di `localStorage` (`lestari-pangan-admin-v2`, `admin/store.tsx` `load()`), terpisah dari sesi Supabase. Setelah admin masuk lalu akun lain masuk di aplikasi, konsol tetap menganggap staf masuk. Perbaikan: turunkan `signedIn` admin dari sesi Supabase + peran profil, bukan dari localStorage.

**B-07 Pesan galat validasi di luar layar.** Tinjau permintaan: "Centang komitmen sebelum mengirim." muncul di bawah, di balik footer lengket, halaman tidak digulir ke sana; pengguna hanya melihat tombol tidak bereaksi. Form lain (Tawarkan Pangan) sudah menampilkan ringkasan "Periksa 2 isian" di atas. Seragamkan.

**B-08 Dashboard admin tidak menonjolkan verifikasi penerimaan yang menunggu.** Saat LP-11 berstatus "Menunggu verifikasi", "Penyaluran yang perlu perhatian" dan "Kendala terbuka" menunjukkan 0; staf harus menemukannya lewat daftar penyaluran. Mungkin disengaja (kendala = laporan masalah); mohon dipastikan.

### Rendah

| ID | Temuan | Lokasi / saran |
| --- | --- | --- |
| B-09 | Judul permintaan memperkecil huruf nama pangan: "4 porsi uji qa nasi kotak ayam" ("QA" jadi "qa") | Detail permintaan; jangan `toLowerCase()` seluruh nama |
| B-10 | Teks digabung dengan tanda baca ganda: penjelasan selisih `“Jumlah fisik kurang: Uji QA: ….”.`; deskripsi penawaran yang diakhiri titik + ". Petunjuk pengambilan: …" menjadi "sendiri.." | Banner "Menunggu verifikasi staf"; Detail pangan |
| B-11 | Kab/kota di langkah Penyaluran (Tawarkan Pangan) kosong walau profil punya area | Prefill dari `profile.area` |
| B-12 | Tombol Keluar langsung keluar tanpa konfirmasi (mudah tersentuh di HP) | `Account.tsx` |
| B-13 | Admin › Pengguna: linimasa menandai "Dokumen diunggah (selesai)" padahal "Belum ada berkas" | `admin/pages/Users` |
| B-14 | Satu chunk utama 1.146 kB (gzip 294 kB); thumbnail 56 px memuat foto 1200 px | Pecah rute (`lazy`), pakai ukuran thumbnail dari storage |
| B-15 | 14 peringatan lint `react-refresh/only-export-components`; peringatan React Router v7 future flags di console | Pindah konstanta/helper; aktifkan flag `v7_*` bila siap |
| B-17 | Tutup penawaran: alasan wajib dipilih, tetapi tidak dikirim ke server (`run({ type: 'closeOffer', id })`), jadi tidak tercatat di mana pun | `pages/donation/OfferClose.tsx:105`; kirim alasan + catatan atau hapus pertanyaannya |
| B-18 | Dev saja: setelah HMR mengedit `LiveData.tsx`, Realtime melempar "cannot add `postgres_changes` callbacks … after `subscribe()`" karena kanal `notifications` lama belum terlepas. Tidak muncul pada muat bersih | `services/notify.ts`; beri nama kanal unik per langganan bila mengganggu |
| B-16 | **Profil penerima (USR-57) berubah sendiri menjadi "petisah, Kota Medan"** di tengah sesi uji (kolom `area` saja; jam, titik peta, alamat utuh). Penyebab **belum ditemukan**: tidak ada kode simpan otomatis di layar Lokasi/Area (`Settings.tsx`, `Extras.tsx`, `LocationPicker.tsx` hanya mengubah state lokal); kemungkinan uji manual di panel pratinjau. Sudah dipulihkan ke "Coblong, Kota Bandung" lewat Pilih area. | Pantau; jika terulang, periksa `identity_save_profile` di log |

## 4 Tinjauan UI

Ditinjau di bingkai HP (≈390 px) pada desktop, plus pemeriksaan DOM di 390/320 px dan konsol admin 1024/390 px.

| ID | Temuan | Catatan |
| --- | --- | --- |
| U-01 | **Target sentuh < 44 px** (standar sendiri di ULASAN-UX: ≥ 44/48): titik indikator banner 12×24 dan 24×24, tombol jeda banner 24×24 (Beranda, Tips, Resep, Reward, Dukung); tombol **Tanya AI** tinggi 34 px | Perbesar area ketuk (padding transparan) tanpa mengubah tampilan titik |
| U-02 | Tombol mengambang **Tanya AI** menutupi konten kanan-bawah (kartu daftar, "Belum ada penawaran aktif") di semua tab | Beri `padding-bottom` cukup di daftar atau kecilkan jadi ikon saat gulir |
| U-03 | Ikon tab **Donasi** berbentuk awan; kurang menyampaikan "berbagi/menawarkan" dibanding tab lain | Pertimbangkan ikon tangan/kotak donasi |
| U-04 | Langkah 2 Tawarkan Pangan: tiga kartu cara penyaluran memakai padding berbeda (kartu "Ojek online" teks mepet atas-bawah) | Samakan tinggi/padding |
| U-05 | Bilah progres langkah 3 dari 3 tidak penuh | Penuh di langkah terakhir |
| U-06 | Jumlah di Ajukan permintaan berupa kolom teks, sedangkan Ubah penawaran/Serahkan memakai stepper − / + | Seragamkan |
| U-07 | Admin: menu "Penawaran dan penyaluran" membungkus dua baris dengan jarak rapat | Perlebar sidebar atau persingkat label |

Yang sudah baik: hierarki Beranda (sapaan → aksi utama → strip Eco Challenge → pintasan), banner promo dengan teks nyata, label status dengan ikon+teks, pesan validasi berbahasa jelas, kartu "Pesan pengiriman" ojol dengan alamat jemput/antar, tampilan admin HP berupa kartu tanpa gulir horizontal, Asisten AI (kosong-state dengan contoh pertanyaan, penolakan di luar topik).

## 5 Data uji yang dibuat di produksi

Semua lewat akun uji juri; tidak ada yang dihapus. Bila ingin membersihkan sebelum penjurian:

| Data | Keterangan |
| --- | --- |
| PGR-11 "Uji QA nasi kotak ayam" | Penawaran pemberi, kini Selesai (sisa 2 porsi) |
| REQ-18 → LP-11 | 4 porsi, ojek online; Diterima sebagian 3/4, laporan 2 dibagikan / 1 digunakan / 0 terbuang; disetujui admin |
| CP-13 "Uji QA beras sisa stok" | Penerima, 2 kg, digunakan 1 kg, sisa 1 kg |
| TKT-3 | Tiket bantuan uji, dibalas admin, Selesai |
| Notifikasi dan baris audit | Menyertai tindakan di atas |
| Profil USR-57 | `area` diubah lalu dipulihkan (B-16) |
| PGR-12 "Uji QA wortel (dihapus)" | 14 Nov, untuk menguji muat ulang form Ubah; sudah ditutup lewat Tutup penawaran |
| PGR-13 "Uji QA produksi (akan ditutup)" | 14 Nov, uji yang sama di produksi; penyimpanan diubah lalu ditutup |

| **PGR-14 "Beras medium sisa stok"** | **Penawaran demo untuk juri, biarkan aktif.** Pemberi uji, Bahan pangan 10 kg, maks 5 kg per penerima, ambil 21 Nov 2026 08.00–20.00 WIB, Ambil sendiri + Ojek online, Coblong, Kota Bandung, tanpa foto (browser bawaan tidak bisa mengunggah berkas; `assets/foto-demo/penawaran/beras-karung.webp` cocok bila ingin menambah). Terlihat di Beranda/Cari pangan penerima. Kedaluwarsa otomatis setelah 21 Nov 20.00 WIB |

## 6 Urutan perbaikan yang disarankan

1. ~~B-02 → B-01~~ dan ~~B-03~~: selesai 14 Nov (lihat §1).
2. B-05, B-04, B-07, B-06, B-17.
4. U-01 dan sisanya, lalu putaran uji kedua untuk bagian "Belum diuji" di §2.
