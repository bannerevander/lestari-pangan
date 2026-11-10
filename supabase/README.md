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

## Menjalankan tes

Tanpa Supabase CLI: buka **SQL Editor**, tempel seluruh isi satu berkas dari `tests/`, jalankan. Hasilnya satu kolom `tap`; semua baris harus diawali `ok`.

| Berkas | Asersi | Cakupan |
| --- | --- | --- |
| `donation_fulfillment.test.sql` | 22 | AT-01, AT-02, AT-03, AT-06, AT-10, append-only, hak akses |
| `issues_engagement_funding.test.sql` | 26 | AT-04, AT-07, AT-08, AT-09, kendala, challenge, konten, ledger, admin |
| `security.test.sql` | 12 | Hak `anon`/`authenticated`, RLS, view, `search_path`, kolom privat, storage |
| `tickets_promotions.test.sql` | 10 | Tiket idempoten + privat, balasan admin, promosi hanya admin konten, tautan internal, periode tayang |

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

Akun kurir dibuat dengan cara sama (`role = 'kurir'`, `admin_scope` null), lalu tambah kontak: `insert into public.profile_contacts (profile_id, pic, phone, address) …`.

## Menambah migrasi

1. Tulis `migrations/YYYYMMDDHHMMSS_nama.sql` (aturan: [docs/CONVENTIONS.md](../docs/CONVENTIONS.md) §4).
2. Terapkan (Supabase MCP `apply_migration` atau SQL Editor).
3. Jalankan ketiga berkas tes + Supabase advisor.
4. Perbarui tipe front end: `lestari-pangan-frontend/src/lib/supabase/database.types.ts`.
5. Catat di [docs/PROGRESS.md](../docs/PROGRESS.md).
