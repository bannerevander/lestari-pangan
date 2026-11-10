import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, HandHeart, Info, LockSimple, MapTrifold, ShieldCheck, Storefront, UsersThree } from '@phosphor-icons/react'
import { Button, Chip, Field, inputCls, Notice } from '../components/ui'
import { useApp } from '../state/AppState'
import type { Role } from '../data/types'
import { asset } from '../lib/format'

/* ---------- U02 Pengenalan ---------- */

const slides = [
  {
    img: asset('illustrations/keranjang.svg'),
    title: 'Berbagi pangan berlebih, cegah sisa makanan',
    body: 'Hubungkan warung, restoran, dan rumah tangga dengan komunitas yang membutuhkan.',
    points: [
      [HandHeart, 'Tanpa biaya pembelian pangan', 'Pangan diberikan, bukan dijual.'],
      [MapTrifold, 'Koordinasi langsung', 'Jadwal dan cara pengambilan disepakati bersama.'],
    ],
  },
  {
    img: asset('illustrations/tangan-berbagi.svg'),
    title: 'Jumlah dicatat sesuai hasil nyata',
    body: 'Penawaran, reservasi, dan penerimaan dibedakan, sehingga laporan tetap jujur.',
    points: [
      [ShieldCheck, 'Pelaporan tanpa sanksi', 'Selisih atau pangan rusak boleh dilaporkan apa adanya.'],
      [LockSimple, 'Alamat tetap terlindungi', 'Alamat lengkap dibuka setelah ada kesepakatan.'],
    ],
  },
  {
    img: asset('illustrations/dampak.svg'),
    title: 'Pantau dan kurangi sisa',
    body: 'Catat pangan, lihat dampak per periode, dan temukan tips serta resep dari bahan yang ada.',
    points: [] as unknown[],
  },
] as const

export function Onboarding() {
  const [i, setI] = useState(0)
  const navigate = useNavigate()
  const { dispatch } = useApp()
  const s = slides[i]
  const finish = (to: string) => {
    dispatch({ type: 'onboarded' })
    navigate(to)
  }
  const last = i === slides.length - 1
  return (
    <main className="flex min-h-screen flex-col bg-surface pb-[calc(16px+env(safe-area-inset-bottom,0px))]">
      <div className="flex min-h-14 items-center justify-between border-b border-line px-4">
        <span className="flex items-center gap-2">
          <img src={asset('img/logo-mark.png')} alt="" className="h-8 w-8 rounded-[8px]" />
          <span className="text-[1.125rem] font-bold">Lestari Pangan</span>
        </span>
        <button type="button" onClick={() => finish('/masuk')} className="tap min-h-12 rounded-control px-3 text-[0.875rem] font-semibold text-ink-secondary hover:bg-page">
          Lewati
        </button>
      </div>
      <div className="mt-4 flex justify-center gap-1.5" aria-hidden="true">
        {slides.map((_, k) => (
          <span key={k} className={`h-1.5 rounded-full transition-all duration-micro ${k === i ? 'w-6 bg-primary' : 'w-1.5 bg-line'}`} />
        ))}
      </div>
      <section key={i} className="flex flex-1 animate-rise-in flex-col items-center gap-4 px-6 pt-6 text-center" aria-live="polite">
        <div className="flex h-40 w-40 items-center justify-center rounded-[24px] border border-line bg-page">
          <span className="flex h-28 w-28 items-center justify-center rounded-full bg-primary-container">
            <img src={s.img} alt="" className="h-20 w-20" />
          </span>
        </div>
        <p className="sr-only">Langkah {i + 1} dari {slides.length}</p>
        <h1 className="text-page-title">{s.title}</h1>
        <p className="max-w-sm text-body text-ink-secondary">{s.body}</p>
        {s.points.length > 0 && (
          <ul className="flex w-full max-w-sm flex-col gap-2 text-left">
            {(s.points as unknown as [typeof HandHeart, string, string][]).map(([Icon, t, d]) => (
              <li key={t} className="card flex items-center gap-3 p-3">
                <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-primary-container text-primary"><Icon size={22} /></span>
                <span className="min-w-0">
                  <span className="block font-semibold">{t}</span>
                  <span className="block text-meta text-ink-secondary">{d}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
        {last && <p className="text-[1rem] font-semibold text-primary">Bijak Konsumsi, Kurangi Sisa, Jaga Bumi.</p>}
      </section>
      <div className="flex flex-col gap-2 px-6 pt-6">
        {last ? (
          <Button onClick={() => finish('/peran')}>Mulai</Button>
        ) : (
          <Button onClick={() => setI(i + 1)}>Lanjut</Button>
        )}
        {i > 0 && !last ? (
          <Button variant="secondary" onClick={() => setI(i - 1)}>Sebelumnya</Button>
        ) : (
          <Button variant="secondary" onClick={() => finish('/masuk')}>Saya sudah punya akun</Button>
        )}
        <p className="flex items-center justify-center gap-1.5 pt-1 text-caption text-ink-secondary">
          <ShieldCheck size={16} aria-hidden="true" /> Data demo · Tanpa transaksi jual beli pangan
        </p>
      </div>
    </main>
  )
}

/* ---------- U03 Masuk (simulasi) ---------- */

export function Login() {
  const navigate = useNavigate()
  const { dispatch } = useApp()
  const [id, setId] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!id.trim()) return setError('Isi email atau nomor ponsel.')
    setError('')
    setBusy(true)
    window.setTimeout(() => {
      dispatch({ type: 'signIn' })
      navigate('/', { replace: true })
    }, 600)
  }
  return (
    <main className="flex min-h-screen flex-col bg-surface px-6 pb-8 pt-10">
      <img src={asset('img/logo-lestari-pangan.png')} alt="Lestari Pangan" className="h-14 w-auto self-start" />
      <h1 className="mt-8 text-page-title">Masuk</h1>
      <p className="text-body text-ink-secondary">Lanjutkan berbagi dan menerima pangan.</p>
      <form onSubmit={submit} className="mt-6 flex flex-col gap-4" noValidate>
        <Field label="Email atau nomor ponsel" error={error}>
          {(p) => <input {...p} autoComplete="username" className={inputCls} value={id} onChange={(e) => setId(e.target.value)} />}
        </Field>
        <Notice tone="info">Prototipe: metode autentikasi menunggu keputusan OD-02. Isian apa pun akan masuk ke akun demo.</Notice>
        <Button type="submit" loading={busy} loadingLabel="Memeriksa…">Masuk</Button>
        <Button variant="ghost" onClick={() => navigate('/peran')}>Belum punya akun? Daftar</Button>
      </form>
    </main>
  )
}

/* ---------- U07 Peran / tipe akun ---------- */

export function RolePick() {
  const navigate = useNavigate()
  const { dispatch } = useApp()
  const [role, setRole] = useState<Role | null>(null)
  const [kind, setKind] = useState('')
  const options: { role: Role; icon: JSX.Element; title: string; sub: string; desc: string; kinds: string[] }[] = [
    {
      role: 'pemberi',
      icon: <Storefront size={24} />,
      title: 'Saya menawarkan pangan',
      sub: 'Pemberi donasi',
      desc: 'Untuk restoran, warung, katering, toko roti, atau rumah tangga dengan surplus pangan layak konsumsi.',
      kinds: ['Warung / UMKM', 'Restoran', 'Katering', 'Rumah tangga'],
    },
    {
      role: 'penerima',
      icon: <UsersThree size={24} />,
      title: 'Saya mencari pangan',
      sub: 'Penerima donasi',
      desc: 'Untuk panti asuhan, panti jompo, dapur umum, dan komunitas yang menyalurkan makanan.',
      kinds: ['Panti asuhan', 'Panti jompo', 'Dapur umum', 'Komunitas'],
    },
  ]
  return (
    <main className="flex min-h-screen flex-col bg-surface pb-[calc(16px+env(safe-area-inset-bottom,0px))]">
      <div className="flex min-h-14 items-center gap-1 border-b border-line px-1">
        <button type="button" aria-label="Kembali" onClick={() => navigate(-1)} className="tap flex h-12 w-12 items-center justify-center rounded-full hover:bg-page">
          <ArrowLeft size={24} aria-hidden="true" />
        </button>
        <p className="flex-1 text-[1.125rem] font-semibold">Pilih peran akun</p>
      </div>
      <div className="px-6 pt-4">
        <div className="flex justify-between text-caption text-ink-secondary">
          <span>Langkah 1 dari 2 · Pengaturan awal</span>
          <span className="font-semibold text-primary">50%</span>
        </div>
        <div className="mt-1.5 h-1.5 rounded-full bg-line" aria-hidden="true"><span className="block h-full w-1/2 rounded-full bg-primary" /></div>
        <h1 className="mt-6 text-page-title">Bagaimana Anda ingin berpartisipasi?</h1>
        <p className="mt-1 text-body text-ink-secondary">Pilih peran utama. Satu akun memiliki satu peran aktif.</p>
      </div>
      <fieldset className="mt-5 flex flex-col gap-3 px-6">
        <legend className="sr-only">Peran</legend>
        {options.map((o) => {
          const on = role === o.role
          return (
            <div key={o.role} className={`rounded-card border-2 ${on ? 'border-primary bg-surface shadow-card' : 'border-line bg-surface'}`}>
              <label className="tap flex cursor-pointer items-start gap-3 p-4">
                <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-primary-container text-primary">{o.icon}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-card-title">{o.title}</span>
                  <span className="block text-meta font-semibold text-primary">{o.sub}</span>
                  <span className="mt-1 block text-meta text-ink-secondary">{o.desc}</span>
                </span>
                <input type="radio" name="role" checked={on} onChange={() => { setRole(o.role); setKind('') }} className="mt-1 h-5 w-5 shrink-0 accent-primary" />
              </label>
              {on && (
                <fieldset className="border-t border-line px-4 pb-4 pt-3">
                  <legend className="sr-only">Jenis {o.sub.toLowerCase()}</legend>
                  <p aria-hidden="true" className="mb-2 text-meta text-ink-secondary">Jenis {o.role === 'pemberi' ? 'usaha atau tempat pangan' : 'lembaga'} (opsional)</p>
                  <div className="flex flex-wrap gap-2">
                    {o.kinds.map((k) => <Chip key={k} selected={kind === k} onClick={() => setKind(kind === k ? '' : k)}>{k}</Chip>)}
                  </div>
                </fieldset>
              )}
            </div>
          )
        })}
      </fieldset>
      <p className="mx-6 mt-4 flex gap-2 rounded-control bg-primary-container p-3 text-meta">
        <Info size={18} aria-hidden="true" className="mt-px shrink-0 text-primary" />
        Peran bisa disesuaikan nanti melalui verifikasi akun.
      </p>
      <div className="mt-auto px-6 pt-8">
        <Button
          block
          disabled={!role}
          onClick={() => {
            dispatch({ type: 'signIn', role: role! })
            navigate('/', { replace: true })
          }}
        >
          Lanjutkan
        </Button>
        <p className="mt-2 text-center text-caption text-ink-secondary">Langkah profil dan verifikasi belum dibangun di prototipe.</p>
      </div>
    </main>
  )
}
