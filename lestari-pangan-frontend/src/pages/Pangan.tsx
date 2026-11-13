import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowDown, ArrowRight, ArrowUp, CalendarBlank, PencilSimple, Plus, Truck } from '@phosphor-icons/react'
import { RootHeader } from '../components/Layouts'
import { AppBar, Badge, Button, ButtonLink, Chip, CountUp, Field, inputCls, PolicyNote, QtyStepper, RadioCard, StatePanel, StatusBadge, StickyFooter, ChipRow, toast } from '../components/ui'
import { NotAvailable } from '../components/NotAvailable'
import { useApp } from '../state/AppState'
import { useCommand } from '../state/useCommand'
import { messageOf } from '../lib/supabase/errors'
import type { FoodCategory, RecordStatus, Unit } from '../data/types'

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
      <div className="stagger flex flex-col gap-4 px-4 pt-4">
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
        <ChipRow className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {filters
            .filter((x) => (donor ? x !== 'Didistribusikan' : x !== 'Ditawarkan'))
            .map((x) => (
              <Chip key={x} selected={f === x} onClick={() => setF(x)}>
                {x}
              </Chip>
            ))}
        </ChipRow>
        {list.length === 0 ? (
          <StatePanel title={mine.length ? 'Tidak ada catatan dengan status ini' : 'Belum ada catatan pangan'} action={!mine.length ? <ButtonLink to="/pangan/baru">Catat Pangan</ButtonLink> : undefined}>
            {mine.length ? 'Pilih status lain.' : 'Catat bahan atau makanan yang masih tersedia.'}
          </StatePanel>
        ) : (
          <ul key={f} className="stagger flex flex-col gap-3">
            {list.map((r) => (
              <li key={r.id} className="card overflow-hidden">
                <Link to={`/pangan/${r.id}`} className="tap tap-soft block p-4 hover:bg-page" aria-label={`${r.name}, ${r.quantity} ${r.unit}, ${r.status}. Buka detail`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <StatusBadge status={r.status} />
                    <p className="mt-1.5 text-card-title">{r.name}</p>
                    <p className="text-meta text-ink-secondary">{r.category} · {r.storage}</p>
                  </div>
                  <p className="flex shrink-0 flex-col items-end text-right">
                    <span className={`text-[1.5rem] font-bold leading-8 tabular-nums ${r.quantity === 0 ? 'text-ink-secondary' : 'text-ink'}`}>{r.quantity}</span>
                    <span className="text-caption text-ink-secondary">{r.unit}{r.quantity === 0 ? ' tersisa' : ''}</span>
                    {r.estimate && <span className="text-caption font-semibold text-warning">Perkiraan</span>}
                  </p>
                </div>
                <div className="mt-3 flex flex-col gap-1 border-t border-line pt-3 text-meta text-ink-secondary">
                  <p className="flex items-start gap-1.5">
                    <CalendarBlank size={18} aria-hidden="true" className="mt-px shrink-0" />
                    Dicatat {r.date}
                  </p>
                  {r.source && (
                    <p className="flex items-start gap-1.5">
                      <Truck size={18} aria-hidden="true" className="mt-px shrink-0" />
                      <span className="min-w-0">{r.source}</span>
                    </p>
                  )}
                </div>
                </Link>
                {donor && r.status === 'Masih tersedia' && (
                  <div className="px-4 pb-4">
                    <ButtonLink to={`/donasi/baru?dari=${r.id}`} variant="tonal" block className="min-h-12">
                      Tawarkan sebagai donasi
                    </ButtonLink>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        <p className="text-caption text-ink-secondary">Porsi, kilogram, dan unit tidak dijumlahkan tanpa dasar konversi. Hari tanpa catatan tidak dianggap hari tanpa food waste.</p>
      </div>
    </>
  )
}

/* ---------- C02 Tambah catatan ---------- */

export function RecordForm() {
  const run = useCommand()
  const [clientId] = useState(() => crypto.randomUUID())
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [cat, setCat] = useState<FoodCategory | ''>('')
  const [qty, setQty] = useState('')
  const [unit, setUnit] = useState<Unit>('porsi')
  const [estimate, setEstimate] = useState(false)
  const [storage, setStorage] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const save = () => {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Isi nama pangan.'
    if (!cat) e.cat = 'Pilih kategori.'
    if (!(Number(qty.replace(',', '.')) > 0)) e.qty = 'Isi jumlah lebih dari 0.'
    setErrors(e)
    if (Object.keys(e).length) return
    setBusy(true)
    run({
      type: 'addRecord',
      clientId,
      record: { name: name.trim(), category: cat as FoodCategory, quantity: Number(qty.replace(',', '.')), unit, estimate, storage: storage || '—' },
    })
      .then(() => navigate('/pangan', { replace: true }))
      .catch((err) => {
        toast(messageOf(err), 'info')
        setBusy(false)
      })
  }

  const cats: [FoodCategory, string][] = [
    ['Makanan matang', 'Porsi, kotak'],
    ['Bahan pangan', 'Beras, sayur'],
    ['Produk kemasan', 'Roti, botol'],
  ]
  return (
    <>
      <AppBar title="Tambah catatan pangan" />
      <main className="mx-auto flex max-w-[560px] flex-col gap-4 px-4 pb-32 pt-4">
        <section className="card flex flex-col gap-4 p-4">
          <Field label="Nama pangan atau bahan" error={errors.name} hint="Tulis nama yang spesifik, misalnya “Beras sisa stok”.">
            {(p) => <input {...p} className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Wortel" />}
          </Field>
          <fieldset>
            <legend className="mb-1.5 text-label">Kategori</legend>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(6.5rem,1fr))] gap-2">
              {cats.map(([c, hint]) => (
                <button
                  key={c}
                  type="button"
                  aria-pressed={cat === c}
                  onClick={() => setCat(c)}
                  className={`tap flex min-h-[4.5rem] flex-col items-center justify-center rounded-control border px-2 py-2 text-center ${
                    cat === c ? 'border-primary bg-primary-container text-primary' : 'border-line bg-surface hover:border-line-control'
                  }`}
                >
                  <span className="font-semibold leading-5">{c}</span>
                  <span className="text-caption text-ink-secondary">{hint}</span>
                </button>
              ))}
            </div>
            {errors.cat && <p className="mt-1.5 text-meta font-medium text-danger">{errors.cat}</p>}
          </fieldset>
        </section>

        <section className="card flex flex-col gap-3 p-4">
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <Field label="Jumlah" error={errors.qty}>
              {(p) => <input {...p} inputMode="decimal" className={inputCls} value={qty} onChange={(e) => setQty(e.target.value)} placeholder="0" />}
            </Field>
            <Field label="Satuan">
              {(p) => (
                <select {...p} className={inputCls} value={unit} onChange={(e) => setUnit(e.target.value as Unit)}>
                  {['porsi', 'kg', 'kemasan', 'bungkus', 'unit'].map((u) => <option key={u}>{u}</option>)}
                </select>
              )}
            </Field>
          </div>
          <label className="flex min-h-12 items-start gap-3">
            <input type="checkbox" checked={estimate} onChange={(e) => setEstimate(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-primary" />
            <span>
              Jumlah ini perkiraan
              <span className="block text-meta text-ink-secondary">Misalnya hasil timbangan sendiri, bukan pengukuran resmi.</span>
            </span>
          </label>
        </section>

        <section className="card flex flex-col gap-4 p-4">
          <Field label="Tempat penyimpanan" optional hint="Membantu saat koordinasi atau saat pangan ditawarkan.">
            {(p) => (
              <select {...p} className={inputCls} value={storage} onChange={(e) => setStorage(e.target.value)}>
                <option value="">Pilih tempat penyimpanan</option>
                {['Suhu ruang / tempat kering', 'Kulkas', 'Freezer', 'Wadah tertutup', 'Rak kering'].map((o) => <option key={o}>{o}</option>)}
              </select>
            )}
          </Field>
        </section>
      </main>
      <StickyFooter>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => navigate(-1)}>Batal</Button>
          <Button block loading={busy} onClick={save}>Simpan catatan</Button>
        </div>
      </StickyFooter>
    </>
  )
}

/* ---------- C03 Detail catatan ---------- */

export function RecordDetail() {
  const { id } = useParams()
  const { state } = useApp()
  const r = state.records.find((x) => x.id === id && x.owner === state.role)
  if (!r) return <NotAvailable />
  const donor = state.role === 'pemberi'
  const initial = r.quantity - (r.history ?? []).reduce((sum, h) => sum + h.delta, 0)
  const rows = [{ label: r.source ? 'Diterima' : 'Dicatat', delta: initial, at: r.date, note: r.source, kind: 'masuk' as const }, ...(r.history ?? [])]
  const canMove = r.quantity > 0
  return (
    <>
      <AppBar title="Detail catatan" actions={<ButtonLink to={`/pangan/${r.id}/koreksi`} variant="ghost" className="min-h-12 text-[0.875rem]">Koreksi</ButtonLink>} />
      <main className="stagger mx-auto flex max-w-[560px] flex-col gap-4 px-4 pb-40 pt-4">
        <section className="card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <StatusBadge status={r.status} />
            <span className="text-caption text-ink-secondary">{r.id}</span>
          </div>
          <h1 className="mt-2 text-page-title">{r.name}</h1>
          <p className="text-meta text-ink-secondary">{r.category}{r.source ? ` · ${r.source}` : ''}</p>
          <div className="mt-4 flex items-end justify-between gap-3 rounded-control bg-primary-container p-4">
            <div>
              <p className="text-caption font-semibold text-primary">Sisa saat ini</p>
              <p className="text-display text-primary-pressed"><CountUp value={r.quantity} /> <span className="text-card-title font-semibold">{r.unit}</span></p>
              {r.estimate && <p className="text-caption font-semibold text-warning">Jumlah perkiraan</p>}
            </div>
            <p className="text-right text-meta text-ink-secondary">Disimpan di<br /><span className="font-semibold text-ink">{r.storage}</span></p>
          </div>
        </section>
        <section className="card p-4" aria-labelledby="riw-h">
          <h2 id="riw-h" className="mb-3 text-card-title">Riwayat pergerakan</h2>
          <ol className="flex flex-col divide-y divide-line">
            {rows.map((h, i) => (
              <li key={i} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                <span
                  aria-hidden="true"
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${h.kind === 'masuk' ? 'bg-primary-container text-primary' : h.kind === 'koreksi' ? 'bg-info-container text-info' : 'bg-accent-soft text-accent-ink'}`}
                >
                  {h.kind === 'masuk' ? <ArrowDown size={16} weight="bold" /> : h.kind === 'koreksi' ? <PencilSimple size={16} weight="bold" /> : <ArrowUp size={16} weight="bold" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold leading-6">{h.label}</p>
                  <p className="text-meta text-ink-secondary">{h.at}{h.note ? ` · ${h.note}` : ''}</p>
                </div>
                <span className={`shrink-0 font-bold tabular ${h.delta >= 0 ? 'text-primary' : 'text-ink'}`}>
                  {h.delta >= 0 ? '+' : '−'}{Math.abs(h.delta)} {r.unit}
                </span>
              </li>
            ))}
          </ol>
          <div className="mt-3 flex justify-between border-t border-line pt-3 font-semibold">
            <span>Saldo</span>
            <span className="tabular">{r.quantity} {r.unit}</span>
          </div>
        </section>
        <p className="text-caption text-ink-secondary">Riwayat tidak dihapus. Koreksi dicatat sebagai baris baru beserta alasannya.</p>
      </main>
      <StickyFooter>
        {donor && r.status === 'Masih tersedia' && canMove && (
          <ButtonLink to={`/donasi/baru?dari=${r.id}`} variant="tonal" block>Tawarkan sebagai donasi</ButtonLink>
        )}
        {canMove ? (
          <ButtonLink to={`/pangan/${r.id}/gerak`} block>Catat pergerakan ({r.quantity} {r.unit})</ButtonLink>
        ) : (
          <p className="py-2 text-center text-meta text-ink-secondary">Saldo habis. Gunakan Koreksi bila jumlah fisik berbeda.</p>
        )}
      </StickyFooter>
    </>
  )
}

/* ---------- C04 Catat pergerakan ---------- */

const MOVES = [
  ['Digunakan', 'Dimasak atau dikonsumsi untuk kebutuhan sendiri.'],
  ['Didistribusikan', 'Diteruskan langsung ke warga yang membutuhkan.'],
  ['Terbuang', 'Kualitas menurun melewati batas simpan. Dicatat apa adanya.'],
] as const

export function RecordMove() {
  const { id } = useParams()
  const { state } = useApp()
  const run = useCommand()
  const [clientId] = useState(() => crypto.randomUUID())
  const navigate = useNavigate()
  const r = state.records.find((x) => x.id === id && x.owner === state.role)
  const [kind, setKind] = useState<(typeof MOVES)[number][0] | ''>('')
  const [qty, setQty] = useState(1)
  const [note, setNote] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  if (!r || r.quantity <= 0) return <NotAvailable />
  const options = state.role === 'pemberi' ? MOVES.filter(([k]) => k !== 'Didistribusikan') : MOVES
  const submit = () => {
    if (!kind) return setErr('Pilih jenis pergerakan.')
    setBusy(true)
    run({ type: 'moveRecord', id: r.id, kind, quantity: qty, note: note.trim() || undefined, clientId })
      .then(() => {
        toast(`${qty} ${r.unit} dicatat sebagai ${kind.toLowerCase()}.`)
        navigate(-1)
      })
      .catch((err) => {
        setErr(messageOf(err))
        setBusy(false)
      })
  }
  return (
    <>
      <AppBar title="Catat pergerakan" />
      <main className="stagger mx-auto flex max-w-[560px] flex-col gap-4 px-4 pb-40 pt-4">
        <section className="card flex items-center justify-between gap-3 p-4">
          <div className="min-w-0">
            <p className="text-caption text-ink-secondary">{r.id}</p>
            <p className="font-semibold">{r.name}</p>
          </div>
          <Badge tone="success" icon={false}>Sisa {r.quantity} {r.unit}</Badge>
        </section>
        <fieldset className="card flex flex-col gap-2 p-4">
          <legend className="float-left mb-3 text-card-title">Ke mana pangan ini?</legend>
          {options.map(([k, d]) => (
            <RadioCard key={k} name="move" checked={kind === k} onChange={() => (setKind(k), setErr(''))} title={k} description={d} />
          ))}
          {err && <p role="alert" className="text-meta font-medium text-danger">{err}</p>}
        </fieldset>
        <section className="card flex flex-col gap-4 p-4">
          <Field label={`Jumlah (${r.unit})`} hint={`Maksimal ${r.quantity} ${r.unit}.`}>
            {(p) => <QtyStepper id={p.id} describedBy={p['aria-describedby']} value={qty} onChange={setQty} min={1} max={r.quantity} unit={r.unit} />}
          </Field>
          <dl className="grid grid-cols-3 gap-2 rounded-control bg-page p-3 text-center text-meta" aria-live="polite">
            <div><dt className="text-caption text-ink-secondary">Sebelum</dt><dd className="font-bold">{r.quantity}</dd></div>
            <div><dt className="text-caption text-ink-secondary">Keluar</dt><dd className="font-bold text-accent-ink">−{qty}</dd></div>
            <div><dt className="text-caption text-ink-secondary">Sisa</dt><dd className="font-bold text-primary">{r.quantity - qty}</dd></div>
          </dl>
          <Field label="Catatan" optional>
            {(p) => <input {...p} className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Contoh: dibagikan ke warga RT 03" />}
          </Field>
        </section>
      </main>
      <StickyFooter>
        <Button block loading={busy} loadingLabel="Menyimpan…" onClick={submit}>Simpan pergerakan</Button>
      </StickyFooter>
    </>
  )
}

/* ---------- C05 Koreksi catatan ---------- */

const CORRECTION_REASONS = ['Selisih hitung fisik saat pemeriksaan', 'Salah input jumlah sebelumnya', 'Kondisi pangan menurun', 'Alasan lain']

export function RecordCorrection() {
  const { id } = useParams()
  const { state } = useApp()
  const run = useCommand()
  const [clientId] = useState(() => crypto.randomUUID())
  const navigate = useNavigate()
  const r = state.records.find((x) => x.id === id && x.owner === state.role)
  const [qty, setQty] = useState(r?.quantity ?? 0)
  const [reason, setReason] = useState('')
  const [other, setOther] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  if (!r) return <NotAvailable />
  const corrections = (r.history ?? []).filter((h) => h.kind === 'koreksi')
  const submit = () => {
    if (qty === r.quantity) return setErr('Nilai baru sama dengan nilai tercatat.')
    if (!reason) return setErr('Pilih alasan koreksi.')
    if (reason === 'Alasan lain' && other.trim().length < 5) return setErr('Jelaskan alasan lain.')
    setBusy(true)
    run({ type: 'correctRecord', id: r.id, quantity: qty, reason: reason === 'Alasan lain' ? other.trim() : reason, clientId })
      .then(() => {
        toast('Koreksi tersimpan di riwayat.')
        navigate(-1)
      })
      .catch((err) => {
        setErr(messageOf(err))
        setBusy(false)
      })
  }
  return (
    <>
      <AppBar title="Koreksi catatan" dirty={(qty !== r.quantity || !!reason) && !busy} />
      <main className="stagger mx-auto flex max-w-[560px] flex-col gap-4 px-4 pb-40 pt-4">
        <PolicyNote title="Tercatat di riwayat">Nilai lama tidak dihapus. Koreksi ditambahkan sebagai baris baru beserta alasannya.</PolicyNote>
        <section className="card p-4">
          <h1 className="text-card-title">{r.name}</h1>
          <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <div className="rounded-control bg-page p-3 text-center">
              <p className="text-caption text-ink-secondary">Tercatat</p>
              <p className="text-[1.5rem] font-bold">{r.quantity}</p>
              <p className="text-caption text-ink-secondary">{r.unit}</p>
            </div>
            <ArrowRight size={20} aria-label="menjadi" className="text-ink-secondary" />
            <div className={`rounded-control p-3 text-center transition-colors duration-micro ${qty !== r.quantity ? 'bg-info-container' : 'bg-page'}`}>
              <p className="text-caption text-ink-secondary">Koreksi</p>
              <p className="text-[1.5rem] font-bold text-info">{qty}</p>
              <p className="text-caption text-ink-secondary">{r.unit}</p>
            </div>
          </div>
          <div className="mt-4">
            <Field label={`Jumlah fisik sebenarnya (${r.unit})`}>
              {(p) => <QtyStepper id={p.id} describedBy={p['aria-describedby']} value={qty} onChange={(n) => (setQty(n), setErr(''))} min={0} unit={r.unit} />}
            </Field>
          </div>
        </section>
        <fieldset className="card flex flex-col gap-2 p-4">
          <legend className="float-left mb-3 text-card-title">Alasan koreksi</legend>
          {CORRECTION_REASONS.map((x) => (
            <RadioCard key={x} name="reason" checked={reason === x} onChange={() => (setReason(x), setErr(''))} title={x} />
          ))}
          {reason === 'Alasan lain' && (
            <div className="animate-rise-in">
              <Field label="Jelaskan">{(p) => <input {...p} className={inputCls} value={other} onChange={(e) => setOther(e.target.value)} />}</Field>
            </div>
          )}
          {err && <p role="alert" className="text-meta font-medium text-danger">{err}</p>}
        </fieldset>
        <section className="card p-4">
          <h2 className="text-card-title">Koreksi sebelumnya</h2>
          {corrections.length ? (
            <ul className="mt-2 flex flex-col gap-2">
              {corrections.map((c, i) => <li key={i} className="text-meta"><span className="font-semibold">{c.note}</span> · {c.label.replace('Koreksi: ', '')} · <span className="text-ink-secondary">{c.at}</span></li>)}
            </ul>
          ) : (
            <p className="mt-1 text-meta text-ink-secondary">Belum pernah dikoreksi.</p>
          )}
        </section>
      </main>
      <StickyFooter>
        <Button block loading={busy} loadingLabel="Menyimpan…" onClick={submit}>Simpan koreksi</Button>
      </StickyFooter>
    </>
  )
}
