import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, WarningCircle } from '@phosphor-icons/react'
import { RootHeader } from '../../components/Layouts'
import { ButtonLink, Segmented, StatePanel } from '../../components/ui'
import { FoodCardCompact } from '../../components/FoodCard'
import { useApp } from '../../state/AppState'
import { useProfile } from '../../state/useProfile'
import { SearchInput } from './SearchInput'

export function MyOffers() {
  const { state } = useApp()
  const profile = useProfile()
  const [tab, setTab] = useState<'aktif' | 'draf' | 'selesai'>('aktif')
  const [q, setQ] = useState('')
  const mine = state.offers.filter((o) => o.donorName === profile.name)
  const groups = {
    aktif: mine.filter((o) => o.status === 'Tersedia'),
    draf: mine.filter((o) => o.status === 'Draf'),
    selesai: mine.filter((o) => o.status === 'Ditutup'),
  }
  const list = groups[tab].filter((o) => o.name.toLowerCase().includes(q.toLowerCase()))

  return (
    <>
      <RootHeader title="Penawaran saya" subtitle={`${profile.name} · ${profile.area}`} />
      <div className="stagger flex flex-col gap-4 px-4 pt-4">
        <Segmented
          label="Status penawaran"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'aktif', label: 'Aktif', count: groups.aktif.length },
            { value: 'draf', label: 'Draf', count: groups.draf.length },
            { value: 'selesai', label: 'Selesai', count: groups.selesai.length },
          ]}
        />
        <SearchInput value={q} onChange={setQ} placeholder="Cari penawaran saya" />
        <ButtonLink to="/donasi/baru" block icon={<Plus size={22} weight="bold" />}>
          Tawarkan Pangan
        </ButtonLink>
        <h2 className="sr-only">Daftar penawaran</h2>
        {list.length === 0 ? (
          <StatePanel title={q ? 'Tidak ada penawaran yang cocok' : 'Belum ada penawaran di sini'}>
            {q ? 'Coba kata kunci lain.' : 'Penawaran yang Anda buat akan muncul di bagian ini.'}
          </StatePanel>
        ) : (
          list.map((o) => {
            const pending = state.requests.filter((r) => r.offerId === o.id && r.status === 'Diajukan').length
            return (
              <FoodCardCompact
                key={o.id}
                offer={o}
                to={`/donasi/kelola/${o.id}`}
                extra={
                  pending > 0 ? (
                    <Link to="/aktivitas/permintaan" className="tap mx-3 mb-3 flex min-h-12 items-center gap-2 rounded-control bg-warning-container px-3 text-[0.875rem] font-semibold text-warning">
                      <WarningCircle size={18} weight="fill" aria-hidden="true" />
                      <span className="flex-1">{pending} permintaan masuk</span>
                      <span>Tinjau</span>
                    </Link>
                  ) : null
                }
              />
            )
          })
        )}
        <p className="py-6 text-center text-caption text-ink-secondary">Verifikasi identitas bukan jaminan mutu pangan.</p>
      </div>
    </>
  )
}
