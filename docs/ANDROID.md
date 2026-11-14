# Aplikasi Android (APK)

Lestari Pangan untuk Android adalah **Trusted Web Activity (TWA)**: aplikasi Android kecil yang membuka https://lestari-pangan.vercel.app di mesin Chrome, layar penuh tanpa bilah alamat. Isi aplikasi selalu mengikuti versi web yang ter-deploy di Vercel, jadi APK **tidak perlu dibuat ulang** setiap kali kode web berubah.

Karena berjalan di Chrome asli, semua fitur web tetap jalan: login, Realtime, kamera, chat Asisten Dapur AI yang mengalir, mikrofon (pengenalan suara `id-ID`), dan pembacaan suara Bahasa Indonesia. Pembungkus WebView biasa (Capacitor/Cordova) **tidak** dipakai karena WebView Android tidak mendukung Web Speech API.

## Data paket

| Item | Nilai |
| --- | --- |
| Nama paket | `app.vercel.lestari_pangan.twa` |
| Versi | 1.0.0 (versionCode 1), minSdk 24 (Android 7.0+) |
| Orientasi | potret |
| Sidik jari SHA-256 kunci | `23:5E:77:A3:1E:91:51:53:DB:82:ED:FC:A3:11:35:38:50:45:FE:E9:55:9C:6C:D9:1B:75:37:26:AC:92:42:A3` |
| Digital Asset Links | [`public/.well-known/assetlinks.json`](../lestari-pangan-frontend/public/.well-known/assetlinks.json), dilayani di `https://lestari-pangan.vercel.app/.well-known/assetlinks.json` |
| Dibuat dengan | PWABuilder (layanan `pwabuilder-cloudapk`), 13 Nov 2026 |

## Berkas hasil (di luar git)

Folder `android-release/` di akar repo diabaikan git (`.gitignore`):

| Berkas | Fungsi | Boleh dibagikan? |
| --- | --- | --- |
| `paket/Lestari Pangan.apk` | Dipasang langsung di HP (sideload) atau dibagikan ke juri | Ya |
| `paket/Lestari Pangan.aab` | Diunggah ke Google Play Console bila kelak terbit di Play Store | Ya, hanya ke Play Console |
| `paket/signing.keystore` + `paket/signing-key-info.txt` | Kunci tanda tangan + kata sandinya | **Tidak.** Simpan cadangan di tempat aman (mis. pengelola kata sandi). Tanpa kunci ini, pembaruan aplikasi tidak bisa ditandatangani dengan identitas yang sama |

## Unduhan publik

APK dibagikan lewat **GitHub Releases** (bukan di-commit ke git):

- Tautan tetap versi terbaru: https://github.com/bannerevander/lestari-pangan/releases/latest/download/lestari-pangan.apk
- Halaman rilis: https://github.com/bannerevander/lestari-pangan/releases

Tautan hanya bisa dibuka orang lain setelah repo **public**. Untuk versi baru, unggah APK dengan nama berkas yang sama (`lestari-pangan.apk`) ke rilis baru agar tautan `latest` tetap berlaku.

## Memasang di HP

1. Buka tautan unduhan di atas dari browser HP Android (atau kirim berkas `.apk` ke HP lewat kabel/Google Drive).
2. Buka berkasnya, izinkan "Instal aplikasi tidak dikenal" untuk aplikasi pembuka berkas bila diminta.
3. Buka **Lestari Pangan** dari laci aplikasi. Chrome (atau browser lain yang mendukung TWA) harus terpasang dan terbarui.

Bila bagian atas aplikasi masih menampilkan bilah alamat, berarti `assetlinks.json` belum ter-deploy atau sidik jarinya tidak cocok. Periksa alamat di tabel atas; setelah deploy, hapus data aplikasi lalu buka lagi.

## Membuat versi baru APK

Hanya perlu bila nama, ikon, warna, orientasi, atau versi aplikasi Android berubah. Pakai PWABuilder dengan **kunci yang sama** (mode "Use mine": unggah `signing.keystore` dan kata sandinya) dan naikkan `appVersionCode`. Kunci baru akan mengubah sidik jari sehingga `assetlinks.json` harus diperbarui juga.
