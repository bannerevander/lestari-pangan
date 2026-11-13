import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  BookmarkSimple,
  CaretRight,
  ChartBar,
  CheckCircle,
  Clock,
  CookingPot,
  DownloadSimple,
  Gauge,
  Lightbulb,
  Medal,
  ShieldCheck,
  UsersThree,
  X,
} from '@phosphor-icons/react'
import {
  AppBar,
  Badge,
  BottomSheet,
  Button,
  ButtonLink,
  Field,
  IconButton,
  inputCls,
  Notice,
  PolicyNote,
  QtyStepper,
  Segmented,
  StageList,
  StatePanel,
  StickyFooter,
  SuccessMark,
  toast,
} from '../components/ui'
import { useApp } from '../state/AppState'
import { useCommand } from '../state/useCommand'
import { messageOf } from '../lib/supabase/errors'
import { useProfile } from '../state/useProfile'
import { progressOf } from './challengeProgress'
import { asset } from '../lib/format'
import { NotAvailable } from '../components/NotAvailable'

/* ---------- R04 Detail resep ---------- */

export function RecipeDetail() {
  const { id } = useParams()
  const { state } = useApp()
  const run = useCommand()
  const r = state.recipes.find((x) => x.id === id)
  if (!r || r.status !== 'Tersedia') return <NotAvailable />
  const saved = state.savedRecipes.includes(r.id)
  return (
    <>
      <AppBar
        title="Detail resep"
        actions={
          <IconButton
            label={saved ? 'Hapus dari resep tersimpan' : 'Simpan resep'}
            onClick={() => {
              run({ type: 'toggleRecipe', id: r.id })
                .then(() => toast(saved ? 'Dihapus dari resep tersimpan.' : 'Resep disimpan.', saved ? 'info' : 'success'))
                .catch((err) => toast(messageOf(err), 'info'))
            }}
          >
            <BookmarkSimple key={String(saved)} size={24} weight={saved ? 'fill' : 'regular'} aria-hidden="true" className={saved ? 'animate-pop text-primary' : ''} />
          </IconButton>
        }
      />
      <main className="stagger mx-auto flex max-w-[560px] flex-col gap-4 px-4 pb-36 pt-4">
        {r.photo && <img src={r.photo} alt="" className="aspect-[16/9] w-full rounded-greet object-cover" />}
        <section className="relative overflow-hidden rounded-greet bg-primary-container p-5">
          <CookingPot size={120} weight="duotone" aria-hidden="true" className="absolute -bottom-6 -right-6 text-primary/15" />
          <p className="text-caption font-semibold uppercase tracking-wide text-primary">{r.category}</p>
          <h1 className="mt-1 max-w-[24ch] text-page-title">{r.title}</h1>
          <p className="mt-1 max-w-[36ch] text-body text-ink-secondary">{r.summary}</p>
          <dl className="mt-4 flex flex-wrap gap-2">
            {[
              [Clock, `${r.minutes} menit`],
              [UsersThree, r.portions],
              [Gauge, r.level],
            ].map(([Icon, v]) => {
              const I = Icon as typeof Clock
              return (
                <div key={v as string} className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-meta font-semibold">
                  <I size={16} aria-hidden="true" className="text-primary" />
                  <dd>{v as string}</dd>
                </div>
              )
            })}
          </dl>
        </section>
        <section className="card p-4">
          <h2 className="text-card-title">Bahan dari persediaan Anda</h2>
          <ul className="mt-3 flex flex-col divide-y divide-line">
            {r.have.map((h) => (
              <li key={h.name} className="flex items-center justify-between gap-3 py-2.5">
                <span className="flex items-center gap-2"><CheckCircle size={18} weight="fill" aria-hidden="true" className="shrink-0 text-primary" />{h.name}</span>
                <span className="shrink-0 text-meta text-ink-secondary">{h.amount}</span>
              </li>
            ))}
          </ul>
          <h3 className="mt-4 text-label">Bumbu pelengkap</h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {r.extra.map((e) => <li key={e} className="rounded-full bg-page px-3 py-1 text-meta">{e}</li>)}
          </ul>
          <p className="mt-4 text-meta text-ink-secondary">Alat: {r.tool}</p>
        </section>
        <section className="card p-4">
          <h2 className="text-card-title">{r.steps.length} langkah</h2>
          <ol className="mt-3 flex flex-col gap-2">
            {r.steps.map((s, i) => (
              <li key={s.title} className="flex items-center gap-3 text-meta">
                <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-container font-bold text-primary">{i + 1}</span>
                <span className="flex-1">{s.title}</span>
                <span className="text-ink-secondary">{s.minutes} mnt</span>
              </li>
            ))}
          </ol>
        </section>
        <PolicyNote title="Keamanan pangan mandiri">{r.safety}</PolicyNote>
      </main>
      <StickyFooter>
        <ButtonLink to={`/resep/${r.id}/masak`} block icon={<CookingPot size={20} />}>Mulai memasak</ButtonLink>
      </StickyFooter>
    </>
  )
}

/* ---------- R05 Mode memasak ---------- */

export function CookMode() {
  const { id } = useParams()
  const navigate = useNavigate()
  const r = useApp().state.recipes.find((x) => x.id === id)
  const [i, setI] = useState(0)
  const [dir, setDir] = useState<'next' | 'prev'>('next')
  if (!r || r.status !== 'Tersedia') return <NotAvailable />
  const step = r.steps[i]
  const last = i === r.steps.length - 1
  const go = (n: number) => {
    setDir(n > i ? 'next' : 'prev')
    setI(n)
  }
  return (
    <main className="flex min-h-screen flex-col bg-surface pb-[calc(16px+env(safe-area-inset-bottom,0px))]">
      <div className="flex min-h-14 items-center gap-1 px-1">
        <IconButton label="Keluar dari mode memasak" onClick={() => navigate(`/resep/${r.id}`)}>
          <X size={24} aria-hidden="true" />
        </IconButton>
        <p className="flex-1 truncate text-meta font-semibold">{r.title}</p>
        <span className="pr-4 text-meta text-ink-secondary">Langkah {i + 1}/{r.steps.length}</span>
      </div>
      <div className="flex gap-1.5 px-4" aria-hidden="true">
        {r.steps.map((s, n) => (
          <span key={s.title} className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
            <span className={`block h-full origin-left rounded-full bg-primary transition-transform duration-page ease-enter ${n <= i ? 'scale-x-100' : 'scale-x-0'}`} />
          </span>
        ))}
      </div>
      <section key={i} aria-live="polite" className={`flex flex-1 flex-col px-6 pt-8 ${dir === 'next' ? 'animate-page-forward' : 'animate-page-back'}`}>
        <span aria-hidden="true" className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-[1.5rem] font-bold text-white">{i + 1}</span>
        <p className="mt-4 inline-flex items-center gap-1.5 text-meta font-semibold text-primary"><Clock size={16} aria-hidden="true" />Sekitar {step.minutes} menit</p>
        <h1 className="mt-1 text-page-title">{step.title}</h1>
        {/* Teks besar supaya terbaca dari jarak dapur. */}
        <p className="mt-3 text-[1.1875rem] leading-8">{step.body}</p>
        {step.tip && (
          <p className="mt-5 flex gap-3 rounded-control bg-accent-soft p-4 text-body">
            <Lightbulb size={22} weight="fill" aria-hidden="true" className="mt-0.5 shrink-0 text-accent-ink" />
            {step.tip}
          </p>
        )}
        {!last && (
          <div className="mt-auto pt-6">
            <p className="text-caption font-semibold uppercase tracking-wide text-ink-secondary">Berikutnya</p>
            <ul className="mt-2 flex flex-col gap-1">
              {r.steps.slice(i + 1).map((s, n) => (
                <li key={s.title} className="flex justify-between text-meta text-ink-secondary"><span>{i + n + 2}. {s.title}</span><span>{s.minutes} mnt</span></li>
              ))}
            </ul>
          </div>
        )}
      </section>
      <div className="flex gap-2 px-4 pt-4">
        <Button variant="secondary" className="flex-1" disabled={i === 0} icon={<ArrowLeft size={18} />} onClick={() => go(i - 1)}>Sebelumnya</Button>
        {last ? (
          <Button className="flex-[1.4]" onClick={() => navigate(`/resep/${r.id}/catat`, { replace: true })}>Selesai memasak</Button>
        ) : (
          <Button className="flex-[1.4]" onClick={() => go(i + 1)}>Langkah berikutnya <ArrowRight size={18} aria-hidden="true" /></Button>
        )}
      </div>
    </main>
  )
}

/* ---------- R07 Catat bahan digunakan ---------- */

export function RecipeUseLog() {
  const { id } = useParams()
  const { state } = useApp()
  const run = useCommand()
  const navigate = useNavigate()
  const r = state.recipes.find((x) => x.id === id)
  const stock = state.records.filter((x) => x.owner === state.role && x.quantity > 0)
  const [picked, setPicked] = useState<Record<string, number>>({})
  const [busy, setBusy] = useState(false)
  if (!r) return <NotAvailable />
  const chosen = Object.entries(picked).filter(([, q]) => q > 0)
  return (
    <>
      <AppBar title="Catat bahan digunakan" back={`/resep/${r.id}`} />
      <main className="stagger mx-auto flex max-w-[560px] flex-col gap-4 px-4 pb-40 pt-4">
        <section className="flex flex-col items-center gap-2 py-2 text-center">
          <SuccessMark size={64} />
          <h1 className="text-section-title">{r.title} selesai</h1>
          <p className="text-meta text-ink-secondary">Catat bahan yang benar-benar terpakai agar persediaan tetap akurat.</p>
        </section>
        {stock.length === 0 ? (
          <StatePanel title="Tidak ada persediaan tercatat">Bahan yang dipakai tidak ada di Catat Pangan, jadi tidak ada yang perlu dikurangi.</StatePanel>
        ) : (
          <ul className="flex flex-col gap-3">
            {stock.map((s) => {
              const q = picked[s.id] ?? 0
              return (
                <li key={s.id} className={`card p-4 transition-[border-color] duration-micro ${q > 0 ? 'border-primary' : ''}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold">{s.name}</p>
                      <p className="text-meta text-ink-secondary">Saldo {s.quantity} {s.unit} · {s.storage}</p>
                    </div>
                    {q > 0 && <Badge tone="success">−{q} {s.unit}</Badge>}
                  </div>
                  <div className="mt-3">
                    <QtyStepper id={`use-${s.id}`} value={q} onChange={(n) => setPicked({ ...picked, [s.id]: n })} min={0} max={s.quantity} unit={s.unit} />
                  </div>
                </li>
              )
            })}
          </ul>
        )}
        <p className="rounded-control bg-page p-3 text-meta text-ink-secondary">Membaca atau menyimpan resep tidak pernah mengurangi persediaan otomatis.</p>
      </main>
      <StickyFooter>
        <Button
          block
          disabled={!chosen.length}
          loading={busy}
          loadingLabel="Menyimpan…"
          onClick={() => {
            setBusy(true)
            // Berurutan agar satu kegagalan tidak membuat sebagian bahan tercatat ganda saat diulang.
            chosen
              .reduce((p, [rid, q]) => p.then(() => run({ type: 'moveRecord', id: rid, kind: 'Digunakan', quantity: q, note: `Resep: ${r.title}` })), Promise.resolve())
              .then(() => {
                toast(`${chosen.length} bahan dicatat sebagai digunakan.`)
                navigate('/pangan', { replace: true })
              })
              .catch((err) => {
                toast(messageOf(err), 'info')
                setBusy(false)
              })
          }}
        >
          Catat penggunaan
        </Button>
        <Button block variant="ghost" onClick={() => navigate('/resep', { replace: true })}>Lewati</Button>
      </StickyFooter>
    </>
  )
}

/* ---------- R06 Resep tersimpan ---------- */

export function SavedRecipes() {
  const { state } = useApp()
  const list = state.recipes.filter((r) => state.savedRecipes.includes(r.id))
  return (
    <>
      <AppBar title="Resep tersimpan" />
      <main className="stagger mx-auto flex max-w-[560px] flex-col gap-3 px-4 pb-10 pt-4">
        {list.length === 0 ? (
          <StatePanel icon={<BookmarkSimple size={40} className="text-ink-secondary" />} title="Belum ada resep tersimpan" action={<ButtonLink to="/resep">Cari resep</ButtonLink>}>
            Tekan ikon simpan di detail resep.
          </StatePanel>
        ) : (
          list.map((r) =>
            r.status === 'Tersedia' ? (
              <Link key={r.id} to={`/resep/${r.id}`} className="tap card flex items-center gap-3 p-4 hover:bg-page">
                {r.photo ? (
                  <img src={r.photo} alt="" loading="lazy" className="h-16 w-16 shrink-0 rounded-control object-cover" />
                ) : (
                  <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-control bg-primary-container text-primary"><CookingPot size={24} /></span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{r.title}</span>
                  <span className="block text-meta text-ink-secondary">{r.category} · {r.minutes} menit</span>
                </span>
                <CaretRight size={20} aria-hidden="true" className="text-ink-secondary" />
              </Link>
            ) : (
              <div key={r.id} className="card flex items-center gap-3 p-4 opacity-70">
                <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-control bg-page text-ink-secondary"><CookingPot size={24} /></span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{r.title}</span>
                  <span className="block text-meta text-ink-secondary">{r.summary}</span>
                </span>
                <Badge tone="warning">Ditinjau ulang</Badge>
              </div>
            ),
          )
        )}
      </main>
    </>
  )
}

/* ---------- E01 Eco Challenge ---------- */

export function ChallengeList() {
  const { state } = useApp()
  const me = useProfile().name
  const [tab, setTab] = useState<'tersedia' | 'diikuti'>('tersedia')
  const mine = state.challenges.filter((c) => c.roles.includes(state.role))
  const list = mine.filter((c) => (tab === 'diikuti') === state.joinedChallenges.includes(c.id))
  return (
    <>
      <AppBar title="Eco Challenge" />
      <main className="stagger flex flex-col gap-4 px-4 pb-10 pt-4">
        <Segmented label="Challenge" value={tab} onChange={setTab} options={[{ value: 'tersedia', label: 'Tersedia', count: mine.filter((c) => !state.joinedChallenges.includes(c.id)).length }, { value: 'diikuti', label: 'Diikuti', count: state.joinedChallenges.filter((id) => mine.some((c) => c.id === id)).length }]} />
        {list.length === 0 ? (
          <StatePanel icon={<img src={asset('illustrations/medali-daun.svg')} alt="" className="h-16 w-16" />} title={tab === 'diikuti' ? 'Belum mengikuti challenge' : 'Semua challenge sudah diikuti'}>
            {tab === 'diikuti' ? 'Pilih challenge di tab Tersedia.' : 'Pantau progres di tab Diikuti.'}
          </StatePanel>
        ) : (
          list.map((c) => {
            const done = Math.min(progressOf(state, c, me), c.target)
            const joined = state.joinedChallenges.includes(c.id)
            return (
              <Link key={c.id} to={joined ? `/tantangan/${c.id}/progres` : `/tantangan/${c.id}`} className="tap tap-soft card block p-4 hover:bg-page">
                <div className="flex items-start gap-3">
                  <img src={asset('illustrations/medali-daun.svg')} alt="" className="h-12 w-12 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold">{c.title}</h2>
                    <p className="text-meta text-ink-secondary">{c.desc}</p>
                    <p className="mt-1 text-caption text-ink-secondary">{c.period} · {c.points} poin</p>
                  </div>
                  <CaretRight size={20} aria-hidden="true" className="shrink-0 text-ink-secondary" />
                </div>
                {joined && (
                  <div className="mt-3">
                    <div className="flex justify-between text-meta"><span className="text-ink-secondary">Progres</span><span className="font-semibold tabular">{done} dari {c.target} {c.unit}</span></div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-line" role="progressbar" aria-label={`Progres ${c.title}`} aria-valuemin={0} aria-valuemax={c.target} aria-valuenow={done}>
                      <div className="h-full origin-left animate-grow-x rounded-full bg-primary" style={{ width: `${(done / c.target) * 100}%` }} />
                    </div>
                  </div>
                )}
              </Link>
            )
          })
        )}
        <p className="text-caption text-ink-secondary">Challenge tidak memakai peringkat kilogram donasi. Reward tidak memberi prioritas memperoleh pangan.</p>
      </main>
    </>
  )
}

/* ---------- E02 Detail challenge ---------- */

export function ChallengeDetail() {
  const { id } = useParams()
  const { state } = useApp()
  const run = useCommand()
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()
  const c = state.challenges.find((x) => x.id === id)
  if (!c) return <NotAvailable />
  const joined = state.joinedChallenges.includes(c.id)
  return (
    <>
      <AppBar title="Detail challenge" />
      <main className="stagger mx-auto flex max-w-[560px] flex-col gap-4 px-4 pb-36 pt-4">
        <section className="flex flex-col items-center gap-3 rounded-greet bg-primary-container px-6 py-6 text-center">
          <img src={asset('illustrations/medali-daun.svg')} alt="" className="h-20 w-20 animate-pop" />
          <h1 className="text-page-title">{c.title}</h1>
          <p className="max-w-[34ch] text-body text-ink-secondary">{c.desc}</p>
          <Badge tone="success" icon={false}>+{c.points} poin</Badge>
        </section>
        <section className="card p-4">
          <dl className="grid grid-cols-2 gap-4">
            <div><dt className="text-meta text-ink-secondary">Periode</dt><dd className="font-semibold">{c.period}</dd></div>
            <div><dt className="text-meta text-ink-secondary">Target</dt><dd className="font-semibold">{c.target} {c.unit}</dd></div>
            <div><dt className="text-meta text-ink-secondary">Pemeriksaan</dt><dd className="font-semibold">Otomatis dari catatan</dd></div>
            <div><dt className="text-meta text-ink-secondary">Apresiasi</dt><dd className="font-semibold">{c.points} poin, ditukar paket reward</dd></div>
          </dl>
        </section>
        <Notice tone="info" title="Cara kerja poin">Poin masuk setelah tim memeriksa capaian. Challenge bisa diikuti lagi di periode berikutnya. Melaporkan sisa atau kendala tidak mengurangi kelayakan Anda.</Notice>
        <PolicyNote title="Sukarela dan adil">Tidak ada hadiah uang tunai. Challenge tidak memengaruhi prioritas memperoleh pangan.</PolicyNote>
      </main>
      <StickyFooter>
        {joined ? (
          <ButtonLink to={`/tantangan/${c.id}/progres`} block>Lihat progres</ButtonLink>
        ) : (
          <Button
            block
            icon={<Medal size={20} />}
            loading={busy}
            onClick={() => {
              setBusy(true)
              run({ type: 'joinChallenge', id: c.id })
                .then(() => {
                  toast('Anda mengikuti challenge ini.')
                  navigate(`/tantangan/${c.id}/progres`, { replace: true })
                })
                .catch((err) => {
                  toast(messageOf(err), 'info')
                  setBusy(false)
                })
            }}
          >
            Ikuti challenge
          </Button>
        )}
      </StickyFooter>
    </>
  )
}

/* ---------- E03 Progres dan bukti ---------- */

export function ChallengeProgress() {
  const { id } = useParams()
  const { state } = useApp()
  const run = useCommand()
  const me = useProfile().name
  const [busy, setBusy] = useState(false)
  const c = state.challenges.find((x) => x.id === id)
  const done = c ? Math.min(progressOf(state, c, me), c.target) : 0
  const entry = c ? state.challengeEntries[c.id] : undefined
  const [shown, setShown] = useState(0)
  useEffect(() => {
    // Cincin terisi dari 0 saat layar dibuka, bukan langsung penuh.
    const raf = requestAnimationFrame(() => setShown(done))
    return () => cancelAnimationFrame(raf)
  }, [done])
  if (!c) return <NotAvailable />
  const pct = Math.round((done / c.target) * 100)
  // Satu bukti per hari berbeda, sesuai cara target dihitung.
  const evidence =
    c.metric === 'catat_pangan'
      ? state.records.filter((r, i, all) => r.owner === state.role && all.findIndex((x) => x.owner === state.role && x.date.split(',')[0] === r.date.split(',')[0]) === i).slice(0, c.target)
      : []
  const circ = 2 * Math.PI * 42
  return (
    <>
      <AppBar title="Progres challenge" />
      <main className="stagger mx-auto flex max-w-[560px] flex-col gap-4 px-4 pb-10 pt-4">
        <section className="card flex items-center gap-5 p-5">
          <svg viewBox="0 0 100 100" className="h-28 w-28 shrink-0 -rotate-90" role="img" aria-label={`${done} dari ${c.target} ${c.unit}`}>
            <circle cx="50" cy="50" r="42" fill="none" strokeWidth="10" className="stroke-line" />
            <circle cx="50" cy="50" r="42" fill="none" strokeWidth="10" strokeLinecap="round" className="stroke-primary transition-[stroke-dashoffset] duration-[900ms] ease-enter" strokeDasharray={circ} strokeDashoffset={circ * (1 - shown / c.target)} />
          </svg>
          <div className="min-w-0">
            <h1 className="text-card-title">{c.title}</h1>
            <p className="mt-1 text-[1.75rem] font-bold leading-9 text-primary-pressed">{done}/{c.target} <span className="text-body font-semibold text-ink-secondary">{c.unit}</span></p>
            <p className="text-meta text-ink-secondary">{pct}% · {c.period}</p>
          </div>
        </section>
        <section className="card p-4">
          <h2 className="mb-3 text-card-title">Bukti terhubung</h2>
          {evidence.length ? (
            <ul className="flex flex-col gap-2">
              {evidence.map((r) => (
                <li key={r.id}>
                  <Link to={`/pangan/${r.id}`} className="tap flex items-center gap-3 rounded-control border border-line p-3 hover:bg-page">
                    <CheckCircle size={20} weight="fill" aria-hidden="true" className="shrink-0 text-primary" />
                    <span className="min-w-0 flex-1 text-meta"><span className="block font-semibold">#{r.id} · {r.name}</span>{r.date}</span>
                    <CaretRight size={16} aria-hidden="true" className="text-ink-secondary" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-meta text-ink-secondary">Bukti dihitung otomatis dari {c.unit} yang tercatat di aplikasi.</p>
          )}
          {done < c.target && (
            <div className="mt-3 flex items-center gap-3 rounded-control border-2 border-dashed border-line p-3">
              <span aria-hidden="true" className="flex h-8 w-8 items-center justify-center rounded-full bg-page font-bold text-ink-secondary">{done + 1}</span>
              <p className="flex-1 text-meta text-ink-secondary">Belum dilakukan. {c.metric === 'catat_pangan' ? 'Catat pangan pada hari lain.' : 'Lengkapi dari Aktivitas.'}</p>
            </div>
          )}
        </section>
        <StageList
          label="Status pemeriksaan"
          current={entry?.status === 'Lolos' ? 3 : done >= c.target ? 1 : 0}
          stages={[
            { title: 'Mengumpulkan bukti', detail: `${done} dari ${c.target} ${c.unit}` },
            { title: 'Pemeriksaan tim', detail: 'Objektif dari log sistem' },
            { title: 'Hak apresiasi', detail: 'Tidak otomatis memberi verifikasi' },
          ]}
        />
        {entry?.status === 'Menunggu verifikasi' && <Notice tone="info" title="Sedang diperiksa">Tim program memeriksa capaian Anda dari log sistem.</Notice>}
        {entry?.status === 'Lolos' && <ButtonLink to="/reward" block>Pilih paket apresiasi</ButtonLink>}
        {entry?.status === 'Tidak lolos' && <Notice tone="info" title="Belum lolos pemeriksaan">Tim program sudah meninjau capaian Anda. Lihat notifikasi untuk alasannya.</Notice>}
        {entry?.status === 'Berjalan' && done >= c.target && (
          <Button
            block
            loading={busy}
            onClick={() => {
              setBusy(true)
              run({ type: 'finishChallenge', id: entry.participant })
                .then(() => toast('Capaian dikirim untuk diperiksa tim program.'))
                .catch((err) => toast(messageOf(err), 'info'))
                .finally(() => setBusy(false))
            }}
          >
            Ajukan pemeriksaan capaian
          </Button>
        )}
        {c.metric === 'catat_pangan' && done < c.target && <ButtonLink to="/pangan/baru" block>Catat pangan sekarang</ButtonLink>}
      </main>
    </>
  )
}

/* ---------- E09 Materi apresiasi & E08 Pratinjau ---------- */

function Certificate({ name, area }: { name: string; area: string }) {
  const { state } = useApp()
  const received = state.transfers.filter((t) => (t.donorName === name || t.recipientName === name) && (t.received ?? 0) > 0).length
  if (state.appreciationImage)
    return (
      <figure className="overflow-hidden rounded-card border border-line bg-surface">
        <img src={state.appreciationImage} alt={`Materi apresiasi untuk ${name}`} className="w-full object-cover" />
        {state.appreciationCaption && <figcaption className="p-4 text-body italic">“{state.appreciationCaption}”</figcaption>}
      </figure>
    )
  return (
    <figure className="relative overflow-hidden rounded-card border-2 border-primary/30 bg-gradient-to-br from-primary-container via-surface to-accent-soft p-6 text-center">
      <img src={asset('img/logo-mark.png')} alt="" className="mx-auto h-10 w-10" />
      <p className="mt-2 text-caption font-bold uppercase tracking-[0.2em] text-primary">Sertifikat kontribusi</p>
      <p className="mt-1 text-card-title">Apresiasi berbagi pangan</p>
      <p className="mt-4 text-meta text-ink-secondary">Diberikan kepada</p>
      <p className="text-page-title text-primary-pressed">{name}</p>
      <p className="text-meta text-ink-secondary">{area}</p>
      <blockquote className="mx-auto mt-4 max-w-[34ch] text-body italic">“{state.appreciationCaption ?? 'Apresiasi atas komitmen mencegah susut pangan dan koordinasi pembagian makanan surplus.'}”</blockquote>
      <figcaption className="mt-4 text-caption text-ink-secondary">{received} penyaluran diterima terkonfirmasi</figcaption>
    </figure>
  )
}

export function AppreciationMaterial() {
  const { state } = useApp()
  const profile = useProfile()
  const status = state.appreciation
  return (
    <>
      <AppBar title="Materi apresiasi" />
      <main className="stagger mx-auto flex max-w-[560px] flex-col gap-4 px-4 pb-36 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-meta">Persetujuan publikasi</p>
          <Badge tone={status === 'Disetujui' ? 'success' : 'warning'}>{status === 'Disetujui' ? 'Disetujui v1.0' : status === 'Revisi diminta' ? 'Revisi diminta' : 'Belum diberikan'}</Badge>
        </div>
        <Certificate name={profile.name} area={profile.area} />
        <p className="text-caption text-ink-secondary">Bukan sertifikasi laboratorium keamanan pangan atau jaminan komersial.</p>
      </main>
      <StickyFooter>
        <ButtonLink to="/apresiasi/pratinjau" block variant={status === 'Disetujui' ? 'secondary' : 'primary'}>Kelola persetujuan publikasi</ButtonLink>
        {state.appreciationImage && status === 'Disetujui' ? (
          <a href={state.appreciationImage} download target="_blank" rel="noopener noreferrer" className="tap inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-control text-[0.9375rem] font-semibold text-primary hover:bg-primary-container">
            <DownloadSimple size={18} aria-hidden="true" /> Unduh materi apresiasi
          </a>
        ) : (
          <Button block variant="ghost" icon={<DownloadSimple size={18} />} disabled>
            {status === 'Disetujui' ? 'Belum ada berkas untuk diunduh' : 'Unduh setelah disetujui'}
          </Button>
        )}
      </StickyFooter>
    </>
  )
}

export function AppreciationPreview() {
  const { state } = useApp()
  const run = useCommand()
  const profile = useProfile()
  const navigate = useNavigate()
  const [sheet, setSheet] = useState(false)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const noMaterial = state.appreciationId === null
  const respond = (value: 'Disetujui' | 'Revisi diminta', done: () => void) => {
    setBusy(true)
    run({ type: 'setAppreciation', value, note: value === 'Revisi diminta' ? note.trim() : undefined, materialId: state.appreciationId })
      .then(done)
      .catch((err) => toast(messageOf(err), 'info'))
      .finally(() => setBusy(false))
  }
  return (
    <>
      <AppBar title="Pratinjau apresiasi" />
      <main className="stagger mx-auto flex max-w-[560px] flex-col gap-4 px-4 pb-40 pt-4">
        <PolicyNote title="Anda yang menentukan">Materi hanya tayang di kanal program setelah Anda setujui. Tidak ada publikasi otomatis ke media sosial.</PolicyNote>
        <Certificate name={profile.name} area={profile.area} />
        <section className="card p-4">
          <h2 className="text-card-title">Kanal yang diminta</h2>
          <ul className="mt-2 flex flex-col gap-1.5 text-meta">
            {['Profil mitra di aplikasi', 'Laporan bulanan program'].map((c) => <li key={c} className="flex items-center gap-2"><ShieldCheck size={16} aria-hidden="true" className="text-primary" />{c}</li>)}
          </ul>
          <p className="mt-3 text-caption text-ink-secondary">Perubahan teks atau gambar di masa depan memerlukan persetujuan ulang.</p>
        </section>
        {noMaterial && <Notice tone="info" title="Belum ada materi">Tim program akan mengirim materi apresiasi untuk Anda setujui. Anda akan menerima notifikasi.</Notice>}
        {state.appreciation !== 'Draf' && <Notice tone={state.appreciation === 'Disetujui' ? 'success' : 'info'}>Status saat ini: {state.appreciation}.</Notice>}
      </main>
      <StickyFooter>
        <Button
          block
          disabled={state.appreciation === 'Disetujui' || noMaterial}
          loading={busy}
          onClick={() =>
            respond('Disetujui', () => {
              toast('Versi ini disetujui untuk dipublikasikan.')
              navigate('/apresiasi', { replace: true })
            })
          }
        >
          {state.appreciation === 'Disetujui' ? 'Sudah disetujui' : 'Setujui versi ini'}
        </Button>
        <Button block variant="ghost" disabled={noMaterial} onClick={() => setSheet(true)}>Minta revisi</Button>
      </StickyFooter>
      <BottomSheet
        open={sheet}
        onClose={() => setSheet(false)}
        title="Minta revisi"
        footer={
          <Button
            block
            disabled={note.trim().length < 5}
            loading={busy}
            onClick={() =>
              respond('Revisi diminta', () => {
                setSheet(false)
                toast('Permintaan revisi dikirim ke tim program.')
              })
            }
          >
            Kirim permintaan
          </Button>
        }
      >
        <Field label="Apa yang perlu diubah?">{(p) => <textarea {...p} rows={4} className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} />}</Field>
      </BottomSheet>
    </>
  )
}

/* ---------- I02 Riwayat dampak ---------- */

export function ImpactHistory() {
  const { state } = useApp()
  const profile = useProfile()
  const donor = state.role === 'pemberi'
  const list = state.transfers.filter((t) => t.received !== undefined && (donor ? t.donorName === profile.name : t.recipientName === profile.name))
  return (
    <>
      <AppBar title="Riwayat dampak" />
      <main className="stagger mx-auto flex max-w-[560px] flex-col gap-4 px-4 pb-10 pt-4">
        <Notice tone="info" title="Dihitung sekali per kegiatan">Catatan pemberi dan penerima untuk kegiatan yang sama tidak dijumlahkan dua kali.</Notice>
        <p className="font-semibold">Oktober 2026 · {list.length} kegiatan terkonfirmasi</p>
        {list.length === 0 && <StatePanel title="Belum ada kegiatan terkonfirmasi">Dampak tercatat setelah penerima mengonfirmasi penerimaan.</StatePanel>}
        {list.map((t) => (
          <article key={t.id} className="card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Link to={`/aktivitas/${t.id}`} className="font-semibold text-primary hover:underline">{t.id}</Link>
              <Badge tone="success">Terkonfirmasi</Badge>
            </div>
            <p className="mt-1 font-semibold">{t.foodName}</p>
            <p className="text-meta text-ink-secondary">{t.date} · {donor ? `ke ${t.recipientName}` : `dari ${t.donorName}`}</p>
            <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
              {[
                ['Disepakati', t.agreed, 'bg-page'],
                ['Diterima', t.received, 'bg-primary-container text-primary'],
                ['Tidak diterima', t.rejected ?? 0, 'bg-accent-soft'],
              ].map(([k, v, c]) => (
                <div key={k as string} className={`rounded-control p-2 ${c}`}><dd className="text-[1.25rem] font-bold">{v as number}</dd><dt className="text-caption">{k}</dt></div>
              ))}
            </dl>
            {t.distribution && (
              <div className="mt-3 border-t border-line pt-3 text-meta">
                <p className="font-semibold">Penggunaan oleh penerima</p>
                <p className="text-ink-secondary">{t.distribution.distributed} dibagikan · {t.distribution.used} dipakai posko · {t.distribution.wasted} terbuang</p>
              </div>
            )}
          </article>
        ))}
        <ButtonLink to="/dampak/penjelasan" variant="ghost" block>Cara data ini dihitung</ButtonLink>
      </main>
    </>
  )
}

/* ---------- I03 Penjelasan data ---------- */

const DEFINITIONS = [
  ['Ditawarkan', 'Pemberi', 'Jumlah yang diumumkan pemberi. Niat awal, belum dihitung sebagai donasi berhasil.'],
  ['Diterima', 'Penerima', 'Jumlah fisik yang dikonfirmasi saat serah terima. Selisih dicatat terpisah.'],
  ['Didistribusikan', 'Warga', 'Porsi yang diteruskan ke penerima manfaat di sekitar.'],
  ['Digunakan posko', 'Internal', 'Dimasak atau dikonsumsi pengelola untuk kebutuhan harian.'],
  ['Sisa persediaan', 'Posko', 'Pangan layak yang tersimpan untuk dipakai berikutnya; tidak dianggap terbuang.'],
]

export function DataExplainer() {
  return (
    <>
      <AppBar title="Penjelasan data" />
      <main className="stagger mx-auto flex max-w-[560px] flex-col gap-4 px-4 pb-10 pt-4">
        <section className="flex items-start gap-3 rounded-greet bg-primary-container p-4">
          <ChartBar size={28} aria-hidden="true" className="shrink-0 text-primary" />
          <p className="text-body">Laporan dibuat dari kejadian nyata di lapangan, tanpa angka gabungan atau estimasi spekulatif.</p>
        </section>
        <section className="card p-4">
          <h2 className="text-card-title">5 status pangan</h2>
          <ol className="mt-3 flex flex-col gap-3">
            {DEFINITIONS.map(([t, who, d], i) => (
              <li key={t} className="flex gap-3">
                <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-[0.8125rem] font-bold text-white">{i + 1}</span>
                <div>
                  <p className="font-semibold">{t} <span className="font-normal text-ink-secondary">· {who}</span></p>
                  <p className="text-meta text-ink-secondary">{d}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
        <section className="card p-4">
          <h2 className="text-card-title">Batasan</h2>
          <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-5 text-meta">
            <li>Porsi, kilogram, dan kemasan tidak pernah dijumlahkan silang.</li>
            <li>Hari tanpa catatan berbeda dari hari dengan nilai 0.</li>
            <li>Estimasi emisi dan nilai rupiah pangan tidak ditampilkan sampai metodenya tersedia.</li>
          </ul>
        </section>
      </main>
    </>
  )
}
