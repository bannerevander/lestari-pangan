import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, LockSimple } from '@phosphor-icons/react'
import { AppBar, Button, Field, inputCls, Notice, QtyStepper, StickyFooter, toast } from '../../components/ui'
import { pickupLabel } from '../../components/FoodCard'
import { FoodPhoto } from '../../components/FoodPhoto'
import { NotAvailable } from '../../components/NotAvailable'
import { useApp } from '../../state/AppState'
import { useCommand } from '../../state/useCommand'
import { messageOf } from '../../lib/supabase/errors'
import { isoToLabel, labelToIso, timeLabel } from '../../lib/format'

export function OfferEdit() {
  const { id } = useParams()
  const { state } = useApp()
  const run = useCommand()
  const navigate = useNavigate()
  const offer = state.offers.find((o) => o.id === id)
  const [f, setF] = useState(() => ({
    date: offer ? labelToIso(offer.pickupDate) : '',
    start: offer?.pickupStart.replace('.', ':') ?? '',
    end: offer?.pickupEnd.replace('.', ':') ?? '',
    available: offer?.available ?? 0,
    storage: offer?.storage ?? '',
    description: offer?.description ?? '',
  }))
  const [reason, setReason] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  if (!offer || offer.status !== 'Tersedia') return <NotAvailable />

  const next = { pickupDate: f.date ? isoToLabel(f.date) : offer.pickupDate, pickupStart: timeLabel(f.start), pickupEnd: timeLabel(f.end) }
  const moved = next.pickupDate !== offer.pickupDate || next.pickupStart !== offer.pickupStart || next.pickupEnd !== offer.pickupEnd
  const affected = state.transfers.filter((t) => t.offerId === offer.id && t.status === 'Terjadwal')
  const needsReason = moved && affected.length > 0
  const dirty = moved || f.available !== offer.available || f.storage !== offer.storage || f.description !== (offer.description ?? '')

  const submit = () => {
    const e: Record<string, string> = {}
    if (!f.date) e.date = 'Pilih tanggal pengambilan.'
    if (!f.start || !f.end || f.end <= f.start) e.end = 'Jam selesai harus setelah jam mulai.'
    if (!f.storage.trim()) e.storage = 'Isi cara penyimpanan.'
    if (needsReason && reason.trim().length < 10) e.reason = 'Jelaskan alasan perubahan minimal 10 karakter untuk penerima.'
    setErrors(e)
    if (Object.keys(e).length) return void requestAnimationFrame(() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus())
    setBusy(true)
    run({
      type: 'updateOffer',
      id: offer.id,
      reason: reason.trim() || undefined,
      changes: { ...next, available: f.available, storage: f.storage.trim(), description: f.description.trim() || undefined },
    })
      .then(() => {
        toast(needsReason ? 'Perubahan dikirim. Penerima diminta menyetujui jadwal baru.' : 'Penawaran diperbarui')
        navigate(-1)
      })
      .catch((err) => {
        toast(messageOf(err), 'info')
        setBusy(false)
      })
  }

  return (
    <>
      <AppBar title="Ubah penawaran" dirty={dirty && !busy} />
      <main className="stagger mx-auto flex max-w-[560px] flex-col gap-4 px-4 pb-36 pt-4">
        <section className="card flex gap-3 p-3">
          <FoodPhoto src={offer.photo} alt="" className="h-14 w-14 shrink-0 rounded-control" />
          <div className="min-w-0 flex-1">
            <p className="text-caption font-semibold text-primary">#{offer.id}</p>
            <p className="font-semibold leading-6">{offer.name}</p>
            <p className="text-meta text-ink-secondary">
              {offer.available} tersedia · {offer.reserved} direservasi · {offer.initial} {offer.unit} awal
            </p>
          </div>
        </section>

        {affected.length > 0 && (
          <Notice tone="warning" title="Ada kesepakatan berjalan">
            {affected.length} penyaluran terjadwal ({affected.map((t) => `${t.agreed} ${t.unit} untuk ${t.recipientName}`).join(', ')}). Perubahan jadwal perlu persetujuan penerima.
          </Notice>
        )}

        <section className="card flex flex-col gap-4 p-4" aria-labelledby="jd-h">
          <h2 id="jd-h" className="text-card-title">Jadwal pengambilan</h2>
          <Field label="Tanggal" error={errors.date}>
            {(p) => <input {...p} type="date" className={inputCls} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} />}
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Mulai">{(p) => <input {...p} type="time" className={inputCls} value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })} />}</Field>
            <Field label="Selesai" error={errors.end}>{(p) => <input {...p} type="time" className={inputCls} value={f.end} onChange={(e) => setF({ ...f, end: e.target.value })} />}</Field>
          </div>
          {moved && (
            <div className="grid animate-rise-in grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-control bg-page p-3" aria-live="polite">
              <div className="min-w-0">
                <p className="text-caption text-ink-secondary">Jadwal lama</p>
                <p className="text-meta text-ink-secondary line-through">{pickupLabel(offer)}</p>
              </div>
              <ArrowRight size={18} aria-label="menjadi" className="text-ink-secondary" />
              <div className="min-w-0">
                <p className="text-caption font-semibold text-primary">Jadwal baru</p>
                <p className="text-meta font-semibold">{pickupLabel(next)}</p>
              </div>
            </div>
          )}
          {needsReason && (
            <div className="animate-rise-in">
              <Field label="Alasan perubahan jadwal" hint="Dikirim langsung ke penerima yang terdampak." error={errors.reason}>
                {(p) => <textarea {...p} rows={3} className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Contoh: waktu kemas bergeser agar makanan tetap hangat." />}
              </Field>
            </div>
          )}
        </section>

        <section className="card flex flex-col gap-4 p-4" aria-labelledby="jm-h">
          <h2 id="jm-h" className="text-card-title">Jumlah dan kondisi</h2>
          <Field label={`Jumlah tersedia (${offer.unit})`} hint={offer.reserved ? `${offer.reserved} ${offer.unit} yang sudah direservasi tidak ikut berubah.` : undefined}>
            {(p) => <QtyStepper id={p.id} describedBy={p['aria-describedby']} value={f.available} onChange={(n) => setF({ ...f, available: n })} unit={offer.unit} />}
          </Field>
          <Field label="Cara penyimpanan saat ini" error={errors.storage}>
            {(p) => <input {...p} className={inputCls} value={f.storage} onChange={(e) => setF({ ...f, storage: e.target.value })} />}
          </Field>
          <Field label="Catatan untuk penerima" optional>
            {(p) => <textarea {...p} rows={3} className={inputCls} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />}
          </Field>
        </section>
        <p className="flex items-start gap-2 text-meta text-ink-secondary">
          <LockSimple size={18} aria-hidden="true" className="mt-px shrink-0" />
          Nama, kategori, dan informasi alergen tidak bisa diubah setelah terbit. Tutup penawaran dan terbitkan ulang bila perlu.
        </p>
      </main>
      <StickyFooter>
        <Button block onClick={submit} loading={busy} loadingLabel="Menyimpan…" disabled={!dirty}>
          {needsReason ? 'Kirim perubahan jadwal' : 'Simpan perubahan'}
        </Button>
      </StickyFooter>
    </>
  )
}
