# Backend Supabase

Proyek: **Lestari Pangan** (`nuikazqzrdtaxkywwfvm`, region Singapura, Postgres 17). Rancangan lengkap: [docs/architecture.md](../docs/architecture.md) §9; keamanan: [docs/SECURITY.md](../docs/SECURITY.md).

## Isi folder

| Folder | Isi |
| --- | --- |
| `migrations/` | Skema, RLS, RPC, dan job, berurutan menurut nama berkas. Sudah diterapkan ke proyek; jangan diedit, tambahkan migrasi baru untuk perubahan. |
| `tests/` | Tes pgTAP. Setiap berkas berjalan dalam satu transaksi dan di-rollback, jadi aman dijalankan di database proyek. |

## Urutan migrasi

| Berkas | Isi |
| --- | --- |
| `20261012150000_identity` | Profil, kontak, verifikasi, notifikasi, audit, bucket storage |
| `20261012151000_donation_fulfillment` | Catatan pangan, penawaran, permintaan, penyaluran, kurir, view dampak, job kedaluwarsa (pg_cron) |
| `20261012152000_advisor_fixes` | Perbaikan temuan advisor |
| `20261012153000_issues` | Laporan kendala |
| `20261012154000_engagement` | Konten, challenge, reward, apresiasi |
| `20261012155000_funding` | Program, dukungan, ledger, ringkasan dana, antrean admin |
| `20261012160000_security_hardening` | Kolom privat profil, `identity_me()`, batas berkas storage |
| `20261013100000_engagement_seed_realtime` | Data awal tips/resep, challenge, paket reward; Realtime untuk `notifications` |
| `20261013110000_tickets_promotions` | Tiket bantuan/hapus data, promosi, bucket publik `media` (unggah hanya admin konten) |
| `20261013120000_admin_scope_all` | Lingkup admin `semua` (satu akun memegang ops, keuangan, konten) |
| `20261110100000_product_decisions` | OD-01 s.d. OD-05: batas konfirmasi 2 jam, batas per penerima, data wajib per kategori, verifikasi penerimaan sebagian, ongkir penerima/pemberi, poin challenge dan periode berikutnya |
| `20261112100000_ai_assistant` | Kuota Asisten Dapur AI (`ai_requests`, `ai_take_quota`) |

## Menjalankan tes

Tanpa Supabase CLI: buka **SQL Editor**, tempel seluruh isi satu berkas dari `tests/`, jalankan. Hasilnya satu kolom `tap`; semua baris harus diawali `ok`. Database produksi sudah berisi data asli, jadi tes baru harus memfilter ke akun/`client_id` uji, bukan `limit 1` atau `count(*)` seluruh tabel.

| Berkas | Asersi | Cakupan |
| --- | --- | --- |
| `donation_fulfillment.test.sql` | 23 | AT-01, AT-02, AT-03, AT-06, AT-10, append-only, hak akses |
| `issues_engagement_funding.test.sql` | 26 | AT-04, AT-07, AT-08, AT-09, kendala, challenge, konten, ledger, admin |
| `security.test.sql` | 12 | Hak `anon`/`authenticated`, RLS, view, `search_path`, kolom privat, storage |
| `tickets_promotions.test.sql` | 10 | Tiket idempoten + privat, balasan admin, promosi hanya admin konten, tautan internal, periode tayang |
| `ai_assistant.test.sql` | 5 | Kuota 40 pesan/jam, pulih setelah sejam, kurir ditolak, hak akses |
| `product_decisions.test.sql` | 19 | Data wajib kategori, batas per penerima, batal otomatis 2 jam, ongkir, verifikasi penerimaan, poin, periode berikutnya |

## Edge Function

| Fungsi | Isi |
| --- | --- |
| `functions/demo-login` | Masuk instan akun uji juri (4 alamat `@example.com` tetap) saat memilih metode Kode verifikasi: membuat token sekali pakai dengan `auth.admin.generateLink`, klien menukarnya lewat `verifyOtp`. Tidak mengirim email. Hapus setelah penjurian. |
| `functions/ai-chat` | Asisten Dapur AI (AR-21): validasi input, kuota lewat `ai_take_quota` atas nama pengguna, panggil Gemini dan alirkan jawaban (SSE: `{d}` potongan, `{reset}`, `{status:'padat'}`, `{done,onTopic,remaining}`, `{error}`) bila body berisi `stream: true`, hanya topik makanan. `verify_jwt` mati karena fungsi memeriksa sesi sendiri lewat RPC. |

| `functions/ai-tts` | Suara Asisten Dapur (AR-24): teks ≤ 600 huruf → WAV lewat Gemini TTS, kuota `ai_take_tts_quota`, `fast: true` untuk kalimat pertama. Secret opsional: `GEMINI_TTS_MODEL`, `GEMINI_TTS_FAST_MODEL`, `GEMINI_TTS_VOICE` (bawaan Sulafat). |

Secret yang wajib diisi di Dashboard → Edge Functions → Secrets: `GEMINI_API_KEY` (dari Google AI Studio); kunci tambahan boleh bernama `GEMINI_API_KEY_2`, dst. Opsional `GEMINI_MODEL`: daftar model dipisah koma (bawaan `gemini-3.5-flash-lite,gemini-3.1-flash-lite,gemini-3.8-flash`). Log waktu tiap percobaan: Dashboard → Edge Functions → ai-chat → Logs. Deploy ulang: Supabase MCP `deploy_edge_function` atau `supabase functions deploy ai-chat --no-verify-jwt`.

## Akun admin

Akun staf tidak bisa mendaftar sendiri. Langkah membuat satu akun admin:

1. Buka `/admin/masuk`, isi email staf, masukkan kode dari email. Konsol menolak karena profil belum ada; akun auth sudah terbentuk.
2. Di SQL Editor (ganti email dan lingkup `ops` / `keuangan` / `konten`):

```sql
insert into public.profiles (user_id, role, admin_scope, org_name, org_type, area)
select id, 'admin', 'ops', 'Admin Operasional', 'Staf', 'Bandung' from auth.users where email = 'staf@contoh.id';
```

3. Masuk lagi di `/admin/masuk`. Lingkup `ops`/`keuangan`/`konten` hanya bisa menjalankan aksi lingkupnya; `semua` memegang ketiganya.

Email pendaftaran pertama memakai template **Confirm signup**. Agar berisi kode 6 angka (bukan hanya tautan), tambahkan `{{ .Token }}` di Dashboard → Authentication → Emails → Confirm signup (juga Magic Link). Tanpa itu, akun baru hanya bisa dikonfirmasi lewat tautan di email.

Peran kurir dihentikan sejak 13 Nov 2026 (docs/architecture.md AR-22): tabel `courier_tasks` dan RPC tugas kurir tetap ada tetapi tidak dipakai aplikasi, dan akun berperan kurir ditolak saat masuk.

## Menambah migrasi

1. Tulis `migrations/YYYYMMDDHHMMSS_nama.sql` (aturan: [docs/CONVENTIONS.md](../docs/CONVENTIONS.md) §4).
2. Terapkan (Supabase MCP `apply_migration` atau SQL Editor).
3. Jalankan ketiga berkas tes + Supabase advisor.
4. Perbarui tipe front end: `lestari-pangan-frontend/src/lib/supabase/database.types.ts`.
5. Catat di [docs/PROGRESS.md](../docs/PROGRESS.md).
