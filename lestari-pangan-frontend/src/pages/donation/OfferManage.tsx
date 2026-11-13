import { Link, useParams } from 'react-router-dom'
import { methodLabel } from '../../lib/format'
import { CaretRight, Clock, MapPin, PencilSimple, WarningCircle, XCircle } from '@phosphor-icons/react'
import { AppBar, Badge, ButtonLink, MenuRow, StatusBadge, StickyFooter } from '../../components/ui'
import { pickupLabel } from '../../components/FoodCard'
import { FoodPhoto } from '../../components/FoodPhoto'
import { useApp } from '../../state/AppState'
import { NotAvailable } from '../../components/NotAvailable'

export function OfferManage() {
  const { id } = useParams()
  const { state } = useApp()
  const offer = state.offers.find((o) => o.id === id)
  if (!offer) return <NotAvailable />
  const reqs = state.requests.filter((r) => r.offerId === offer.id)
  const pending = reqs.filter((r) => r.status === 'Diajukan')
  const pct = (n: number) => (offer.initial ? Math.round((n / offer.initial) * 100) : 0)

  return (
    <>
      <AppBar title="Kelola penawaran" />
      <main className="stagger flex flex-col gap-4 px-4 pb-32 pt-4">
        <section className="card flex flex-col gap-3 p-4">
          <div className="flex gap-3">
            <FoodPhoto src={offer.photo} alt={offer.name} className="h-20 w-20 shrink-0 rounded-control" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <StatusBadge status={offer.status} />
                <Badge tone="neutral" icon={false}>{offer.category}</Badge>
              </div>
              <h1 className="mt-1 text-card-title">{offer.name}</h1>
              <p className="flex items-start gap-1 text-meta text-ink-secondary">
                <MapPin size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
                <span className="min-w-0">{offer.area} · <span className="whitespace-nowrap">#{offer.id}</span></span>
              </p>
            </div>
          </div>
          <p className="flex items-center gap-2 rounded-control border border-line px-3 py-2 text-meta">
            <Clock size={18} aria-hidden="true" className="shrink-0 text-primary" />
            <span>Pengambilan {pickupLabel(offer)}</span>
          </p>
        </section>

        <section aria-labelledby="jumlah-h" className="card p-4">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-2">
            <h2 id="jumlah-h" className="text-card-title">Alokasi jumlah</h2>
            <span className="text-meta text-ink-secondary">Total awal {offer.initial} {offer.unit}</span>
          </div>
          <dl className="grid grid-cols-3 gap-2 text-center">
            {[
              ['Tersedia', offer.available, 'Masih bisa diminta', 'bg-primary-container text-primary'],
              ['Direservasi', offer.reserved, 'Menunggu serah terima', 'bg-info-container text-info'],
              ['Diserahkan', offer.handedOver, 'Sudah dicatat', 'bg-page text-ink'],
            ].map(([label, value, hint, cls]) => (
              <div key={label as string} className={`flex flex-col rounded-control p-2 ${cls}`}>
                <dt className="order-2 text-caption font-semibold">{label}</dt>
                <dd className="order-1 text-[1.25rem] font-bold leading-7">{value}</dd>
                <dd className="order-3 text-[0.75rem] leading-4 text-ink-secondary">{hint}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-3 flex h-2.5 origin-left animate-grow-x overflow-hidden rounded-full bg-line" aria-hidden="true">
            <span className="bg-primary" style={{ width: `${pct(offer.available)}%` }} />
            <span className="bg-info" style={{ width: `${pct(offer.reserved)}%` }} />
            <span className="bg-ink-secondary" style={{ width: `${pct(offer.handedOver)}%` }} />
          </div>
          <p className="mt-3 text-caption text-ink-secondary">Satuan: {offer.unit}. Direservasi belum berarti diterima; jumlah diterima dicatat penerima saat serah terima.</p>
        </section>

        <section aria-labelledby="req-h" className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="req-h" className="text-section-title">Permintaan ({reqs.length})</h2>
            {pending.length > 0 && <Badge tone="warning">{pending.length} perlu ditinjau</Badge>}
          </div>
          {reqs.length === 0 && <p className="text-body text-ink-secondary">Belum ada permintaan.</p>}
          {reqs.map((r) => {
            const over = r.status === 'Diajukan' && r.quantity > offer.available
            return (
              <Link key={r.id} to={r.status === 'Diajukan' ? `/permintaan/${r.id}/tinjau` : `/permintaan/${r.id}`} className="tap card flex flex-col gap-2 p-4 hover:bg-page">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{r.recipientName}</p>
                    <p className="text-meta text-ink-secondary">{methodLabel(r.method)} · {r.pickupTime}</p>
                  </div>
                  <span className="shrink-0 text-right">
                    <span className="block text-[1.125rem] font-bold">{r.quantity} {r.unit}</span>
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <StatusBadge status={r.status} />
                  <span className="inline-flex items-center gap-1 text-[0.875rem] font-semibold text-primary">
                    {r.status === 'Diajukan' ? 'Tinjau' : 'Lihat detail'} <CaretRight size={14} weight="bold" aria-hidden="true" />
                  </span>
                </div>
                {over && (
                  <p className="flex items-start gap-1.5 rounded-control bg-warning-container p-2 text-meta text-ink">
                    <WarningCircle size={18} weight="fill" aria-hidden="true" className="mt-px shrink-0 text-warning" />
                    Melebihi sisa tersedia ({offer.available} {offer.unit}). Perlu penyesuaian jumlah.
                  </p>
                )}
              </Link>
            )
          })}
        </section>

        {offer.status === 'Tersedia' && (
          <nav aria-labelledby="aksi-h" className="flex flex-col gap-2">
            <h2 id="aksi-h" className="text-section-title">Tindakan penawaran</h2>
            <div className="card divide-y divide-line overflow-hidden">
              <MenuRow to={`/donasi/kelola/${offer.id}/ubah`} icon={<PencilSimple size={20} />} title="Ubah informasi penawaran" />
              <Link to={`/donasi/kelola/${offer.id}/tutup`} className="tap flex min-h-16 items-center gap-3 px-4 py-3 hover:bg-danger-container">
                <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-danger-container text-danger">
                  <XCircle size={20} />
                </span>
                <span className="min-w-0 flex-1 font-medium text-danger">Tutup penawaran lebih awal</span>
                <CaretRight size={20} aria-hidden="true" className="shrink-0 text-ink-secondary" />
              </Link>
            </div>
          </nav>
        )}
      </main>
      {pending.length > 0 && (
        <StickyFooter>
          <ButtonLink to="/aktivitas/permintaan" block>
            Tinjau {pending.length} permintaan
          </ButtonLink>
        </StickyFooter>
      )}
    </>
  )
}

/* ---------- D05 Tutup penawaran ---------- */
