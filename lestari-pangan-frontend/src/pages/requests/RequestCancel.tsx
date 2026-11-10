import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { WarningCircle } from '@phosphor-icons/react'
import { AppBar, Button, Field, inputCls, PolicyNote, RadioCard, StickyFooter, toast } from '../../components/ui'
import { useApp } from '../../state/AppState'
import { useCommand } from '../../state/useCommand'
import { messageOf } from '../../lib/supabase/errors'
import { NotAvailable } from '../../components/NotAvailable'

const CANCEL_REASONS = [
  ['Kebutuhan sudah terpenuhi', 'Sudah mendapat pangan dari sumber lain.'],
  ['Kendala transportasi atau relawan', 'Relawan tidak bisa hadir tepat waktu.'],
  ['Salah memasukkan jumlah', 'Akan mengajukan ulang dengan jumlah yang benar.'],
  ['Alasan lain', 'Jelaskan di catatan.'],
] as const

export function RequestCancel() {
  const { id } = useParams()
  const { state } = useApp()
  const run = useCommand()
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
              run({ type: 'cancelRequest', id: req.id, reason: note.trim() ? `${reason}. ${note.trim()}` : reason })
                .then(() => navigate(`/permintaan/${req.id}`, { replace: true }))
                .catch((err) => {
                  toast(messageOf(err), 'info')
                  setBusy(false)
                })
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
