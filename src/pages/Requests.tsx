import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CaretRight, CheckCircle, Users } from '@phosphor-icons/react'
import { AppBar, BottomSheet, Button, ButtonLink, Field, inputCls, KeyValue, Notice, StatePanel, StatusBadge, StickyFooter } from '../components/ui'
import { FoodPhoto } from '../components/FoodPhoto'
import { pickupLabel } from '../components/FoodCard'
import { useApp } from '../state/AppState'
import { RECIPIENT } from '../data/mock'
import { NotAvailable } from './Donasi'
import type { FoodRequest } from '../data/types'

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
  if (!offer) return <NotAvailable />

  const n = Number(qty)
  const check = () => {
    if (!qty || !Number.isInteger(n) || n <= 0) return setError(`Isi jumlah ${offer.unit} dalam bilangan bulat.`)
    if (n > offer.available) return setError(`Jumlah tersedia saat ini ${offer.available} ${offer.unit}. Ubah jumlah permintaan.`)
    if (time < offer.pickupStart.replace('.', ':') || time > offer.pickupEnd.replace('.', ':'))
      return setError(`Pilih jam di rentang ${offer.pickupStart}–${offer.pickupEnd} WIB.`)
    setError('')
    setReviewing(true)
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

  return (
    <>
      <AppBar title="Ajukan permintaan" />
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
              <label key={m} className={`tap flex min-h-14 items-center gap-3 rounded-control border px-4 ${method === m ? 'border-primary bg-primary-container' : 'border-line bg-surface'}`}>
                <input type="radio" name="method" checked={method === m} onChange={() => setMethod(m)} className="h-5 w-5 accent-primary" />
                <span className="flex-1">
                  <span className="block font-medium">{m}</span>
                  <span className="block text-meta text-ink-secondary">
                    {m === 'Ambil sendiri' ? 'Tanpa biaya pengiriman dari platform' : m === 'Mitra pengiriman' ? 'Biaya belum tersedia' : 'Sesuai kesepakatan dengan pemberi'}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <Field label="Catatan untuk pemberi" optional>
          {(p) => <textarea {...p} rows={3} className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Contoh: Kami membawa boks pendingin." />}
        </Field>
      </main>
      <StickyFooter>
        <Button block onClick={check}>Tinjau permintaan</Button>
      </StickyFooter>

      <BottomSheet
        open={reviewing}
        onClose={() => setReviewing(false)}
        title="Tinjau permintaan"
        footer={
          <Button block loading={sending} onClick={send}>
            Kirim permintaan
          </Button>
        }
      >
        <dl className="divide-y divide-line">
          <KeyValue label="Pangan">{offer.name}</KeyValue>
          <KeyValue label="Jumlah">{n} {offer.unit}</KeyValue>
          <KeyValue label="Pengambilan">{offer.pickupDate}, {time.replace(':', '.')} WIB</KeyValue>
          <KeyValue label="Cara">{method}</KeyValue>
        </dl>
        <div className="mt-3">
          <Notice tone="info">Permintaan perlu disetujui pemberi. Jumlah belum direservasi sampai disetujui.</Notice>
        </div>
      </BottomSheet>
    </>
  )
}

/* ---------- Q02 Detail permintaan ---------- */

export function RequestDetail() {
  const { id } = useParams()
  const { state, dispatch } = useApp()
  const req = state.requests.find((r) => r.id === id)
  const [cancel, setCancel] = useState(false)
  const [reason, setReason] = useState('')
  if (!req) return <NotAvailable />
  const offer = state.offers.find((o) => o.id === req.offerId)
  const transfer = state.transfers.find((t) => t.requestId === req.id)

  return (
    <>
      <AppBar title="Detail permintaan" />
      <main className="flex flex-col gap-4 px-4 pb-32 pt-4">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={req.status} />
          <span className="text-caption text-ink-secondary">{req.id} · {req.createdAt}</span>
        </div>
        <h1 className="text-page-title">{offer?.name ?? 'Penawaran'}</h1>
        {req.status === 'Diajukan' && <Notice tone="info" title="Menunggu keputusan pemberi">Anda akan mendapat notifikasi saat pemberi menyetujui, mengajukan penyesuaian, atau menolak.</Notice>}
        {req.status === 'Ditolak' && <Notice tone="danger" title="Permintaan ditolak">{req.reason ?? 'Pemberi tidak menyertakan alasan.'}</Notice>}
        {req.status === 'Dibatalkan' && <Notice tone="warning" title="Permintaan dibatalkan">{req.reason}</Notice>}
        <section className="card p-4">
          <dl className="divide-y divide-line">
            <KeyValue label="Jumlah diminta">{req.quantity} {req.unit}</KeyValue>
            <KeyValue label="Pengambilan">{req.pickupTime}</KeyValue>
            <KeyValue label="Cara">{req.method}</KeyValue>
            {req.note && <KeyValue label="Catatan">{req.note}</KeyValue>}
          </dl>
        </section>
        {transfer && (
          <ButtonLink to={`/aktivitas/${transfer.id}`} variant="tonal" block>
            Lihat penyaluran {transfer.id}
          </ButtonLink>
        )}
        {req.status === 'Diajukan' && state.role === 'penerima' && (
          <Button variant="danger" block onClick={() => setCancel(true)}>
            Batalkan permintaan
          </Button>
        )}
      </main>
      <BottomSheet
        open={cancel}
        onClose={() => setCancel(false)}
        title="Batalkan permintaan?"
        footer={
          <Button
            variant="danger"
            block
            disabled={!reason}
            onClick={() => {
              dispatch({ type: 'cancelRequest', id: req.id, reason })
              setCancel(false)
            }}
          >
            Batalkan permintaan
          </Button>
        }
      >
        <p className="mb-3 text-body text-ink-secondary">Pemberi akan diberi tahu. Permintaan yang dibatalkan tidak bisa dipulihkan.</p>
        {['Kebutuhan sudah terpenuhi', 'Tidak bisa mengambil di jam ini', 'Salah memasukkan jumlah', 'Lainnya'].map((r) => (
          <label key={r} className="flex min-h-12 items-center gap-3">
            <input type="radio" name="cancel" checked={reason === r} onChange={() => setReason(r)} className="h-5 w-5 accent-primary" />
            {r}
          </label>
        ))}
      </BottomSheet>
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
      <main className="flex flex-col gap-5 px-4 pb-10 pt-4">
        {byOffer.length === 0 && (
          <StatePanel icon={<CheckCircle size={40} className="text-primary" />} title="Semua permintaan sudah ditinjau">
            Permintaan baru akan muncul di sini.
          </StatePanel>
        )}
        {byOffer.map((o) => (
          <section key={o.id} className="flex flex-col gap-2">
            <div>
              <h2 className="text-card-title">{o.name}</h2>
              <p className="text-meta text-ink-secondary">{o.available} {o.unit} masih tersedia · {pickupLabel(o)}</p>
            </div>
            {pending
              .filter((r) => r.offerId === o.id)
              .map((r) => (
                <Link key={r.id} to={`/permintaan/${r.id}/tinjau`} className="tap card flex items-center gap-3 p-4 hover:bg-page">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{r.recipientName}</p>
                    <p className="text-meta text-ink-secondary">{r.recipientType} · kapasitas {r.capacity}</p>
                    <p className="mt-1 text-[1rem] font-semibold">
                      Meminta {r.quantity} {r.unit} · {r.pickupTime.split(', ')[1]}
                    </p>
                  </div>
                  <CaretRight size={20} aria-hidden="true" className="text-ink-secondary" />
                </Link>
              ))}
          </section>
        ))}
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
