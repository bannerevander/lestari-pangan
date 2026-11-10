/**
 * Semua variabel VITE_* ikut tertanam di bundle browser. Pemeriksaan ini menggagalkan
 * dev/build bila ada nilai yang tampak seperti kunci rahasia (docs/SECURITY.md).
 */

const SECRET_NAME = /SECRET|SERVICE_ROLE|PRIVATE|PASSWORD/i

// Node 24 dan browser punya atob global; tsconfig.node tidak memuat tipe DOM/Node.
const atob = (globalThis as unknown as { atob(data: string): string }).atob

/** Role di payload JWT legacy Supabase, atau null bila nilai bukan JWT. */
function jwtRole(value: string): string | null {
  const payload = value.split('.')[1]
  if (!payload || value.split('.').length !== 3) return null
  try {
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))).role ?? null
  } catch {
    return null
  }
}

/** Nama variabel VITE_* yang bocor; kosong berarti aman. */
export function findLeakedSecrets(env: Record<string, string | undefined>): string[] {
  return Object.entries(env)
    .filter(([name]) => name.startsWith('VITE_'))
    .filter(([name, value = '']) => SECRET_NAME.test(name) || value.startsWith('sb_secret_') || jwtRole(value) === 'service_role')
    .map(([name]) => name)
}

export function assertPublicEnv(env: Record<string, string | undefined>): void {
  const leaked = findLeakedSecrets(env)
  if (leaked.length > 0) {
    throw new Error(`Variabel ${leaked.join(', ')} tampak berisi kunci rahasia dan akan terekspos di browser. Pakai publishable key saja.`)
  }
}
