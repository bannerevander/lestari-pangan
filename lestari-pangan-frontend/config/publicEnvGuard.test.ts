// Jalankan: npm run test:config
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { findLeakedSecrets } from './publicEnvGuard.ts'

const jwt = (role: string) => `x.${btoa(JSON.stringify({ role })).replace(/=+$/, '')}.y`

test('publishable key dan URL lolos', () => {
  assert.deepEqual(
    findLeakedSecrets({ VITE_SUPABASE_URL: 'https://abc.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_abc', VITE_ANON: jwt('anon') }),
    [],
  )
})

test('kunci rahasia ditolak', () => {
  assert.deepEqual(
    findLeakedSecrets({ VITE_KEY: 'sb_secret_abc', VITE_LEGACY: jwt('service_role'), VITE_STRIPE_SECRET: 'x' }),
    ['VITE_KEY', 'VITE_LEGACY', 'VITE_STRIPE_SECRET'],
  )
})

test('variabel tanpa awalan VITE_ tidak masuk bundle sehingga diabaikan', () => {
  assert.deepEqual(findLeakedSecrets({ SUPABASE_SERVICE_ROLE_KEY: 'sb_secret_abc' }), [])
})
