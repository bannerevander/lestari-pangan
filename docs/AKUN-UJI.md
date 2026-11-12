# Akun uji untuk juri

Satu akun per peran, dibuat 12 Nov 2026 di proyek Supabase produksi. Akun ini masuk dengan **kata sandi**, tidak perlu kode email. Akun pengguna biasa tetap memakai kode OTP email.

Kata sandi semua akun: `test123`

| Peran | Email | Tempat masuk | Profil |
| --- | --- | --- | --- |
| Pemberi | `pemberi@example.com` | https://lestari-pangan.vercel.app/masuk | Warung Uji Juri (UMKM), Coblong, Kota Bandung |
| Penerima | `penerima@example.com` | https://lestari-pangan.vercel.app/masuk | Dapur Komunitas Uji Juri, kapasitas 30 porsi/hari |
| Kurir | `kurir@example.com` | https://lestari-pangan.vercel.app/masuk | Kurir Uji Juri (relawan), diarahkan ke `/tugas` |
| Admin (semua lingkup: ops, keuangan, konten) | `admin@example.com` | https://lestari-pangan.vercel.app/admin/masuk | Admin Uji Juri |

Cara masuk: buka halaman masuk, ketuk **"Akun uji juri? Masuk dengan kata sandi"**, isi email dan kata sandi di atas.

Domain `example.com` adalah domain cadangan resmi (RFC 2606) yang tidak menerima email, jadi tidak ada email yang terkirim ke pihak lain.

## Skenario uji per peran

1. **Pemberi**: Tawarkan Pangan → isi kategori (Makanan matang wajib waktu dimasak), jumlah, jadwal, cara penyaluran "Mitra pengiriman", opsional batas per penerima → Terbitkan.
2. **Penerima**: Cari pangan → pilih penawaran Warung Uji Juri → ajukan permintaan. Permintaan batal otomatis bila pemberi tidak menanggapi dalam 2 jam.
3. **Pemberi**: Aktivitas → tinjau permintaan → setujui. Penerima bisa mengajukan ongkir ditanggung pemberi di detail penyaluran.
4. **Admin**: Penyaluran/Pengiriman → tugaskan Kurir Uji Juri.
5. **Kurir**: Tugas → ambil → antar.
6. **Penerima**: konfirmasi penerimaan. Bila jumlahnya kurang, isi penjelasan → status **Menunggu verifikasi** → **Admin** menyetujui di detail penyaluran.
7. **Penerima/Pemberi**: Eco Challenge → ikuti → ajukan pemeriksaan → **Admin** meloloskan → poin masuk → Reward → tukar poin.

## Catatan keamanan

- Akun dan kata sandi ini akan publik di repo. Akun admin melihat data seluruh pengguna di produksi; setelah penjurian selesai, ganti kata sandinya atau hapus akun-akun ini (SQL di bawah).
- Membuat ulang atau menghapus: akun dibuat lewat SQL Editor (insert `auth.users` + `auth.identities` dengan kata sandi bcrypt, lalu `identity_complete_onboarding`). Untuk menonaktifkan kata sandi tanpa menghapus data:

```sql
update auth.users set encrypted_password = extensions.crypt(gen_random_uuid()::text, extensions.gen_salt('bf'))
where email in ('pemberi@example.com', 'penerima@example.com', 'kurir@example.com', 'admin@example.com');
```
