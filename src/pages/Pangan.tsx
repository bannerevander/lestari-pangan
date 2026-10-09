import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus } from '@phosphor-icons/react'
import { RootHeader } from '../components/Layouts'
import { AppBar, Button, ButtonLink, Chip, DemoNote, Field, inputCls, StatePanel, StatusBadge, StickyFooter } from '../components/ui'
import { useApp } from '../state/AppState'
import type { FoodCategory, RecordStatus, Unit } from '../data/types'
import { isoToLabel } from '../lib/format'

/* ---------- C01 / C01B Catat Pangan ---------- */

const filters: Array<RecordStatus | 'Semua'> = ['Semua', 'Masih tersedia', 'Ditawarkan', 'Didistribusikan', 'Digunakan', 'Terbuang']

export function PanganTab() {
  const { state } = useApp()
  const donor = state.role === 'pemberi'
  const [f, setF] = useState<(typeof filters)[number]>('Semua')
  const mine = state.records.filter((r) => r.owner === state.role)
  const list = mine.filter((r) => f === 'Semua' || r.status === f)
  const pendingDistribution = donor ? [] : state.transfers.filter((t) => t.received !== undefined && t.received > 0 && !t.distributionReported)

  return (
    <>
      <RootHeader title="Catat Pangan" subtitle={donor ? 'Persediaan dan surplus' : 'Pangan diterima dan penggunaannya'} />
      <div className="flex flex-col gap-4 px-4 pt-4">
        <ButtonLink to="/pangan/baru" block icon={<Plus size={22} weight="bold" />}>
          Catat Pangan
        </ButtonLink>
        {pendingDistribution.map((t) => (
          <Link key={t.id} to={`/aktivitas/${t.id}/distribusi`} className="tap card flex items-center gap-3 border-info/30 p-4 hover:bg-page">
            <span className="flex-1">
              <span className="block font-semibold">Laporan distribusi belum diisi</span>
              <span className="block text-meta text-ink-secondary">{t.received} {t.unit} {t.foodName.toLowerCase()} dari {t.donorName}</span>
            </span>
            <span className="text-[0.875rem] font-semibold text-primary">Isi</span>
          </Link>
        ))}
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {filters
            .filter((x) => (donor ? x !== 'Didistribusikan' : x !== 'Ditawarkan'))
            .map((x) => (
              <Chip key={x} selected={f === x} onClick={() => setF(x)}>
                {x}
              </Chip>
            ))}
        </div>
        {list.length === 0 ? (
          <StatePanel title={mine.length ? 'Tidak ada catatan dengan status ini' : 'Belum ada catatan pangan'} action={!mine.length ? <ButtonLink to="/pangan/baru">Catat Pangan</ButtonLink> : undefined}>
            {mine.length ? 'Pilih status lain.' : 'Catat bahan atau makanan yang masih tersedia.'}
          </StatePanel>
        ) : (
          <ul className="flex flex-col gap-3">
            {list.map((r) => (
              <li key={r.id} className="card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-card-title">{r.name}</p>
                    <p className="text-meta text-ink-secondary">{r.category} · {r.storage}</p>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
                <p className="mt-2 text-[1rem] font-semibold">
                  {r.quantity} {r.unit}
                  {r.estimate && <span className="ml-2 text-caption font-semibold text-warning">Perkiraan</span>}
                </p>
                <p className="text-meta text-ink-secondary">Dicatat {r.date}{r.source ? ` · ${r.source}` : ''}</p>
                {donor && r.status === 'Masih tersedia' && (
                  <ButtonLink to={`/donasi/baru?dari=${r.id}`} variant="tonal" block className="mt-3 min-h-12">
                    Tawarkan sebagai donasi
                  </ButtonLink>
                )}
              </li>
            ))}
          </ul>
        )}
        <p className="text-caption text-ink-secondary">Porsi, kilogram, dan unit tidak dijumlahkan tanpa dasar konversi. Hari tanpa catatan tidak dianggap hari tanpa food waste.</p>
        <DemoNote />
      </div>
    </>
  )
}

/* ---------- C02 Tambah catatan ---------- */

export function RecordForm() {
  const { state, dispatch } = useApp()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [cat, setCat] = useState<FoodCategory | ''>('')
  const [qty, setQty] = useState('')
  const [unit, setUnit] = useState<Unit>('porsi')
  const [estimate, setEstimate] = useState(false)
  const [date, setDate] = useState('2026-10-10')
  const [storage, setStorage] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const save = () => {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Isi nama pangan.'
    if (!cat) e.cat = 'Pilih kategori.'
    if (!(Number(qty.replace(',', '.')) > 0)) e.qty = 'Isi jumlah lebih dari 0.'
    setErrors(e)
    if (Object.keys(e).length) return
    dispatch({
      type: 'addRecord',
      record: { owner: state.role, name: name.trim(), category: cat as FoodCategory, quantity: Number(qty.replace(',', '.')), unit, estimate, date: isoToLabel(date), storage: storage || '—', status: 'Masih tersedia' },
    })
    navigate('/pangan', { replace: true })
  }

  return (
    <>
      <AppBar title="Tambah catatan" />
      <main className="mx-auto flex max-w-[560px] flex-col gap-5 px-4 pb-32 pt-4">
        <Field label="Nama pangan" error={errors.name}>
          {(p) => <input {...p} className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Wortel" />}
        </Field>
        <fieldset>
          <legend className="mb-1.5 text-label">Kategori</legend>
          <div className="flex flex-wrap gap-2">
            {(['Makanan matang', 'Bahan pangan', 'Produk kemasan'] as FoodCategory[]).map((c) => (
              <Chip key={c} selected={cat === c} onClick={() => setCat(c)}>{c}</Chip>
            ))}
          </div>
          {errors.cat && <p className="mt-1.5 text-meta font-medium text-danger">{errors.cat}</p>}
        </fieldset>
        <div className="grid grid-cols-[1fr_auto] gap-3">
          <Field label="Jumlah" error={errors.qty}>
            {(p) => <input {...p} inputMode="decimal" className={inputCls} value={qty} onChange={(e) => setQty(e.target.value)} />}
          </Field>
          <Field label="Satuan">
            {(p) => (
              <select {...p} className={inputCls} value={unit} onChange={(e) => setUnit(e.target.value as Unit)}>
                {['porsi', 'kg', 'kemasan', 'bungkus', 'unit'].map((u) => <option key={u}>{u}</option>)}
              </select>
            )}
          </Field>
        </div>
        <label className="-mt-2 flex min-h-12 items-center gap-3">
          <input type="checkbox" checked={estimate} onChange={(e) => setEstimate(e.target.checked)} className="h-5 w-5 accent-primary" />
          Jumlah ini perkiraan
        </label>
        <Field label="Tanggal">{(p) => <input {...p} type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} />}</Field>
        <Field label="Penyimpanan" optional>{(p) => <input {...p} className={inputCls} value={storage} onChange={(e) => setStorage(e.target.value)} placeholder="Contoh: Kulkas" />}</Field>
      </main>
      <StickyFooter>
        <Button block onClick={save}>Simpan catatan</Button>
      </StickyFooter>
    </>
  )
}
