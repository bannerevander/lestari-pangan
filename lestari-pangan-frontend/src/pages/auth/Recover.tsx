import { Navigate } from 'react-router-dom'

/* ---------- U06 Pulihkan akses ---------- */

/** Login tanpa kata sandi: memulihkan akses = meminta kode masuk baru dari halaman Masuk. */
export function Recover() {
  return <Navigate to="/masuk" replace />
}
