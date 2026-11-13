import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CaretRight, Flag, Gear, LockSimple, MapPin, NavigationArrow, Phone, ShieldCheck } from '@phosphor-icons/react'
import { AppBar, Badge, Button, ButtonLink, Field, inputCls, Notice, PolicyNote, QtyStepper, RadioCard, Segmented, StatePanel, StickyFooter, toast, type Tone } from '../components/ui'
import { useApp, type CourierTask } from '../state/AppState'
import { useCommand } from '../state/useCommand'
import { useLiveData } from '../state/LiveData'
import { messageOf } from '../lib/supabase/errors'
import { reportIssue, uploadIssuePhoto } from '../services/issues'
import { PhotoPicker } from '../components/PhotoPicker'
import { NotAvailable } from '../components/NotAvailable'

const tone = (s: CourierTask['status']): Tone => (s === 'Selesai' ? 'success' : s === 'Dalam perjalanan' ? 'info' : s === 'Gagal' ? 'danger' : 'warning')
const closed = (s: CourierTask['status']) => s === 'Selesai' || s === 'Gagal'

/* ---------- K01 Tugas mitra ---------- */

export function TaskList() {
  const { state } = useApp()
  const [tab, setTab] = useState<'aktif' | 'selesai'>('aktif')
  const active = state.tasks.filter((t) => !closed(t.status))
  const done = state.tasks.filter((t) => closed(t.status))
  const list = tab === 'aktif' ? active : done
  return (
    <>
      <AppBar
        title="Tugas pengantaran"
        back={false}
        actions={<Link to="/pengaturan" aria-label="Pengaturan akun" className="tap mr-1 flex h-12 w-12 items-center justify-center rounded-full hover:bg-page"><Gear size={24} aria-hidden="true" /></Link>}
      />
      <main className="stagger mx-auto flex max-w-[560px] flex-col gap-4 px-4 pb-10 pt-4">
        <Notice tone="info" title="Khusus mitra yang ditugaskan">Daftar ini hanya berisi tugas yang disepakati pemberi dan penerima. Bukan pencarian publik.</Notice>
        <Segmented label="Tugas" value={tab} onChange={setTab} options={[{ value: 'aktif', label: 'Aktif', count: active.length }, { value: 'selesai', label: 'Selesai', count: done.length }]} />
        {list.length === 0 ? (
          <StatePanel title={tab === 'aktif' ? 'Tidak ada tugas aktif' : 'Belum ada tugas selesai'}>Tugas baru muncul setelah ditetapkan tim operasional.</StatePanel>
        ) : (
          <ul key={tab} className="stagger flex flex-col gap-3">
            {list.map((t) => (
              <li key={t.id}>
                <Link to={`/tugas/${t.id}`} className="tap tap-soft card block p-4 hover:bg-page">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge tone={tone(t.status)}>{t.status}</Badge>
                    <span className="text-caption text-ink-secondary">{t.id}</span>
                  </div>
                  <p className="mt-2 text-card-title">{t.food}</p>
                  <p className="text-meta text-ink-secondary">{t.delivered ?? t.picked ?? t.agreed} {t.unit} · {t.window}</p>
                  <ol className="mt-3 flex flex-col gap-2 border-t border-line pt-3 text-meta">
                    <li className="flex items-center gap-2"><span aria-hidden="true" className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[0.6875rem] font-bold text-white">1</span>Ambil di <span className="font-semibold">{t.from.name}</span></li>
                    <li className="flex items-center gap-2"><span aria-hidden="true" className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[0.6875rem] font-bold text-ink">2</span>Serahkan ke <span className="font-semibold">{t.to.name}</span></li>
                  </ol>
                  <p className="mt-3 flex items-center justify-end gap-1 text-[0.875rem] font-semibold text-primary">Buka tugas <CaretRight size={14} weight="bold" aria-hidden="true" /></p>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <p className="text-caption text-ink-secondary">Tanpa pelacakan GPS otomatis. Posisi dikoordinasikan manual oleh para pihak.</p>
      </main>
    </>
  )
}

/* ---------- K02 Detail tugas ---------- */

function Stop({ n, label, p, done }: { n: number; label: string; p: CourierTask['from']; done: boolean }) {
  return (
    <section className={`card p-4 ${done ? 'opacity-70' : ''}`}>
      <div className="flex items-center gap-2">
        <span aria-hidden="true" className={`flex h-7 w-7 items-center justify-center rounded-full text-[0.8125rem] font-bold ${n === 1 ? 'bg-primary text-white' : 'bg-accent text-ink'}`}>{n}</span>
        <p className="text-caption font-semibold uppercase tracking-wide text-ink-secondary">{label}</p>
        {done && <Badge tone="success">Selesai</Badge>}
      </div>
      <p className="mt-2 font-semibold">{p.name} <span className="font-normal text-ink-secondary">· {p.pic}</span></p>
      <p className="mt-1 flex items-start gap-1.5 text-meta"><MapPin size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-primary" />{p.address}</p>
      {p.note && <p className="mt-2 rounded-control bg-page p-2 text-meta">{p.note}</p>}
      <p className="mt-2 flex items-center gap-1 text-caption text-ink-secondary"><LockSimple size={14} aria-hidden="true" />Alamat privat, hanya untuk tugas ini</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <a href={p.phone ? `tel:${p.phone.replace(/[^\d+]/g, '')}` : undefined} aria-disabled={!p.phone} className={`tap inline-flex min-h-11 items-center justify-center gap-2 rounded-control border border-line bg-surface text-[0.875rem] font-semibold text-primary ${p.phone ? 'hover:border-line-control' : 'pointer-events-none opacity-50'}`}>
          <Phone size={18} aria-hidden="true" /> Hubungi
        </a>
        <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.address)}`} target="_blank" rel="noopener noreferrer" className="tap inline-flex min-h-11 items-center justify-center gap-2 rounded-control border border-line bg-surface text-[0.875rem] font-semibold text-primary hover:border-line-control">
          <NavigationArrow size={18} aria-hidden="true" /> Arah
        </a>
      </div>
    </section>
  )
}

export function TaskDetail() {
  const { id } = useParams()
  const { state } = useApp()
  const t = state.tasks.find((x) => x.id === id)
  if (!t) return <NotAvailable />
  return (
    <>
      <AppBar title="Detail tugas" actions={!closed(t.status) ? <ButtonLink to={`/tugas/${t.id}/kendala`} variant="ghost-danger" className="min-h-12 text-[0.875rem]" icon={<Flag size={18} />}>Kendala</ButtonLink> : undefined} />
      <main className="stagger mx-auto flex max-w-[560px] flex-col gap-4 px-4 pb-36 pt-4">
        <section className="card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Badge tone={tone(t.status)}>{t.status}</Badge>
            <span className="text-caption text-ink-secondary">{t.id} · {t.transferId}</span>
          </div>
          <h1 className="mt-2 text-card-title">{t.food}</h1>
          <p className="text-meta text-ink-secondary">{t.agreed} {t.unit} disepakati · {t.window}</p>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-meta">
            <div className="rounded-control bg-page p-2"><dt className="text-caption text-ink-secondary">Nilai pangan</dt><dd className="font-semibold">Rp0 (donasi)</dd></div>
            <div className="rounded-control bg-page p-2"><dt className="text-caption text-ink-secondary">Biaya pengiriman</dt><dd className="font-semibold">{t.cost}</dd></div>
          </dl>
        </section>
        <Stop n={1} label="Titik ambil" p={t.from} done={t.status !== 'Menunggu ambil'} />
        <Stop n={2} label="Titik serah" p={t.to} done={t.status === 'Selesai'} />
        <section className="card p-4">
          <h2 className="mb-3 text-card-title">Riwayat</h2>
          <ol className="relative flex flex-col gap-3 border-l-2 border-line pl-5">
            {t.timeline.map((e, i) => (
              <li key={i} className="relative">
                <span aria-hidden="true" className={`absolute -left-[27px] top-1 h-3 w-3 rounded-full ring-4 ring-surface ${i === t.timeline.length - 1 ? 'bg-primary' : 'bg-line-control'}`} />
                <p className="font-semibold">{e.label}</p>
                <p className="text-meta text-ink-secondary">{e.at}{e.note ? ` · ${e.note}` : ''}</p>
              </li>
            ))}
          </ol>
        </section>
        <PolicyNote title="Higienitas dan privasi">Jaga wadah tertutup dan terpisah dari barang lain. Jangan memotret wajah atau membagikan alamat.</PolicyNote>
      </main>
      {!closed(t.status) && (
        <StickyFooter>
          <ButtonLink to={`/tugas/${t.id}/serah-terima`} block>{t.status === 'Menunggu ambil' ? 'Catat pengambilan' : 'Catat penyerahan'}</ButtonLink>
        </StickyFooter>
      )}
    </>
  )
}

/* ---------- K03 Ambil dan serahkan ---------- */

export function TaskHandover() {
  const { id } = useParams()
  const { state } = useApp()
  const run = useCommand()
  const navigate = useNavigate()
  const t = state.tasks.find((x) => x.id === id)
  const [qty, setQty] = useState(t?.picked ?? t?.agreed ?? 0)
  const [checks, setChecks] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  if (!t || t.status === 'Selesai') return <NotAvailable />
  const pickup = t.status === 'Menunggu ambil'
  const base = pickup ? t.agreed : t.picked ?? t.agreed
  const CHECKS = pickup ? ['Kemasan tertutup rapat dan tidak bocor', 'Tampilan dan aroma layak'] : ['Penerima memeriksa jumlah bersama', 'Selisih atau kerusakan dicatat apa adanya']
  return (
    <>
      <AppBar title={pickup ? 'Catat pengambilan' : 'Catat penyerahan'} />
      <main className="stagger mx-auto flex max-w-[560px] flex-col gap-4 px-4 pb-36 pt-4">
        <ol className="grid grid-cols-2 gap-2" aria-label="Tahap tugas">
          {['Ambil dari pemberi', 'Serahkan ke penerima'].map((s, i) => {
            const on = (i === 0) === pickup
            const done = i === 0 && !pickup
            return (
              <li key={s} aria-current={on ? 'step' : undefined} className={`rounded-control border-2 p-3 text-meta ${on ? 'border-primary bg-primary-container font-semibold' : done ? 'border-line bg-page text-ink-secondary line-through' : 'border-line text-ink-secondary'}`}>
                {i + 1}. {s}
              </li>
            )
          })}
        </ol>
        <section className="card p-4">
          <Field label={`Jumlah ${pickup ? 'diambil' : 'diserahkan'} (${t.unit})`} hint={`${pickup ? 'Kesepakatan' : 'Diambil'}: ${base} ${t.unit}.`}>
            {(p) => <QtyStepper id={p.id} describedBy={p['aria-describedby']} value={qty} onChange={setQty} min={0} max={base} unit={t.unit} />}
          </Field>
          {qty < base && <Notice tone="warning" title={`Selisih ${base - qty} ${t.unit}`}>Catat apa adanya. Laporkan kendala bila ada kemasan rusak.</Notice>}
        </section>
        <fieldset className="card flex flex-col gap-2 p-4">
          <legend className="float-left mb-2 text-card-title">Pemeriksaan</legend>
          {CHECKS.map((c) => (
            <label key={c} className="tap flex min-h-12 cursor-pointer items-center gap-3 rounded-control p-1">
              <input type="checkbox" className="h-5 w-5 accent-primary" checked={checks.includes(c)} onChange={() => setChecks(checks.includes(c) ? checks.filter((x) => x !== c) : [...checks, c])} />
              <span className="text-meta">{c}</span>
            </label>
          ))}
        </fieldset>
        <PolicyNote title="Tanpa penalti">Perbedaan fisik dilaporkan apa adanya tanpa khawatir sanksi reputasi.</PolicyNote>
      </main>
      <StickyFooter>
        <Button
          block
          disabled={checks.length < CHECKS.length}
          loading={busy}
          onClick={() => {
            setBusy(true)
            run({ type: pickup ? 'taskPickup' : 'taskDeliver', id: t.id, quantity: qty })
              .then(() => {
                toast(pickup ? `${qty} ${t.unit} diambil. Lanjut ke ${t.to.name}.` : 'Tugas selesai. Terima kasih!')
                navigate(`/tugas/${t.id}`, { replace: true })
              })
              .catch((err) => {
                toast(messageOf(err), 'info')
                setBusy(false)
              })
          }}
        >
          {pickup ? 'Konfirmasi pangan diambil' : 'Konfirmasi pangan diserahkan'}
        </Button>
        {checks.length < CHECKS.length && <p className="text-center text-caption text-ink-secondary">Centang pemeriksaan untuk melanjutkan.</p>}
      </StickyFooter>
    </>
  )
}

/* ---------- K04 Kendala tugas ---------- */

const TASK_ISSUES = [
  ['Kemasan rusak atau tumpah di jalan', 'Ada wadah bocor saat perjalanan.'],
  ['Titik temu tidak bisa diakses', 'Pemberi atau penerima belum bisa ditemui.'],
  ['Terlambat atau cuaca buruk', 'Perlu menggeser waktu serah terima.'],
] as const

export function TaskIssue() {
  const { id } = useParams()
  const { state } = useApp()
  const { refresh } = useLiveData()
  const [clientId] = useState(() => crypto.randomUUID())
  const navigate = useNavigate()
  const t = state.tasks.find((x) => x.id === id)
  const [cat, setCat] = useState('')
  const [desc, setDesc] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPath, setPhotoPath] = useState<{ file: File; path: string } | null>(null) // kirim ulang tidak mengunggah dua kali
  const [busy, setBusy] = useState(false)
  if (!t) return <NotAvailable />
  const send = async () => {
    setBusy(true)
    try {
      let path = photo && photoPath?.file === photo ? photoPath.path : undefined
      if (photo && !path) {
        path = await uploadIssuePhoto(photo)
        setPhotoPath({ file: photo, path })
      }
      const code = await reportIssue(clientId, t.transferId, cat, `[${t.id}] ${desc.trim()}`, path)
      await refresh()
      toast('Laporan kendala terkirim ke tim operasional.')
      navigate(`/masalah/${code}`, { replace: true })
    } catch (err) {
      toast(messageOf(err), 'info')
      setBusy(false)
    }
  }
  const ready = cat && desc.trim().length >= 10
  return (
    <>
      <AppBar title="Laporkan kendala tugas" />
      <main className="stagger mx-auto flex max-w-[560px] flex-col gap-4 px-4 pb-36 pt-4">
        <p className="flex items-center gap-2 text-meta text-ink-secondary"><ShieldCheck size={18} aria-hidden="true" className="text-primary" />Tugas {t.id} · resolusi netral tanpa sanksi kurir</p>
        <fieldset className="card flex flex-col gap-2 p-4">
          <legend className="float-left mb-3 text-card-title">Kategori</legend>
          {TASK_ISSUES.map(([title, d]) => <RadioCard key={title} name="cat" checked={cat === title} onChange={() => setCat(title)} title={title} description={d} />)}
        </fieldset>
        <section className="card flex flex-col gap-4 p-4">
          <Field label="Kronologi singkat" hint="Minimal 10 karakter. Tulis jumlah dan kondisi.">
            {(p) => <textarea {...p} rows={4} className={inputCls} value={desc} onChange={(e) => setDesc(e.target.value)} />}
          </Field>
          <PhotoPicker file={photo} onChange={setPhoto} label="Foto kondisi" hint="Hanya foto kondisi wadah atau makanan." />
        </section>
      </main>
      <StickyFooter>
        <Button
          block
          disabled={!ready}
          loading={busy}
          onClick={send}
        >
          Kirim laporan kendala
        </Button>
      </StickyFooter>
    </>
  )
}
