import { MapPin } from '@phosphor-icons/react'
import { AppBar, Badge, ButtonLink, StatePanel } from './ui'

export function NotAvailable() {
  return (
    <>
      <AppBar title="Tidak tersedia" />
      <main className="p-4">
        <StatePanel
          icon={<MapPin size={40} className="text-ink-secondary" />}
          title="Kegiatan tidak tersedia"
          action={<ButtonLink to="/" variant="secondary">Kembali ke Beranda</ButtonLink>}
        >
          Data mungkin sudah ditutup atau Anda tidak memiliki akses.
        </StatePanel>
      </main>
    </>
  )
}

export { Badge }
