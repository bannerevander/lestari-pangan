import type { ReactNode } from 'react'
import { PromoBanner } from '../components/PromoBanner'
import { cityOf, shortCity } from '../lib/area'
import { Link, useNavigate } from 'react-router-dom'
import { CaretDown, CaretRight, Check, Clock, Gift, HandHeart, MagnifyingGlass, MapPin, Tray } from '@phosphor-icons/react'
import { RootHeader } from '../components/Layouts'
import { CountUp, SectionHeader } from '../components/ui'
import { FoodCardCompact, FoodCardSearch } from '../components/FoodCard'
import { useApp } from '../state/AppState'
import { useProfile } from '../state/useProfile'
import { asset, methodLabel } from '../lib/format'
import { EcoChallengeCard } from './EcoChallengeCard'

/*
 * Urutan Beranda mengikuti pola super-app (Gojek, Grab, Tokopedia, Shopee):
 * sapaan + aksi utama/pencarian → strip poin (Eco Challenge) → status berjalan → pintasan → promo → daftar → konten.
 */

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

/** Sapaan + peran + area; `children` = aksi utama peran (tombol tawarkan / kolom cari). */
function Greeting({ role, area, subtitle, children }: { role: string; area: string; subtitle?: string; children: ReactNode }) {
  const { name } = useProfile()
  return (
    <section aria-label="Sapaan" className="relative overflow-hidden rounded-greet border border-line bg-gradient-to-br from-primary-container to-surface p-4">
      <LeafDecor />
      <div className="relative flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-primary/30 bg-primary-container px-3 py-1 text-[0.875rem] font-semibold text-primary">{role}</span>
        <Link to="/area" className="tap inline-flex min-h-12 items-center gap-1 rounded-full px-2 text-[0.875rem] font-medium hover:bg-surface">
          <MapPin size={18} aria-hidden="true" /> {area} <CaretDown size={14} aria-hidden="true" />
        </Link>
      </div>
      <h1 className="relative text-page-title">Halo, {name}</h1>
      {subtitle && <p className="relative text-body text-ink-secondary">{subtitle}</p>}
      <div className="relative mt-3">{children}</div>
    </section>
  )
}

function HomeSearch() {
  const navigate = useNavigate()
  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault()
        const q = new FormData(e.currentTarget).get('q')
        navigate(`/donasi${q ? `?q=${encodeURIComponent(String(q))}` : ''}`)
      }}
    >
      <label htmlFor="home-search" className="sr-only">Cari pangan</label>
      <div className="flex min-h-[52px] items-center gap-2 rounded-control border border-line-control bg-surface px-3 shadow-card focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/30">
        <MagnifyingGlass size={22} aria-hidden="true" className="text-ink-secondary" />
        <input id="home-search" name="q" placeholder="Cari nama atau jenis pangan" className="min-w-0 flex-1 bg-transparent py-3 text-body outline-none placeholder:text-ink-secondary" />
        <button type="submit" className="tap -mr-1 min-h-12 rounded-control bg-primary-container px-4 text-[0.875rem] font-semibold text-primary">Cari</button>
      </div>
    </form>
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

/** Konten edukasi sebagai rail kartu potret berjudul di atas foto (pola Explore Gojek / story), beda bentuk dari kartu pangan. */
function InspirationSection() {
  const tips = useApp().state.tips.slice(0, 6)
  if (!tips.length) return null
  return (
    <section aria-labelledby="inspirasi" className="flex flex-col gap-3">
      <SectionHeader id="inspirasi" title="Inspirasi untukmu" to="/tips" />
      <ul className="chip-row -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
        {tips.map((t) => (
          // Lebar 9.5rem: kartu ketiga terlihat sebagian di HP 375 px, tanda baris bisa digeser.
          <li key={t.id} className="w-[9.5rem] shrink-0">
            <Link to={`/tips/${t.id}`} className="tap tap-soft relative block aspect-[3/4] overflow-hidden rounded-card bg-primary-pressed shadow-card">
              {t.photo && <img src={t.photo} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />}
              {/* Gradasi hijau gelap dari bawah: judul putih tetap terbaca di atas foto apa pun. */}
              <span aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(0deg,rgba(10,32,16,0.9)_0%,rgba(10,32,16,0.5)_45%,rgba(10,32,16,0)_72%)]" />
              <span className="absolute left-2 top-2 max-w-[calc(100%-1rem)] truncate rounded-full bg-surface px-2.5 py-1 text-caption font-semibold">{t.category}</span>
              <span className="absolute inset-x-0 bottom-0 p-3">
                <span className="line-clamp-3 block font-semibold leading-5 text-[#fff]">{t.title}</span>
                <span className="mt-1 block text-caption text-[#fff]/85">{t.minutes} menit baca</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
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
    <div className="stagger flex flex-col gap-6 px-4 pt-4">
      <Greeting role="Pemberi" area={profile.area ? shortCity(cityOf(profile.area)) : 'Pilih area'} subtitle="Punya pangan berlebih hari ini?">
        <button type="button" onClick={() => navigate('/donasi/baru')} className="tap inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-control bg-primary px-3 text-[1rem] font-semibold text-white shadow-card hover:bg-primary-pressed">
          <HandHeart size={22} aria-hidden="true" className="shrink-0" /> Tawarkan Pangan
        </button>
        <button type="button" onClick={() => navigate('/pangan')} className="tap mt-1 inline-flex min-h-12 w-full items-center justify-center gap-1 rounded-control px-3 text-[0.9375rem] font-semibold text-primary hover:bg-primary-container">
          atau pilih dari Catat Pangan <CaretRight size={16} weight="bold" aria-hidden="true" />
        </button>
      </Greeting>

      <EcoChallengeCard />

      {pending.length > 0 && (
        <section aria-labelledby="perlu-tindakan" className="card flex items-center gap-3 border-primary/40 p-3 pl-4">
          <Tray size={28} aria-hidden="true" className="shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <h2 id="perlu-tindakan" className="text-label uppercase tracking-wide text-primary">Perlu tindakan</h2>
            <p className="text-[1rem] font-semibold">{pending.length} permintaan baru</p>
          </div>
          <Link to="/aktivitas/permintaan" className="tap inline-flex min-h-12 items-center rounded-control bg-primary px-4 text-[1rem] font-semibold text-white hover:bg-primary-pressed">
            Tinjau
          </Link>
        </section>
      )}

      <nav aria-label="Pintasan" className="-mt-2 grid grid-cols-4 gap-1">
        <Shortcut to="/pangan" img="illustrations/catat-pangan.svg" label="Catat Pangan" />
        <Shortcut to="/dampak" img="illustrations/dampak.svg" label="Dampak" />
        <Shortcut to="/resep" img="illustrations/resep.svg" label="Resep" />
        <Shortcut to="/fitur" img="illustrations/semua-fitur.svg" label="Semua fitur" />
      </nav>

      <section aria-labelledby="penawaran-aktif" className="-mt-2 flex flex-col gap-3">
        <SectionHeader id="penawaran-aktif" title="Penawaran aktif" to="/donasi" />
        {active.length ? (
          active.map((o) => <FoodCardCompact key={o.id} offer={o} to={`/donasi/kelola/${o.id}`} />)
        ) : (
          <p className="card p-4 text-body text-ink-secondary">Belum ada penawaran aktif. Tawarkan pangan pertama Anda.</p>
        )}
      </section>

      <PromoBanner placement="beranda" />

      <section aria-labelledby="dampak-berbagi" className="flex flex-col gap-3">
        <SectionHeader id="dampak-berbagi" title="Dampak berbagi" to="/dampak" linkLabel="Lihat dampak" />
        <div className="relative flex items-center gap-3 overflow-hidden rounded-card border border-line bg-gradient-to-br from-primary-container/70 to-surface p-4">
          <div className="min-w-0 flex-1">
            <p className="text-display text-primary"><CountUp value={received} /> porsi</p>
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
    </div>
  )
}

function RecipientHome() {
  const { state } = useApp()
  const profile = useProfile()
  const next = state.transfers.find((t) => t.recipientName === profile.name && (t.status === 'Terjadwal' || t.status === 'Diserahkan'))
  const available = state.offers.filter((o) => o.status === 'Tersedia' && o.available > 0).slice(0, 2)
  const received = state.transfers
    .filter((t) => t.recipientName === profile.name && t.received !== undefined)
    .reduce((s, t) => s + (t.received ?? 0), 0)

  return (
    <div className="stagger flex flex-col gap-6 px-4 pt-4">
      <Greeting role="Penerima" area={profile.area}>
        <HomeSearch />
      </Greeting>

      <EcoChallengeCard />

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
            <Clock size={18} aria-hidden="true" className="text-primary" /> {next.timeStart}–{next.timeEnd} WIB · {methodLabel(next.method)}
          </p>
          <Link to={`/aktivitas/${next.id}`} className="tap mt-3 flex min-h-[52px] items-center justify-center gap-1 rounded-control bg-primary text-[1rem] font-semibold text-white hover:bg-primary-pressed">
            Lihat penyaluran <CaretRight size={18} weight="bold" aria-hidden="true" />
          </Link>
        </section>
      )}

      <nav aria-label="Pintasan" className="-mt-2 grid grid-cols-4 gap-1">
        <Shortcut to="/pangan" img="illustrations/catat-pangan.svg" label="Pangan diterima" />
        <Shortcut to="/dampak" img="illustrations/dampak.svg" label="Dampak" />
        <Shortcut to="/resep" img="illustrations/resep.svg" label="Resep" />
        <Shortcut to="/fitur" img="illustrations/semua-fitur.svg" label="Semua fitur" />
      </nav>

      <PromoBanner placement="beranda" className="-mt-2" />

      <section aria-labelledby="tersedia" className="flex flex-col gap-3">
        <SectionHeader id="tersedia" title="Pangan di sekitar Anda" to="/donasi" />
        {available.map((o) => (
          <FoodCardSearch key={o.id} offer={o} />
        ))}
      </section>

      <section aria-labelledby="dampak-diterima" className="flex flex-col gap-3">
        <SectionHeader id="dampak-diterima" title="Pangan diterima" to="/dampak" linkLabel="Lihat dampak" />
        <div className="flex items-center gap-3 rounded-card border border-line bg-gradient-to-br from-primary-container/70 to-surface p-4">
          <div className="min-w-0 flex-1">
            <p className="text-display text-primary"><CountUp value={received} /> porsi</p>
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
