# Requirement pengembangan Lestari Pangan

Versi 0.1 | 8 Oktober 2026

Dokumen ini menjelaskan kebutuhan yang perlu tersedia ketika aplikasi dikembangkan. Tujuan, manfaat, dan cakupan produk dirangkum pada [README.md](README.md). Requirement fungsional serta kriteria penerimaan di bawah merupakan penjabaran awal dari cakupan yang disetujui sementara; rincian yang belum diputuskan ditandai terbuka. Pemilihan penyedia API, teknologi, dan rancangan integrasi akan dibahas kemudian dalam architecture.md.

## 1 Kebutuhan produk dan ruang lingkup

Lestari Pangan menghubungkan restoran, UMKM, dan rumah tangga yang memiliki surplus pangan layak konsumsi dengan panti serta komunitas penerima. Produk membantu penawaran, koordinasi, penyaluran, pencatatan hasil, dan pencegahan pangan terbuang.

Dokumen ini menetapkan kebutuhan awal untuk pengembangan aplikasi mobile dan layanan pendukungnya. Cakupan fitur telah disetujui sementara. Kriteria penerimaan, pembagian prioritas, dan rincian sistem di bawah merupakan usulan spesifikasi untuk ditinjau, bukan keputusan teknis yang telah dikunci.

| Dasar produk | Requirement |
| --- | --- |
| Pengguna utama | Dua peran: pemberi donasi dan penerima donasi. |
| Pemberi | Restoran, UMKM, dan rumah tangga. |
| Penerima | Pengelola panti asuhan, panti jompo, dan komunitas penyaluran gratis. |
| Penyaluran | Pengambilan mandiri atau mitra pengiriman, termasuk pihak ketiga. |
| Pendanaan | Dukungan sukarela, sponsor pengiriman, kemitraan program, serta bantuan barang dan jasa. |
| Resep | Rekomendasi dengan percakapan suara dua arah melalui API. |
| Reward | Paket Apresiasi Mitra dan Paket Dukungan Penyaluran. |

Tujuan keberhasilan: meningkatkan penyaluran yang selesai, mencatat hasil secara dapat ditelusuri, membantu mengurangi surplus dan pangan terbuang, serta menjaga biaya layanan dapat ditopang pendanaan. Publikasi penawaran saja tidak membuktikan keberhasilan penyaluran.

P0 = fondasi penyaluran dan pengendalian operasional. P1 = kebutuhan modul pendukung dalam cakupan yang disetujui. P2 = pengembangan lanjutan. Urutan ini diusulkan untuk perencanaan; P1 bukan berarti fitur dibatalkan, termasuk speech-to-speech. Jadwal peluncuran belum ditentukan.

UI.html dan sketsa beranda menjadi referensi visual yang dapat direvisi. Target Android/iOS belum ditetapkan. Pembahasan penyedia API, framework, cloud, pembayaran, dan integrasi logistik ditempatkan pada tahap architecture.md.

## Kebutuhan yang harus tersedia untuk pengembangan

Bagian ini menyebut kemampuan dan sumber daya yang diperlukan, tanpa memilih merek layanan, framework, atau penyedia API.

| Komponen | Kebutuhan yang perlu dikembangkan atau disiapkan |
| --- | --- |
| Aplikasi mobile | Antarmuka pemberi dan penerima, formulir, pencarian, status penyaluran, dashboard, resep teks/suara, challenge, reward, serta izin perangkat. |
| Panel admin | Pemeriksaan akun, kegiatan bermasalah, pengelolaan konten, challenge/reward, publikasi, pendanaan, dan laporan. |
| Layanan backend | Aturan donasi, otorisasi, reservasi jumlah, perubahan status, konfirmasi, progres challenge, reward, dan pencatatan dana. |
| Penyimpanan data | Data akun, pangan, penawaran, permintaan, penyaluran, distribusi, reward, transaksi, serta riwayat perubahan yang saling terhubung. |
| Penyimpanan berkas | Foto opsional, bukti verifikasi, lampiran kegiatan, dan materi apresiasi dengan pembatasan akses. |
| Percakapan resep | Akses mikrofon, sesi masukan dan keluaran suara, konteks percakapan, resep tertulis, klarifikasi, serta alternatif teks. |
| Pengiriman | Jadwal, penugasan mitra atau koordinasi manual, biaya, sumber pembayar, status, dan penanganan gagal. |
| Pembayaran dan dana | Pencatatan dukungan, konfirmasi terpercaya, alokasi sponsor, bukti pengeluaran, rekonsiliasi, dan pengembalian bila berlaku. |
| Notifikasi | Pemberitahuan kegiatan, pengingat, dan riwayat dalam aplikasi yang tetap dapat dibaca ketika push tidak tersedia. |
| Pemeliharaan | Pencadangan, pemulihan, pemantauan gangguan, pengendalian biaya, dan penanganan kendala pengguna. |
| Lingkungan kerja | Repositori dan kontrol versi, lingkungan pengembangan/pengujian/rilis, konfigurasi rahasia, serta proses distribusi aplikasi sesuai platform. |
| Pengujian | Data uji dan skenario donor-penerima, konkurensi reservasi, transaksi berulang, privasi, pembatalan, reward, serta kegagalan audio/jaringan. |

### Kebutuhan operasional sebelum digunakan

- Mitra pemberi dan penerima yang siap mengikuti uji alur penyaluran.
- Pengelola untuk verifikasi, bantuan pengguna, kendala penyaluran, konten, dan laporan dana. Satu tim dapat memegang beberapa tanggung jawab pada awalnya.
- Prosedur pangan yang boleh ditawarkan, pengemasan, penyerahan, penolakan, dan penanganan masalah; ditinjau pihak yang kompeten.
- Kesepakatan mitra pengiriman dan sumber pembayaran yang jelas jika layanan pengiriman digunakan.
- Anggaran aplikasi, koordinasi, logistik, pemeliharaan, dan reward yang akan dijanjikan.
- Konten tips/resep yang ditinjau, aturan challenge yang lengkap, serta sponsor atau persediaan reward yang sudah pasti.
- Kebijakan privasi, persetujuan penggunaan data, retensi rekaman/transkrip, serta persetujuan publikasi apresiasi.
- Dokumentasi bantuan dan proses pencatatan penggunaan dana.

### Cakupan dokumen

Dokumen ini menetapkan apa yang harus dapat dilakukan oleh produk dan hal yang perlu disiapkan untuk mengembangkannya. Pemilihan penyedia API, arsitektur audio, framework, database, hosting, sistem pembayaran, protokol integrasi, dan struktur deployment dilanjutkan dalam architecture.md. Tidak ada tanggal rilis atau penyedia yang dipilih di sini.

## 2 Requirement bisnis dan tanggung jawab

Tujuan utama adalah pengurangan food waste dan penyaluran pangan. Pendanaan mendukung kesinambungan layanan; surplus digunakan kembali untuk misi sosial.

### BR-01  Akses donasi gratis  P0

Kebutuhan: Memberi dan menerima donasi pangan tidak mensyaratkan langganan atau pembelian paket. Biaya pengiriman ditampilkan terpisah jika layanan tersebut digunakan.

Diterima apabila: Pengguna dapat membuat atau meminta donasi tanpa membeli akses; biaya tambahan diketahui sebelum disetujui.

### BR-02  Pendanaan dan penggunaan surplus  P0

Kebutuhan: Dukungan sukarela, sponsor, program perusahaan, serta bantuan barang/jasa dicatat terpisah. Surplus setelah kebutuhan operasional dan cadangan yang disepakati dialokasikan kembali untuk misi.

Diterima apabila: Laporan menunjukkan sumber, tujuan penggunaan, pengeluaran, dan saldo; aturan cadangan merujuk keputusan OD-07.

### BR-03  Distribusi sesuai kebutuhan  P0

Kebutuhan: Pembayaran, poin, dan reward tidak memberi prioritas memperoleh pangan. Pencocokan mempertimbangkan kebutuhan, kapasitas, jenis pangan, waktu, dan penyaluran.

Diterima apabila: Tidak tersedia pembelian prioritas donasi; alasan persetujuan atau penolakan dapat dicatat.

### BR-04  Pencegahan pemborosan  P1

Kebutuhan: Apresiasi tidak ditentukan hanya oleh kilogram atau frekuensi donasi. Pelaporan penolakan, sisa, dan kegagalan tetap didukung.

Diterima apabila: Pengurangan surplus tidak menurunkan hak layanan; laporan masalah tidak otomatis menggugurkan reward tanpa pemeriksaan.

### BR-05  Tanggung jawab operasional  P0

Kebutuhan: Pemberi menyediakan informasi pangan; penerima menyatakan kebutuhan dan hasil penerimaan. Admin mengelola pemeriksaan dan kendala; mitra pengiriman hanya mengakses tugas terkait.

Diterima apabila: Setiap kegiatan mempunyai pelaku, waktu, dan status; akses mengikuti tanggung jawab.

Kaitan misi: pengurangan food waste diarahkan pada SDG 12.3; pencegahan limbah dan edukasi mendukung tujuan 12.5 dan 12.8. Pengukuran aplikasi merupakan data program, bukan pelaporan indikator SDG resmi secara otomatis.

Asumsi untuk tinjauan: akun penerima diwakili pengelola komunitas. Admin dan pengiriman merupakan fungsi pendukung, bukan peran peserta Eco Challenge tambahan. Model akun dengan beberapa peran masih terbuka pada OD-02.

## 3 Akun profil dan verifikasi

Profil menjadi dasar penawaran, kecocokan penerima, komunikasi, dan pembatasan akses. Metode login serta dokumen verifikasi belum ditentukan.

### FR-AK-01  Registrasi dan pemulihan akun  P0

Kebutuhan: Sistem menyediakan registrasi, login, keluar, dan pemulihan akses. Pengguna memilih pemberi atau penerima serta tipe individu/usaha/komunitas yang relevan.

Diterima apabila: Sesi hanya membuka data berizin; akses dapat dipulihkan dengan metode yang ditetapkan pada OD-02.

### FR-AK-02  Profil pemberi  P0

Kebutuhan: Profil memuat nama, tipe pemberi, kontak penanggung jawab, lokasi, jam koordinasi, dan identitas usaha jika berlaku. Rumah tangga tidak diwajibkan mempunyai nama usaha.

Diterima apabila: Pemberi dapat mengubah profil; data wajib dan informasi publik ditampilkan jelas.

### FR-AK-03  Profil penerima  P0

Kebutuhan: Profil memuat nama organisasi/komunitas, pengelola, area layanan, pangan diterima, kapasitas per penerimaan, fasilitas penyimpanan, jadwal, dan kemampuan mengambil.

Diterima apabila: Penerima dapat memperbarui kebutuhan; detail penawaran dapat dibandingkan dengan profil tanpa mengklaim kecocokan sebagai jaminan keamanan.

### FR-AK-04  Pemeriksaan identitas  P0

Kebutuhan: Admin dapat meninjau bukti, meminta perbaikan, menyetujui, menolak, atau menangguhkan akun sesuai kebijakan. Dokumen tidak tampil publik.

Diterima apabila: Status dan alasan pemeriksaan tercatat; verifikasi tidak dapat dibeli melalui sponsor atau reward. Persyaratan rilis ditentukan pada OD-02.

### FR-AK-05  Hak akses dan lokasi  P0

Kebutuhan: Lokasi umum dapat digunakan untuk pencarian. Alamat rinci dan kontak operasional dibatasi kepada pihak penyaluran yang berwenang.

Diterima apabila: Pengguna lain tidak dapat membaca dokumen verifikasi atau alamat rinci melalui tampilan maupun permintaan API tanpa hak akses.

Fungsi pendukung: akun admin memiliki wewenang sesuai tugas; pihak pengiriman hanya melihat penugasan, alamat terkait, kontak yang diperlukan, dan bukti serah terima. Pengelolaan beberapa cabang dan staf usaha termasuk P2.

## 4 Catat Pangan

Pencatatan membedakan pangan yang masih tersedia, digunakan, ditawarkan, disalurkan, dan terbuang. Catatan pangan dan penawaran donasi saling terhubung.

### FR-CP-01  Catatan dan satuan jumlah  P0

Kebutuhan: Pengguna mencatat nama, kategori, jumlah, satuan, tanggal, dan informasi penyimpanan. Sistem membedakan makanan matang, bahan pangan, dan produk kemasan.

Diterima apabila: Jumlah harus valid dan satuannya terlihat; perkiraan jumlah diberi penanda estimasi.

### FR-CP-02  Pergerakan jumlah  P0

Kebutuhan: Satu catatan dapat dialokasikan sebagian untuk digunakan, ditawarkan, disalurkan, atau dibuang. Jumlah tersisa dihitung dari pergerakan yang sah.

Diterima apabila: Jumlah yang sama tidak dapat dialokasikan melebihi persediaan; sisa diperbarui tanpa membuat catatan pangan ganda.

### FR-CP-03  Pengubahan menjadi donasi  P0

Kebutuhan: Pemberi dapat membuat penawaran dari catatan dengan informasi terisi, atau membuat penawaran langsung tanpa pencatatan stok terpisah.

Diterima apabila: Penawaran menyimpan hubungan asal; data tidak perlu diketik ulang; tidak terjadi penghitungan ganda.

### FR-CP-04  Alasan dan koreksi  P1

Kebutuhan: Catatan pembuangan atau kegagalan penyaluran menyimpan alasan. Pengguna dapat memperbaiki catatan; koreksi kegiatan yang telah dikonfirmasi harus dapat ditelusuri.

Diterima apabila: Koreksi memperbarui ringkasan; perubahan jumlah dan status menyimpan pelaku serta waktu.

### FR-CP-05  Distribusi oleh penerima  P1

Kebutuhan: Penerima mencatat pangan yang diterima lalu digunakan, didistribusikan, masih tersedia, atau terbuang. Catatan mengacu penyaluran asal.

Diterima apabila: Jumlah distribusi dan sisa tidak melebihi jumlah diterima; sisa tidak otomatis dianggap sudah dikonsumsi.

Jumlah porsi, unit, dan kilogram tidak boleh dijumlahkan sebagai satu ukuran. Konversi harus mempunyai dasar yang terdokumentasi dan penanda estimasi; jika tidak tersedia, statistik mempertahankan satuan aslinya.

Data tanggal membantu koordinasi, bukan otomatis membuktikan keamanan konsumsi. Batas pengambilan merupakan batas penawaran dan harus dibedakan dari tanggal pada label produk.

## 5 Penawaran donasi

Pemberi menyediakan informasi yang cukup bagi penerima untuk menilai kecocokan dan merencanakan pengambilan. Kriteria pangan yang dapat ditawarkan perlu ditetapkan sebelum operasional.

### FR-DN-01  Buat dan kelola penawaran  P0

Kebutuhan: Pemberi membuat, menyimpan, menerbitkan, dan menutup penawaran. Informasi mencakup jenis, jumlah, satuan, penyimpanan, waktu persiapan/pembukaan jika relevan, tanggal label, bahan/alergen diketahui, area, dan batas pengambilan. Foto opsional.

Diterima apabila: Penawaran tidak terbit jika data wajib belum lengkap atau jumlah tidak valid; data yang tidak diketahui ditandai jelas.

### FR-DN-02  Waktu dan ketersediaan  P0

Kebutuhan: Penawaran menunjukkan jadwal pengambilan dan batas waktu dalam zona lokasi. Sistem menghentikan permintaan baru setelah batas penawaran terlewati.

Diterima apabila: Penawaran yang ditutup tidak dapat dipesan; pemesanan aktif ditindaklanjuti sesuai kebijakan OD-01 dan OD-03.

### FR-DN-03  Temukan penawaran  P0

Kebutuhan: Penerima dapat mencari serta memfilter penawaran berdasarkan area/jarak jika tersedia, jenis pangan, waktu, dan jumlah. Daftar hanya menunjukkan penawaran yang relevan dan tersedia.

Diterima apabila: Filter menghasilkan data sesuai pilihan; keadaan tanpa hasil dan izin lokasi ditolak mempunyai tampilan yang dapat digunakan.

### FR-DN-04  Reservasi jumlah  P0

Kebutuhan: Sistem memisahkan jumlah tersedia, direservasi, diserahkan, dan dibatalkan. Satu penawaran dapat dibagi ke beberapa penerima sesuai kebijakan yang ditetapkan.

Diterima apabila: Dua permintaan bersamaan tidak menyebabkan kelebihan alokasi; pembatalan melepaskan reservasi hanya jika penawaran masih berlaku.

### FR-DN-05  Perubahan setelah pemesanan  P0

Kebutuhan: Perubahan informasi penting, jumlah, waktu, atau lokasi setelah persetujuan harus diketahui pihak terkait. Perubahan tidak menghilangkan riwayat kesepakatan.

Diterima apabila: Pihak terkait menerima notifikasi dan dapat meninjau ulang; jumlah yang sudah disepakati tidak berubah diam-diam.

Permintaan dengan persetujuan pemberi merupakan alur kerja usulan. Klaim langsung, masa reservasi, pembagian sebagian, dan batas pembatalan belum menjadi keputusan final; lihat OD-01.

Nama dan logo restoran pada materi apresiasi tidak otomatis memberikan hak menggunakan foto penerima atau dokumen kegiatan untuk publikasi.

## 6 Permintaan penerimaan dan penanganan masalah

Penerima mengajukan jumlah sesuai kapasitas. Sistem merekam penerimaan aktual dan mendukung penolakan sebagian maupun seluruhnya.

### FR-PN-01  Permintaan dan keputusan  P0

Kebutuhan: Penerima memilih penawaran, jumlah, waktu, dan cara mengambil yang tersedia. Pemberi dapat menyetujui, menolak, atau menawarkan penyesuaian.

Diterima apabila: Penyesuaian jumlah atau waktu memerlukan penerimaan kesepakatan; status permintaan terlihat oleh kedua pihak.

### FR-PN-02  Konfirmasi serah terima  P0

Kebutuhan: Kegiatan penyerahan menggunakan kode, konfirmasi kedua pihak, atau bukti lain sesuai kebijakan. Penerima mencatat jumlah aktual diterima dan kondisi yang dilaporkan.

Diterima apabila: Permintaan ulang tidak menggandakan penerimaan; selisih dari jumlah disepakati tercatat dan dapat diperiksa.

### FR-PN-03  Penolakan dan penerimaan sebagian  P0

Kebutuhan: Penerima dapat menolak pangan yang tidak sesuai atau menerima sebagian dengan alasan. Sistem memisahkan jumlah diterima dan ditolak.

Diterima apabila: Jumlah ditolak tidak dihitung sebagai donasi berhasil; alasan dapat diteruskan ke admin tanpa kewajiban foto wajah.

### FR-PN-04  Distribusi dan penutupan  P1

Kebutuhan: Penerimaan dan distribusi dicatat sebagai kegiatan berbeda. Penerima dapat melaporkan penggunaan, pembagian, atau sisa setelah serah terima.

Diterima apabila: Status diterima tidak otomatis menjadi didistribusikan atau dikonsumsi; laporan distribusi terhubung ke penyaluran.

### FR-PN-05  Pembatalan dan laporan masalah  P0

Kebutuhan: Pihak terkait dapat melaporkan tidak datang, jumlah berbeda, kendala pangan, atau masalah pengiriman. Admin dapat meninjau dan memberikan tindak lanjut.

Diterima apabila: Status, alasan, pelapor, waktu, dan hasil penanganan tersimpan; kegiatan bermasalah tidak otomatis menghasilkan reward.

| Entitas | Status utama usulan |
| --- | --- |
| Penawaran | Draf, tersedia, ditutup, melewati batas pengambilan. |
| Permintaan | Diajukan, menunggu penyesuaian, disetujui, ditolak, dibatalkan. |
| Penyaluran | Terjadwal, diserahkan, diterima penuh/sebagian, ditolak, gagal. |
| Distribusi | Belum dilaporkan, sebagian digunakan/disalurkan, selesai dilaporkan. |

## 7 Pengiriman komunikasi dan notifikasi

Sistem mendukung pengambilan mandiri dan layanan mitra. Penyedia serta integrasi otomatis dipilih setelah operasi dan pendanaannya ditentukan.

### FR-KR-01  Cara penyaluran  P0

Kebutuhan: Pihak terkait memilih pengambilan oleh penerima, pengantaran oleh pemberi jika tersedia, atau mitra pengiriman. Pilihan menyesuaikan kapasitas dan jadwal.

Diterima apabila: Cara, penanggung jawab, jadwal, dan alamat terkait tersimpan sebelum penyaluran berlangsung.

### FR-KR-02  Biaya dan sumber pembayaran  P0

Kebutuhan: Biaya pengiriman serta pihak pembayar ditampilkan sebelum disetujui. Sumber dapat berupa pemberi atau dana sponsor sesuai kelayakan program.

Diterima apabila: Pengiriman tanpa pendanaan terlihat menunggu pendanaan; sistem tidak menyatakan pembayaran berhasil dari tangkapan layar atau tampilan klien.

### FR-KR-03  Penugasan dan status mitra  P0

Kebutuhan: Admin atau integrasi mitra mengatur tugas, pengambilan, perjalanan, penyerahan, dan kegagalan. Status manual diperbolehkan sebelum integrasi tersedia.

Diterima apabila: Setiap pembaruan mencantumkan sumber dan waktu; status tidak diulang menjadi kegiatan baru; akses terbatas pada tugas terkait.

### FR-KR-04  Kegagalan dan pembatalan  P0

Kebutuhan: Kendala kurir, keterlambatan, atau pembatalan memicu tindak lanjut. Biaya dan pengembalian mengikuti kebijakan yang diinformasikan sebelum persetujuan.

Diterima apabila: Kegagalan tidak otomatis menandai pangan diterima; keputusan pengembalian dicatat. Aturan rinci masih OD-04.

### FR-KM-01  Komunikasi terkait penyaluran  P0

Kebutuhan: Pengguna mempunyai sarana koordinasi yang terhubung dengan penawaran atau penyaluran. Pilihan chat internal atau kontak terbatas belum ditentukan.

Diterima apabila: Pihak yang berwenang dapat berkoordinasi; akses kontak mengikuti kesepakatan dan kebijakan privasi.

### FR-KM-02  Notifikasi kegiatan  P0

Kebutuhan: Sistem memberi pemberitahuan permintaan, keputusan, perubahan, pengingat jadwal, konfirmasi, kendala, dan hasil reward. Kanal push dan daftar dalam aplikasi dapat dikembangkan sesuai platform.

Diterima apabila: Notifikasi membuka kegiatan yang benar; status tetap dapat dilihat jika push ditolak atau gagal dikirim.

Pelacakan GPS langsung bukan syarat versi awal. Biaya pengiriman dan bantuan ongkir dasar dipisahkan dari reward challenge. Batas layanan wilayah dan penanganan pangan selama perjalanan perlu ditentukan pada OD-03 dan OD-09.

## 8 Pemantauan dampak dan ukuran keberhasilan

Dashboard menggunakan kegiatan dan jumlah terkonfirmasi, dengan penjelasan periode, satuan, sumber data, dan status estimasi.

### FR-IM-01  Ringkasan sesuai peran  P1

Kebutuhan: Pemberi melihat surplus, penyaluran, dan pembuangan. Penerima melihat penerimaan, distribusi/penggunaan, sisa, dan penolakan. Filter periode serta detail riwayat tersedia.

Diterima apabila: Jumlah ringkasan sesuai kegiatan sumber dan hak akses; perbedaan satuan tetap terlihat.

### FR-IM-02  Pencegahan hitung ganda  P0

Kebutuhan: Kegiatan donor, kurir, penerima, dan distribusi dihubungkan dengan identitas penyaluran. Koreksi dan konfirmasi ulang tidak menciptakan dampak tambahan.

Diterima apabila: Satu penyaluran terhitung sekali pada agregat platform; penerimaan sebagian memakai jumlah aktual.

### FR-IM-03  Kualitas dan keterbatasan data  P1

Kebutuhan: Sistem membedakan laporan pribadi, konfirmasi serah terima, dan laporan distribusi. Hari tanpa catatan tidak dianggap nol food waste.

Diterima apabila: Dashboard menandai catatan belum lengkap; estimasi tidak ditampilkan sebagai angka terukur.

### FR-IM-04  Tren dan pengurangan surplus  P1

Kebutuhan: Tren membantu melihat kategori dan penyebab surplus/terbuang. Perbandingan hanya digunakan ketika satuan, periode, dan kelengkapan data memadai.

Diterima apabila: Sistem tidak menyimpulkan penurunan ketika data periode pembanding tidak cukup; metode perbandingan terlihat.

| Ukuran | Definisi kebutuhan |
| --- | --- |
| Pangan diterima | Jumlah aktual diterima; tampil per satuan atau kilogram dengan dasar konversi. |
| Keberhasilan penyaluran | Penyaluran dengan penerimaan penuh/sebagian dibagi seluruh penyaluran terjadwal dalam periode, dengan kegagalan terlihat. |
| Waktu penyaluran | Selisih waktu penawaran diterbitkan sampai penerimaan terkonfirmasi; kasus gagal dilaporkan terpisah. |
| Pangan terbuang | Jumlah dilaporkan terbuang dan alasannya; kelengkapan pencatatan ikut ditampilkan. |
| Biaya operasional | Pengeluaran tunai aplikasi, koordinasi, dan distribusi; nilai pangan bukan uang tersedia. |

Target numerik belum ditentukan. Ukuran emisi, porsi ekuivalen, dan penghematan ekonomi masuk pengembangan lanjutan sampai metode serta faktor konversi tersedia. Beranda tidak menampilkan persentase progres tanpa target dan periode yang jelas.

## 9 Resep dan percakapan speech to speech

Requirement eksplisit: pengguna dapat menyampaikan bahan melalui suara, menerima jawaban suara, dan melanjutkan percakapan. Penyedia API serta arsitektur audio belum ditetapkan.

### FR-RS-01  Rekomendasi berdasarkan bahan  P1

Kebutuhan: Pengguna memasukkan atau memilih bahan, porsi, alat masak, dan preferensi. Sistem memberi pilihan resep serta menjelaskan bahan tambahan yang diperlukan.

Diterima apabila: Resep sesuai input atau menjelaskan keterbatasannya; bahan yang tidak tersedia tidak dianggap sudah dimiliki.

### FR-RS-02  Percakapan suara dua arah  P1

Kebutuhan: API mendukung masukan suara dan keluaran suara secara percakapan, dengan konteks pertanyaan lanjutan. Bahasa Indonesia menjadi kebutuhan usulan layanan.

Diterima apabila: Pengguna dapat menyebut bahan, memilih resep, bertanya langkah berikutnya, dan menerima respons suara yang sesuai konteks.

### FR-RS-03  Konfirmasi dan kendali suara  P1

Kebutuhan: Asisten meminta klarifikasi ketika bahan atau jumlah tidak jelas. UI menunjukkan mikrofon aktif dan menyediakan hentikan, ulangi, serta peralihan ke teks.

Diterima apabila: Penolakan izin mikrofon tetap memungkinkan resep teks; berhenti mengakhiri pengambilan audio dan respons sesuai kendali pengguna.

### FR-RS-04  Resep tertulis dan penyimpanan  P1

Kebutuhan: Hasil akhir memuat bahan, jumlah porsi, bahan tambahan, dan langkah tertulis yang dapat dibaca serta disimpan. Penggunaan bahan dapat dicatat setelah dikonfirmasi.

Diterima apabila: Jawaban suara tidak menjadi satu-satunya keluaran; resep tersimpan dapat dibuka kembali; stok tidak berkurang hanya karena resep dilihat.

### FR-RS-05  Sumber resep dan batas asisten  P1

Kebutuhan: Katalog terkurasi menjadi dasar usulan. Adaptasi AI tidak dinyatakan sebagai resep terkurasi jika belum ditinjau. Asisten tidak mengesahkan keamanan pangan dari foto atau tanggal.

Diterima apabila: Sumber atau status adaptasi terlihat; pangan yang dilaporkan tidak layak tidak diarahkan untuk dikonsumsi demi menyelesaikan challenge.

### FR-RS-06  Biaya privasi dan gangguan API  P1

Kebutuhan: Kredensial penyedia dilindungi di server. Penggunaan sesi dicatat untuk biaya tanpa membuka rekaman kepada pihak tak berizin. Gangguan API memunculkan pilihan teks/katalog.

Diterima apabila: Kunci API tidak ada pada aplikasi klien; batas sesi diinformasikan; retensi audio/transkrip mengikuti OD-06.

FR-RS-02 wajib pada modul resep. Pemilihan API dan cara implementasinya dibahas kemudian pada architecture.md. Requirement tetap berupa percakapan suara dua arah, hasil tertulis, kendali pengguna, dan penanganan kegagalan. Tarif dan target latensi belum ditetapkan.

## 10 Tips dan Eco Challenge

Tips membantu persiapan penyaluran dan pencegahan pemborosan. Eco Challenge bersifat pilihan dengan dua kelompok peserta: pemberi dan penerima.

### FR-TP-01  Konten dan pencarian  P1

Kebutuhan: Pengguna melihat kategori, mencari tips, menyimpan artikel, dan mendapat tips relevan pada langkah donasi. Konten dibedakan untuk pemberi serta penerima.

Diterima apabila: Artikel dapat ditemukan dan dibuka kembali; tips sesuai konteks tanpa menghambat penyaluran.

### FR-TP-02  Pengelolaan dan peninjauan konten  P1

Kebutuhan: Admin membuat draf, meninjau, menerbitkan, memperbarui, dan menarik tips/resep. Panduan penanganan pangan memerlukan proses peninjauan yang ditetapkan.

Diterima apabila: Versi serta tanggal pembaruan tercatat; konten ditarik tidak direkomendasikan sebagai panduan aktif.

### FR-EC-01  Informasi challenge  P1

Kebutuhan: Challenge memuat peran peserta, tujuan, periode, syarat, aktivitas yang dihitung, bukti, pilihan reward, kuota, serta aturan klaim sebelum diikuti.

Diterima apabila: Pengguna mengetahui syarat dan reward yang dijanjikan; tidak ada peserta kurir sebagai kelompok challenge tambahan.

### FR-EC-02  Progres dan penyelesaian  P1

Kebutuhan: Progres bersumber dari kegiatan aplikasi yang memenuhi aturan. Laporan pribadi diberi penanda; verifikasi admin digunakan untuk reward yang membutuhkan pemeriksaan.

Diterima apabila: Penawaran, pembatalan, dan konfirmasi ulang tidak otomatis menambah pencapaian; progres dapat ditelusuri.

### FR-EC-03  Keadilan dan koreksi  P1

Kebutuhan: Keikutsertaan tidak memengaruhi hak menerima pangan. Pelaporan sisa atau penolakan jujur tidak otomatis dihukum. Koreksi data dapat memicu tinjauan pencapaian.

Diterima apabila: Tidak ada prioritas makanan karena poin; keputusan koreksi atau penolakan reward memiliki alasan yang dapat dilihat.

Contoh challenge untuk dibahas: pencatatan surplus, penyaluran terkonfirmasi bagi pemberi, dan pencatatan penerimaan/distribusi bagi penerima. Nama, jumlah kegiatan, periode, dan nilai pencapaian belum final. Poin versus hak klaim langsung mengikuti OD-05.

Challenge tidak menargetkan produksi surplus atau pengambilan melebihi kebutuhan. Foto wajah penerima bukan bukti wajib. Usulan pencegahan pemborosan tidak mengubah informasi surplus menjadi klaim keamanan konsumsi.

## 11 Reward dan apresiasi mitra

Reward bukan paket berbayar. Pengguna memperoleh hak sesuai challenge dan hasil pemeriksaan. Ketersediaan pendanaan atau kapasitas harus dipastikan sebelum hadiah dijanjikan.

### FR-RW-01  Katalog dan hak klaim  P1

Kebutuhan: Sistem menampilkan reward, kelayakan peserta, kuota, periode, cara mengambil, serta biaya penyerahan bila ada. Klaim menggunakan hak yang sudah diverifikasi.

Diterima apabila: Klaim ganda dan stok negatif dicegah; reward yang tidak tersedia tidak dijanjikan. Mekanisme cadangan klaim mengikuti OD-05.

### FR-RW-02  Paket Apresiasi Mitra  P1

Kebutuhan: Paket memuat honorable mention, sorotan profil, materi publikasi, dan sertifikat digital. Materi menyatakan kontribusi terverifikasi dan periode kegiatan.

Diterima apabila: Mitra menerima pratinjau; publikasi hanya berjalan setelah persetujuan terhadap versi materi yang sama.

### FR-RW-03  Persetujuan dan batas publikasi  P1

Kebutuhan: Publikasi bersifat pilihan. Penggunaan nama, logo, foto, dan cerita memerlukan persetujuan pihak terkait. Apresiasi tidak menjadi sertifikasi atau janji kenaikan penjualan.

Diterima apabila: Riwayat persetujuan tersimpan; perubahan materi memerlukan persetujuan baru; data pribadi tidak dipublikasikan otomatis.

### FR-RW-04  Paket Dukungan Penyaluran  P1

Kebutuhan: Pengguna memilih satu reward tersedia berupa voucher atau perlengkapan pangan. Sistem melacak pemilihan, persetujuan, pengiriman/pengambilan, dan penerimaan.

Diterima apabila: Jumlah, nilai, stok, dan bukti penerimaan tercatat; barang/jasa dari sponsor dibedakan dari saldo uang.

### FR-RW-05  Penanganan klaim dan keberatan  P1

Kebutuhan: Admin meninjau klaim bermasalah, membatalkan duplikasi, dan mengelola pengganti atau tindak lanjut sesuai aturan yang diketahui peserta.

Diterima apabila: Alasan keputusan tercatat; ketidaktersediaan reward tidak diselesaikan dengan janji yang belum didanai.

Pembagian awal yang diusulkan: restoran/UMKM memilih Apresiasi Mitra atau Dukungan Penyaluran; rumah tangga dan komunitas penerima mendapat pilihan Dukungan Penyaluran. Lencana digital menjadi apresiasi dasar. Pembagian, durasi sorotan, kuota, dan sponsor belum final.

Bantuan pengiriman berdasarkan kebutuhan tetap merupakan fungsi pendanaan layanan. Reward tidak dipakai untuk menentukan siapa berhak menerima pangan atau untuk membeli status verifikasi.

## 12 Pendanaan dan transparansi

Pendanaan dibedakan antara uang, pangan, serta barang/jasa. Donasi operasional dan sponsor pengiriman tidak memberikan akses istimewa terhadap donasi pangan.

### FR-FD-01  Dukungan sukarela  P0

Kebutuhan: Sistem menyediakan pencatatan dukungan sekali atau rutin sesuai kemampuan penyedia pembayaran. Tujuan penggunaan, biaya yang relevan, dan status transaksi diinformasikan.

Diterima apabila: Status menunggu, berhasil, gagal, dan pengembalian dapat ditelusuri; pembayaran tidak menjadi syarat memberi/menerima pangan.

### FR-FD-02  Tujuan dan saldo dana  P0

Kebutuhan: Catatan dana mengidentifikasi sumber serta tujuan: operasional, pengiriman, bantuan komunitas, atau program tertentu. Dana terikat digunakan sesuai tujuan.

Diterima apabila: Pengeluaran mengacu dana tersedia; saldo tidak mencampur nilai makanan atau barang sebagai uang tunai.

### FR-FD-03  Sponsor pengiriman  P0

Kebutuhan: Biaya pengiriman dapat dibiayai program sponsor dengan aturan wilayah, kelayakan, batas anggaran, dan periode. Sistem mencatat alokasi serta penggunaan aktual.

Diterima apabila: Dua penyaluran tidak menggunakan saldo sponsor yang sama melebihi anggaran; kegiatan batal ditangani sesuai OD-04.

### FR-FD-04  Program dan dukungan nonuang  P0

Kebutuhan: Admin mencatat kerja sama program, anggaran, kegiatan, serta sumbangan barang/jasa. Laporan sponsor menggunakan hasil terverifikasi sesuai hak akses.

Diterima apabila: Sponsor melihat ringkasan program yang relevan; tidak memperoleh dokumen pribadi peserta tanpa dasar akses.

### FR-FD-05  Rekonsiliasi dan laporan  P0

Kebutuhan: Pemasukan dan pengeluaran mempunyai tanggal, referensi, tujuan, dan bukti. Laporan memisahkan biaya operasional, pengiriman, bantuan, saldo, serta alokasi surplus.

Diterima apabila: Transaksi dapat dicocokkan dengan penyedia dan bukti; pembaruan berulang tidak menggandakan uang masuk.

Akun pembayaran, penyedia, pembayaran rutin otomatis versus dukungan berulang manual, biaya transaksi, penanggung jawab persetujuan pengeluaran, dan jadwal laporan mengikuti OD-07 serta OD-08. Pencatatan manual boleh menjadi langkah awal, tetapi harus memakai kontrol dan bukti yang jelas.

Target pendanaan diturunkan dari anggaran nyata, bukan nilai pangan yang disalurkan. Biaya tim, server, pemeliharaan, koordinasi, dan distribusi termasuk kebutuhan operasional yang dapat dijelaskan secara terbuka.

## 13 Panel admin dan integrasi

Admin mendukung operasi dan menjaga ketertelusuran. Integrasi otomatis tidak menghapus kebutuhan penanganan manual saat penyedia gagal.

### FR-AD-01  Pengelolaan pengguna  P0

Kebutuhan: Admin meninjau verifikasi, perubahan identitas, penangguhan, dan pemulihan akun. Wewenang dapat dipisahkan sesuai tugas.

Diterima apabila: Perubahan penting memiliki alasan dan jejak audit; dokumen tidak tampil kepada admin tanpa wewenang.

### FR-AD-02  Pengawasan penyaluran  P0

Kebutuhan: Admin melihat penawaran, reservasi, jadwal, masalah, serta kasus yang menunggu konfirmasi. Koreksi tidak menghapus peristiwa asal.

Diterima apabila: Kasus dapat ditelusuri dari pemberi sampai penerima; koreksi memperbarui statistik dan pencapaian terkait.

### FR-AD-03  Konten challenge dan reward  P1

Kebutuhan: Admin mengelola versi konten, periode challenge, kriteria, kuota, sponsor, klaim, serta persetujuan publikasi.

Diterima apabila: Perubahan syarat peserta aktif tercatat dan diinformasikan; reward yang dipublikasikan memiliki kapasitas pendanaan.

### FR-AD-04  Dana dan laporan  P0

Kebutuhan: Admin berwenang mencatat serta memeriksa transaksi, alokasi, biaya, pengembalian, dan laporan. Pembatasan hak disesuaikan kebijakan.

Diterima apabila: Pengguna biasa tidak dapat mengubah saldo atau persetujuan; ekspor mengikuti hak akses.

| Integrasi | Requirement antarmuka |
| --- | --- |
| API suara | Sesi audio, konteks percakapan, keluaran teks, kendali berhenti, biaya penggunaan, serta pemulihan kegagalan. |
| Mitra logistik | Jadwal, biaya, penugasan, status, pembatalan, dan bukti serah terima; operasi manual dapat menjadi tahap awal. |
| Pembayaran | Referensi unik, konfirmasi dari sumber terpercaya, rekonsiliasi, dan pengembalian. |
| Notifikasi | Pengiriman pemberitahuan dan tautan kegiatan; daftar dalam aplikasi tetap tersedia. |

Integrasi peta, GPS langsung, otomatisasi publikasi media sosial, beberapa cabang, dan pencocokan otomatis belum wajib pada tahap awal. Data atau event eksternal dipetakan ke status internal dan tidak dipercaya tanpa pemeriksaan sumber.

## 14 Kebutuhan nonfungsional dan data

Detail berikut adalah kebutuhan sistem yang diusulkan agar cakupan produk dapat dioperasikan. Target performa dan volume penggunaan harus diputuskan sebelum pengujian rilis.

### NFR-01  Keamanan akses  P0

Kebutuhan: Autentikasi, otorisasi per objek, perlindungan kredensial penyedia, serta koneksi terenkripsi berlaku untuk aplikasi, admin, dan integrasi.

Diterima apabila: Pengguna tidak dapat membaca atau mengubah penyaluran, dana, reward, atau dokumen yang bukan haknya; kunci API tidak dikirim sebagai konfigurasi publik.

### NFR-02  Integritas dan idempotensi  P0

Kebutuhan: Reservasi, penerimaan, pembayaran, dan reward tahan terhadap permintaan berulang dan kegiatan bersamaan.

Diterima apabila: Permintaan duplikat tidak membuat saldo, dampak, atau klaim tambahan; alokasi tidak melebihi stok.

### NFR-03  Privasi dan retensi  P0

Kebutuhan: Izin mikrofon dan lokasi dijelaskan saat diperlukan. Kebijakan rekaman, transkrip, dokumen, serta permintaan penghapusan ditentukan; log dibatasi.

Diterima apabila: Penolakan izin menyediakan alternatif; data sensitif tidak ada pada log publik; retensi audio mengikuti OD-06.

### NFR-04  Kegagalan dan pemulihan  P0

Kebutuhan: Status kegagalan, percobaan ulang, pencadangan, dan pemulihan data disediakan. Formulir tidak menyatakan berhasil sebelum konfirmasi server.

Diterima apabila: Gangguan jaringan tidak menyebabkan duplikasi; uji pemulihan dilakukan sesuai target yang ditetapkan pada OD-10.

### NFR-05  Kegunaan dan aksesibilitas  P1

Kebutuhan: Bahasa Indonesia, label jelas, satuan dan tanggal terbaca, status tidak hanya memakai warna, serta alternatif teks untuk audio.

Diterima apabila: Alur dapat dijalankan dengan izin audio ditolak; kesalahan menjelaskan tindakan perbaikan.

### NFR-06  Performa dan biaya  P0

Kebutuhan: Waktu respons, keberhasilan sesi suara, biaya sesi, beban pengguna, serta notifikasi dipantau. Target layanan dan batas penggunaan disetujui sebelum rilis.

Diterima apabila: Evaluasi menghasilkan pengukuran pada perangkat/jaringan sasaran; tidak ada klaim SLA atau batas menit yang belum ditetapkan.

Entitas data minimum: akun dan profil; verifikasi; catatan pangan dan pergerakan jumlah; penawaran; permintaan dan reservasi; penyaluran dan pengiriman; serah terima dan distribusi; masalah; konten dan sesi resep; challenge dan progres; reward dan klaim; persetujuan publikasi; program dan transaksi dana; notifikasi serta jejak audit.

Setiap kegiatan penting menyimpan identitas unik, pemilik atau pihak terkait, waktu, status, satuan, dan sumber perubahan. Data resep atau percakapan tidak otomatis memberi izin mengubah stok, membuat donasi, atau mengeluarkan dana.

## 15 Skenario penerimaan lintas fitur

Skenario ini menjadi dasar pengujian produk. Angka contoh digunakan untuk menguji perilaku sistem, bukan target challenge atau estimasi dampak.

| ID | Skenario dan hasil yang diharapkan |
| --- | --- |
| AT-01 | Pemberi menawarkan 20 porsi. Dua penerima meminta 12 dan 10 porsi bersamaan. Sistem tidak dapat menyetujui total melebihi 20; penyesuaian memerlukan kesepakatan. |
| AT-02 | Dari 12 porsi disepakati, hanya 10 diterima. Statistik memakai 10; dua porsi lain tercatat sebagai selisih/ditolak. Konfirmasi ulang tidak menambah dampak. |
| AT-03 | Batas pengambilan terlewati. Permintaan baru ditutup; reservasi aktif ditangani menurut kebijakan. Tidak ada status pangan aman yang disimpulkan dari batas waktu. |
| AT-04 | Kurir gagal mengambil. Pihak terkait melihat kendala; pangan tidak ditandai diterima. Biaya atau alokasi sponsor ditindaklanjuti menurut kebijakan. |
| AT-05 | Pengguna menyebut bahan melalui suara, memilih resep, lalu menanyakan langkah. Jawaban suara dan resep tertulis tersedia. Izin mikrofon ditolak tetap membuka mode teks. |
| AT-06 | Penerima melaporkan sebagian pangan masih tersisa. Ringkasan tidak menyatakan semuanya didistribusikan; laporan jujur tidak otomatis dihukum oleh challenge. |
| AT-07 | Challenge selesai, tetapi belum diverifikasi. Reward belum diserahkan. Setelah lolos, satu hak klaim tidak dapat digunakan dua kali dan stok tidak negatif. |
| AT-08 | Restoran memilih apresiasi. Materi belum disetujui sehingga tidak terbit. Perubahan caption setelah persetujuan mengharuskan persetujuan versi baru. |
| AT-09 | Konfirmasi pembayaran diterima dua kali dari penyedia. Saldo bertambah sekali. Dana pengiriman tidak dipakai untuk tujuan lain tanpa kebijakan yang sesuai. |
| AT-10 | Akun lain mencoba membuka dokumen verifikasi, alamat rinci, atau sesi resep privat. Akses ditolak pada server. |
| AT-11 | Catatan pangan dikonversi menjadi penawaran dan berhasil diserahkan. Riwayat asal tetap ada; platform menghitung satu penyaluran. |
| AT-12 | Gangguan API suara muncul. Pengguna mendapat pesan dan opsi katalog/teks; tidak ada pengurangan stok karena jawaban terputus. |

Sebelum rilis operasional: kebijakan pangan, akun/verifikasi, status dan reservasi, penyaluran, biaya/pengembalian, pendanaan, dan akses data harus selesai dirinci. Sebelum modul reward aktif: aturan serta ketersediaan hadiah harus pasti. Sebelum modul suara aktif: retensi, batas penggunaan, dan target kualitas harus diputuskan serta rancangan integrasi diselesaikan pada tahap arsitektur.

## 16 Keputusan terbuka dan rencana penetapan

Keputusan ini belum disepakati. Requirement yang bergantung padanya dapat digunakan untuk desain, tetapi belum lengkap sebagai kontrak implementasi.

| ID | Keputusan yang diperlukan | Requirement terkait |
| --- | --- | --- |
| OD-01 | Permintaan dengan persetujuan atau klaim langsung; lama reservasi; pembagian sebagian; batas perubahan dan pembatalan. | FR-DN, FR-PN |
| OD-02 | Metode login; satu atau beberapa peran; bukti verifikasi; akun yang boleh melakukan kegiatan; pemeriksaan admin. | FR-AK |
| OD-03 | Kategori pangan, data wajib, kriteria penerimaan/penolakan, prosedur penanganan, dan batas waktu operasional. | FR-DN, FR-PN, FR-TP |
| OD-04 | Pembayar ongkir, kelayakan sponsor, kegagalan, biaya pembatalan, dan pengembalian. | FR-KR, FR-FD |
| OD-05 | Nama/target challenge, poin atau klaim langsung, paket per peserta, stok, nilai voucher, sponsor, dan durasi apresiasi. | FR-EC, FR-RW |
| OD-06 | Sumber resep, Bahasa Indonesia, batas sesi, izin, retensi, penghapusan, dan kualitas percakapan. Penyedia API dibahas di architecture.md. | FR-RS, NFR-03 |
| OD-07 | Anggaran, tujuan dana, cadangan, alokasi surplus, jadwal laporan, dan kewenangan pengeluaran. | BR-02, FR-FD |
| OD-08 | Penyedia pembayaran, dukungan rutin, bukti transaksi, dan rekonsiliasi. | FR-FD, FR-AD |
| OD-09 | Wilayah/perangkat sasaran, Android/iOS, mitra pengiriman, koordinasi manual atau integrasi, kanal komunikasi. | FR-KR, FR-KM |
| OD-10 | Target beban, latensi, keberhasilan sesi suara, ketersediaan, pemulihan, dan biaya layanan. | NFR-04, NFR-06 |

Urutan penetapan yang diusulkan: alur dan kebijakan donasi; akun serta operasi pengiriman; pembiayaan dan pengembalian; challenge/reward; kemudian layanan resep suara serta target nonfungsional. Penetapan dapat berjalan per modul tanpa mengunci UI final.

Pengembangan P2 yang belum menjadi komitmen: pencocokan otomatis, GPS langsung, beberapa cabang/staf, analisis prediksi surplus, estimasi emisi, dan otomatisasi publikasi. Penyedia teknologi serta tanggal rilis tidak ditetapkan dalam versi ini.

## 17 Ketertelusuran dan referensi

Requirement mengikuti enam use case asal dan hasil diskusi produk. Referensi eksternal mendukung pemahaman misi serta pendanaan, bukan keputusan penyedia atau jaminan kelayakan bisnis.

| Use case asal | Requirement dalam dokumen |
| --- | --- |
| Catat Sisa Makanan | FR-CP; pengubahan menjadi penawaran terhubung FR-DN. |
| Pantau Food Waste | FR-IM; sumber data berasal dari pencatatan dan penerimaan. |
| Donasi Makanan | FR-DN, FR-PN, FR-KR, FR-KM, serta akun FR-AK. |
| Resep dari Sisa | FR-RS, termasuk speech-to-speech FR-RS-02. |
| Tips Anti Food Waste | FR-TP serta pengelolaan konten FR-AD. |
| Eco Challenge | FR-EC dan FR-RW untuk dua peran dan dua paket reward. |
| Pendanaan dan operasi | BR, FR-FD, FR-AD, dan NFR. |

Sumber proyek: PRESENTASI USE CASE HTML (1).docx pada C:\Users\banne\Downloads; UI.html dan CATATAN-KEPUTUSAN-PRODUK.md pada direktori proyek. Dokumen use case memuat enam fitur serta aktor pengguna, penerima, dan admin. Keputusan pembahasan memperjelas pemberi, penerima, pengiriman, pendanaan, reward, dan kebutuhan suara.

Target SDG 12: https://sdgs.un.org/goals/goal12

Food Waste Index Report 2024: https://www.unep.org/resources/publication/food-waste-index-report-2024

Contoh aplikasi donor, relawan, dan penerima: https://foodrescue.us/

Pemisahan kontribusi uang dan donasi pangan dalam laporan Food Rescue US 2024: https://foodrescue.us/wp-content/uploads/2025/08/FRUS_2024_ImpactReport_Web.pdf

Contoh dukungan sekali, rutin, dan kegiatan distribusi SOS Indonesia: https://sosindonesia.give.asia/

Versi 0.1 disusun pada 8 Oktober 2026. Bagian berikut yang perlu dilengkapi setelah keputusan requirement ditinjau: user flow terperinci, desain layar, backlog pengembangan serta rencana pengujian dan peluncuran. Pilihan teknologi, penyedia API, spesifikasi integrasi, dan rancangan penyimpanan dilanjutkan pada architecture.md.
