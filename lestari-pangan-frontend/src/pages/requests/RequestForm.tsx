import { useState } from 'react'
import { methodLabel } from '../../lib/format'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CaretRight, PaperPlaneTilt, Users } from '@phosphor-icons/react'
import { Button, Field, inputCls, Notice, RadioCard, StickyFooter, toast } from '../../components/ui'
import { FoodPhoto } from '../../components/FoodPhoto'
import { pickupLabel } from '../../components/FoodCard'
import { useApp } from '../../state/AppState'
import { useProfile } from '../../state/useProfile'
import { useLiveData } from '../../state/LiveData'
import { messageOf } from '../../lib/supabase/errors'
import { submitRequest } from '../../services/donation'
import { fromLabels } from '../../services/mappers'
import { NotAvailable } from '../../components/NotAvailable'
import type { FoodRequest } from '../../data/types'
import { Row } from './Row'

export function RequestForm() {
  const { id } = useParams()
  const { state } = useApp()
  const navigate = useNavigate()
  const profile = useProfile()
  const { refresh } = useLiveData()
  const [clientId] = useState(() => crypto.randomUUID()) // kirim ulang tidak membuat permintaan ganda
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
  // Batas per penerima (OD-01) dikurangi permintaan aktif/disetujui akun ini; server memeriksa ulang.
  const used = state.requests
    .filter((r) => r.offerId === offer.id && ['Diajukan', 'Menunggu penyesuaian', 'Disetujui'].includes(r.status))
    .reduce((s, r) => s + r.quantity, 0)
  const cap = offer.maxPerRecipient !== undefined ? Math.max(0, Math.min(offer.available, offer.maxPerRecipient - used)) : offer.available
  const check = () => {
    if (!qty || !Number.isInteger(n) || n <= 0) return setError(`Isi jumlah ${offer.unit} dalam bilangan bulat.`)
    if (n > offer.available) return setError(`Jumlah tersedia saat ini ${offer.available} ${offer.unit}. Ubah jumlah permintaan.`)
    if (n > cap) return setError(`Pemberi membatasi ${offer.maxPerRecipient} ${offer.unit} per penerima. Sisa untuk Anda: ${cap} ${offer.unit}.`)
    if (time < offer.pickupStart.replace('.', ':') || time > offer.pickupEnd.replace('.', ':'))
      return setError(`Pilih jam di rentang ${offer.pickupStart}–${offer.pickupEnd} WIB.`)
    setError('')
    setReviewing(true)
    window.scrollTo(0, 0)
  }

  const send = async () => {
    setSending(true)
    try {
      await submitRequest({ clientId, offerCode: offer.id, quantity: n, method, pickupAt: fromLabels(offer.pickupDate, time), note: note || undefined })
      await refresh()
      navigate('/aktivitas', { replace: true })
    } catch (err) {
      toast(messageOf(err), 'info')
      setSending(false)
    }
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
            Porsi direservasi setelah {offer.donorName} menyetujui. Bila tidak ditanggapi dalam 2 jam, permintaan batal otomatis. Pastikan Anda siap mengambil sesuai jadwal.
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
          <p className="mt-1 text-body">{[profile.capacity, profile.storage].filter(Boolean).join(' · ') || 'Belum diisi'}</p>
          <p className="mt-1 text-meta text-ink-secondary">Periksa kapasitas penerimaan Anda sebelum menentukan jumlah. Ambil sesuai kebutuhan.</p>
          <Link to="/akun/kebutuhan" className="tap mt-2 inline-flex min-h-12 items-center gap-1 text-[0.875rem] font-semibold text-primary">
            Perbarui kebutuhan <CaretRight size={16} weight="bold" aria-hidden="true" />
          </Link>
        </section>

        <Field label={`Jumlah yang diminta (${offer.unit})`} error={error} hint={offer.maxPerRecipient !== undefined ? `Batas pemberi: ${offer.maxPerRecipient} ${offer.unit} per penerima.` : undefined}>
          {(p) => <input {...p} inputMode="numeric" className={inputCls} value={qty} onChange={(e) => setQty(e.target.value.replace(/\D/g, ''))} placeholder={`Maksimal ${cap}`} />}
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
                title={methodLabel(m)}
                description={m === 'Ambil sendiri' ? 'Tanpa biaya pengiriman dari platform' : m === 'Mitra pengiriman' ? 'Pesan GoSend/GrabExpress sendiri; ongkir dibayar Anda, atau pemberi bila disepakati.' : 'Sesuai kesepakatan dengan pemberi'}
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
