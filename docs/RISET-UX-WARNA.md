# Riset UX warna Lestari Pangan

Tanggal: 8 Oktober 2026. Status: palet hijau–oranye dengan permukaan netral telah disetujui pengguna; penerapan terperinci tersedia dalam [design.md](design.md).

## Konteks produk

Dasar: README.md dan REQUIREMENTS.md. Aplikasi mobile menghubungkan pemberi dan penerima pangan, dengan koordinasi penyaluran, pencatatan, dashboard, resep teks/suara, tips, challenge, dan reward. Pengguna menginginkan kualitas pengalaman aplikasi startup seperti Tokopedia/Shopee. Warna perlu membantu menemukan tindakan dan membaca informasi operasional, terutama jumlah, satuan, jadwal, serta status penerimaan.

## Temuan dari sumber

1. Kontras teks biasa minimal 4,5:1; teks besar minimal 3:1. Besar menurut WCAG adalah setara 18 pt biasa atau 14 pt tebal, bukan otomatis semua judul mobile. Ini acuan aksesibilitas visual yang diadopsi untuk desain mobile, bukan bukti bahwa keseluruhan aplikasi telah memenuhi WCAG. Sumber: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
2. Ikon, indikator keadaan, dan bagian kontrol yang diperlukan untuk mengenali fungsi perlu kontras minimal 3:1 terhadap warna bersebelahan. Tidak semua garis dekoratif atau batas kartu harus mencapai rasio ini. Sumber: https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html
3. Warna tidak boleh menjadi satu-satunya pembawa informasi. Status, kesalahan, pilihan filter, dan grafik perlu label, ikon, bentuk, atau pola. Sumber: https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html
4. Material menyarankan pembagian peran warna: surface untuk area besar, primary untuk tindakan penting, dan warna semantik untuk makna tertentu. Tidak semua komponen memakai primary. Sumber: https://developer.android.com/codelabs/m3-design-theming
5. Warna dan kontras membantu hierarki visual; konsistensi penggunaannya membantu pengenalan elemen. Sumber: https://www.nngroup.com/articles/color-enhance-design/
6. Tema gelap perlu desain dan pengujian tersendiri. Apple menjelaskan bahwa abu di atas hitam yang nyaman bagi sebagian pengguna dalam cahaya rendah dapat menyulitkan sebagian pengguna dengan penglihatan rendah atau sensitif terhadap cahaya. Kenyamanan harus dinilai sesuai pengguna dan kondisi. Sumber: https://developer.apple.com/help/app-store-connect/manage-app-accessibility/dark-interface-evaluation-criteria/ dan https://developer.android.com/develop/ui/views/theming/darktheme

## Kesimpulan desain

Riset ini tidak menetapkan satu hue yang paling nyaman untuk semua orang. Rekomendasi berikut merupakan penerapan panduan pada Lestari Pangan. Hijau dipilih sebagai identitas lingkungan/pangan dan kelanjutan prototipe, bukan klaim bahwa hijau terbukti mengurangi kelelahan mata. Kenyamanan juga dipengaruhi ukuran huruf, kepadatan layar, kecerahan perangkat, cahaya sekitar, dan preferensi pengguna.

Gunakan latar netral terang dan kartu putih sebagai area dominan. Warna merek mengarahkan perhatian ke tindakan utama dan navigasi aktif; warna lembut untuk panel pendukung. Hindari semua kartu berwarna kuat, banyak banner bergerak, dan teks penting di atas foto tanpa panel kontras. Proporsi warna bukan aturan ilmiah tetap.

## Palet yang direkomendasikan

| Peran | HEX | Penggunaan |
| --- | --- | --- |
| Utama | #2E7D32 | Tombol Tawarkan Pangan / Ajukan Permintaan, pilihan aktif |
| Teks pada utama | #FFFFFF | Label tombol hijau |
| Latar utama lembut | #EAF5EC | Ringkasan atau panel pendukung, teks gelap |
| Aksen | #FFB74D | Sorotan apresiasi/challenge dengan teks gelap |
| Latar halaman | #F7F8FA | Area halaman |
| Permukaan kartu | #FFFFFF | Kartu pangan, formulir, resep |
| Teks utama | #12212B | Nama pangan, jumlah, judul, informasi penting |
| Teks sekunder | #52605A | Deskripsi dan metadata |
| Peringatan | #92400E pada #FFF4DB | Informasi batas pengambilan, dengan ikon dan label |
| Kesalahan | #B42318 pada #FEF3F2 | Validasi, gagal, masalah yang memerlukan tindakan |
| Informasi | #1D4ED8 pada #EFF6FF | Terjadwal atau sedang berlangsung, dengan label |

Status sukses boleh memakai hijau dengan teks dan ikon centang. Status Diterima dan Didistribusikan tetap dibedakan secara eksplisit. Warna hijau tidak mengesahkan keamanan konsumsi. Challenge tidak lebih menonjol daripada tindakan penyaluran yang harus diselesaikan. Peringatan waktu tidak dibuat seperti promosi kelangkaan untuk mendorong permintaan berlebihan.

## Pemeriksaan kontras

Perhitungan lokal memakai luminans relatif sRGB dan rumus WCAG. Nilai tampilan dibulatkan dua desimal; keputusan ambang memakai nilai sebelum pembulatan. Warna diasumsikan solid dan opak. Ini pemeriksaan pasangan warna, belum uji kenyamanan pengguna atau audit layar lengkap.

| Teks / latar | Rasio | Untuk teks biasa |
| --- | --- | --- |
| #FFFFFF / #2E7D32 | 5,13:1 | Memenuhi minimum |
| #FFFFFF / #0F766E | 5,47:1 | Memenuhi minimum |
| #FFFFFF / #FFB74D | 1,73:1 | Tidak memenuhi |
| #12212B / #FFB74D | 9,49:1 | Memenuhi minimum |
| #12212B / #FFFFFF | 16,43:1 | Memenuhi minimum |
| #52605A / #F7F8FA | 6,22:1 | Memenuhi minimum |
| #FFFFFF / #C2410C | 5,18:1 | Memenuhi minimum |
| #FFFFFF / #C4663D | 3,95:1 | Tidak memenuhi |
| #FFFFFF / #C69A46 | 2,59:1 | Tidak memenuhi |
| #92400E / #FFF4DB | 6,49:1 | Memenuhi minimum |
| #B42318 / #FEF3F2 | 6,05:1 | Memenuhi minimum |
| #1D4ED8 / #EFF6FF | 6,16:1 | Memenuhi minimum |

Implikasi untuk palet awal: terracotta, emas, dan oranye lembut perlu teks gelap atau varian warna yang lebih tua jika dipakai sebagai tombol. Semua palet dapat dibuat aksesibel; palet hijau atau teal tidak otomatis lebih nyaman hanya karena rasionya lebih tinggi.

## Alternatif yang tetap layak

- Hijau #2E7D32: rekomendasi utama, mempertahankan prototipe dan identitas pangan/lingkungan.
- Teal #0F766E: alternatif arah visual, label tombol putih memenuhi kontras.
- Oranye tua #C2410C: alternatif utama jika memilih identitas oranye; gunakan warna lembut untuk area besar. Jangan memakai #FFB74D dengan label putih.

## Validasi setelah palet dipilih

Buat prototipe beranda, detail pangan, formulir donasi, dan status serah terima. Uji apakah pemberi/penerima dapat menemukan tindakan utama, membaca jumlah dan batas pengambilan, membedakan diterima dengan didistribusikan, serta memahami kesalahan. Periksa ukuran huruf diperbesar, tampilan abu-abu/simulasi kekurangan penglihatan warna, kondisi cahaya terang dan redup, serta keadaan aktif, ditekan, fokus, dan nonaktif. Simulasi tidak menggantikan pengujian pengguna. Tema gelap, jika dimasukkan dalam cakupan, mempunyai pasangan warna dan pemeriksaan kontras terpisah.

Pengguna telah memilih palet hijau–oranye yang direkomendasikan. Dokumen [design.md](design.md) menggunakan hasil riset ini sebagai dasar warna untuk rancangan UI baru dari awal.
