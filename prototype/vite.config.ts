import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { assertPublicEnv } from './config/publicEnvGuard.ts'
import vercel from './vercel.json'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Gagal sebelum build bila kunci rahasia ikut ke bundle browser (docs/SECURITY.md).
  assertPublicEnv(loadEnv(mode, '.', 'VITE_'))
  return {
    plugins: [react()],
    build: { sourcemap: false }, // kode sumber tidak dipublikasikan
    // `npm run preview` memakai header keamanan yang sama dengan produksi di Vercel.
    preview: { headers: Object.fromEntries(vercel.headers[0].headers.map((h) => [h.key, h.value])) },
  }
})
