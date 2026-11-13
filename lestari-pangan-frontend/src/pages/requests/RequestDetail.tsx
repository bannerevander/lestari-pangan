import { useParams } from 'react-router-dom'
import { methodLabel } from '../../lib/format'
import { LockSimple } from '@phosphor-icons/react'
import { AppBar, ButtonLink, Notice, StageList, StatusBadge, StickyFooter } from '../../components/ui'
import { useApp } from '../../state/AppState'
import { NotAvailable } from '../../components/NotAvailable'
import type { FoodRequest, Transfer } from '../../data/types'
import { Row } from './Row'

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
      <main className="stagger flex flex-col gap-4 px-4 pb-32 pt-4">
        <section className="card flex flex-col gap-3 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <StatusBadge status={req.status} />
            <span className="text-caption text-ink-secondary">{req.id} · {req.createdAt}</span>
          </div>
          <h1 className="text-page-title">{req.quantity} {req.unit} {offer?.name.toLowerCase() ?? ''}</h1>
          {req.status === 'Diajukan' && <p className="text-meta text-ink-secondary">Permintaan Anda masuk antrean {donorName} untuk diperiksa ketersediaannya.</p>}
          {req.deadline && <p className="text-meta font-medium text-warning">Batal otomatis bila belum ditanggapi sampai {req.deadline}.</p>}
          {req.status === 'Menunggu penyesuaian' && req.proposal && (
            <Notice tone="warning" title={`${donorName} mengusulkan ${req.proposal.quantity} ${req.unit}`}>
              {state.role === 'penerima' ? 'Tinjau usulan untuk melanjutkan. Kuota belum dikunci.' : 'Menunggu jawaban penerima.'}
            </Notice>
          )}
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
            <Row k="Cara" v={methodLabel(req.method)} />
            {offer && <Row k="Area" v={offer.area} />}
            {req.note && <Row k="Catatan" v={req.note} />}
          </dl>
        </section>
      </main>
      <StickyFooter>
        {req.status === 'Menunggu penyesuaian' && state.role === 'penerima' ? (
          <ButtonLink to={`/permintaan/${req.id}/penyesuaian`} block>Tinjau usulan penyesuaian</ButtonLink>
        ) : req.status === 'Diajukan' && state.role === 'penerima' ? (
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
