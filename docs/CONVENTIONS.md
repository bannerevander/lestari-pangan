# Konvensi kode

Versi 0.1 | 12 Oktober 2026

Aturan ini berlaku untuk kode baru dan kode yang sedang diubah (AR-12). Tujuannya agar setiap berkas mudah dicari, dibaca, dan diuji.

## 1 Satu berkas, satu tanggung jawab

- **Satu layar per berkas.** Layar yang berkaitan dikelompokkan dalam folder fitur dengan `index.ts` sebagai pintu ekspor. Contoh: `src/pages/auth/` (Login, Register, VerifyCode, …).
- **Logika data tidak berada di layar.** Panggilan Supabase hanya ada di `src/services/<modul>.ts`; layar memanggil fungsi service.
- **Helper yang dipakai beberapa layar** masuk ke berkas sendiri di folder fitur (mis. `auth/draft.ts`, `auth/useFinishSignIn.ts`), bukan disalin.
- **Patokan ukuran**: berkas di atas ±300 baris atau berisi lebih dari satu kegunaan berarti saatnya dipecah. Berkas lama yang melebihi patokan dipecah saat disentuh (daftar di [PROGRESS.md](PROGRESS.md)).

## 2 Struktur front end

```
prototype/                salinan front end mode demo (presentasi tanpa akun); tidak dikembangkan lagi
lestari-pangan-frontend/
  config/                 pemeriksaan build (publicEnvGuard.ts + tes)
  src/
    lib/supabase/         client.ts (klien tunggal), rpc.ts (pemanggil RPC), errors.ts (kode galat → pesan), database.types.ts (dibuat otomatis)
    services/             satu berkas per modul backend: auth, identity, donation, fulfillment, inventory, issues, notify, engagement, funding;
                          admin.ts (baca data konsol) + adminActions.ts (RPC admin_*); mappers.ts (baris DB → tipe UI)
    state/                AppState.tsx (state + reducer demo), SessionSync.tsx, MyProfile.tsx + useProfile.ts (profil sendiri),
                          LiveData.tsx (muat data live → hydrate, Realtime notifikasi), useCommand.ts (aksi → RPC di mode live)
    pages/<fitur>/        satu layar per berkas + index.ts: auth/, account/, donation/, requests/
    pages/*.tsx           layar lama yang belum dipecah
    components/           komponen UI bersama
    admin/                konsol admin, terpisah dari aplikasi mobile
  vercel.json             hosting + header keamanan
```

## 3 Aturan service

- Nama fungsi mengikuti RPC: `donation_decide_request` → `decideRequest()` di `services/donation.ts`.
- Setiap galat dibungkus `toAppError()` sehingga layar cukup menampilkan `messageOf(err)`.
- Tidak ada mode demo di aplikasi utama: env Supabase wajib (tanpa env, `main.tsx` menampilkan layar konfigurasi). Demo ada di `../prototype`.
- Baca tabel dengan kolom eksplisit (`select('id, org_name, …')`), bukan `select('*')`. Beberapa kolom sengaja tertutup (docs/SECURITY.md §1).
- Pembuatan data mengirim `client_id` (`crypto.randomUUID()`) agar kiriman ulang tidak menggandakan data.
- Layar yang mengubah data memanggil `run(aksi)` dari `useCommand()` (aksi berbasis ID) atau fungsi service langsung (formulir dengan data mentah), lalu `refresh()` dari `useLiveData()`. Jangan `dispatch` langsung untuk data yang sudah live.
- Layar membaca profil sendiri lewat `useProfile()`, bukan data demo.

## 4 Database

- Satu migrasi per modul atau perubahan, nama `YYYYMMDDHHMMSS_nama.sql`, tidak pernah mengedit migrasi yang sudah diterapkan; perbaikan = migrasi baru.
- Akhiri migrasi dengan blok pencabutan hak `anon` dan hak tulis `authenticated` (lihat migrasi yang ada). Jangan `grant execute on all functions` secara massal.
- Setiap aturan bisnis baru disertai tes di `supabase/tests/`.
- Setelah migrasi: jalankan semua tes, cek Supabase advisor, perbarui `database.types.ts`, catat di PROGRESS.md.

## 5 Bahasa

- Teks UI, komentar, dan dokumen: Bahasa Indonesia.
- Nama tabel, kolom, fungsi, dan variabel: Bahasa Inggris `snake_case` (SQL) / `camelCase` (TypeScript). Nilai status: teks Indonesia persis seperti di UI.
- Komentar hanya menjelaskan *mengapa*, bukan mengulang kode.
