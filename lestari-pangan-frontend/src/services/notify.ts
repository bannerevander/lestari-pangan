import { supabase } from '../lib/supabase/client'
import { toAppError } from '../lib/supabase/errors'
import type { Notification, Role } from '../data/types'
import { stampLabel } from './mappers'

/** Notifikasi dalam aplikasi (tabel notifications, RPC notify_mark_read). */

interface NotificationRow {
  id: number
  kind: string
  title: string
  body: string
  link: string | null
  cta: string | null
  read_at: string | null
  created_at: string
}

export async function loadNotifications(role: Role): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('id, kind, title, body, link, cta, read_at, created_at')
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) throw toAppError(error)
  return (data as NotificationRow[]).map((n) => ({
    id: `N-${n.id}`,
    role, // semua baris milik akun ini (RLS)
    title: n.title,
    body: n.body,
    at: stampLabel(n.created_at),
    read: n.read_at !== null,
    to: n.link ?? '/aktivitas',
    kind: n.kind as Notification['kind'],
    cta: n.cta ?? undefined,
  }))
}

/** id kosong = tandai semua sudah dibaca. */
export async function markRead(id?: string): Promise<void> {
  const { error } = await supabase.rpc('notify_mark_read', id ? { p_id: Number(id.slice(2)) } : {})
  if (error) throw toAppError(error)
}

/** Panggil onChange setiap ada notifikasi baru untuk akun ini (Realtime; RLS tetap berlaku). */
export function subscribeNotifications(onChange: () => void): () => void {
  const client = supabase
  const channel = client
    .channel('notifications')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, onChange)
    .subscribe()
  return () => void client.removeChannel(channel)
}
