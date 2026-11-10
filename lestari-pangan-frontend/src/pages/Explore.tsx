import { PromoBanner } from '../components/PromoBanner'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  BookmarkSimple,
  CaretRight,
  Gift,
  HeartStraight,
  Lightbulb,
  MagnifyingGlass,
  Microphone,
  Notebook,
  Plus,
  Question,
  Receipt,
  X,
} from '@phosphor-icons/react'
import { matchRecipes } from '../data/recipes'
import { AppBar, Badge, Button, ButtonLink, Chip, CountUp, inputCls, Notice, Segmented, StatePanel, StickyFooter, ChipRow, toast } from '../components/ui'
import { useApp } from '../state/AppState'
import { useCommand } from '../state/useCommand'
import { messageOf } from '../lib/supabase/errors'
import { useProfile } from '../state/useProfile'
import { asset } from '../lib/format'

/* ---------- H03 Semua fitur ---------- */

type Feature = { to: string; img?: string; icon?: typeof Notebook; title: string; desc: string; badge?: string }

const featureGroups: { title: string; note?: string; items: Feature[] }[] = [
  {
    title: 'Berbagi dan mencatat',
    items: [
      { to: '/donasi', img: 'illustrations/tangan-berbagi.svg', title: 'Donasi Pangan', desc: 'Tawarkan atau cari pangan surplus layak konsumsi', badge: 'Utama' },
      { to: '/pangan', img: 'illustrations/catat-pangan.svg', title: 'Catat Pangan', desc: 'Persediaan, surplus, dan pangan terbuang' },
      { to: '/dampak', img: 'illustrations/dampak.svg', title: 'Dampak', desc: 'Ringkasan per periode dengan sumber data' },
    ],
  },
  {
    title: 'Ide dan kebiasaan',
    items: [
      { to: '/resep', img: 'illustrations/resep.svg', title: 'Resep dari Sisa', desc: 'Olahan dari bahan yang masih ada' },
      { to: '/tips', icon: Lightbulb, title: 'Tips Anti Food Waste', desc: 'Penyimpanan, perencanaan, dan donasi' },
      { to: '/tantangan', img: 'illustrations/medali-daun.svg', title: 'Eco Challenge', desc: 'Langkah kecil untuk kebiasaan baru' },
      { to: '/reward', icon: Gift, title: 'Reward dan apresiasi', desc: 'Apresiasi mitra dan dukungan penyaluran' },
    ],
  },
]

const supportLinks: Feature[] = [
  { to: '/dukung', icon: HeartStraight, title: 'Dukung Lestari Pangan', desc: '' },
  { to: '/transparansi', icon: Receipt, title: 'Transparansi dana', desc: '' },
  { to: '/bantuan', icon: Question, title: 'Pusat bantuan dan kebijakan', desc: '' },
]

export function Features() {
  return (
    <>
      <AppBar title="Semua fitur" />
      <main className="stagger flex flex-col gap-6 px-4 pb-6 pt-4">
        <p className="text-body text-ink-secondary">Layanan berbagi pangan, pencatatan, dan edukasi dalam satu tempat.</p>
        {featureGroups.map((g) => (
          <section key={g.title} aria-labelledby={`fg-${g.title}`} className="flex flex-col gap-3">
            <h2 id={`fg-${g.title}`} className="text-caption font-semibold uppercase tracking-wide text-ink-secondary">{g.title}</h2>
            <div className="flex flex-col gap-3">
              {g.items.map(({ to, img, icon: Icon, title, desc, badge }) => (
                <Link key={to} to={to} className="tap card flex items-center gap-4 p-4 hover:bg-page">
                  <span aria-hidden="true" className="flex h-14 w-14 shrink-0 items-center justify-center rounded-control border border-line bg-page text-primary">
                    {img ? <img src={asset(img)} alt="" className="h-10 w-10" /> : Icon ? <Icon size={28} /> : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-card-title">{title}</span>
                      {badge && <span className="rounded-full bg-primary-container px-2 py-0.5 text-[0.75rem] font-semibold text-primary">{badge}</span>}
                    </span>
                    <span className="block text-meta text-ink-secondary">{desc}</span>
                  </span>
                  <CaretRight size={20} aria-hidden="true" className="shrink-0 text-ink-secondary" />
                </Link>
              ))}
            </div>
          </section>
        ))}
        <section aria-labelledby="fg-dukungan" className="flex flex-col gap-3">
          <h2 id="fg-dukungan" className="text-caption font-semibold uppercase tracking-wide text-ink-secondary">Dukungan dan bantuan</h2>
          <div className="card divide-y divide-line overflow-hidden">
            {supportLinks.map(({ to, icon: Icon, title }) => (
              <Link key={to} to={to} className="tap flex min-h-16 items-center gap-3 px-4 py-3 hover:bg-page">
                <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control border border-line bg-page text-primary">
                  {Icon && <Icon size={22} />}
                </span>
                <span className="min-w-0 flex-1 font-semibold">{title}</span>
                <CaretRight size={20} aria-hidden="true" className="shrink-0 text-ink-secondary" />
              </Link>
            ))}
          </div>
        </section>
      </main>
    </>
  )
}

/* ---------- I01 Dashboard dampak ---------- */

type ImpactUnit = 'porsi' | 'kg' | 'unit'

export function Impact() {
  const { state } = useApp()
  const profile = useProfile()
  const donor = state.role === 'pemberi'
  const [unit, setUnit] = useState<ImpactUnit>('porsi')
  const done = state.transfers.filter((t) => t.received !== undefined && t.unit === unit && (donor ? t.donorName === profile.name : t.recipientName === profile.name))
  const received = done.reduce((s, t) => s + (t.received ?? 0), 0)
  const rejected = done.reduce((s, t) => s + (t.rejected ?? 0), 0)
  const offered = state.offers.filter((o) => o.donorName === profile.name && o.status !== 'Draf' && o.unit === unit).reduce((s, o) => s + o.initial, 0)
  const dist = done.reduce(
    (acc, t) => {
      if (t.distribution) {
        acc.distributed += t.distribution.distributed
        acc.used += t.distribution.used
        acc.wasted += t.distribution.wasted
      } else acc.unreported += t.received ?? 0
      return acc
    },
    { distributed: 0, used: 0, wasted: 0, unreported: 0 },
  )
  const remaining = received - dist.distributed - dist.used - dist.wasted - dist.unreported
  const parts = donor
    ? [
        { label: 'Diterima penerima', value: received, cls: 'bg-primary' },
        { label: 'Tidak diterima saat serah terima', value: rejected, cls: 'bg-accent' },
      ]
    : [
        { label: 'Didistribusikan ke penerima manfaat', value: dist.distributed, cls: 'bg-primary' },
        { label: 'Digunakan di posko', value: dist.used, cls: 'bg-leaf' },
        { label: 'Sisa persediaan', value: remaining, cls: 'bg-accent' },
        { label: 'Belum dilaporkan', value: dist.unreported, cls: 'bg-line-control' },
        { label: 'Terbuang', value: dist.wasted, cls: 'bg-danger' },
      ].filter((p) => p.value > 0)
  const total = parts.reduce((s, p) => s + p.value, 0)
  const days = [
    { day: '6 Okt', value: 0 as number | null, note: '0 porsi' },
    { day: '7 Okt', value: received as number | null, note: 'Terkonfirmasi' },
    { day: '8 Okt', value: null, note: 'Belum dicatat' },
    { day: '9 Okt', value: 0, note: '0 porsi' },
  ]
  const max = Math.max(1, ...days.map((d) => d.value ?? 0))

  return (
    <>
      <AppBar title="Dampak" />
      <main className="stagger flex flex-col gap-4 px-4 pb-10 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-2 font-semibold"><span aria-hidden="true" className="h-2 w-2 rounded-full bg-primary" />Sejak bergabung</p>
        </div>
        <Segmented
          label="Satuan"
          value={unit}
          onChange={setUnit}
          options={[
            { value: 'porsi', label: 'Porsi' },
            { value: 'kg', label: 'Kilogram' },
            { value: 'unit', label: 'Kemasan' },
          ]}
        />
        {unit !== 'porsi' ? (
          <StatePanel title={`Belum ada data ${unit === 'kg' ? 'kilogram' : 'kemasan'}`}>
            Tidak ada kegiatan terkonfirmasi dengan satuan ini pada Oktober 2026. Satuan berbeda tidak dijumlahkan.
          </StatePanel>
        ) : (
          <>
            <section className="card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h2 className="text-caption font-semibold uppercase tracking-wide text-ink-secondary">{donor ? 'Pangan diterima penerima' : 'Pangan diterima posko'}</h2>
                <Badge tone="success">Terkonfirmasi</Badge>
              </div>
              <p className="mt-2"><span className="text-[2.5rem] font-bold leading-none"><CountUp value={received} /></span> <span className="text-card-title text-ink-secondary">porsi</span></p>
              <p className="mt-3 flex items-start gap-2 border-t border-line pt-3 text-meta text-ink-secondary">
                <Notebook size={18} aria-hidden="true" className="mt-px shrink-0" />
                <span className="min-w-0">Sumber: konfirmasi penerimaan <span className="whitespace-nowrap">{done.map((t) => t.id).join(', ') || '—'}</span></span>
              </p>
              {donor && <p className="mt-1 text-meta text-ink-secondary">Surplus ditawarkan bulan ini: {offered} porsi (belum dihitung sebagai donasi berhasil).</p>}
            </section>

            {total > 0 && (
              <section aria-labelledby="rincian-dampak" className="card p-4">
                <h2 id="rincian-dampak" className="text-card-title">{donor ? 'Hasil serah terima' : 'Penggunaan dan penyaluran'}</h2>
                <p className="text-meta text-ink-secondary">{donor ? 'Sumber: konfirmasi penerima' : 'Sumber: laporan penggunaan Anda'}</p>
                <div className="mt-3 flex h-3 origin-left animate-grow-x overflow-hidden rounded-full bg-line" aria-hidden="true">
                  {parts.map((p) => <span key={p.label} className={p.cls} style={{ width: `${(p.value / total) * 100}%` }} />)}
                </div>
                <dl className="mt-3 divide-y divide-line">
                  {parts.map((p) => (
                    <div key={p.label} className="flex items-center justify-between gap-3 py-2.5">
                      <dt className="flex min-w-0 flex-1 items-center gap-2 text-meta"><span aria-hidden="true" className={`h-3 w-3 shrink-0 rounded-full ${p.cls}`} />{p.label}</dt>
                      <dd className="shrink-0 font-bold tabular-nums">{p.value} porsi</dd>
                    </div>
                  ))}
                </dl>
                {!donor && remaining > 0 && (
                  <p className="mt-2 rounded-control bg-info-container p-3 text-meta">Sisa {remaining} porsi tetap tercatat sebagai persediaan aktif, tidak dianggap habis.</p>
                )}
              </section>
            )}

            <section aria-labelledby="sepekan" className="card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 id="sepekan" className="text-card-title">Aktivitas sepekan</h2>
                <span className="text-caption text-ink-secondary">Satuan: porsi</span>
              </div>
              <ul className="mt-4 grid grid-cols-4 items-end gap-2" aria-label="Porsi diterima per hari">
                {days.map((d) => (
                  <li key={d.day} className="flex flex-col items-center gap-1 text-center">
                    <span className="text-caption font-bold tabular-nums">{d.value ?? '–'}</span>
                    <span className="flex h-20 w-full items-end justify-center border-b border-line" aria-hidden="true">
                      {d.value === null ? (
                        <span className="h-full w-8 rounded-t-[6px] border-2 border-b-0 border-dashed border-line-control" />
                      ) : (
                        <span className="w-8 origin-bottom animate-grow-y rounded-t-[6px] bg-primary" style={{ height: `${Math.max(4, (d.value / max) * 80)}px` }} />
                      )}
                    </span>
                    <span className="text-caption font-semibold">{d.day}</span>
                    <span className="text-[0.75rem] leading-4 text-ink-secondary">{d.note}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 border-t border-line pt-3 text-caption text-ink-secondary">Hari tanpa catatan dibedakan dari nilai 0, supaya tidak terbaca sebagai “nol food waste”.</p>
            </section>

            <div className="card divide-y divide-line overflow-hidden">
              <Link to="/dampak/riwayat" className="tap flex min-h-14 items-center justify-between gap-3 px-4 hover:bg-page"><span className="font-semibold">Riwayat per kegiatan</span><CaretRight size={18} aria-hidden="true" className="text-ink-secondary" /></Link>
              <Link to="/dampak/penjelasan" className="tap flex min-h-14 items-center justify-between gap-3 px-4 hover:bg-page"><span className="font-semibold">Penjelasan data</span><CaretRight size={18} aria-hidden="true" className="text-ink-secondary" /></Link>
            </div>
            <Notice tone="info" title="Cara membaca data">
              Penawaran belum dihitung sebagai donasi berhasil. Catatan pemberi dan penerima untuk kegiatan yang sama tidak dihitung dua kali. Estimasi emisi belum ditampilkan sampai metodenya tersedia.
            </Notice>
          </>
        )}
      </main>
    </>
  )
}

/* ---------- T01 / T02 Tips ---------- */

export function Tips() {
  const { state } = useApp()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState<string | null>(null)
  const tips = state.tips
  const cats = [...new Set(tips.map((t) => t.category))]
  const list = tips.filter((t) => (!cat || t.category === cat) && `${t.title} ${t.summary}`.toLowerCase().includes(q.toLowerCase()))
  return (
    <>
      <AppBar
        title="Tips Anti Food Waste"
        actions={<ButtonLink to="/tips/tersimpan" variant="ghost" className="min-h-12 text-[0.875rem]" icon={<BookmarkSimple size={18} />}>Tersimpan{state.savedTips.length ? ` (${state.savedTips.length})` : ''}</ButtonLink>}
      />
      <main className="stagger flex flex-col gap-4 px-4 pb-10 pt-4">
        <PromoBanner placement="tips" />
        <div className="flex min-h-[52px] items-center gap-2 rounded-control border border-line-control bg-surface px-3">
          <MagnifyingGlass size={22} aria-hidden="true" className="text-ink-secondary" />
          <input aria-label="Cari tips" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari tips" className="min-w-0 flex-1 bg-transparent py-3 outline-none" />
        </div>
        <ChipRow className="-mx-4 flex gap-2 overflow-x-auto px-4">
          <Chip selected={!cat} onClick={() => setCat(null)}>Semua</Chip>
          {cats.map((c) => <Chip key={c} selected={cat === c} onClick={() => setCat(c)}>{c}</Chip>)}
        </ChipRow>
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
  const { state } = useApp()
  const run = useCommand()
  const tip = state.tips.find((t) => t.id === id)
  if (!tip) return <><AppBar title="Tips" /><main className="p-4"><StatePanel title="Konten tidak tersedia" /></main></>
  const saved = state.savedTips.includes(tip.id)
  return (
    <>
      <AppBar
        title="Artikel tips"
        actions={
          <button type="button" aria-pressed={saved} onClick={() => run({ type: 'toggleTip', id: tip.id }).catch((err) => toast(messageOf(err), 'info'))} className="tap flex h-12 items-center gap-1 rounded-full px-3 text-[0.875rem] font-semibold text-primary hover:bg-primary-container">
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
  const { state } = useApp()
  const [items, setItems] = useState<string[]>(['Nasi putih', 'Wortel'])
  const [draft, setDraft] = useState('')
  const [portions, setPortions] = useState<'1–2 orang' | '3–4 orang' | 'Komunitas (>5)'>('1–2 orang')
  const [tools, setTools] = useState<string[]>(['Wajan', 'Panci'])
  const [limits, setLimits] = useState<string[]>([])
  const [searched, setSearched] = useState(false)
  const toggle = (list: string[], set: (v: string[]) => void, v: string) => set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v])
  const add = (v: string) => {
    const t = v.trim()
    if (t && !items.some((i) => i.toLowerCase() === t.toLowerCase())) setItems([...items, t])
    setDraft('')
  }
  const fromRecords = state.records.filter((r) => r.owner === state.role && r.status === 'Masih tersedia').map((r) => r.name)
  const matches = matchRecipes(items, tools, state.recipes)

  return (
    <>
      <AppBar
        title="Resep dari Sisa"
        actions={<ButtonLink to="/resep/tersimpan" variant="ghost" className="min-h-12 text-[0.875rem]" icon={<BookmarkSimple size={18} />}>Tersimpan{state.savedRecipes.length ? ` (${state.savedRecipes.length})` : ''}</ButtonLink>}
      />
      <main className="stagger mx-auto flex max-w-[560px] flex-col gap-4 px-4 pb-32 pt-4">
        <PromoBanner placement="resep" />
        <section className="flex items-center gap-3 rounded-card border border-line bg-primary-container p-4">
          <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-control bg-surface text-primary"><Microphone size={24} /></span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">Bingung mau masak apa?</p>
            <p className="text-meta text-ink-secondary">Asisten suara belum tersedia. Gunakan isian di bawah.</p>
          </div>
          <Badge tone="neutral" icon={false}>Segera</Badge>
        </section>

        <section aria-labelledby="bahan" className="card flex flex-col gap-3 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="bahan" className="text-card-title">Bahan yang tersedia</h2>
            {fromRecords.length > 0 && (
              <button type="button" onClick={() => setItems([...new Set([...items, ...fromRecords])])} className="tap inline-flex min-h-12 items-center gap-1 rounded-control px-2 text-[0.875rem] font-semibold text-primary hover:bg-primary-container">
                Ambil dari Catat Pangan <CaretRight size={14} weight="bold" aria-hidden="true" />
              </button>
            )}
          </div>
          <ul className="flex flex-wrap gap-2" aria-label="Bahan terpilih">
            {items.map((i) => (
              <li key={i} className="inline-flex min-h-11 animate-pop items-center gap-1 rounded-full bg-primary-container pl-3 text-[0.875rem] font-semibold text-primary">
                {i}
                <button type="button" aria-label={`Hapus ${i}`} onClick={() => setItems(items.filter((x) => x !== i))} className="tap flex h-11 w-11 items-center justify-center rounded-full hover:bg-primary-active">
                  <X size={16} weight="bold" aria-hidden="true" />
                </button>
              </li>
            ))}
            {items.length === 0 && <li className="text-meta text-ink-secondary">Belum ada bahan.</li>}
          </ul>
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); add(draft) }}>
            <label htmlFor="bahan-baru" className="sr-only">Tambah bahan</label>
            <input id="bahan-baru" className={inputCls} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Mis. telur" />
            <Button type="submit" variant="tonal" className="shrink-0" icon={<Plus size={18} weight="bold" />}>Tambah</Button>
          </form>
        </section>

        <section className="card flex flex-col gap-4 p-4">
          <fieldset>
            <legend className="mb-2 text-label">Jumlah porsi</legend>
            <div className="flex flex-wrap gap-2">
              {(['1–2 orang', '3–4 orang', 'Komunitas (>5)'] as const).map((p) => (
                <Chip key={p} selected={portions === p} onClick={() => setPortions(p)}>{p}</Chip>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-2 text-label">Alat masak yang ada</legend>
            <div className="flex flex-wrap gap-2">
              {['Wajan', 'Panci', 'Rice cooker', 'Oven', 'Kukusan'].map((t) => (
                <Chip key={t} selected={tools.includes(t)} onClick={() => toggle(tools, setTools, t)}>{t}</Chip>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-2 text-label">Batasan <span className="font-normal text-ink-secondary">(opsional)</span></legend>
            <div className="flex flex-wrap gap-2">
              {['Tanpa pedas', 'Tanpa kacang', 'Tanpa santan'].map((t) => (
                <Chip key={t} selected={limits.includes(t)} onClick={() => toggle(limits, setLimits, t)}>{t}</Chip>
              ))}
            </div>
          </fieldset>
        </section>

        {searched && (
          <section aria-live="polite" className="flex flex-col gap-3">
            <h2 className="text-section-title">{matches.length} ide olahan</h2>
            {matches.length === 0 && <StatePanel title="Belum ada resep yang cocok">Tambah bahan lain atau pilih alat masak yang berbeda.</StatePanel>}
            <div key={matches.map((m) => m.recipe.id).join()} className="stagger flex flex-col gap-3">
              {matches.map(({ recipe: r, hits, score }) => (
                <Link key={r.id} to={`/resep/${r.id}`} className="tap tap-soft card block p-4 hover:bg-page">
                  <div className="flex items-center justify-between gap-2">
                    <Badge tone={score >= 50 ? 'success' : 'accent'} icon={false}>Cocok {score}%</Badge>
                    <span className="text-meta text-ink-secondary">{r.minutes} menit</span>
                  </div>
                  <h3 className="mt-2 text-card-title">{r.title}</h3>
                  <p className="text-meta text-ink-secondary">{r.summary}</p>
                  <p className="mt-2 text-meta text-primary">Bahan dimiliki: {hits.join(', ')}</p>
                  <p className="mt-2 flex items-center gap-1 text-[0.875rem] font-semibold text-primary">Buka resep <CaretRight size={14} weight="bold" aria-hidden="true" /></p>
                </Link>
              ))}
            </div>
            <p className="text-caption text-ink-secondary">{portions}{limits.length ? ` · ${limits.join(', ')}` : ''}. Asisten resep tidak menilai keamanan pangan dari foto, tanggal, atau percakapan.</p>
          </section>
        )}
        <p className="rounded-control bg-page p-3 text-caption text-ink-secondary">Saran resep adalah inspirasi. Tetap periksa kesegaran bahan sebelum dimasak.</p>
      </main>
      <StickyFooter>
        <Button block disabled={items.length === 0} onClick={() => (setSearched(true), requestAnimationFrame(() => document.querySelector('[aria-live="polite"]')?.scrollIntoView({ behavior: 'smooth', block: 'start' })))}>Cari resep dari bahan ini</Button>
      </StickyFooter>
    </>
  )
}
