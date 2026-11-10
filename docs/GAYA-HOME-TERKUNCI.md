# Gaya home — terkunci v1

8 Oktober 2026. Fokus tahap ini hanya home pemberi. Screen lain mengikuti acuan ini setelah home disetujui.

Sumber desain: [Google Stitch](https://stitch.withgoogle.com/projects/8912238116133870259), screen `320e45c9615648c18bdbd1022ed6913c`, **H01 / Pemberi / Home • LOCKED v1**. Pratinjau: http://127.0.0.1:8766/home/?v=3.

## Susunan dan prioritas

1. App bar putih: identitas, notifikasi, profil.
2. Sapaan botanical dengan peran, lokasi, label demo, serta permintaan baru dan Tinjau dalam satu modul.
3. Modul tindakan: Tawarkan Pangan sebagai aksi utama; Dari Catat Pangan sebagai aksi sekunder.
4. Empat pintasan terbuka: Catat Pangan, Dampak, Resep, Semua fitur.
5. Penawaran aktif: foto pangan, nama, jumlah tersedia, waktu absolut dan area.
6. Dampak berbagi: jumlah diterima, status, periode dan sumber; ilustrasi tangan berbagi sebagai dekorasi.
7. Inspirasi untukmu: foto editorial dan teks tips; kartu tantangan lebih ringkas dengan ilustrasi medali daun.
8. Navigasi lima tab: Beranda, Donasi, Pangan, Aktivitas, Akun.

## Bahasa visual

- Inter; judul halaman 24/32, judul bagian 20/28, nama pangan 18/26, isi 16/24, metadata dan navigasi 14/20. Caption 12 hanya untuk informasi minor.
- Hijau #2E7D32, hijau tekan #256528, mint #EAF5EC, aksen oranye #FFB74D, teks #12212B, sekunder #52605A, latar #F7F8FA, permukaan putih dan garis #DCE3DE.
- Kartu membulat 16 px, sapaan 20 px, gutter home 16 px, ritme antarmodul 16–24 px. Ilustrasi kecil seragam; foto pangan dan foto tips memiliki fungsi yang berbeda.
- Satu aksi utama dalam modul. Metadata berada dekat kontennya; hindari deretan kartu yang semuanya sama dominan.
- Target interaksi minimum 48×48 px, fokus keyboard terlihat. Header dan navigasi mengikuti tinggi teks; pembesaran 200% menumpuk aksi dan mengubah pintasan menjadi dua kolom.
- Ilustrasi bersifat dekoratif. Angka dampak selalu memiliki satuan, periode, status dan sumber. 20 porsi tersedia berbeda dari 10 porsi diterima; penerimaan tidak dinyatakan sebagai konsumsi/distribusi.

## Batas prototipe

Ini pratinjau UI statis. Navigasi dan tombol belum menjalankan alur aplikasi. Audit browser memeriksa layout, target sentuh, fokus, kontras pada latar solid, aset, reduced motion dan pembesaran teks; belum merupakan pengujian dengan pengguna atau screen reader.

Referensi dan interpretasi desain tersimpan di `output/stitch/HOME-REFERENCES.md`. HTML final merupakan ekspor lengkap Stitch, tanpa patch tampilan lokal. Draf sebelum pembersihan tersimpan di `output/archive/stitch-before-home-lock-2026-10-08.zip`.
