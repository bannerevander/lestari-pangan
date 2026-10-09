import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CaretRight, CheckCircle, LockSimple, PaperPlaneTilt, Users, WarningCircle } from '@phosphor-icons/react'
import { AppBar, Badge, BottomSheet, Button, ButtonLink, DemoNote, Field, inputCls, KeyValue, Notice, PolicyNote, RadioCard, StageList, StatePanel, StatusBadge, StickyFooter } from '../components/ui'
import { FoodPhoto } from '../components/FoodPhoto'
import { pickupLabel } from '../components/FoodCard'
import { useApp } from '../state/AppState'
import { RECIPIENT } from '../data/mock'
import { NotAvailable } from './Donasi'
import type { FoodRequest, Transfer } from '../data/types'

/* ---------- Q01 Ajukan permintaan ---------- */

export function RequestForm() {
  const { id } = useParams()
  const { state, dispatch } = useApp()
  const navigate = useNavigate()
  const offer = state.offers.find((o) => o.id === id)
  const [qty, setQty] = useState('')
  const [time, setTime] = useState('16:30')
  const [method, setMethod] = useState<FoodRequest['method']>('Ambil sendiri')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [reviewing, setReviewing] = useState(false)
  const [sending, setSending] = useState(false)
  const [commit, setCommit] = useState(false)
  const [commitError, setCommitError] = useState(false)
  if (!offer) return <NotAvailable />

  const n = Number(qty)
  const check = () => {
    if (!qty || !Number.isInteger(n) || n <= 0) return setError(`Isi jumlah ${offer.unit} dalam bilangan bulat.`)
    if (n > offer.available) return setError(`Jumlah tersedia saat ini ${offer.available} ${offer.unit}. Ubah jumlah permintaan.`)
    if (time < offer.pickupStart.replace('.', ':') || time > offer.pickupEnd.replace('.', ':'))
      return setError(`Pilih jam di rentang ${offer.pickupStart}–${offer.pickupEnd} WIB.`)
    setError('')
    setReviewing(true)
    window.scrollTo(0, 0)
  }

  const send = () => {
    setSending(true)
    window.setTimeout(() => {
      dispatch({
        type: 'submitRequest',
        request: {
          offerId: offer.id,
          recipientName: RECIPIENT.name,
          recipientType: RECIPIENT.type,
          capacity: RECIPIENT.capacity,
          quantity: n,
          unit: offer.unit,
          method,
          pickupTime: `${offer.pickupDate}, ${time.replace(':', '.')} WIB`,
          note: note || undefined,
        },
      })
      navigate('/aktivitas', { replace: true })
    }, 700)
  }

  const progress = (
    <div className="px-4 pb-3">
      <div className="flex justify-between text-caption font-semibold">
        <span className="text-primary">1. Rincian kebutuhan</span>
        <span className={reviewing ? 'text-primary' : 'text-ink-secondary'}>2. Tinjauan dan komitmen</span>
      </div>
      <div className="mt-1.5 flex gap-1.5" aria-hidden="true">
        <span className="h-1.5 flex-1 rounded-full bg-primary" />
        <span className={`h-1.5 flex-1 rounded-full ${reviewing ? 'bg-primary' : 'bg-line'}`} />
      </div>
    </div>
  )

  if (reviewing) {
    return (
      <>
        <header className="sticky top-0 z-30 border-b border-line bg-surface">
          <div className="flex min-h-14 items-center gap-1 px-1">
            <button type="button" aria-label="Kembali ke rincian" onClick={() => setReviewing(false)} className="tap flex h-12 w-12 items-center justify-center rounded-full hover:bg-page">
              <ArrowLeft size={24} aria-hidden="true" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-caption text-ink-secondary">Langkah 2 dari 2</p>
              <h1 className="text-[1.125rem] font-semibold leading-6">Tinjau permintaan</h1>
            </div>
          </div>
          {progress}
        </header>
        <main className="mx-auto flex max-w-[560px] flex-col gap-4 px-4 pb-40 pt-4">
          <Notice tone="success" title="Perlu persetujuan pemberi">
            Porsi direservasi setelah {offer.donorName} menyetujui. Pastikan Anda siap mengambil sesuai jadwal.
          </Notice>
          <section className="card p-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-card-title">Rincian permintaan</h2>
              <button type="button" onClick={() => setReviewing(false)} className="tap min-h-12 rounded-control px-3 text-[0.875rem] font-semibold text-primary hover:bg-primary-container">Ubah</button>
            </div>
            <dl className="divide-y divide-line">
              <Row k="Pangan" v={offer.name} />
              <Row k="Pemberi" v={`${offer.donorName} (${offer.donorType})`} />
              <Row k="Jumlah diminta" v={<span className="rounded-full bg-primary-container px-2.5 py-0.5 font-bold text-primary">{n} {offer.unit}</span>} />
              <Row k="Tersedia saat ini" v={`${offer.available} ${offer.unit} (sisa ${offer.available - n} jika disetujui)`} />
            </dl>
          </section>
          <section className="card p-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-card-title">Jadwal dan pengambilan</h2>
              <button type="button" onClick={() => setReviewing(false)} className="tap min-h-12 rounded-control px-3 text-[0.875rem] font-semibold text-primary hover:bg-primary-container">Ubah</button>
            </div>
            <dl className="divide-y divide-line">
              <Row k="Waktu pengambilan" v={`${offer.pickupDate}, ${time.replace(':', '.')} WIB`} />
              <Row k="Rentang pemberi" v={`${offer.pickupStart}–${offer.pickupEnd} WIB`} />
              <Row k="Cara" v={method} />
              <Row k="Biaya pengiriman" v={method === 'Ambil sendiri' ? 'Tanpa biaya dari platform' : 'Belum tersedia'} />
              <Row k="Lokasi" v={<>{offer.area}<span className="block text-caption text-ink-secondary">Alamat lengkap dibuka setelah disetujui</span></>} />
              {note && <Row k="Catatan" v={note} />}
            </dl>
          </section>
          <label className={`flex items-start gap-3 rounded-card border p-4 ${commitError ? 'border-danger bg-danger-container' : 'border-line bg-surface'}`}>
            <input type="checkbox" checked={commit} onChange={(e) => { setCommit(e.target.checked); setCommitError(false) }} className="mt-0.5 h-5 w-5 shrink-0 accent-primary" />
            <span className="text-meta">
              <span className="block font-semibold text-ink">Komitmen penerima</span>
              Kami akan datang tepat waktu, mengambil sesuai kebutuhan, dan memberi kabar jika batal.
            </span>
          </label>
          {commitError && <p className="-mt-2 text-meta font-medium text-danger">Centang komitmen sebelum mengirim.</p>}
        </main>
        <StickyFooter>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setReviewing(false)}>Kembali</Button>
            <Button block loading={sending} icon={<PaperPlaneTilt size={20} />} onClick={() => (commit ? send() : setCommitError(true))}>
              Kirim permintaan
            </Button>
          </div>
        </StickyFooter>
      </>
    )
  }

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line bg-surface">
        <div className="flex min-h-14 items-center gap-1 px-1">
          <button type="button" aria-label="Kembali" onClick={() => navigate(-1)} className="tap flex h-12 w-12 items-center justify-center rounded-full hover:bg-page">
            <ArrowLeft size={24} aria-hidden="true" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-caption text-ink-secondary">Langkah 1 dari 2</p>
            <h1 className="text-[1.125rem] font-semibold leading-6">Ajukan permintaan</h1>
          </div>
        </div>
        {progress}
      </header>
      <main className="mx-auto flex max-w-[560px] flex-col gap-5 px-4 pb-36 pt-4">
        <div className="card flex gap-3 p-3">
          <FoodPhoto src={offer.photo} alt="" className="h-16 w-16 shrink-0 rounded-control" />
          <div className="min-w-0">
            <p className="font-semibold">{offer.name}</p>
            <p className="text-meta font-semibold text-primary">{offer.available} {offer.unit} tersedia</p>
            <p className="text-meta text-ink-secondary">{pickupLabel(offer)}</p>
          </div>
        </div>

        <section className="rounded-card bg-primary-container p-4">
          <h2 className="flex items-center gap-2 text-label"><Users size={18} aria-hidden="true" /> Kebutuhan dan kapasitas Anda</h2>
          <p className="mt-1 text-body">{RECIPIENT.capacity} · {RECIPIENT.storage}</p>
          <p className="mt-1 text-meta text-ink-secondary">Periksa kapasitas penerimaan Anda sebelum menentukan jumlah. Ambil sesuai kebutuhan.</p>
          <Link to="/akun/kebutuhan" className="tap mt-2 inline-flex min-h-12 items-center gap-1 text-[0.875rem] font-semibold text-primary">
            Perbarui kebutuhan <CaretRight size={16} weight="bold" aria-hidden="true" />
          </Link>
        </section>

        <Field label={`Jumlah yang diminta (${offer.unit})`} error={error}>
          {(p) => <input {...p} inputMode="numeric" className={inputCls} value={qty} onChange={(e) => setQty(e.target.value.replace(/\D/g, ''))} placeholder={`Maksimal ${offer.available}`} />}
        </Field>
        <Field label="Jam pengambilan (WIB)" hint={`Rentang pemberi: ${offer.pickupStart}–${offer.pickupEnd} WIB`}>
          {(p) => <input {...p} type="time" className={inputCls} value={time} onChange={(e) => setTime(e.target.value)} />}
        </Field>
        <fieldset>
          <legend className="mb-1.5 text-label">Cara penyaluran</legend>
          <div className="flex flex-col gap-2">
            {offer.methods.map((m) => (
              <RadioCard
                key={m}
                name="method"
                checked={method === m}
                onChange={() => setMethod(m)}
                title={m}
                description={m === 'Ambil sendiri' ? 'Tanpa biaya pengiriman dari platform' : m === 'Mitra pengiriman' ? 'Biaya belum tersedia' : 'Sesuai kesepakatan dengan pemberi'}
              />
            ))}
          </div>
        </fieldset>
        <Field label="Catatan untuk pemberi" optional>
          {(p) => <textarea {...p} rows={3} className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Contoh: Kami membawa boks pendingin." />}
        </Field>
      </main>
      <StickyFooter>
        <Button block onClick={check}>Lanjut ke tinjauan</Button>
      </StickyFooter>
    </>
  )
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 py-2.5">
      <dt className="text-meta text-ink-secondary">{k}</dt>
      <dd className="text-right text-body font-medium">{v}</dd>
    </div>
  )
}

/* ---------- Q02 Detail permintaan ---------- */

function requestStage(req: FoodRequest, transfer?: Transfer) {
  if (req.status !== 'Disetujui') return 1
  if (!transfer || transfer.status === 'Terjadwal') return 3
  return 4
}

export function RequestDetail() {
  const { id } = useParams()
  const { state } = useApp()
  const req = state.requests.find((r) => r.id === id)
  if (!req) return <NotAvailable />
  const offer = state.offers.find((o) => o.id === req.offerId)
  const transfer = state.transfers.find((t) => t.requestId === req.id)
  const closed = req.status === 'Ditolak' || req.status === 'Dibatalkan'
  const donorName = offer?.donorName ?? 'Pemberi'

  return (
    <>
      <AppBar title="Detail permintaan" />
      <main className="flex flex-col gap-4 px-4 pb-32 pt-4">
        <section className="card flex flex-col gap-3 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <StatusBadge status={req.status} />
            <span className="text-caption text-ink-secondary">{req.id} · {req.createdAt}</span>
          </div>
          <h1 className="text-page-title">{req.quantity} {req.unit} {offer?.name.toLowerCase() ?? ''}</h1>
          {req.status === 'Diajukan' && <p className="text-meta text-ink-secondary">Permintaan Anda masuk antrean {donorName} untuk diperiksa ketersediaannya.</p>}
          {req.status === 'Ditolak' && <Notice tone="danger" title="Permintaan ditolak">{req.reason ?? 'Pemberi tidak menyertakan alasan.'}</Notice>}
          {req.status === 'Dibatalkan' && <Notice tone="warning" title="Permintaan dibatalkan">{req.reason}</Notice>}
          {req.status === 'Diajukan' && (
            <p className="flex gap-2 rounded-control bg-page p-3 text-meta text-ink-secondary">
              <LockSimple size={18} aria-hidden="true" className="mt-px shrink-0" />
              Alamat lengkap dan kontak pemberi dibuka otomatis setelah permintaan disetujui.
            </p>
          )}
        </section>

        {!closed && (
          <section className="card p-4">
            <h2 className="mb-3 text-caption font-semibold uppercase tracking-wide text-ink-secondary">Tahapan permintaan</h2>
            <StageList
              label="Tahapan permintaan"
              current={requestStage(req, transfer)}
              stages={[
                { title: 'Permintaan diajukan', detail: `${req.createdAt} · ${req.quantity} ${req.unit}` },
                { title: `Ditinjau oleh ${donorName}`, detail: req.status === 'Diajukan' ? 'Menunggu persetujuan atau usulan penyesuaian' : 'Selesai' },
                { title: 'Kesepakatan dan reservasi', detail: 'Alamat dan kontak dibuka' },
                { title: 'Pengambilan dan serah terima', detail: req.pickupTime },
              ]}
            />
          </section>
        )}

        <section className="card p-4">
          <h2 className="mb-1 text-caption font-semibold uppercase tracking-wide text-ink-secondary">Rincian permintaan</h2>
          <dl className="divide-y divide-line">
            <Row k="Pemberi" v={`${donorName}${offer ? ` (${offer.area.split(',')[0]})` : ''}`} />
            <Row k="Jumlah diminta" v={<span className="font-bold text-primary">{req.quantity} {req.unit}</span>} />
            <Row k="Pengambilan" v={req.pickupTime} />
            <Row k="Cara" v={req.method} />
            {offer && <Row k="Area" v={offer.area} />}
            {req.note && <Row k="Catatan" v={req.note} />}
          </dl>
        </section>
      </main>
      <StickyFooter>
        {req.status === 'Diajukan' && state.role === 'penerima' ? (
          <div className="flex gap-2">
            <ButtonLink to={`/permintaan/${req.id}/batal`} variant="danger" className="flex-1">Batalkan</ButtonLink>
            <ButtonLink to="/aktivitas" className="flex-[1.4]">Pantau di Aktivitas</ButtonLink>
          </div>
        ) : transfer ? (
          <ButtonLink to={`/aktivitas/${transfer.id}`} block>Lihat penyaluran {transfer.id}</ButtonLink>
        ) : (
          <ButtonLink to="/aktivitas" variant="secondary" block>Kembali ke Aktivitas</ButtonLink>
        )}
      </StickyFooter>
    </>
  )
}

/* ---------- Q06 Batalkan permintaan ---------- */

const CANCEL_REASONS = [
  ['Kebutuhan sudah terpenuhi', 'Sudah mendapat pangan dari sumber lain.'],
  ['Kendala transportasi atau relawan', 'Relawan tidak bisa hadir tepat waktu.'],
  ['Salah memasukkan jumlah', 'Akan mengajukan ulang dengan jumlah yang benar.'],
  ['Alasan lain', 'Jelaskan di catatan.'],
] as const

export function RequestCancel() {
  const { id } = useParams()
  const { state, dispatch } = useApp()
  const navigate = useNavigate()
  const req = state.requests.find((r) => r.id === id)
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  if (!req || req.status !== 'Diajukan') return <NotAvailable />
  const offer = state.offers.find((o) => o.id === req.offerId)
  const ready = !!reason && (reason !== 'Alasan lain' || note.trim())

  return (
    <>
      <AppBar title="Batalkan permintaan" />
      <main className="mx-auto flex max-w-[560px] flex-col gap-4 px-4 pb-40 pt-4">
        <section className="rounded-card border border-danger/30 bg-danger-container p-4">
          <h1 className="flex items-center gap-2 font-semibold text-danger">
            <WarningCircle size={22} weight="fill" aria-hidden="true" /> Batalkan permintaan ini?
          </h1>
          <p className="mt-1 text-meta text-ink">
            Permintaan <strong>{req.quantity} {req.unit} {offer?.name.toLowerCase()}</strong> dari {offer?.donorName} akan ditarik dari antrean. Pembatalan tidak bisa dipulihkan.
          </p>
        </section>
        <fieldset className="card flex flex-col gap-2 p-4">
          <legend className="sr-only">Alasan pembatalan</legend>
          <p aria-hidden="true" className="mb-1 text-label">Alasan pembatalan</p>
          {CANCEL_REASONS.map(([t, d]) => (
            <RadioCard key={t} name="batal" checked={reason === t} onChange={() => setReason(t)} title={t} description={d} />
          ))}
          <div className="mt-2">
            <Field label="Pesan singkat untuk pemberi" optional={reason !== 'Alasan lain'}>
              {(p) => <textarea {...p} rows={3} className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Contoh: Mohon maaf, relawan kami berhalangan hari ini." />}
            </Field>
          </div>
        </fieldset>
        <PolicyNote title="Pembatalan tanpa sanksi">
          Membatalkan sebelum serah terima tidak memengaruhi kesempatan Anda meminta pangan berikutnya.
        </PolicyNote>
      </main>
      <StickyFooter>
        <div className="flex flex-col gap-2">
          <Button
            variant="danger"
            block
            loading={busy}
            disabled={!ready}
            onClick={() => {
              setBusy(true)
              window.setTimeout(() => {
                dispatch({ type: 'cancelRequest', id: req.id, reason: note.trim() ? `${reason}. ${note.trim()}` : reason })
                navigate(`/permintaan/${req.id}`, { replace: true })
              }, 500)
            }}
          >
            Batalkan permintaan
          </Button>
          <Button block variant="ghost" onClick={() => navigate(-1)}>Pertahankan permintaan</Button>
        </div>
      </StickyFooter>
    </>
  )
}

/* ---------- Q03 Permintaan masuk (pemberi) ---------- */

export function IncomingRequests() {
  const { state } = useApp()
  const pending = state.requests.filter((r) => r.status === 'Diajukan')
  const byOffer = state.offers.filter((o) => pending.some((r) => r.offerId === o.id))
  return (
    <>
      <AppBar title="Permintaan masuk" />
      <main className="flex flex-col gap-6 px-4 pb-10 pt-4">
        {byOffer.length === 0 && (
          <StatePanel icon={<CheckCircle size={40} className="text-primary" />} title="Semua permintaan sudah ditinjau">
            Permintaan baru akan muncul di sini.
          </StatePanel>
        )}
        {byOffer.map((o) => {
          const queue = pending.filter((r) => r.offerId === o.id).sort((x, y) => Number(x.id.replace(/\D/g, '')) - Number(y.id.replace(/\D/g, '')))
          const total = queue.reduce((sum, r) => sum + r.quantity, 0)
          let remaining = o.available
          return (
            <section key={o.id} aria-labelledby={`q-${o.id}`} className="flex flex-col gap-3">
              <div className="card flex flex-wrap items-end justify-between gap-2 p-4">
                <div className="min-w-0">
                  <p className="text-caption text-ink-secondary">Penawaran #{o.id}</p>
                  <h2 id={`q-${o.id}`} className="font-semibold">{o.name}</h2>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <p className="text-caption text-ink-secondary">Jumlah awal {o.initial} {o.unit}</p>
                  <Badge tone="success" icon={false}>Sisa {o.available} {o.unit}</Badge>
                </div>
              </div>
              {total > o.available && (
                <div className="flex gap-3 rounded-card border border-warning/30 bg-warning-container p-3">
                  <WarningCircle size={22} aria-hidden="true" className="mt-0.5 shrink-0 text-warning" />
                  <div className="text-meta">
                    <p className="font-semibold text-warning">{queue.length} permintaan masuk (total {total} {o.unit})</p>
                    <p className="text-ink">Total melebihi sisa {o.available} {o.unit}. Tinjau berurutan dan sesuaikan dengan kapasitas penerima.</p>
                  </div>
                </div>
              )}
              {queue.map((r, i) => {
                const fits = r.quantity <= remaining
                const leftBefore = remaining
                if (fits) remaining -= r.quantity
                const first = i === 0
                return (
                  <article key={r.id} className={`card flex flex-col gap-3 p-4 ${first ? 'border-primary/50 ring-1 ring-primary/20' : ''}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-center gap-2">
                          <Badge tone={first ? 'success' : 'warning'} icon={false}>Antrean #{i + 1}</Badge>
                          <span className="text-caption text-ink-secondary">{r.createdAt.split(', ')[1]}</span>
                        </p>
                        <h3 className="mt-1.5 text-card-title">{r.recipientName}</h3>
                        <p className="text-meta text-ink-secondary">{r.recipientType} · kapasitas {r.capacity}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[1.25rem] font-bold text-primary">{r.quantity} {r.unit}</p>
                        <p className="text-caption text-ink-secondary">{r.method}</p>
                      </div>
                    </div>
                    <div className="rounded-control bg-page p-3 text-meta">
                      <dl>
                        <div><dt className="inline font-semibold">Pengambilan: </dt><dd className="inline">{r.pickupTime}</dd></div>
                        {r.note && <div><dt className="inline font-semibold">Catatan: </dt><dd className="inline">{r.note}</dd></div>}
                      </dl>
                      {!fits && (
                        <p className="mt-1 text-warning">
                          Jika antrean sebelumnya disetujui, sisa tinggal {leftBefore} {r.unit}. Permintaan ini perlu penyesuaian.
                        </p>
                      )}
                    </div>
                    <ButtonLink to={`/permintaan/${r.id}/tinjau`} variant={first ? 'primary' : 'secondary'} block>
                      {first ? 'Tinjau dan putuskan' : 'Lihat rincian'}
                    </ButtonLink>
                  </article>
                )
              })}
            </section>
          )
        })}
        <DemoNote />
      </main>
    </>
  )
}

/* ---------- Q04 Tinjau permintaan (pemberi) ---------- */

export function ReviewRequest() {
  const { id } = useParams()
  const { state, dispatch } = useApp()
  const navigate = useNavigate()
  const req = state.requests.find((r) => r.id === id)
  const [mode, setMode] = useState<'approve' | 'reject' | 'adjust' | null>(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  if (!req) return <NotAvailable />
  const offer = state.offers.find((o) => o.id === req.offerId)
  if (!offer) return <NotAvailable />
  const over = req.quantity > offer.available
  const done = req.status !== 'Diajukan'

  const decide = (decision: 'approve' | 'reject') => {
    setBusy(true)
    window.setTimeout(() => {
      dispatch({ type: 'decideRequest', id: req.id, decision, reason })
      setMode(null)
      setBusy(false)
      navigate('/aktivitas', { replace: true })
    }, 600)
  }

  return (
    <>
      <AppBar title="Tinjau permintaan" />
      <main className="flex flex-col gap-4 px-4 pb-44 pt-4">
        <div className="card flex gap-3 p-3">
          <FoodPhoto src={offer.photo} alt="" className="h-16 w-16 shrink-0 rounded-control" />
          <div>
            <p className="font-semibold">{offer.name}</p>
            <p className="text-meta font-semibold text-primary">{offer.available} {offer.unit} tersedia</p>
          </div>
        </div>
        <section className="card p-4">
          <h1 className="text-card-title">{req.recipientName}</h1>
          <p className="text-meta text-ink-secondary">{req.recipientType}</p>
          <dl className="mt-3 divide-y divide-line">
            <KeyValue label="Jumlah diminta"><span className="font-semibold">{req.quantity} {req.unit}</span></KeyValue>
            <KeyValue label="Kapasitas penerima">{req.capacity}</KeyValue>
            <KeyValue label="Pengambilan">{req.pickupTime}</KeyValue>
            <KeyValue label="Cara">{req.method}</KeyValue>
            {req.note && <KeyValue label="Catatan">{req.note}</KeyValue>}
          </dl>
        </section>
        {over && <Notice tone="warning" title="Jumlah melebihi yang tersedia">Tersedia {offer.available} {offer.unit}. Ajukan penyesuaian atau tolak dengan alasan.</Notice>}
        {done && <Notice tone="info">Permintaan ini sudah {req.status.toLowerCase()}.</Notice>}
        <p className="text-caption text-ink-secondary">Keputusan tidak dipengaruhi poin, reward, atau pembayaran.</p>
      </main>
      {!done && (
        <StickyFooter>
          <div className="flex flex-col gap-2">
            <Button block disabled={over} onClick={() => setMode('approve')}>
              Setujui {req.quantity} {req.unit}
            </Button>
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setMode('adjust')}>
                Ajukan penyesuaian
              </Button>
              <Button variant="danger" className="flex-1" onClick={() => setMode('reject')}>
                Tolak
              </Button>
            </div>
          </div>
        </StickyFooter>
      )}
      <BottomSheet
        open={mode === 'approve'}
        onClose={() => setMode(null)}
        title="Setujui permintaan?"
        footer={<Button block loading={busy} onClick={() => decide('approve')}>Setujui</Button>}
      >
        <dl className="divide-y divide-line">
          <KeyValue label="Penerima">{req.recipientName}</KeyValue>
          <KeyValue label="Jumlah disepakati">{req.quantity} {req.unit}</KeyValue>
          <KeyValue label="Pengambilan">{req.pickupTime}</KeyValue>
          <KeyValue label="Sisa setelah disetujui">{offer.available - req.quantity} {offer.unit}</KeyValue>
        </dl>
        <p className="mt-3 text-meta text-ink-secondary">Alamat lengkap dan kontak Anda akan dibuka untuk penerima ini.</p>
      </BottomSheet>
      <BottomSheet open={mode === 'adjust'} onClose={() => setMode(null)} title="Ajukan penyesuaian">
        <p className="text-body text-ink-secondary">
          Alur penyesuaian jumlah atau jadwal (Q05) belum dibangun di prototipe ini. Untuk sekarang, setujui sesuai jumlah yang bisa Anda layani atau tolak dengan alasan.
        </p>
      </BottomSheet>
      <BottomSheet
        open={mode === 'reject'}
        onClose={() => setMode(null)}
        title="Tolak permintaan"
        footer={<Button variant="danger" block loading={busy} disabled={!reason} onClick={() => decide('reject')}>Tolak permintaan</Button>}
      >
        <Field label="Alasan untuk penerima">
          {(p) => <textarea {...p} rows={3} className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Contoh: Jam pengambilan tidak bisa kami layani." />}
        </Field>
      </BottomSheet>
    </>
  )
}
