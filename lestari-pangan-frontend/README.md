# Lestari Pangan — Front End

Front end mobile-first Lestari Pangan (aplikasi pengguna + konsol admin di `/admin`). Gambaran produk, arsitektur, dan akun demo ada di [README utama](../README.md).

Bijak Konsumsi, Kurangi Sisa, Jaga Bumi.

## Menjalankan

```bash
npm install
cp .env.example .env.local   # isi URL + publishable key Supabase (wajib)
npm run dev                  # http://localhost:5173
npm run build                # type-check + build produksi ke dist/ (gagal bila ada kunci rahasia di env)
npm run preview              # melayani dist/ dengan header keamanan yang sama seperti Vercel
npm run test:config          # tes pengaman env
npm run lint
```

Butuh Node.js 18 atau lebih baru (`test:config` butuh Node 23.6+ karena menjalankan TypeScript langsung).

**Tanpa mode demo.** Aplikasi selalu memakai Supabase; tanpa env tampil layar "Konfigurasi belum lengkap".

**Deploy ke Vercel.** Produksi: https://lestari-pangan.vercel.app (proyek `lestari-pangan`, env sudah terisi di Vercel). Dari folder ini:

```bash
npx vercel@latest login              # sekali per komputer
npx vercel@latest deploy --prod      # build di server Vercel lalu terbit
```

`vercel.json` berisi rewrite SPA dan header keamanan; `.vercelignore` mencegah berkas env ikut terunggah. Jangan menaruh kunci lain di env Vercel.

## Teknologi

- React 18 + TypeScript + Vite 5
- Tailwind CSS 3 dengan token dari design.md §4–5 (`tailwind.config.js`)
- React Router 6
- Supabase (`@supabase/supabase-js`): login email OTP, RPC, storage
- Ikon Phosphor (`@phosphor-icons/react`), sesuai design.md §6; ikon tab bawah memakai geometri SVG dari H01
- Font Inter dibundel lokal (`@fontsource/inter`), tanpa CDN

## Yang sudah bisa dicoba

Masuk dengan email + kode OTP. Peran (Pemberi atau Penerima) dipilih sekali saat mendaftar; untuk menguji dua peran, pakai dua akun. Akun admin dibuat lewat SQL; caranya di [supabase/README.md](../supabase/README.md); akun demo testing ada di [docs/AKUN-UJI.md](../docs/AKUN-UJI.md).

| Kode | Layar | Rute |
| --- | --- | --- |
| U02, U03, U07 | Pengenalan, Masuk (OTP / kata sandi), Pilih peran | `/pengenalan`, `/masuk`, `/peran` |
| H01 / H02 | Beranda pemberi / penerima | `/` |
| H03 | Semua fitur | `/fitur` |
| D01 | Penawaran saya (pemberi) | `/donasi` |
| D02 | Tawarkan Pangan, 3 langkah + draf | `/donasi/baru` (juga `?dari=<id catatan>`) |
| D03, D05 | Kelola dan tutup penawaran | `/donasi/kelola/:id`, `/donasi/kelola/:id/tutup` |
| D06, D07 | Cari pangan + filter (penerima) | `/donasi` |
| D08 | Detail pangan | `/donasi/:id` |
| Q01, Q01-B | Ajukan permintaan, 2 langkah + komitmen | `/donasi/:id/minta` |
| Q02, Q06 | Detail dan batalkan permintaan | `/permintaan/:id`, `/permintaan/:id/batal` |
| Q03, Q04 | Permintaan masuk, tinjau (setujui/tolak) | `/aktivitas/permintaan`, `/permintaan/:id/tinjau` |
| L01 / L01R | Aktivitas: Perlu tindakan / Berjalan / Riwayat | `/aktivitas` |
| L02 | Detail penyaluran + riwayat kegiatan | `/aktivitas/:id` |
| L05, L06 | Catat penyerahan, konfirmasi penerimaan (penuh/sebagian/tolak) | `/aktivitas/:id/serahkan`, `/aktivitas/:id/terima` |
| C06 | Laporan penggunaan/distribusi | `/aktivitas/:id/distribusi` |
| L09, L10 | Notifikasi, laporan masalah | `/notifikasi`, `/aktivitas/:id/masalah` |
| C01, C02 | Catat Pangan, tambah catatan | `/pangan`, `/pangan/baru` |
| I01 | Dashboard dampak | `/dampak` |
| T01, T02 | Tips, artikel + simpan | `/tips`, `/tips/:id` |
| R01 | Resep dari Sisa | `/resep` |
| AI | Asisten Dapur AI (chat + suara) | `/asisten` |
| E01 | Eco Challenge (tampilan) | `/tantangan` |
| A01 / A01R | Akun | `/akun` |

Alur lengkap yang sudah teruji otomatis: pemberi menerbitkan penawaran → penerima meminta → pemberi menyetujui → pemberi mencatat penyerahan → penerima menerima sebagian → penerima melaporkan distribusi.

## Batas yang diketahui

- Semua layar memakai Supabase.
- Pembayaran memakai transfer bank manual yang divalidasi admin (QRIS tidak dikerjakan untuk lomba). Push notification di luar aplikasi belum ada; notifikasi in-app memakai Realtime.

## Struktur

```
config/           publicEnvGuard.ts (build gagal bila ada kunci rahasia) + tes
src/
  lib/supabase/   client.ts, errors.ts, database.types.ts (dibuat otomatis dari skema)
  services/       auth.ts, identity.ts — satu berkas per modul backend
  state/          AppState.tsx (sesi + data hasil muat Supabase), SessionSync.tsx (sesi Supabase)
  pages/auth/     alur masuk/daftar, satu layar per berkas
  pages/*.tsx     layar lain (dipecah saat disambungkan ke backend)
  components/     ui.tsx (Button, Badge, Notice, Field, …), FoodCard, BottomTabBar, Layouts
  admin/          konsol admin, chunk terpisah
  data/           types.ts, kota.json (514 kab/kota), recipes.ts/engagement.ts (tipe)
public/
  illustrations/  ilustrasi SVG dari aset Stitch
  img/            logo, foto pangan dan tips dari Stitch
vercel.json       rewrite SPA + header keamanan (CSP, HSTS, dll.)
```

## Aksesibilitas yang sudah diperiksa

Pemeriksaan otomatis (axe-core) pada 17 layar di lebar 390 px tanpa pelanggaran setelah perbaikan; target sentuh minimal 48 px; tidak ada scroll horizontal pada 360 dan 390 px; teks memakai `rem` sehingga mengikuti ukuran huruf browser, dan layout diuji pada teks 200%; `prefers-reduced-motion` dihormati. Ini belum menggantikan uji dengan pengguna atau screen reader.
