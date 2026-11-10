import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppBar, BottomSheet, Button, Field, inputCls, KeyValue, Notice, QtyStepper, StickyFooter, toast } from '../../components/ui'
import { FoodPhoto } from '../../components/FoodPhoto'
import { useApp } from '../../state/AppState'
import { useCommand } from '../../state/useCommand'
import { messageOf } from '../../lib/supabase/errors'
import { NotAvailable } from '../../components/NotAvailable'

export function ReviewRequest() {
  const { id } = useParams()
  const { state } = useApp()
  const run = useCommand()
  const navigate = useNavigate()
  const req = state.requests.find((r) => r.id === id)
  const [mode, setMode] = useState<'approve' | 'reject' | 'adjust' | null>(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [qty, setQty] = useState(0)
  const [adjReason, setAdjReason] = useState('')
  const [adjErr, setAdjErr] = useState('')
  if (!req) return <NotAvailable />
  const offer = state.offers.find((o) => o.id === req.offerId)
  if (!offer) return <NotAvailable />
  const over = req.quantity > offer.available
  const done = req.status !== 'Diajukan'

  const decide = (decision: 'approve' | 'reject') => {
    setBusy(true)
    run({ type: 'decideRequest', id: req.id, decision, reason })
      .then(() => {
        setMode(null)
        navigate('/aktivitas', { replace: true })
      })
      .catch((err) => toast(messageOf(err), 'info'))
      .finally(() => setBusy(false))
  }

  return (
    <>
      <AppBar title="Tinjau permintaan" />
      <main className="stagger flex flex-col gap-4 px-4 pb-44 pt-4">
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
              <Button variant="secondary" className="flex-1" disabled={offer.available === 0} onClick={() => (setQty(Math.min(offer.available, req.quantity - 1)), setMode('adjust'))}>
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
      <BottomSheet
        open={mode === 'adjust'}
        onClose={() => setMode(null)}
        title="Usulkan jumlah lain"
        footer={
          <Button
            block
            loading={busy}
            loadingLabel="Mengirim…"
            onClick={() => {
              if (qty < 1 || qty >= req.quantity) return setAdjErr(`Usulkan antara 1 dan ${req.quantity - 1} ${req.unit}.`)
              if (qty > offer.available) return setAdjErr(`Maksimal ${offer.available} ${req.unit} sesuai yang tersedia.`)
              if (adjReason.trim().length < 10) return setAdjErr('Tulis alasan singkat untuk penerima (minimal 10 karakter).')
              setBusy(true)
              run({ type: 'proposeAdjustment', id: req.id, quantity: qty, reason: adjReason.trim() })
                .then(() => {
                  toast('Usulan dikirim. Kuota belum dikunci sampai penerima setuju.')
                  navigate('/aktivitas/permintaan', { replace: true })
                })
                .catch((err) => {
                  setAdjErr(messageOf(err))
                  setBusy(false)
                })
            }}
          >
            Kirim usulan {qty || ''} {req.unit}
          </Button>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="rounded-control bg-page p-3">
              <p className="text-caption text-ink-secondary">Diminta</p>
              <p className="text-[1.25rem] font-bold">{req.quantity} {req.unit}</p>
            </div>
            <div className="rounded-control bg-primary-container p-3">
              <p className="text-caption text-ink-secondary">Tersedia</p>
              <p className="text-[1.25rem] font-bold text-primary">{offer.available} {req.unit}</p>
            </div>
          </div>
          <Field label={`Jumlah yang bisa Anda berikan (${req.unit})`} error={/^(Usulkan|Maksimal)/.test(adjErr) ? adjErr : undefined}>
            {(p) => <QtyStepper id={p.id} describedBy={p['aria-describedby']} value={qty} onChange={(n) => (setQty(n), setAdjErr(''))} min={0} max={Math.min(offer.available, req.quantity - 1)} unit={req.unit} />}
          </Field>
          <Field label="Alasan untuk penerima" hint="Contoh: 12 porsi sudah disetujui untuk antrean sebelumnya." error={adjErr.startsWith('Tulis') ? adjErr : undefined}>
            {(p) => <textarea {...p} rows={3} className={inputCls} value={adjReason} onChange={(e) => (setAdjReason(e.target.value), setAdjErr(''))} />}
          </Field>
          <p className="text-meta text-ink-secondary">Jadwal dan cara pengambilan tetap. Penerima bisa menyetujui atau membatalkan.</p>
        </div>
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

/* ---------- Q05 Tinjau penyesuaian (penerima) ---------- */
