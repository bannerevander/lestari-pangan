import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Funnel } from '@phosphor-icons/react'
import { RootHeader } from '../../components/Layouts'
import { BottomSheet, Button, Chip, Notice, StatePanel, ChipRow } from '../../components/ui'
import { FoodCardSearch } from '../../components/FoodCard'
import { useApp } from '../../state/AppState'
import { useProfile } from '../../state/useProfile'
import type { FoodCategory, Offer } from '../../data/types'
import { SearchInput } from './SearchInput'

const categories: FoodCategory[] = ['Makanan matang', 'Bahan pangan', 'Produk kemasan']

export function SearchFood() {
  const { state } = useApp()
  const profile = useProfile()
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const cat = (params.get('kategori') as FoodCategory | null) ?? null
  const method = params.get('cara')
  const [sheet, setSheet] = useState(false)
  const [draftMethod, setDraftMethod] = useState<string | null>(method)

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params)
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)))
    setParams(next, { replace: true })
  }

  const results = useMemo(
    () =>
      state.offers.filter(
        (o) =>
          o.status === 'Tersedia' &&
          o.available > 0 &&
          (!q || `${o.name} ${o.category}`.toLowerCase().includes(q.toLowerCase())) &&
          (!cat || o.category === cat) &&
          (!method || o.methods.includes(method as Offer['methods'][number])),
      ),
    [state.offers, q, cat, method],
  )
  const activeFilters = method ? 1 : 0

  return (
    <>
      <RootHeader title="Cari pangan" subtitle={profile.area} />
      <div className="stagger flex flex-col gap-4 px-4 pt-4">
        <SearchInput value={q} onChange={(v) => update({ q: v || null })} placeholder="Cari nama atau jenis pangan" />
        <ChipRow className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          <button
            type="button"
            onClick={() => {
              setDraftMethod(method)
              setSheet(true)
            }}
            className="tap inline-flex min-h-12 shrink-0 items-center gap-1.5 rounded-full border border-line bg-surface px-4 text-[0.875rem] font-semibold hover:border-line-control"
          >
            <Funnel size={18} aria-hidden="true" /> Filter
            {activeFilters > 0 && <span className="rounded-full bg-primary-container px-2 text-primary">{activeFilters}</span>}
          </button>
          <Chip selected={!cat} onClick={() => update({ kategori: null })}>Semua</Chip>
          {categories.map((c) => (
            <Chip key={c} selected={cat === c} onClick={() => update({ kategori: cat === c ? null : c })}>
              {c}
            </Chip>
          ))}
        </ChipRow>
        <Notice tone="info">
          <strong>Donasi pangan gratis.</strong> Biaya pengiriman, jika memakai mitra, ditampilkan terpisah sebelum disetujui.
        </Notice>
        <p className="text-meta text-ink-secondary" aria-live="polite">
          {results.length} penawaran tersedia · diurutkan menurut waktu pengambilan
        </p>
        <h2 className="sr-only">Hasil pencarian</h2>
        {results.length === 0 ? (
          <StatePanel
            title="Belum ada penawaran sesuai filter ini"
            action={
              <Button variant="secondary" onClick={() => setParams({}, { replace: true })}>
                Ubah filter
              </Button>
            }
          />
        ) : (
          results.map((o) => <FoodCardSearch key={o.id} offer={o} />)
        )}
      </div>

      <BottomSheet
        open={sheet}
        onClose={() => setSheet(false)}
        title="Filter dan urutkan"
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setDraftMethod(null)}>
              Reset
            </Button>
            <Button
              className="flex-[2]"
              onClick={() => {
                update({ cara: draftMethod })
                setSheet(false)
              }}
            >
              Terapkan
            </Button>
          </div>
        }
      >
        <fieldset>
          <legend className="mb-2 text-label">Cara penyaluran</legend>
          <div className="flex flex-wrap gap-2">
            {['Ambil sendiri', 'Antar pemberi', 'Mitra pengiriman'].map((m) => (
              <Chip key={m} selected={draftMethod === m} onClick={() => setDraftMethod(draftMethod === m ? null : m)}>
                {m}
              </Chip>
            ))}
          </div>
        </fieldset>
        <div className="mt-6">
          <p className="mb-2 text-label">Urutan</p>
          <p className="rounded-control bg-page p-3 text-meta text-ink-secondary">
            Waktu pengambilan terdekat. Urutan tidak dipengaruhi sponsor, poin, atau pembayaran.
          </p>
        </div>
      </BottomSheet>
    </>
  )
}
