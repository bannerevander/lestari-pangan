# Lestari Pangan

**Lestari Pangan** adalah rencana aplikasi mobile yang mempertemukan restoran, UMKM, dan rumah tangga yang memiliki surplus pangan layak konsumsi dengan panti serta komunitas yang membutuhkan. Aplikasi membantu kegiatan dari penawaran makanan hingga penerimaan dan pencatatan hasil distribusi, dengan dukungan pengambilan mandiri atau mitra pengiriman.

Tagline: **Bijak Konsumsi, Kurangi Sisa, Jaga Bumi.**

Status: tahap rancangan UI. Arah produk, pendanaan, paket reward, dan cakupan fitur telah dibahas; cakupan fitur disetujui sementara dan dapat disempurnakan. Palet hijau–oranye dan arah aplikasi mobile modern telah disetujui. Rancangan seluruh halaman, komponen, dan motion tersedia dalam docs/design.md sebagai acuan pembuatan UI baru dari awal. Direktori proyek memiliki aset logo, catatan keputusan, dokumentasi kebutuhan, serta spesifikasi desain; belum merupakan aplikasi mobile yang berjalan.

## Tujuan aplikasi

1. Mengurangi pangan layak konsumsi yang akhirnya terbuang dengan menghubungkan pemberi dan penerima donasi.
2. Memudahkan restoran, UMKM, dan rumah tangga menawarkan serta menyalurkan kelebihan pangan.
3. Membantu panti dan komunitas menemukan pangan yang sesuai kebutuhan, kapasitas, dan kemampuan penyalurannya.
4. Membuat penyaluran dapat ditelusuri melalui jadwal, status, konfirmasi penerimaan, serta laporan distribusi.
5. Membantu pengguna memahami penyebab surplus dan membangun kebiasaan yang mengurangi food waste.
6. Menjaga operasional platform melalui pendanaan sosial yang transparan dan mengembalikan surplus dana untuk misi sosial.

Fokus SDG utama adalah **SDG 12 tentang konsumsi dan produksi yang bertanggung jawab**, terutama pengurangan food waste pada target 12.3. Pencegahan limbah dan edukasi juga berkaitan dengan tujuan 12.5 dan 12.8. Data aplikasi menunjukkan hasil kegiatan program; tidak otomatis menjadi pengukuran indikator SDG resmi.

## Manfaat bagi para pihak

| Pihak | Manfaat yang dituju |
| --- | --- |
| Restoran dan UMKM | Menemukan penerima yang sesuai, mempermudah koordinasi, menyimpan riwayat penyaluran, serta mengevaluasi pola surplus. |
| Rumah tangga | Menyalurkan kelebihan pangan dan memperoleh ide penggunaan bahan yang tersedia. |
| Panti dan komunitas | Menemukan donasi yang sesuai kebutuhan, mengatur penerimaan, dan mencatat hasil distribusi. |
| Mitra pengiriman | Menjalankan penugasan dengan jadwal, informasi lokasi, dan status serah terima yang jelas. |
| Sponsor dan pendukung | Membantu operasional atau penyaluran serta melihat penggunaan dukungan dan hasil program yang dapat ditelusuri. |

Manfaat promosi dari reward apresiasi bergantung pada jangkauan dan kredibilitas program; kenaikan penjualan atau reputasi restoran tidak dijanjikan.

## Pengguna dan pihak pendukung

Aplikasi memiliki **dua peran pengguna utama**:

- **Pemberi donasi:** restoran, UMKM, dan rumah tangga.
- **Penerima donasi:** pengelola panti asuhan, panti jompo, dan komunitas penyaluran makanan gratis.

**Admin** membantu verifikasi, pengelolaan konten, penanganan kendala, reward, dan laporan pendanaan. **Mitra pengiriman** membantu pengangkutan, baik melalui kemitraan yang dibangun maupun pihak ketiga. Keduanya merupakan fungsi pendukung operasional, bukan kelompok peserta Eco Challenge tambahan.

## Prinsip produk

- Memberi dan menerima donasi pangan tetap gratis; langganan wajib tidak menjadi model utama.
- Jika pengiriman berbiaya digunakan, biaya dan sumber pembayarannya harus jelas sebelum disetujui.
- Pembayaran, poin, dan reward tidak memberikan prioritas mendapatkan pangan.
- Penyaluran menyesuaikan kebutuhan, kapasitas, jenis pangan, waktu, dan kemampuan pengambilan penerima.
- Istilah surplus pangan merujuk kelebihan yang ditawarkan; informasi tanggal atau foto tidak otomatis membuktikan keamanan konsumsi.
- Penawaran belum dianggap sebagai donasi berhasil. Penerimaan dan distribusi harus dibedakan serta dicatat berdasarkan hasil aktual.
- Catatan donor dan penerima untuk kegiatan yang sama tidak dihitung sebagai dua kontribusi platform.
- Reward tidak mendorong produksi surplus atau pengambilan makanan melebihi kebutuhan.
- Pelaporan jujur mengenai sisa, penolakan, dan kendala harus tetap dimungkinkan.
- Alamat rinci, kontak, bukti verifikasi, dan data kegiatan diberikan sesuai hak akses.

## Fitur utama

### 1 Catat Pangan

Pengembangan dari use case **Catat Sisa Makanan**. Pengguna mencatat pangan yang masih tersedia maupun yang akhirnya terbuang.

- Nama, kategori, jumlah, satuan, tanggal, dan informasi penyimpanan.
- Kategori makanan matang, bahan pangan, dan produk kemasan.
- Status masih tersedia, digunakan, ditawarkan untuk donasi, disalurkan, atau terbuang.
- Alasan pembuangan atau kegagalan penyaluran.
- Pengubahan catatan menjadi penawaran donasi tanpa mengetik ulang informasi.
- Penawaran langsung tetap tersedia tanpa kewajiban mengelola stok terlebih dahulu.
- Penerima dapat mencatat penggunaan, distribusi, sisa, atau pembuangan dari pangan yang diterima.

Jumlah estimasi harus ditandai. Porsi, unit, dan kilogram tidak boleh dijumlahkan tanpa dasar konversi.

### 2 Pantau Food Waste dan dampak

Dashboard menampilkan informasi sesuai peran dan periode.

| Pemberi | Penerima |
| --- | --- |
| Surplus tercatat dan penawaran belum tersalurkan | Jumlah pangan diterima |
| Jumlah yang berhasil diserahkan | Jumlah digunakan atau didistribusikan |
| Pangan terbuang dan penyebabnya | Pangan masih tersedia, ditolak, atau terbuang |
| Tren dan riwayat kegiatan | Riwayat penerimaan dan distribusi |

Data memisahkan laporan pribadi, konfirmasi serah terima, dan laporan distribusi. Hari tanpa catatan tidak dianggap sebagai hari tanpa food waste. Estimasi emisi menunggu metode yang dapat dipertanggungjawabkan.

### 3 Donasi Makanan

Fitur pusat aplikasi mencakup kebutuhan pemberi dan penerima.

**Pemberi:** membuat atau memperbarui penawaran, menentukan jumlah serta waktu, melihat permintaan, mengatur kesepakatan, menyiapkan makanan, dan mencatat penyerahan.

**Penerima:** mencari penawaran, menilai kesesuaian, mengajukan jumlah, menyepakati jadwal, mengatur pengambilan, mengonfirmasi penerimaan aktual, dan mencatat distribusi.

Informasi penawaran meliputi jenis pangan, jumlah, foto opsional, waktu persiapan atau pembukaan jika relevan, tanggal pada label, penyimpanan, bahan/alergen yang diketahui, area, dan batas pengambilan. Profil penerima memuat kebutuhan, kapasitas, penyimpanan, jadwal, dan kemampuan mengambil.

Sistem perlu menyediakan reservasi jumlah, penyaluran sebagian, pembatalan, penolakan, dan laporan masalah. Detail permintaan dengan persetujuan versus klaim langsung masih akan diputuskan.

### 4 Resep dari Sisa dengan speech to speech

Rekomendasi resep mendukung **percakapan suara dua arah melalui API**. Pengguna menyebut bahan yang tersedia, menerima jawaban suara, lalu dapat bertanya kembali mengenai pilihan atau langkah memasak.

- Pencarian berdasarkan bahan, porsi, alat masak, dan preferensi.
- Penjelasan bahan tambahan yang dibutuhkan.
- Resep tertulis yang dapat dibaca dan disimpan.
- Pencatatan penggunaan bahan setelah pengguna mengonfirmasi.

Pendukung percakapan yang diusulkan: Bahasa Indonesia, klarifikasi ucapan yang kurang jelas, kendali mikrofon, berhenti atau ulangi jawaban, dan alternatif teks ketika audio tidak tersedia. Katalog terkurasi diusulkan sebagai dasar rekomendasi; batas adaptasi AI masih perlu dirinci.

Penyedia API dan cara implementasi dibahas pada tahap arsitektur. Asisten resep tidak mengesahkan bahwa pangan aman dikonsumsi hanya berdasarkan foto, tanggal, atau percakapan.

### 5 Tips Anti Food Waste

Kategori, pencarian, artikel singkat, tips tersimpan, dan panduan yang muncul pada langkah relevan.

- Pemberi: perencanaan produksi atau belanja, penyimpanan, penandaan bahan, informasi donasi, dan pengemasan.
- Penerima: kecocokan kebutuhan, pemeriksaan serah terima, penyimpanan, distribusi, dan pencatatan sisa.

Admin mengelola konten. Panduan penanganan pangan perlu mempunyai proses peninjauan sebelum digunakan dalam operasi.

### 6 Eco Challenge dan reward

Challenge menyesuaikan **pemberi dan penerima**. Fitur mencakup tujuan, periode, aturan, progres, bukti penyelesaian, pemeriksaan, reward tersedia, klaim, dan riwayat penyerahan.

Contoh kegiatan yang masih perlu dirinci: pencatatan surplus, penyaluran terkonfirmasi, perbaikan kebiasaan, atau pencatatan hasil distribusi. Nama challenge, jumlah kegiatan, periode, dan mekanisme poin versus klaim langsung belum final.

#### Paket Apresiasi Mitra

Reward pengakuan publik dan materi komunikasi, terutama untuk restoran dan UMKM:

- Honorable mention di kanal Lestari Pangan.
- Sorotan profil mitra pada aplikasi selama periode tertentu.
- Materi gambar dan caption siap dibagikan kembali.
- Sertifikat apresiasi digital dengan periode dan kontribusi terverifikasi.

Materi menekankan kolaborasi penyelamatan pangan, tetap jujur mengenai surplus, dan tidak membingkai restoran sebagai usaha yang tidak laku. Mitra menyetujui penggunaan nama, logo, foto, dan teks sebelum publikasi. Apresiasi bukan sertifikasi keamanan pangan atau penilaian seluruh praktik lingkungan restoran.

#### Paket Dukungan Penyaluran

Reward praktis berupa pilihan voucher perlengkapan pangan, wadah guna ulang, tas berinsulasi, atau perlengkapan informasi donasi. Pengguna memilih satu reward yang tersedia; seluruh isi tidak otomatis diberikan.

Nilai, stok, sponsor, cara memperoleh, dan biaya penyerahan harus diketahui sebelum hadiah dijanjikan. Bantuan ongkir dasar tetap menjadi program pendanaan penyaluran berdasarkan kebutuhan.

Pembagian awal yang diusulkan: restoran/UMKM dapat memilih salah satu paket; rumah tangga dan penerima memperoleh pilihan Dukungan Penyaluran. Kelayakan akhir, kuota, durasi apresiasi, dan sponsor masih perlu ditetapkan. Foto wajah penerima bukan syarat wajib challenge.

## Fitur pendukung

| Fitur | Cakupan |
| --- | --- |
| Akun dan profil | Registrasi, login, pemulihan akses, identitas pemberi/penerima, serta kebutuhan dan lokasi. |
| Verifikasi | Pemeriksaan identitas dan pengelola, status tinjauan, serta pembatasan akses bukti. |
| Pengambilan dan pengiriman | Cara penyaluran, mitra, jadwal, biaya, pembayar atau sponsor, status, dan serah terima. |
| Komunikasi dan notifikasi | Permintaan, persetujuan, koordinasi, pengingat, perubahan, dan hasil kegiatan. |
| Laporan masalah | Tidak datang, keterlambatan, jumlah berbeda, penolakan, dan kendala penyaluran. |
| Dukungan pendanaan | Donasi operasional, sponsor pengiriman, program, serta bantuan barang/jasa dan laporan. |
| Panel admin | Verifikasi, pemantauan operasi, konten, challenge, reward, persetujuan publikasi, dan pendanaan. |
| Privasi dan hak akses | Pembatasan alamat rinci, kontak, dokumen, rekaman, dan data penyaluran. |

## Model pendanaan yang disepakati

Lestari Pangan bertujuan menutup biaya operasional serta menjaga misi sosial. Sumber dukungan yang direncanakan:

1. Donasi operasional sukarela, sekali atau rutin.
2. Sponsor pengiriman dari individu atau perusahaan.
3. Kemitraan program untuk wilayah atau periode tertentu dengan biaya pengelolaan transparan.
4. Dukungan barang dan jasa, seperti pengiriman, kemasan, penyimpanan, hosting, atau tenaga.

Dukungan rutin tidak menjadi langganan wajib. Dana digunakan untuk menjalankan aplikasi dan penyaluran; surplus digunakan kembali untuk distribusi serta bantuan komunitas. Besar cadangan operasional dan aturan alokasi masih perlu ditetapkan.

Laporan membedakan dana operasional, pengiriman, bantuan langsung, barang/jasa, pengeluaran, dan saldo. Dana dengan tujuan khusus digunakan sesuai tujuan. Nilai pangan yang didonasikan dibedakan dari uang tunai untuk operasional.

## Gambaran alur utama

1. Pemberi dan penerima membuat profil serta mengikuti pemeriksaan yang dipersyaratkan.
2. Pemberi mencatat atau langsung menawarkan surplus.
3. Penerima melihat kecocokan dan mengajukan jumlah.
4. Kedua pihak menyepakati jumlah, waktu, cara penyaluran, serta pendanaan pengiriman jika diperlukan.
5. Pangan diserahkan dan jumlah aktual diterima dikonfirmasi.
6. Penerima mencatat penggunaan/distribusi dan sisa.
7. Riwayat, dashboard, dan progres challenge diperbarui dari kegiatan yang relevan.
8. Reward dapat diklaim setelah syarat serta pemeriksaan terpenuhi.

Alur permintaan di atas merupakan dasar pembahasan; persetujuan versus klaim langsung dan rincian pembatalan belum final.

## Hal yang masih perlu ditetapkan

- Jenis pangan yang boleh ditawarkan, informasi wajib, serta prosedur penanganan dan penolakan.
- Aturan verifikasi, reservasi, pembagian jumlah, persetujuan, dan pembatalan.
- Mitra pengiriman, wilayah layanan, sumber pembayar, dan pengembalian biaya.
- Challenge, bukti, poin atau klaim langsung, nilai reward, kuota, sponsor, dan durasi publikasi.
- Anggaran operasional, cadangan, penggunaan surplus, dan jadwal laporan.
- Target perangkat/platform, batas layanan suara, retensi data, serta target kualitas dan performa.

## Struktur folder

| Folder | Isi |
| --- | --- |
| `docs/` | Dokumen produk dan desain: requirement, catatan keputusan, riset warna, `design.md`, gaya home terkunci. |
| `assets/` | Logo sumber (`logo-lestari-pangan.png`) dan pilihan palet (`pilihan-palet.svg`). |
| `lestari-pangan-frontend/` | Kode front end (React + Vite + Tailwind), di-hosting di Vercel; lihat README di dalamnya. |
| `supabase/` | Backend: migrasi database (skema, RLS, RPC) dan tes pgTAP; lihat [supabase/README.md](supabase/README.md). |
| `output/` | Hasil kerja pendukung, bukan kode aplikasi; lihat [output/README.md](output/README.md). |
| `.playwright-cli/` | Log dan snapshot otomatis dari alat browser; aman diabaikan. |

## Dokumentasi proyek

- [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md): kebutuhan pengembangan, requirement fungsional/nonfungsional, dan kriteria penerimaan awal.
- [docs/CATATAN-KEPUTUSAN-PRODUK.md](docs/CATATAN-KEPUTUSAN-PRODUK.md): riwayat pembahasan dan keputusan.
- [docs/design.md](docs/design.md): acuan UI baru untuk seluruh halaman, navigasi, komponen, warna, aksesibilitas, dan motion. UI dirancang dari awal; prototipe UI.html tidak lagi digunakan sebagai acuan.
- [docs/RISET-UX-WARNA.md](docs/RISET-UX-WARNA.md): dasar riset peran warna dan kontras yang mendukung palet pilihan.
- [docs/PROGRESS.md](docs/PROGRESS.md): **papan pelacakan** — status per area dan per kelompok layar, utang teknis, log pekerjaan. Mulai dari sini.
- [docs/architecture.md](docs/architecture.md): keputusan arsitektur yang sudah disetujui (Supabase, modular monolith, PWA, Vercel), skema database, RPC, dan keputusan terbuka.
- [docs/SECURITY.md](docs/SECURITY.md): lapisan keamanan, hasil pemeriksaan, dan **langkah manual dashboard** yang wajib dilakukan.
- [docs/CONVENTIONS.md](docs/CONVENTIONS.md): aturan pembagian berkas kode, service, migrasi, dan bahasa.

Dokumen sumber use case: **PRESENTASI USE CASE HTML (1).docx**. Rujukan misi: [target resmi SDG 12](https://sdgs.un.org/goals/goal12).

Terakhir diperbarui: **12 Oktober 2026**.
