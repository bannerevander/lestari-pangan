# Lestari Pangan — Prototipe (mode demo)

Salinan front end saat masih prototipe (13 Okt 2026): **selalu mode demo**, tidak pernah tersambung ke Supabase. Semua data dari `src/data/mock.ts` dan disimpan di perangkat. Ada pemilih peran **Pemberi/Penerima** (tab Akun di ponsel, panel samping di layar lebar) dan tombol atur ulang data demo.

Dipakai untuk presentasi alur tanpa akun. Aplikasi sungguhan ada di `../lestari-pangan-frontend`. Prototipe ini tidak ikut dikembangkan; perubahan fitur dilakukan di aplikasi utama.

## Menjalankan

```bash
npm install
npm run dev -- --port 5174   # http://localhost:5174 (aplikasi utama memakai 5173)
npm run build:static         # build statis (hash routing) ke dist-static/, bisa dibuka tanpa server
```

Konsol admin demo: `/admin/masuk`, isi email dan kata sandi apa saja.
