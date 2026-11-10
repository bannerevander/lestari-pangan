import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { LockSimple, MinusCircle, Warning, XCircle } from '@phosphor-icons/react'
import { AppBar, Badge, Button, Field, inputCls, RadioCard, StickyFooter, toast } from '../../components/ui'
import { FoodPhoto } from '../../components/FoodPhoto'
import { useApp } from '../../state/AppState'
import { useCommand } from '../../state/useCommand'
import { messageOf } from '../../lib/supabase/errors'
import { NotAvailable } from '../../components/NotAvailable'

const CLOSE_REASONS = [
  ['Pangan sudah habis', 'Semua pangan sudah tersalurkan atau terpakai.'],
  ['Pangan dipakai sendiri', 'Pangan dibutuhkan untuk operasional sendiri.'],
  ['Jam operasional berubah', 'Dapur atau toko tutup lebih cepat hari ini.'],
  ['Informasi perlu diperbaiki', 'Akan diterbitkan ulang dengan data yang benar.'],
  ['Alasan lain', 'Jelaskan di catatan.'],
] as const

export function OfferClose() {
  const { id } = useParams()
  const { state } = useApp()
  const run = useCommand()
  const navigate = useNavigate()
  const offer = state.offers.find((o) => o.id === id)
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')
  const [ack, setAck] = useState(false)
  const [busy, setBusy] = useState(false)
  if (!offer) return <NotAvailable />
  if (offer.status !== 'Tersedia') return <NotAvailable />
  const transfers = state.transfers.filter((t) => t.offerId === offer.id && t.status === 'Terjadwal')
  const ready = !!reason && (reason !== 'Alasan lain' || note.trim()) && (offer.reserved === 0 || ack)

  return (
    <>
      <AppBar title="Tutup penawaran" />
      <main className="mx-auto flex max-w-[560px] flex-col gap-4 px-4 pb-40 pt-4">
        <section className="card flex gap-3 p-3">
          <FoodPhoto src={offer.photo} alt="" className="h-14 w-14 shrink-0 rounded-control" />
          <div className="min-w-0">
            <p className="text-caption font-semibold text-primary">#{offer.id}</p>
            <h1 className="font-semibold">{offer.name}</h1>
            <p className="text-meta text-ink-secondary">{offer.donorName}</p>
          </div>
        </section>

        {offer.reserved > 0 && (
          <div role="note" className="flex gap-3 rounded-card border border-danger/30 bg-danger-container p-4">
            <Warning size={22} weight="fill" aria-hidden="true" className="mt-0.5 shrink-0 text-danger" />
            <div className="text-meta text-ink">
              <p className="font-semibold text-danger">Ada {offer.reserved} {offer.unit} yang sudah direservasi</p>
              <p className="mt-0.5">
                Menutup penawaran tidak membatalkan pengambilan yang sudah disetujui
                {transfers[0] ? ` untuk ${transfers[0].recipientName}` : ''}. Jadwal itu tetap berjalan.
              </p>
            </div>
          </div>
        )}

        <section aria-labelledby="dampak-h" className="flex flex-col gap-2">
          <h2 id="dampak-h" className="text-label">Yang terjadi pada jumlah</h2>
          <div className="card flex items-start gap-3 p-3">
            <MinusCircle size={22} aria-hidden="true" className="mt-0.5 shrink-0 text-ink-secondary" />
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center justify-between gap-2 font-semibold">Sisa tersedia <Badge tone="neutral" icon={false}>{offer.available} {offer.unit}</Badge></p>
              <p className="text-meta text-ink-secondary">Langsung ditarik dari pencarian dan tidak bisa diminta lagi.</p>
            </div>
          </div>
          <div className="card flex items-start gap-3 p-3">
            <LockSimple size={22} aria-hidden="true" className="mt-0.5 shrink-0 text-info" />
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center justify-between gap-2 font-semibold">Direservasi <Badge tone="info" icon={false}>{offer.reserved} {offer.unit}</Badge></p>
              <p className="text-meta text-ink-secondary">Tetap terjadwal sampai serah terima, kecuali dibatalkan bersama penerima.</p>
            </div>
          </div>
        </section>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1.5 text-label">Alasan penutupan</legend>
          {CLOSE_REASONS.map(([t, d]) => (
            <RadioCard key={t} name="alasan-tutup" checked={reason === t} onChange={() => setReason(t)} title={t} description={d} />
          ))}
        </fieldset>
        <Field label="Catatan tambahan" optional={reason !== 'Alasan lain'}>
          {(p) => <textarea {...p} rows={3} className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Contoh: dapur tutup pukul 17.00 hari ini." />}
        </Field>
        {offer.reserved > 0 && (
          <label className="flex items-start gap-3 rounded-card border border-line bg-surface p-4">
            <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-primary" />
            <span className="text-meta">Saya memahami bahwa {offer.reserved} {offer.unit} yang sudah disetujui tetap wajib dikoordinasikan sampai serah terima.</span>
          </label>
        )}
        <p className="text-caption text-ink-secondary">Penutupan dicatat di riwayat penawaran.</p>
      </main>
      <StickyFooter>
        <div className="flex flex-col gap-2">
          <Button
            variant="danger"
            block
            loading={busy}
            disabled={!ready}
            icon={<XCircle size={20} />}
            onClick={() => {
              setBusy(true)
              run({ type: 'closeOffer', id: offer.id })
                .then(() => navigate(`/donasi/kelola/${offer.id}`, { replace: true }))
                .catch((err) => {
                  toast(messageOf(err), 'info')
                  setBusy(false)
                })
            }}
          >
            Tutup penawaran sekarang
          </Button>
          <Button block variant="ghost" onClick={() => navigate(-1)}>Kembali</Button>
        </div>
      </StickyFooter>
    </>
  )
}
