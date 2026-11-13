# Akun uji untuk juri

Satu akun per peran, dibuat 12 Nov 2026 (akun `kurir@example.com` masih ada di database tetapi tidak bisa masuk sejak peran kurir dihentikan 13 Nov 2026) di proyek Supabase produksi. Halaman masuk punya dua metode untuk semua pengguna: **Kode verifikasi** dan **Kata sandi**. Akun uji bisa memakai keduanya.

Kata sandi semua akun: `test123`

| Peran | Email | Tempat masuk | Profil |
| --- | --- | --- | --- |
| Pemberi | `pemberi@example.com` | https://lestari-pangan.vercel.app/masuk | Warung Makan Bu Sari (UMKM, PIC Sari Wulandari), Coblong, Kota Bandung |
| Penerima | `penerima@example.com` | https://lestari-pangan.vercel.app/masuk | Dapur Komunitas Harapan (PIC Budi Santoso), Coblong, Kota Bandung, kapasitas 30 porsi/hari |
| Admin (semua lingkup: ops, keuangan, konten) | `admin@example.com` | https://lestari-pangan.vercel.app/admin/masuk | Rina Pratama. Konsol menyesuaikan perangkat: laptop = menu samping + tabel, HP = menu ☰ + kartu |

Cara masuk (pilih salah satu):

- **Kode verifikasi**: isi email akun uji, ketuk **Kirim kode**. Akun uji langsung masuk tanpa kode, karena alamatnya tidak bisa menerima email (Edge Function `demo-login`).
- **Kata sandi**: pilih tab **Kata sandi**, isi email dan kata sandi di atas.

Kata sandi akun uji tidak bisa diubah dari aplikasi agar tetap sama untuk semua juri.

Domain `example.com` adalah domain cadangan resmi (RFC 2606) yang tidak menerima email, jadi tidak ada email yang terkirim ke pihak lain.

## Skenario uji per peran

1. **Pemberi**: Tawarkan Pangan → isi kategori (Makanan matang wajib waktu dimasak), jumlah, jadwal, cara penyaluran "Ojek online (GoSend/GrabExpress)", opsional batas per penerima → Terbitkan.
2. **Penerima**: Cari pangan → pilih penawaran Warung Makan Bu Sari (PGR-14, beras, ambil 21 Nov) → ajukan permintaan. Permintaan batal otomatis bila pemberi tidak menanggapi dalam 2 jam.
3. **Pemberi**: Aktivitas → tinjau permintaan → setujui. Penerima bisa mengajukan ongkir ditanggung pemberi di detail penyaluran.
4. **Penerima**: Aktivitas → detail penyaluran → kartu **Pesan pengiriman**: salin alamat jemput, tujuan, dan catatan driver, lalu pesan GoSend/GrabExpress di aplikasinya. **Koordinasi** → hubungi pemberi lewat Telepon/WhatsApp.
5. **Pemberi**: catat penyerahan saat driver mengambil pangan.
6. **Penerima**: konfirmasi penerimaan. Bila jumlahnya kurang, isi penjelasan → status **Menunggu verifikasi** → **Admin** menyetujui di detail penyaluran.
7. **Penerima/Pemberi**: Eco Challenge → ikuti → ajukan pemeriksaan → **Admin** meloloskan → poin masuk → Reward → tukar poin.

## Catatan keamanan

- Akun dan kata sandi ini akan publik di repo. Akun admin melihat data seluruh pengguna di produksi; setelah penjurian selesai, hapus Edge Function `demo-login` (Dashboard → Edge Functions) lalu ganti kata sandinya atau hapus akun-akun ini (SQL di bawah).
- Membuat ulang atau menghapus: akun dibuat lewat SQL Editor (insert `auth.users` + `auth.identities` dengan kata sandi bcrypt, lalu `identity_complete_onboarding`). Untuk menonaktifkan kata sandi tanpa menghapus data:

```sql
update auth.users set encrypted_password = extensions.crypt(gen_random_uuid()::text, extensions.gen_salt('bf'))
where email in ('pemberi@example.com', 'penerima@example.com', 'kurir@example.com', 'admin@example.com');
```
