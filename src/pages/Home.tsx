import { Link, useNavigate } from 'react-router-dom'
import { CaretDown, CaretRight, Check, Clock, Gift, HandHeart, MagnifyingGlass, MapPin, Tray } from '@phosphor-icons/react'
import { RootHeader } from '../components/Layouts'
import { DemoNote, SectionHeader } from '../components/ui'
import { FoodCardCompact, FoodCardSearch } from '../components/FoodCard'
import { useApp, useProfile } from '../state/AppState'
import { tips } from '../data/mock'
import { asset } from '../lib/format'

/** Daun dekoratif pada modul sapaan (H01 botanical greeting). */
function LeafDecor() {
  return (
    <svg aria-hidden="true" viewBox="0 0 120 120" className="pointer-events-none absolute -right-3 -top-3 h-32 w-32 text-primary/15" fill="none" stroke="currentColor" strokeWidth="3">
      <path d="M60 110C25 90 15 50 40 15c35 15 50 55 20 95Z" />
      <path d="M60 110C55 80 48 50 40 15" />
      <circle cx="102" cy="22" r="5" fill="#FFB74D" stroke="none" opacity=".6" />
    </svg>
  )
}

function Shortcut({ to, img, label }: { to: string; img: string; label: string }) {
  return (
    <Link to={to} className="tap flex min-h-[96px] flex-col items-center justify-start gap-1 rounded-card px-1 py-2 text-center hover:bg-surface">
      <img src={asset(img)} alt="" className="h-12 w-12" />
      <span className="text-[0.875rem] font-medium leading-5">{label}</span>
    </Link>
  )
}

function InspirationSection() {
  const tip = tips[0]
  return (
    <section aria-labelledby="inspirasi" className="flex flex-col gap-3">
      <h2 id="inspirasi" className="text-section-title">Inspirasi untukmu</h2>
      <Link to={`/tips/${tip.id}`} className="tap card block overflow-hidden hover:border-line-control">
        <div className="relative">
          <img src={tip.photo} alt="" className="aspect-[2/1] w-full object-cover" />
          <span className="absolute left-3 top-3 rounded-full bg-surface px-2.5 py-1 text-caption font-semibold">Tips</span>
        </div>
        <div className="p-4">
          <h3 className="text-card-title">{tip.title}</h3>
          <p className="mt-1 text-body text-ink-secondary">{tip.summary}</p>
          <span className="mt-2 inline-flex items-center gap-1 text-[0.875rem] font-semibold text-primary">
            Baca selengkapnya <CaretRight size={16} weight="bold" aria-hidden="true" />
          </span>
        </div>
      </Link>
      <Link to="/tantangan" className="tap flex items-center gap-3 rounded-card border border-accent/60 bg-accent-soft p-4 hover:border-accent">
        <img src={asset('illustrations/medali-daun.svg')} alt="" className="h-14 w-14 shrink-0" />
        <span className="min-w-0 flex-1">
          <span className="block text-[1rem] font-semibold">Tantangan</span>
          <span className="block text-meta text-ink-secondary">Temukan langkah kecil untuk mengurangi sisa pangan.</span>
        </span>
        <CaretRight size={20} aria-hidden="true" className="shrink-0 text-ink-secondary" />
      </Link>
    </section>
  )
}

function DonorHome() {
  const { state } = useApp()
  const profile = useProfile()
  const navigate = useNavigate()
  const pending = state.requests.filter((r) => r.status === 'Diajukan' && state.offers.some((o) => o.id === r.offerId && o.donorName === profile.name))
  const active = state.offers.filter((o) => o.donorName === profile.name && o.status === 'Tersedia').slice(0, 3)
  const received = state.transfers
    .filter((t) => t.donorName === profile.name && (t.status === 'Diterima penuh' || t.status === 'Diterima sebagian'))
    .reduce((s, t) => s + (t.received ?? 0), 0)

  return (
    <div className="flex flex-col gap-6 px-4 pt-4">
      <section aria-label="Sapaan" className="relative overflow-hidden rounded-greet border border-line bg-gradient-to-br from-primary-container to-surface p-4">
        <LeafDecor />
        <h1 className="relative text-page-title">Halo, {profile.name}</h1>
        <p className="relative text-body text-ink-secondary">Siap berbagi hari ini?</p>
        <div className="relative mt-3 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-primary/30 bg-primary-container px-3 py-1 text-[0.875rem] font-semibold text-primary">Pemberi</span>
          <Link to="/akun/lokasi" className="tap inline-flex min-h-12 items-center gap-1 rounded-full px-2 text-[0.875rem] font-medium hover:bg-surface">
            <MapPin size={18} aria-hidden="true" /> Bandung <CaretDown size={14} aria-hidden="true" />
          </Link>
          <span className="ml-auto rounded-full border border-line bg-surface px-2.5 py-0.5 text-caption text-ink-secondary">Data demo</span>
        </div>
        {pending.length > 0 && (
          <div className="relative mt-3 flex items-center gap-3 rounded-card border border-line bg-surface p-2 pl-3">
            <Tray size={24} aria-hidden="true" className="shrink-0 text-primary" />
            <p className="min-w-0 flex-1 text-[1rem] font-medium">{pending.length} permintaan baru</p>
            <Link to="/aktivitas/permintaan" className="tap inline-flex min-h-12 items-center rounded-control bg-primary-container px-4 text-[1rem] font-semibold text-primary hover:bg-[#DCEFDF]">
              Tinjau
            </Link>
          </div>
        )}
      </section>

      <section aria-label="Tawarkan pangan" className="rounded-card border border-primary/20 bg-primary-container/60 p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-card-title">Punya pangan berlebih?</h2>
          <img src={asset('illustrations/keranjang.svg')} alt="" className="h-12 w-12" />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={() => navigate('/donasi/baru')} className="tap inline-flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-control bg-primary px-3 text-[1rem] font-semibold text-white hover:bg-primary-pressed">
            <HandHeart size={22} aria-hidden="true" className="shrink-0 max-[359px]:hidden" /> Tawarkan Pangan
          </button>
          <button type="button" onClick={() => navigate('/pangan')} className="tap min-h-[52px] w-[7.25rem] grow-0 rounded-control border border-line-control bg-surface px-3 text-[0.9375rem] font-medium leading-5 hover:bg-page">
            Dari Catat Pangan
          </button>
        </div>
      </section>

      <nav aria-label="Pintasan" className="-mt-2 grid grid-cols-[repeat(auto-fit,minmax(5.25rem,1fr))] gap-1">
        <Shortcut to="/pangan" img="illustrations/catat-pangan.svg" label="Catat Pangan" />
        <Shortcut to="/dampak" img="illustrations/dampak.svg" label="Dampak" />
        <Shortcut to="/resep" img="illustrations/resep.svg" label="Resep" />
        <Shortcut to="/fitur" img="illustrations/semua-fitur.svg" label="Semua fitur" />
      </nav>

      <section aria-labelledby="penawaran-aktif" className="flex flex-col gap-3">
        <SectionHeader id="penawaran-aktif" title="Penawaran aktif" to="/donasi" />
        {active.length ? (
          active.map((o) => <FoodCardCompact key={o.id} offer={o} to={`/donasi/kelola/${o.id}`} />)
        ) : (
          <p className="card p-4 text-body text-ink-secondary">Belum ada penawaran aktif. Tawarkan pangan pertama Anda.</p>
        )}
      </section>

      <section aria-labelledby="dampak-berbagi" className="flex flex-col gap-3">
        <SectionHeader id="dampak-berbagi" title="Dampak berbagi" to="/dampak" linkLabel="Lihat dampak" />
        <div className="relative flex items-center gap-3 overflow-hidden rounded-card border border-line bg-gradient-to-br from-primary-container/70 to-surface p-4">
          <div className="min-w-0 flex-1">
            <p className="text-display text-primary">{received} porsi</p>
            <p className="text-[1rem] font-medium">diterima penerima</p>
            <p className="mt-1 flex items-center gap-1 text-meta text-primary">
              <Check size={16} weight="bold" aria-hidden="true" /> Terkonfirmasi · Oktober 2026
            </p>
            <p className="text-meta text-ink-secondary">Sumber: penerimaan terkonfirmasi</p>
          </div>
          <img src={asset('illustrations/tangan-berbagi.svg')} alt="" className="h-16 w-16 shrink-0" />
        </div>
      </section>

      <InspirationSection />
      <DemoNote />
    </div>
  )
}

function RecipientHome() {
  const { state } = useApp()
  const profile = useProfile()
  const navigate = useNavigate()
  const next = state.transfers.find((t) => t.recipientName === profile.name && (t.status === 'Terjadwal' || t.status === 'Diserahkan'))
  const available = state.offers.filter((o) => o.status === 'Tersedia' && o.available > 0).slice(0, 2)
  const received = state.transfers
    .filter((t) => t.recipientName === profile.name && t.received !== undefined)
    .reduce((s, t) => s + (t.received ?? 0), 0)

  return (
    <div className="flex flex-col gap-6 px-4 pt-4">
      <section aria-label="Sapaan" className="relative overflow-hidden rounded-greet border border-line bg-gradient-to-br from-primary-container to-surface p-4">
        <LeafDecor />
        <div className="relative flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-primary/30 bg-primary-container px-3 py-1 text-[0.875rem] font-semibold text-primary">Penerima</span>
          <Link to="/akun/lokasi" className="tap inline-flex min-h-12 items-center gap-1 rounded-full px-2 text-[0.875rem] font-medium hover:bg-surface">
            <MapPin size={18} aria-hidden="true" /> {profile.area} <CaretDown size={14} aria-hidden="true" />
          </Link>
        </div>
        <h1 className="relative mt-2 text-page-title">Halo, {profile.name}</h1>
        <p className="relative text-body text-ink-secondary">Cek jadwal dan pangan yang tersedia di sekitar Anda.</p>
      </section>

      {next && (
        <section aria-labelledby="jadwal" className="card border-primary/40 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="jadwal" className="text-label uppercase tracking-wide text-primary">Pengambilan terdekat</h2>
            <span className="rounded-full bg-warning-container px-2.5 py-0.5 text-caption font-semibold text-warning">{next.date}</span>
          </div>
          <p className="mt-2 text-card-title">
            {next.agreed} {next.unit} {next.foodName.toLowerCase()}
          </p>
          <p className="text-meta text-ink-secondary">Dari {next.donorName} · {next.id}</p>
          <p className="mt-1 flex items-center gap-1.5 text-meta">
            <Clock size={18} aria-hidden="true" className="text-primary" /> {next.timeStart}–{next.timeEnd} WIB · {next.method}
          </p>
          <Link to={`/aktivitas/${next.id}`} className="tap mt-3 flex min-h-[52px] items-center justify-center gap-1 rounded-control bg-primary text-[1rem] font-semibold text-white hover:bg-primary-pressed">
            Lihat penyaluran <CaretRight size={18} weight="bold" aria-hidden="true" />
          </Link>
        </section>
      )}

      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault()
          const q = new FormData(e.currentTarget).get('q')
          navigate(`/donasi${q ? `?q=${encodeURIComponent(String(q))}` : ''}`)
        }}
      >
        <label htmlFor="home-search" className="sr-only">Cari pangan</label>
        <div className="flex min-h-[52px] items-center gap-2 rounded-control border border-line-control bg-surface px-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/30">
          <MagnifyingGlass size={22} aria-hidden="true" className="text-ink-secondary" />
          <input id="home-search" name="q" placeholder="Cari nama atau jenis pangan" className="min-w-0 flex-1 bg-transparent py-3 text-body outline-none placeholder:text-ink-secondary" />
          <button type="submit" className="tap -mr-1 min-h-12 rounded-control bg-primary-container px-4 text-[0.875rem] font-semibold text-primary">Cari</button>
        </div>
      </form>

      <nav aria-label="Pintasan" className="-mt-2 grid grid-cols-[repeat(auto-fit,minmax(5.25rem,1fr))] gap-1">
        <Shortcut to="/pangan" img="illustrations/catat-pangan.svg" label="Pangan diterima" />
        <Shortcut to="/dampak" img="illustrations/dampak.svg" label="Dampak" />
        <Shortcut to="/resep" img="illustrations/resep.svg" label="Resep" />
        <Shortcut to="/fitur" img="illustrations/semua-fitur.svg" label="Semua fitur" />
      </nav>

      <section aria-labelledby="tersedia" className="flex flex-col gap-3">
        <SectionHeader id="tersedia" title="Tersedia di sekitar Anda" to="/donasi" />
        {available.map((o) => (
          <FoodCardSearch key={o.id} offer={o} />
        ))}
      </section>

      <section aria-labelledby="dampak-diterima" className="flex flex-col gap-3">
        <SectionHeader id="dampak-diterima" title="Pangan diterima" to="/dampak" linkLabel="Lihat dampak" />
        <div className="flex items-center gap-3 rounded-card border border-line bg-gradient-to-br from-primary-container/70 to-surface p-4">
          <div className="min-w-0 flex-1">
            <p className="text-display text-primary">{received} porsi</p>
            <p className="text-[1rem] font-medium">diterima aktual · Oktober 2026</p>
            <p className="text-meta text-ink-secondary">Sumber: konfirmasi penerimaan Anda</p>
          </div>
          <img src={asset('illustrations/tangan-berbagi.svg')} alt="" className="h-16 w-16 shrink-0" />
        </div>
      </section>

      <InspirationSection />
      <Link to="/dukung" className="tap flex items-center gap-3 rounded-card border border-line bg-surface p-4 hover:bg-page">
        <Gift size={24} aria-hidden="true" className="text-primary" />
        <span className="flex-1 text-meta">Dukung operasional Lestari Pangan secara sukarela.</span>
        <CaretRight size={18} aria-hidden="true" className="text-ink-secondary" />
      </Link>
      <DemoNote />
    </div>
  )
}

export default function Home() {
  const { state } = useApp()
  return (
    <>
      <RootHeader />
      {state.role === 'pemberi' ? <DonorHome /> : <RecipientHome />}
    </>
  )
}
