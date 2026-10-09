# Ulasan kenyamanan UI — Lestari Pangan v0.1

9 Oktober 2026. Ulasan memakai kerangka design critique, accessibility review (WCAG 2.1 AA), dan UX copy terhadap front end yang dibangun, dibandingkan dengan ekspor Google Stitch di `LESTARI PANGAN SDG 12/output/stitch/`. Ini ulasan ahli dan pemeriksaan otomatis, bukan uji dengan pengguna.

## Kesan umum

Beranda pemberi sudah mengikuti H01 terkunci: sapaan, aksi utama **Tawarkan Pangan**, empat pintasan, penawaran aktif, dampak, lalu inspirasi. Mata langsung tertuju ke sapaan dan tombol hijau, sesuai prioritas. Peluang terbesar ada di konsistensi bahasa dan memastikan layar tetap nyaman saat huruf diperbesar, karena calon pengguna (pengurus panti, pemilik warung) beragam usia.

## Yang sudah diperiksa dan diperbaiki

| Temuan | Tingkat | Tindakan |
| --- | --- | --- |
| Ukuran huruf memakai piksel, sehingga tidak ikut membesar saat pengguna memperbesar huruf di browser/ponsel | Kritis | Semua ukuran teks diubah ke `rem`; diuji pada teks 200% di lebar 390 px tanpa scroll horizontal |
| Saat teks 200%, header, tab segmen, pintasan, dan badge di atas foto keluar layar | Kritis | Header, tab, badge dibuat bisa membungkus; pintasan otomatis menjadi 2 kolom |
| Tombol “Tawarkan Pangan” terpecah dua baris di 390 px | Sedang | Lebar tombol pendamping dipersempit; label utama satu baris |
| Tombol area lokasi dan tombol “Cari” di beranda hanya 40 px tinggi | Sedang | Dinaikkan ke 48 px |
| Urutan heading melompat (h1 → h3) di daftar penawaran dan aktivitas | Kecil | Ditambah heading tersembunyi untuk pembaca layar |
| Placeholder “20” pada jumlah terlihat seperti nilai yang sudah terisi | Sedang | Placeholder dihapus |
| Hitungan tab “Perlu tindakan (2)” terpecah | Kecil | Hitungan jadi badge kecil di samping label |

Hasil akhir: axe-core tanpa pelanggaran pada 17 layar; target sentuh ≥ 48 px; tidak ada scroll horizontal di 360 dan 390 px; `prefers-reduced-motion` dihormati; status tidak hanya memakai warna (selalu ikon + teks).

## Temuan pada desain Stitch yang sengaja tidak diikuti

| Di Stitch | Masalah | Di front end |
| --- | --- | --- |
| Kode layar di label tombol, mis. “Catat Penyerahan Pangan (L05)”, “Surat operasional (U11)” | Kode internal membingungkan pengguna | Label tanpa kode |
| “Gratis / Rp0 platform” | design.md melarang menyamakan “belum ada biaya” dengan Rp0 | “Tanpa biaya pengiriman dari platform” |
| “Mitra Terverifikasi” di samping nama pangan | Bisa dibaca sebagai jaminan mutu pangan | “Identitas terverifikasi” + catatan “bukan jaminan mutu pangan” |
| “Selesai Sah (Berita Acara Digital)”, “Dashboard Rekap Porsi & Audit” | Istilah birokratis, berat untuk pengurus panti | “Diterima penuh/sebagian”, “Riwayat kegiatan”, “Dashboard dampak” |
| “Donasi pangan 100% gratis” | Kata absolut, padahal pengiriman mitra bisa berbiaya | “Donasi pangan gratis. Biaya pengiriman, jika memakai mitra, ditampilkan terpisah” |
| Banyak label kapital penuh (“PENGAMBILAN TERDEKAT”) | Lebih sulit dibaca | Dipakai hanya untuk judul kelompok menu yang pendek |

## Pencocokan dengan ekspor Stitch 9 Okt 2026

Ekspor lengkap 126 layar (dari MCP Stitch di komputer Banner) menunjukkan 18 layar yang sudah dibangun punya desain Stitch yang sebelumnya belum terlihat. Layar itu sekarang mengikuti struktur Stitch, dengan beberapa penyesuaian:

| Layar | Yang diambil dari Stitch | Penyesuaian |
| --- | --- | --- |
| L02 Detail penyaluran | Tahap “x dari 5”, baris pemberi → penerima, kartu jadwal dan lokasi, alamat privat, 5 tahapan | Tombol utama tetap satu dan menempel di bawah; riwayat kegiatan dipertahankan |
| L05 Catat penyerahan | Kartu kegiatan, input jumlah dengan tombol − / +, catatan kondisi, cara pencatatan | “Berita Acara Manual” diganti “Diperiksa bersama di lokasi” |
| L06 Konfirmasi penerimaan | Dokumen penyerahan, jumlah diterima vs tidak diterima, total diperiksa, alasan selisih, kebijakan tanpa sanksi | Pilihan penuh/sebagian/tolak digabung jadi satu input jumlah; jumlah 0 berarti tolak seluruhnya |
| C06 Laporan penggunaan | Tiga baris bernomor dengan satuan, kartu sisa otomatis | Sisa tidak dianggap habis dan tetap tercatat |
| L09 Notifikasi | Filter kategori, kartu berikon, tautan aksi, “Tandai dibaca” | Tautan tanpa kode layar (“Tinjau permintaan”, bukan “Tinjau di Q04”) |
| L10 Laporan masalah | Kegiatan terkait, kategori berpenjelasan, foto opsional, prinsip tanpa hukuman | Unggah foto ditandai belum tersedia |
| D02-C Tinjauan penawaran | Alamat privat terkunci, pernyataan kelayakan wajib dicentang | — |
| D03 Kelola penawaran | Alokasi jumlah + bilah proporsi, kartu permintaan, “Tindakan penawaran” | — |
| D05 Tutup penawaran | Peringatan porsi direservasi, dampak ke sisa vs reservasi, alasan, centang pemahaman | Dibuat sebagai halaman penuh (sebelumnya sheet) |
| Q01/Q01-B Ajukan permintaan | Dua langkah dengan bilah progres, kartu rincian dan jadwal, komitmen penerima | “Rp0 (Donasi Gratis)” tidak dipakai |
| Q02 Detail permintaan | Tahapan permintaan, info alamat dibuka setelah disetujui | Label status tetap “Diajukan” sesuai kamus status |
| Q03 Permintaan masuk | Urutan antrean, peringatan total melebihi sisa, simulasi sisa per antrean | — |
| Q06 Batalkan permintaan | Halaman penuh, alasan berpenjelasan, pesan untuk pemberi, kebijakan tanpa sanksi | — |
| H03, C02, R01, I01, U02, U07 | Pengelompokan fitur + ilustrasi, kartu formulir, chip bahan, rincian dampak + grafik sepekan, poin pengenalan, kartu peran + jenis lembaga | I01 tetap tanpa estimasi emisi; R01 suara tetap nonaktif |

Setelah penyesuaian: uji alur lengkap lulus, axe tanpa pelanggaran di 19 layar yang diubah, target sentuh ≥ 44 px, dan tidak ada scroll horizontal pada teks 200%.

## Rekomendasi berikutnya

1. **Uji singkat dengan 3–5 pengguna nyata** (1 pemilik warung, 1 pengurus panti, 1 rumah tangga) pada tugas: tawarkan pangan, minta pangan, konfirmasi penerimaan sebagian. Ini satu-satunya cara memastikan istilah seperti “direservasi” dan “penyaluran” dipahami.
2. **Putuskan OD-01 (persetujuan vs klaim langsung) dan OD-09 (chat vs kontak terbatas)**; dua layar placeholder (Ajukan penyesuaian, Koordinasi) bergantung padanya.
3. **Pemilih tanggal/jam**: input bawaan browser sudah aksesibel, tetapi di Android tampilannya berbeda-beda. Bila dibuat versi aplikasi native, pakai picker platform.
4. **Kartu pencarian penerima cukup tinggi** (foto 16:9 + 6 baris info). Bila penawaran banyak, sediakan tampilan ringkas (thumbnail kiri) sebagai pilihan.
5. **Uji pembaca layar** (TalkBack dan VoiceOver) pada alur konfirmasi penerimaan sebelum rilis.
