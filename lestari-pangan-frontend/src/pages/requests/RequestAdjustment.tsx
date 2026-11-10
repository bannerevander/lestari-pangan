import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowRight } from '@phosphor-icons/react'
import { AppBar, Badge, BottomSheet, Button, ButtonLink, PolicyNote, StatePanel, StickyFooter, toast } from '../../components/ui'
import { useApp } from '../../state/AppState'
import { useCommand } from '../../state/useCommand'
import { messageOf } from '../../lib/supabase/errors'
import { NotAvailable } from '../../components/NotAvailable'
import { Row } from './Row'

export function RequestAdjustment() {
  const { id } = useParams()
  const { state } = useApp()
  const run = useCommand()
  const navigate = useNavigate()
  const req = state.requests.find((r) => r.id === id)
  const [busy, setBusy] = useState<'accept' | 'reject' | null>(null)
  const [confirmReject, setConfirmReject] = useState(false)
  if (!req) return <NotAvailable />
  const offer = state.offers.find((o) => o.id === req.offerId)
  if (req.status !== 'Menunggu penyesuaian' || !req.proposal) {
    return (
      <>
        <AppBar title="Tinjau penyesuaian" />
        <main className="p-4">
          <StatePanel title="Usulan sudah dijawab" action={<ButtonLink to={`/permintaan/${req.id}`} variant="secondary">Lihat permintaan</ButtonLink>}>
            Status permintaan sekarang: {req.status}.
          </StatePanel>
        </main>
      </>
    )
  }
  const p = req.proposal
  const respond = (accept: boolean) => {
    setBusy(accept ? 'accept' : 'reject')
    run({ type: 'respondAdjustment', id: req.id, accept })
      .then(() => {
        toast(accept ? `Disetujui. ${p.quantity} ${req.unit} dikunci untuk Anda.` : 'Permintaan dibatalkan.', accept ? 'success' : 'info')
        navigate(accept ? '/aktivitas' : `/permintaan/${req.id}`, { replace: true })
      })
      .catch((err) => {
        toast(messageOf(err), 'info')
        setBusy(null)
      })
  }
  return (
    <>
      <AppBar title="Tinjau penyesuaian" />
      <main className="stagger mx-auto flex max-w-[560px] flex-col gap-4 px-4 pb-44 pt-4">
        <section className="rounded-greet bg-warning-container p-4">
          <Badge tone="warning">Perlu jawaban Anda</Badge>
          <h1 className="mt-2 text-section-title">{offer?.donorName ?? 'Pemberi'} mengusulkan jumlah lain</h1>
          <p className="mt-1 text-meta text-ink">{offer?.name}</p>
        </section>
        <section className="card p-4" aria-label="Perbandingan jumlah">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center">
            <div className="rounded-control bg-page p-3">
              <p className="text-caption text-ink-secondary">Permintaan Anda</p>
              <p className="text-[1.5rem] font-bold text-ink-secondary line-through">{req.quantity}</p>
              <p className="text-caption text-ink-secondary">{req.unit}</p>
            </div>
            <ArrowRight size={22} aria-label="menjadi" className="text-ink-secondary" />
            <div className="animate-pop rounded-control bg-primary-container p-3">
              <p className="text-caption font-semibold text-primary">Usulan baru</p>
              <p className="text-[1.5rem] font-bold text-primary">{p.quantity}</p>
              <p className="text-caption text-primary">{req.unit}</p>
            </div>
          </div>
          <blockquote className="mt-4 rounded-control border-l-4 border-primary bg-page p-3 text-meta">
            <p className="font-semibold">Alasan pemberi</p>
            <p className="mt-0.5 text-ink">“{p.reason}”</p>
            <p className="mt-1 text-caption text-ink-secondary">{p.at}</p>
          </blockquote>
        </section>
        <section className="card p-4">
          <h2 className="mb-1 text-caption font-semibold uppercase tracking-wide text-ink-secondary">Tidak berubah</h2>
          <dl className="divide-y divide-line">
            <Row k="Pengambilan" v={req.pickupTime} />
            <Row k="Cara" v={req.method} />
            <Row k="Biaya pangan" v="Rp0 (gratis)" />
          </dl>
        </section>
        <PolicyNote title="Setelah Anda setuju">{p.quantity} {req.unit} langsung dikunci untuk Anda dan alamat titik temu dibuka.</PolicyNote>
      </main>
      <StickyFooter>
        <Button block loading={busy === 'accept'} loadingLabel="Mengunci kuota…" disabled={!!busy} onClick={() => respond(true)}>
          Setujui {p.quantity} {req.unit}
        </Button>
        <Button block variant="ghost-danger" disabled={!!busy} onClick={() => setConfirmReject(true)}>
          Tolak dan batalkan permintaan
        </Button>
      </StickyFooter>
      <BottomSheet
        open={confirmReject}
        onClose={() => setConfirmReject(false)}
        title="Batalkan permintaan?"
        footer={
          <Button variant="danger" block loading={busy === 'reject'} onClick={() => respond(false)}>
            Ya, batalkan
          </Button>
        }
      >
        <p className="text-body text-ink-secondary">Permintaan {req.id} akan dibatalkan. Anda bisa mengajukan permintaan baru ke penawaran lain.</p>
      </BottomSheet>
    </>
  )
}
