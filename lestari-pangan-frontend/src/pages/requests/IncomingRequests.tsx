import { CheckCircle, WarningCircle } from '@phosphor-icons/react'
import { AppBar, Badge, ButtonLink, StatePanel } from '../../components/ui'
import { useApp } from '../../state/AppState'

export function IncomingRequests() {
  const { state } = useApp()
  const pending = state.requests.filter((r) => r.status === 'Diajukan')
  const byOffer = state.offers.filter((o) => pending.some((r) => r.offerId === o.id))
  return (
    <>
      <AppBar title="Permintaan masuk" />
      <main className="stagger flex flex-col gap-6 px-4 pb-10 pt-4">
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
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="success" icon={false}>Sisa {o.available} {o.unit}</Badge>
                  <p className="text-caption text-ink-secondary">dari {o.initial} {o.unit} awal</p>
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
                          <span className="text-caption text-ink-secondary">{r.createdAt.split(', ')[1]}{r.deadline && ` · tanggapi sebelum ${r.deadline.split(', ')[1]}`}</span>
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
      </main>
    </>
  )
}

/* ---------- Q04 Tinjau permintaan (pemberi) ---------- */
