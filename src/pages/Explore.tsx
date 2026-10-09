import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  BookmarkSimple,
  CaretRight,
  ChartBar,
  ChefHat,
  Gift,
  HeartStraight,
  Lightbulb,
  MagnifyingGlass,
  Microphone,
  Notebook,
  Trophy,
  Wrench,
} from '@phosphor-icons/react'
import { AppBar, Button, ButtonLink, Chip, Field, inputCls, Notice, Segmented, StatePanel } from '../components/ui'
import { useApp } from '../state/AppState'
import { tips } from '../data/mock'

/* ---------- H03 Semua fitur ---------- */

const features = [
  { to: '/pangan', icon: Notebook, title: 'Catat Pangan', desc: 'Persediaan, surplus, dan pangan terbuang' },
  { to: '/dampak', icon: ChartBar, title: 'Dampak', desc: 'Ringkasan per periode dengan sumber data' },
  { to: '/resep', icon: ChefHat, title: 'Resep dari Sisa', desc: 'Cari resep dari bahan yang ada, teks atau suara' },
  { to: '/tips', icon: Lightbulb, title: 'Tips Anti Food Waste', desc: 'Penyimpanan, perencanaan, dan donasi' },
  { to: '/tantangan', icon: Trophy, title: 'Eco Challenge', desc: 'Langkah kecil untuk kebiasaan baru' },
  { to: '/reward', icon: Gift, title: 'Reward dan apresiasi', desc: 'Paket Apresiasi Mitra dan Dukungan Penyaluran' },
  { to: '/dukung', icon: HeartStraight, title: 'Dukung Lestari Pangan', desc: 'Donasi operasional sukarela dan laporan' },
]

export function Features() {
  return (
    <>
      <AppBar title="Semua fitur" />
      <main className="grid grid-cols-1 gap-3 px-4 pb-10 pt-4 sm:grid-cols-2">
        {features.map(({ to, icon: Icon, title, desc }) => (
          <Link key={to} to={to} className="tap card flex items-center gap-3 p-4 hover:bg-page">
            <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-control bg-primary-container text-primary">
              <Icon size={26} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{title}</span>
              <span className="block text-meta text-ink-secondary">{desc}</span>
            </span>
            <CaretRight size={20} aria-hidden="true" className="text-ink-secondary" />
          </Link>
        ))}
      </main>
    </>
  )
}

/* ---------- I01 Dashboard dampak ---------- */

export function Impact() {
  const { state } = useApp()
  const donor = state.role === 'pemberi'
  const [period, setPeriod] = useState<'okt' | 'sep'>('okt')
  const done = state.transfers.filter((t) => t.received !== undefined && (donor ? t.donorName === 'Warung Kebun' : t.recipientName === 'Komunitas Berbagi'))
  const received = period === 'okt' ? done.reduce((s, t) => s + (t.received ?? 0), 0) : 0
  const rejected = period === 'okt' ? done.reduce((s, t) => s + (t.rejected ?? 0), 0) : 0
  const offered = period === 'okt' ? state.offers.filter((o) => o.donorName === 'Warung Kebun' && o.status !== 'Draf').reduce((s, o) => s + (o.unit === 'porsi' ? o.initial : 0), 0) : 0
  const wasted = period === 'okt' ? state.records.filter((r) => r.owner === state.role && r.status === 'Terbuang' && r.unit === 'porsi').reduce((s, r) => s + r.quantity, 0) : 0

  const metrics = donor
    ? [
        ['Surplus ditawarkan', offered, 'Penawaran diterbitkan'],
        ['Diterima penerima', received, 'Konfirmasi penerima'],
        ['Tidak diterima', rejected, 'Konfirmasi penerima'],
        ['Terbuang', wasted, 'Catatan pribadi'],
      ]
    : [
        ['Diterima aktual', received, 'Konfirmasi Anda'],
        ['Ditolak saat serah terima', rejected, 'Konfirmasi Anda'],
        ['Didistribusikan', period === 'okt' ? 9 : 0, 'Laporan distribusi'],
        ['Digunakan sendiri', period === 'okt' ? 1 : 0, 'Laporan distribusi'],
      ]

  return (
    <>
      <AppBar title="Dampak" />
      <main className="flex flex-col gap-4 px-4 pb-10 pt-4">
        <Segmented label="Periode" value={period} onChange={setPeriod} options={[{ value: 'okt', label: 'Oktober 2026' }, { value: 'sep', label: 'September 2026' }]} />
        <p className="text-meta text-ink-secondary">Satuan: porsi. Kilogram dan kemasan ditampilkan terpisah, tidak dijumlahkan.</p>
        {period === 'sep' ? (
          <StatePanel title="Belum ada data">Tidak ada kegiatan terkonfirmasi pada periode ini. Ini berbeda dengan “nol food waste”.</StatePanel>
        ) : (
          <dl className="grid grid-cols-2 gap-3">
            {metrics.map(([label, value, source]) => (
              <div key={label as string} className="card p-4">
                <dt className="text-meta text-ink-secondary">{label}</dt>
                <dd className="text-display text-primary">{value}</dd>
                <dd className="text-caption text-ink-secondary">porsi · {source}</dd>
              </div>
            ))}
          </dl>
        )}
        <Notice tone="info" title="Cara membaca data">
          Penawaran belum dihitung sebagai donasi berhasil. Catatan pemberi dan penerima untuk kegiatan yang sama tidak dihitung dua kali. Estimasi emisi belum ditampilkan sampai metodenya tersedia.
        </Notice>
      </main>
    </>
  )
}

/* ---------- T01 / T02 Tips ---------- */

export function Tips() {
  const { state } = useApp()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState<string | null>(null)
  const cats = [...new Set(tips.map((t) => t.category))]
  const list = tips.filter((t) => (!cat || t.category === cat) && `${t.title} ${t.summary}`.toLowerCase().includes(q.toLowerCase()))
  return (
    <>
      <AppBar title="Tips Anti Food Waste" />
      <main className="flex flex-col gap-4 px-4 pb-10 pt-4">
        <div className="flex min-h-[52px] items-center gap-2 rounded-control border border-line-control bg-surface px-3">
          <MagnifyingGlass size={22} aria-hidden="true" className="text-ink-secondary" />
          <input aria-label="Cari tips" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari tips" className="min-w-0 flex-1 bg-transparent py-3 outline-none" />
        </div>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4">
          <Chip selected={!cat} onClick={() => setCat(null)}>Semua</Chip>
          {cats.map((c) => <Chip key={c} selected={cat === c} onClick={() => setCat(c)}>{c}</Chip>)}
        </div>
        {list.map((t) => (
          <Link key={t.id} to={`/tips/${t.id}`} className="tap card flex gap-3 overflow-hidden p-3 hover:bg-page">
            {t.photo ? <img src={t.photo} alt="" className="h-20 w-20 shrink-0 rounded-control object-cover" /> : <span aria-hidden="true" className="flex h-20 w-20 shrink-0 items-center justify-center rounded-control bg-primary-container text-primary"><Lightbulb size={32} /></span>}
            <span className="min-w-0">
              <span className="text-caption font-semibold text-primary">{t.category} · {t.minutes} menit</span>
              <span className="block font-semibold">{t.title}</span>
              <span className="block text-meta text-ink-secondary">{t.summary}</span>
              {state.savedTips.includes(t.id) && <span className="text-caption text-primary">Tersimpan</span>}
            </span>
          </Link>
        ))}
        {list.length === 0 && <StatePanel title="Tips tidak ditemukan">Coba kata kunci atau kategori lain.</StatePanel>}
      </main>
    </>
  )
}

export function TipDetail() {
  const { id } = useParams()
  const { state, dispatch } = useApp()
  const tip = tips.find((t) => t.id === id)
  if (!tip) return <><AppBar title="Tips" /><main className="p-4"><StatePanel title="Konten tidak tersedia" /></main></>
  const saved = state.savedTips.includes(tip.id)
  return (
    <>
      <AppBar
        title="Artikel tips"
        actions={
          <button type="button" aria-pressed={saved} onClick={() => dispatch({ type: 'toggleTip', id: tip.id })} className="tap flex h-12 items-center gap-1 rounded-full px-3 text-[0.875rem] font-semibold text-primary hover:bg-primary-container">
            <BookmarkSimple size={22} weight={saved ? 'fill' : 'regular'} aria-hidden="true" />
            {saved ? 'Tersimpan' : 'Simpan'}
          </button>
        }
      />
      <main className="mx-auto max-w-read pb-10">
        {tip.photo && <img src={tip.photo} alt="" className="aspect-[2/1] w-full object-cover" />}
        <article className="flex flex-col gap-4 px-4 pt-4">
          <p className="text-caption font-semibold text-primary">{tip.category} · {tip.minutes} menit baca</p>
          <h1 className="text-page-title">{tip.title}</h1>
          {tip.body.map((p, i) => <p key={i} className="text-body">{p}</p>)}
          <p className="text-caption text-ink-secondary">{tip.reviewed}</p>
        </article>
      </main>
    </>
  )
}

/* ---------- R01 Resep dari Sisa ---------- */

export function Recipes() {
  const [ingredients, setIngredients] = useState('wortel, nasi putih')
  const [portions, setPortions] = useState('2')
  const [searched, setSearched] = useState(false)
  return (
    <>
      <AppBar title="Resep dari Sisa" />
      <main className="mx-auto flex max-w-[560px] flex-col gap-4 px-4 pb-10 pt-4">
        <section className="rounded-card bg-primary-container p-4">
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white"><Microphone size={24} /></span>
            <div className="flex-1">
              <p className="font-semibold">Bicara dengan asisten resep</p>
              <p className="text-meta text-ink-secondary">Sebutkan bahan yang ada, lalu tanya langkah memasak.</p>
            </div>
          </div>
          <Button variant="secondary" block className="mt-3" disabled>
            Percakapan suara belum tersedia
          </Button>
          <p className="mt-2 text-caption text-ink-secondary">Penyedia API suara belum dipilih. Gunakan pencarian teks di bawah.</p>
        </section>
        <Field label="Bahan yang tersedia" hint="Pisahkan dengan koma.">
          {(p) => <input {...p} className={inputCls} value={ingredients} onChange={(e) => setIngredients(e.target.value)} />}
        </Field>
        <Field label="Jumlah porsi">{(p) => <input {...p} inputMode="numeric" className={inputCls} value={portions} onChange={(e) => setPortions(e.target.value.replace(/\D/g, ''))} />}</Field>
        <Button block onClick={() => setSearched(true)}>Cari resep</Button>
        {searched && (
          <section aria-live="polite" className="flex flex-col gap-3">
            <h2 className="text-section-title">Pilihan resep</h2>
            {[
              ['Nasi goreng wortel', 'Bahan dimiliki: nasi putih, wortel', 'Tambahan: bawang putih, kecap, telur (opsional)'],
              ['Perkedel nasi wortel', 'Bahan dimiliki: nasi putih, wortel', 'Tambahan: tepung, daun bawang'],
            ].map(([t, a, b]) => (
              <div key={t} className="card p-4">
                <p className="font-semibold">{t}</p>
                <p className="text-meta text-primary">{a}</p>
                <p className="text-meta text-ink-secondary">{b}</p>
                <p className="mt-1 text-caption text-ink-secondary">Contoh katalog demo · {portions || 1} porsi</p>
              </div>
            ))}
            <p className="text-caption text-ink-secondary">Asisten resep tidak menilai keamanan pangan dari foto, tanggal, atau percakapan.</p>
          </section>
        )}
      </main>
    </>
  )
}

/* ---------- E01 Eco Challenge ---------- */

export function Challenges() {
  const { state } = useApp()
  const [tab, setTab] = useState<'tersedia' | 'diikuti'>('tersedia')
  const items =
    state.role === 'pemberi'
      ? [['Catat surplus 3 hari', 'Catat pangan yang tersisa pada 3 hari berbeda dalam Oktober 2026.', '0 dari 3 hari'], ['Label informasi donasi', 'Lengkapi informasi bahan pada 2 penawaran.', '1 dari 2 penawaran']]
      : [['Laporkan distribusi', 'Isi laporan penggunaan/distribusi untuk 2 penerimaan.', '1 dari 2 laporan'], ['Simpan dengan rapi', 'Catat cara penyimpanan pada 3 catatan pangan.', '1 dari 3 catatan']]
  return (
    <>
      <AppBar title="Eco Challenge" />
      <main className="flex flex-col gap-4 px-4 pb-10 pt-4">
        <Segmented label="Challenge" value={tab} onChange={setTab} options={[{ value: 'tersedia', label: 'Tersedia' }, { value: 'diikuti', label: 'Diikuti' }]} />
        {tab === 'diikuti' ? (
          <StatePanel icon={<img src="/illustrations/medali-daun.svg" alt="" className="h-16 w-16" />} title="Belum mengikuti challenge">Pilih challenge di tab Tersedia.</StatePanel>
        ) : (
          items.map(([t, d, p]) => (
            <article key={t} className="card p-4">
              <div className="flex items-start gap-3">
                <img src="/illustrations/medali-daun.svg" alt="" className="h-12 w-12 shrink-0" />
                <div>
                  <h2 className="font-semibold">{t}</h2>
                  <p className="text-meta text-ink-secondary">{d}</p>
                  <p className="mt-1 text-meta font-semibold">Contoh progres: {p}</p>
                </div>
              </div>
              <Button variant="tonal" block className="mt-3 min-h-12" disabled>Ikuti challenge (segera)</Button>
            </article>
          ))
        )}
        <p className="text-caption text-ink-secondary">Challenge tidak memakai peringkat kilogram donasi. Reward tidak memberi prioritas memperoleh pangan. Target masih contoh.</p>
      </main>
    </>
  )
}

/* ---------- Placeholder layar yang belum dibangun ---------- */

export function ComingSoon({ title }: { title: string }) {
  return (
    <>
      <AppBar title={title} />
      <main className="p-4">
        <StatePanel icon={<Wrench size={40} className="text-ink-secondary" />} title="Layar ini belum dibangun" action={<ButtonLink to="/" variant="secondary">Kembali ke Beranda</ButtonLink>}>
          Desainnya ada di Google Stitch dan akan ditambahkan pada tahap berikutnya.
        </StatePanel>
      </main>
    </>
  )
}
