# Lestari Pangan — Front End (prototipe v0.1)

Front end mobile-first Lestari Pangan, dibangun dari `design.md`, `REQUIREMENTS.md`, `GAYA-HOME-TERKUNCI.md`, dan ekspor layar Google Stitch (H01 terkunci sebagai acuan utama).

Bijak Konsumsi, Kurangi Sisa, Jaga Bumi.

## Menjalankan

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + build produksi ke dist/
npm run preview    # melayani dist/
```

Butuh Node.js 18 atau lebih baru.

## Teknologi

- React 18 + TypeScript + Vite 5
- Tailwind CSS 3 dengan token dari design.md §4–5 (`tailwind.config.js`)
- React Router 6
- Ikon Phosphor (`@phosphor-icons/react`), sesuai design.md §6; ikon tab bawah memakai geometri SVG dari H01
- Font Inter dibundel lokal (`@fontsource/inter`), tanpa CDN

## Yang sudah bisa dicoba

Masuk lewat pengenalan → pilih peran (Pemberi atau Penerima). Peran bisa ditukar dari panel "Skenario demo" (di samping layar pada desktop, atau di bawah halaman Akun pada ponsel).

| Kode | Layar | Rute |
| --- | --- | --- |
| U02, U03, U07 | Pengenalan, Masuk (simulasi), Pilih peran | `/pengenalan`, `/masuk`, `/peran` |
| H01 / H02 | Beranda pemberi / penerima | `/` |
| H03 | Semua fitur | `/fitur` |
| D01 | Penawaran saya (pemberi) | `/donasi` |
| D02 | Tawarkan Pangan, 3 langkah + draf | `/donasi/baru` (juga `?dari=<id catatan>`) |
| D03, D05 | Kelola dan tutup penawaran | `/donasi/kelola/:id` |
| D06, D07 | Cari pangan + filter (penerima) | `/donasi` |
| D08 | Detail pangan | `/donasi/:id` |
| Q01 | Ajukan permintaan + tinjauan | `/donasi/:id/minta` |
| Q02, Q06 | Detail dan batalkan permintaan | `/permintaan/:id` |
| Q03, Q04 | Permintaan masuk, tinjau (setujui/tolak) | `/aktivitas/permintaan`, `/permintaan/:id/tinjau` |
| L01 / L01R | Aktivitas: Perlu tindakan / Berjalan / Riwayat | `/aktivitas` |
| L02 | Detail penyaluran + riwayat kegiatan | `/aktivitas/:id` |
| L05, L06 | Catat penyerahan, konfirmasi penerimaan (penuh/sebagian/tolak) | `/aktivitas/:id/serahkan`, `/aktivitas/:id/terima` |
| C06 | Laporan penggunaan/distribusi | `/aktivitas/:id/distribusi` |
| L09, L10 | Notifikasi, laporan masalah | `/notifikasi`, `/aktivitas/:id/masalah` |
| C01, C02 | Catat Pangan, tambah catatan | `/pangan`, `/pangan/baru` |
| I01 | Dashboard dampak | `/dampak` |
| T01, T02 | Tips, artikel + simpan | `/tips`, `/tips/:id` |
| R01 | Resep dari Sisa (teks; suara belum) | `/resep` |
| E01 | Eco Challenge (tampilan) | `/tantangan` |
| A01 / A01R | Akun | `/akun` |

Alur lengkap yang sudah teruji otomatis: pemberi menerbitkan penawaran → penerima meminta → pemberi menyetujui → pemberi mencatat penyerahan → penerima menerima sebagian → penerima melaporkan distribusi.

## Batas prototipe

- Belum ada backend. Data demo ada di `src/data/mock.ts`, state di `src/state/AppState.tsx`, dan disimpan di `localStorage` browser. "Atur ulang data demo" mengembalikan data awal.
- Respons server disimulasikan dengan jeda singkat; tidak ada autentikasi, unggah foto, pembayaran, suara, atau peta yang nyata.
- Keputusan terbuka (OD-01 s.d. OD-10 di design.md) tidak ditetapkan oleh kode ini. Contoh: alur penyesuaian permintaan (Q05) dan bentuk koordinasi (L08) masih berupa placeholder berlabel.
- Layar yang belum dibangun (reward, pendanaan F01–F09, profil/verifikasi A02–A12/U08–U11, admin AD01–AD22, mitra K01–K04) menampilkan halaman "Layar ini belum dibangun".

## Struktur

```
src/
  components/   ui.tsx (Button, Badge, Notice, Field, BottomSheet, …), FoodCard, BottomTabBar, Layouts
  pages/        Home, Donasi, OfferForm, Requests, Activities, Pangan, Account, Explore, Auth
  state/        AppState.tsx (reducer + localStorage)
  data/         types.ts, mock.ts
public/
  illustrations/  ilustrasi SVG dari aset Stitch
  img/            logo (dipotong dari PNG asli), foto pangan dan tips dari Stitch
```

## Aksesibilitas yang sudah diperiksa

Pemeriksaan otomatis (axe-core) pada 17 layar di lebar 390 px tanpa pelanggaran setelah perbaikan; target sentuh minimal 48 px; tidak ada scroll horizontal pada 360 dan 390 px; teks memakai `rem` sehingga mengikuti ukuran huruf browser, dan layout diuji pada teks 200%; `prefers-reduced-motion` dihormati. Ini belum menggantikan uji dengan pengguna atau screen reader.
