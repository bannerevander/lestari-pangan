# Keamanan Lestari Pangan

Versi 0.1 | 12 Oktober 2026

Dokumen ini menjelaskan cara aplikasi dilindungi, apa yang sudah diuji, dan langkah yang **harus dilakukan manual** di dashboard. Arsitektur lengkap ada di [architecture.md](architecture.md); status kerja di [PROGRESS.md](PROGRESS.md).

Prinsip utama: **front end dianggap tidak tepercaya.** Semua aturan (hak akses, stok, status, dana) ditegakkan di database. Pengguna yang mengubah kode JavaScript di browsernya tetap tidak bisa membaca atau mengubah data orang lain.

## 1 Lapisan backend (Supabase)

| Perlindungan | Penerapan | Diuji oleh |
| --- | --- | --- |
| Tulis hanya lewat RPC | Peran `authenticated` tidak punya hak INSERT/UPDATE/DELETE pada tabel mana pun; semua perubahan lewat fungsi `public.*` yang memeriksa peran di baris pertama. | `security.test.sql` #3 |
| RLS di semua tabel | Setiap tabel `public` memakai Row Level Security; data hanya terbaca oleh pemilik, pihak terkait, atau admin sesuai cakupan. | `security.test.sql` #4, AT-10 |
| Pengunjung tanpa login | Peran `anon` tidak punya hak pada tabel, view, maupun RPC. | `security.test.sql` #1–2 |
| Kolom privat | `profiles.user_id` dan `profiles.prefs` tidak terbaca pengguna lain; profil sendiri lewat `identity_me()`. Kontak dan alamat ada di `profile_contacts` dan hanya terbuka setelah penyaluran disetujui. | `security.test.sql` #7, AT-10 |
| View tidak melewati RLS | Semua view memakai `security_invoker`. | `security.test.sql` #5 |
| Fungsi SECURITY DEFINER aman | Semua mengunci `search_path = ''`. | `security.test.sql` #6 |
| Riwayat tidak bisa dipalsukan | `audit_log`, `transfer_events`, `record_movements`, `issue_events`, `ledger_entries` dilindungi trigger append-only. | `security.test.sql` #8 |
| Integritas data | Reservasi atomik, idempotensi `client_id`, `UNIQUE(provider_ref)`, constraint `CHECK` stok/kuota/saldo. | AT-01, AT-02, AT-07, AT-09 |
| Admin tidak bisa dibuat dari aplikasi | `identity_complete_onboarding` menolak peran `admin`; admin dibuat manual (§4). Setiap aksi admin tercatat di `audit_log`. | `security.test.sql` #12 |
| Berkas | Bucket `verification-docs` dan `issue-photos` privat (pemilik + admin ops, tautan bertanda tangan 5 menit), `offer-photos` publik-baca. Foto diperkecil di perangkat (≤ 1280 px, JPEG) sehingga EXIF termasuk lokasi GPS ikut terbuang sebelum diunggah. Batas ukuran dan jenis berkas ditegakkan server (5 MB PDF/JPG/PNG; 2 MB JPG/PNG/WebP). Pengguna hanya bisa mengunggah ke folder `<uid>/` miliknya; nama asli berkas tidak disimpan. | `security.test.sql` #9 |

Peringatan Supabase advisor "SECURITY DEFINER dapat dipanggil pengguna login" untuk RPC `public.*` **disengaja**: itulah satu-satunya jalur tulis.

## 2 Lapisan front end

| Perlindungan | Penerapan |
| --- | --- |
| Hanya kunci publik di browser | Front end memakai `VITE_SUPABASE_URL` dan `VITE_SUPABASE_PUBLISHABLE_KEY` saja. Keduanya memang dirancang publik. |
| Build gagal bila ada rahasia | [`config/publicEnvGuard.ts`](../lestari-pangan-frontend/config/publicEnvGuard.ts) menghentikan `dev`/`build` bila ada variabel `VITE_*` berisi `sb_secret_`, JWT `service_role`, atau bernama `*SECRET*`/`*SERVICE_ROLE*`/`*PRIVATE*`/`*PASSWORD*`. Diuji dengan `npm run test:config`. |
| Env tidak masuk git | `.env.local` diabaikan git; hanya `.env.example` (berisi placeholder) yang di-commit. |
| Tanpa sourcemap | `build.sourcemap = false`; kode sumber tidak dipublikasikan. |
| Login tanpa kata sandi | Email + OTP 6 angka. Token tidak pernah dibaca dari URL (`detectSessionInUrl: false`). Masuk dan daftar memakai jalur yang sama sehingga respons tidak membocorkan email mana yang terdaftar. |
| Header keamanan (Vercel) | [`vercel.json`](../lestari-pangan-frontend/vercel.json): CSP ketat (`script-src 'self'`, koneksi hanya ke proyek Supabase), HSTS, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy` (mikrofon/kamera hanya untuk situs sendiri). `npm run preview` memakai header yang sama sehingga bisa diuji lokal. |
| Pesan galat aman | [`lib/supabase/errors.ts`](../lestari-pangan-frontend/src/lib/supabase/errors.ts) menerjemahkan kode galat; pesan teknis server tidak ditampilkan ke pengguna. |
| Tanpa skrip pihak ketiga | Font dibundel lokal, tidak ada CDN, tidak ada `dangerouslySetInnerHTML`. |

Pemeriksaan bundle produksi (12 Okt 2026): tidak ada sourcemap; tidak ada `service_role`; string `sb_secret` hanya muncul di kode pustaka supabase-js (pemeriksa awalan kunci); email `@example.invalid` adalah data demo fiktif.

## 3 Langkah manual wajib (dashboard)

Bagian ini tidak bisa dilakukan lewat kode. Centang setelah selesai.

**Supabase → Authentication**

- [ ] **Email Templates → Magic Link**: tampilkan kode `{{ .Token }}` (bukan hanya tautan), karena aplikasi memakai kode 6 angka.
- [ ] **Providers → Email**: email OTP aktif; masa berlaku OTP 600 detik atau kurang.
- [ ] **SMTP Settings** (AR-06): Gmail khusus proyek + App Password (`smtp.gmail.com`, port 587). Tanpa ini, kode hanya terkirim ke anggota tim proyek Supabase. App Password **hanya** disimpan di dashboard ini.
- [ ] **URL Configuration**: Site URL = `https://lestari-pangan.vercel.app`; Redirect URLs = domain itu dan `http://localhost:5173` untuk pengembangan.
- [ ] **Rate Limits**: periksa batas email per jam setelah SMTP terpasang.
- [ ] **Sebelum dibuka untuk umum**: aktifkan CAPTCHA (Cloudflare Turnstile, gratis) di Attack Protection untuk mencegah akun sampah.

**Supabase → Akun**

- [ ] MFA aktif pada akun Supabase pemilik proyek.

**Supabase → Edge Functions → Secrets**

- [ ] `GEMINI_API_KEY` diisi (Google AI Studio). Kunci tidak pernah ditaruh di front end atau repo.
- [ ] **Setelah penjurian**: hapus Edge Function `demo-login` dan nonaktifkan akun uji (docs/AKUN-UJI.md). Selama aktif, siapa pun bisa masuk sebagai akun uji, termasuk admin.

**Vercel**

- [x] Proyek `lestari-pangan` dibuat; env `VITE_SUPABASE_URL` dan `VITE_SUPABASE_PUBLISHABLE_KEY` terisi untuk Production + Preview (13 Okt 2026). Jangan menambahkan kunci lain.
- [x] Deploy dari folder `lestari-pangan-frontend`; `.vercelignore` mencegah `.env*` dan folder build ikut terunggah (diverifikasi: `/.env.local` di produksi hanya mengembalikan `index.html`).
- [ ] Settings → Deployment Protection: biarkan perlindungan untuk URL preview; domain produksi tetap publik.

## 4 Membuat akun admin

Admin tidak bisa mendaftar dari aplikasi. Orang tersebut masuk sekali lewat aplikasi (agar akun auth-nya ada), lalu jalankan di SQL Editor Supabase:

```sql
insert into public.profiles (user_id, role, admin_scope, org_name, org_type, area)
select id, 'admin', 'ops', 'Nama Staf', 'Admin', 'Bandung'   -- scope: ops | konten | keuangan
from auth.users where email = 'email-staf@contoh.id';
```

## 5 Risiko yang masih diterima

| Risiko | Alasan diterima | Rencana |
| --- | --- | --- |
| Siapa pun bisa meminta kode untuk email apa pun, sehingga akun auth kosong bisa terbentuk. | Konsekuensi login tanpa kata sandi yang tidak membocorkan email terdaftar; akun kosong tidak punya profil maupun hak apa pun. | CAPTCHA sebelum rilis umum (§3). |
| Sesi tersimpan di `localStorage` sehingga rentan bila ada XSS. | Perilaku bawaan supabase-js; risiko XSS ditekan CSP ketat dan tanpa HTML mentah. | Tinjau ulang bila ada konten HTML dari pengguna. |
| Belum ada pembatasan laju per RPC. | Skala pilot kecil; batas auth Supabase tetap berlaku. | Pertimbangkan bila ada penyalahgunaan. |
| Tes konkurensi AT-01 berurutan, belum paralel sungguhan. | Keamanan bergantung pada row lock Postgres + `CHECK (available >= 0)`. | Uji paralel sebelum pilot. |
| Akun uji `uji@example.invalid` (belum terkonfirmasi, tanpa profil) tercipta saat uji 12 Okt 2026. | Tidak punya hak apa pun. | Hapus dari Authentication → Users bila ingin bersih. |

## 6 Menjalankan pemeriksaan

- Database: jalankan berkas di `supabase/tests/` (lihat [supabase/README.md](../supabase/README.md)); hasil harus `ok` semua.
- Front end: `npm run test:config`, `npm run build`, lalu `npm run preview` dan periksa console tidak memuat pelanggaran CSP.
- Supabase advisor: Dashboard → Advisors → Security; satu-satunya peringatan yang boleh tersisa adalah peringatan RPC yang disengaja (§1).
