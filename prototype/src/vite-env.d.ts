/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL proyek Supabase. Kosong = mode demo. */
  readonly VITE_SUPABASE_URL?: string
  /** Publishable key (aman untuk browser). Jangan pernah secret/service role key. */
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string
  readonly VITE_HASH_ROUTER?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
