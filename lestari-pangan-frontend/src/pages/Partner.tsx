import { useParams } from 'react-router-dom'
import { Clock, Compass, MapPin, Quotes, SealCheck, Warning } from '@phosphor-icons/react'
import { AppBar, Badge, ButtonLink, CountUp, PolicyNote, Reveal } from '../components/ui'
import { FoodCardCompact } from '../components/FoodCard'
import { NotAvailable } from '../components/NotAvailable'
import { useApp } from '../state/AppState'

export function PartnerProfile() {
  const { id = '' } = useParams()
  const { state } = useApp()
  const name = decodeURIComponent(id)
  const offers = state.offers.filter((o) => o.donorName === name)
  if (!offers.length) return <NotAvailable />
  const first = offers[0]
  const active = offers.filter((o) => o.status === 'Tersedia' && o.available > 0)
  const done = state.transfers.filter((t) => t.donorName === name && t.received !== undefined)
  const portions = done.filter((t) => t.unit === 'porsi').reduce((s, t) => s + (t.received ?? 0), 0)
  const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2)

  return (
    <>
      <AppBar title="Profil mitra" />
      <main className="pb-8">
        <section className="relative overflow-hidden bg-primary-container px-4 pb-6 pt-6">
          <span aria-hidden="true" className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/10" />
          <span aria-hidden="true" className="absolute -right-2 top-16 h-16 w-16 rounded-full bg-accent/30" />
          <div className="relative flex animate-rise-in items-center gap-4">
            <span className="flex h-20 w-20 shrink-0 animate-pop items-center justify-center rounded-full bg-primary text-[1.75rem] font-bold text-white shadow-overlay">{initials}</span>
            <div className="min-w-0">
              <h1 className="text-page-title">{name}</h1>
              <p className="text-meta text-ink-secondary">{first.donorType}</p>
              <p className="mt-1 inline-flex items-center gap-1 text-meta"><MapPin size={16} aria-hidden="true" className="text-primary" />{first.area}</p>
            </div>
          </div>
          <div className="relative mt-4 flex flex-wrap gap-2">
            {first.donorVerified ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-surface px-3 py-1 text-[0.8125rem] font-semibold text-primary shadow-card">
                <SealCheck size={16} weight="fill" aria-hidden="true" /> Identitas terverifikasi
              </span>
            ) : (
              <Badge tone="warning">Menunggu pemeriksaan</Badge>
            )}
          </div>
        </section>

        <div className="flex flex-col gap-5 px-4 pt-4">
          <dl className="stagger grid grid-cols-3 gap-2 text-center">
            {[
              ['Penyaluran', done.length, 'terkonfirmasi'],
              ['Porsi', portions, 'diterima penerima'],
              ['Aktif', active.length, 'penawaran'],
            ].map(([label, value, hint]) => (
              <div key={label} className="card flex flex-col p-3">
                <dt className="order-2 text-caption font-semibold">{label}</dt>
                <dd className="order-1 text-[1.5rem] font-bold leading-8 text-primary-pressed"><CountUp value={value as number} /></dd>
                <dd className="order-3 text-[0.75rem] leading-4 text-ink-secondary">{hint}</dd>
              </div>
            ))}
          </dl>

          <section aria-labelledby="pa-h" className="flex flex-col gap-3">
            <h2 id="pa-h" className="text-section-title">Penawaran aktif</h2>
            {active.length ? (
              <div className="stagger flex flex-col gap-3">
                {active.map((o) => <FoodCardCompact key={o.id} offer={o} to={`/donasi/${o.id}`} />)}
              </div>
            ) : (
              <p className="rounded-card border border-dashed border-line bg-surface p-4 text-body text-ink-secondary">Belum ada penawaran aktif. Cek lagi nanti.</p>
            )}
          </section>

          <Reveal>
            <section className="card p-4">
              <Quotes size={28} weight="fill" aria-hidden="true" className="text-primary/30" />
              <p className="mt-1 text-body italic text-ink">Berkomitmen menyalurkan surplus pangan layak konsumsi dengan pencatatan transparan untuk warga sekitar.</p>
              <p className="mt-3 flex items-center gap-2 text-meta text-ink-secondary"><Clock size={18} aria-hidden="true" />Koordinasi Senin–Sabtu, 14.00–19.00 WIB</p>
            </section>
          </Reveal>
          <Reveal>
            <PolicyNote title="Privasi mitra">
              Alamat lengkap dan telepon dibuka kepada penerima setelah permintaan disetujui. Verifikasi memeriksa identitas, bukan mutu pangan.
            </PolicyNote>
          </Reveal>
        </div>
      </main>
    </>
  )
}

/* ---------- 404 ---------- */

export function NotFound() {
  return (
    <>
      <AppBar title="Halaman tidak ditemukan" />
      <main className="flex flex-col items-center gap-4 px-6 pb-8 pt-12 text-center">
        <span aria-hidden="true" className="flex h-24 w-24 animate-pop items-center justify-center rounded-full bg-primary-container text-primary">
          <Compass size={48} />
        </span>
        <p className="text-page-title">Jalur ini belum ada</p>
        <p className="max-w-[32ch] text-body text-ink-secondary">Tautan mungkin salah ketik atau halamannya sudah dipindahkan.</p>
        <div className="flex w-full max-w-[320px] flex-col gap-2">
          <ButtonLink to="/" block>Kembali ke Beranda</ButtonLink>
          <ButtonLink to="/bantuan" variant="ghost" block>Buka Pusat bantuan</ButtonLink>
        </div>
        <p className="mt-6 flex items-center gap-1.5 text-caption text-ink-secondary"><Warning size={14} aria-hidden="true" />Kode 404</p>
      </main>
    </>
  )
}
