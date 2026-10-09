import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HandHeart, Storefront, UsersThree } from '@phosphor-icons/react'
import { Button, Field, inputCls, Notice } from '../components/ui'
import { useApp } from '../state/AppState'
import type { Role } from '../data/types'

/* ---------- U02 Pengenalan ---------- */

const slides = [
  { img: '/illustrations/keranjang.svg', title: 'Surplus pangan sampai ke yang membutuhkan', body: 'Restoran, UMKM, dan rumah tangga menawarkan pangan layak konsumsi kepada panti dan komunitas.' },
  { img: '/illustrations/tangan-berbagi.svg', title: 'Memberi dan menerima tetap gratis', body: 'Jadwal, jumlah, dan cara penyaluran disepakati bersama. Penerimaan dicatat sesuai hasil nyata.' },
  { img: '/illustrations/dampak.svg', title: 'Pantau dan kurangi sisa', body: 'Catat pangan, lihat dampak per periode, dan temukan tips serta resep dari bahan yang ada.' },
]

export function Onboarding() {
  const [i, setI] = useState(0)
  const navigate = useNavigate()
  const { dispatch } = useApp()
  const s = slides[i]
  const finish = (to: string) => {
    dispatch({ type: 'onboarded' })
    navigate(to)
  }
  return (
    <main className="flex min-h-screen flex-col bg-surface px-6 pb-[calc(24px+env(safe-area-inset-bottom,0px))] pt-8">
      <div className="flex items-center justify-between">
        <img src="/img/logo-lestari-pangan.png" alt="Lestari Pangan" className="h-12 w-auto" />
        <button type="button" onClick={() => finish('/masuk')} className="tap min-h-12 rounded-control px-3 text-[0.875rem] font-semibold text-primary hover:bg-primary-container">
          Lewati
        </button>
      </div>
      <section key={i} className="flex flex-1 animate-rise-in flex-col items-center justify-center gap-4 text-center" aria-live="polite">
        <div className="flex h-44 w-44 items-center justify-center rounded-full bg-primary-container">
          <img src={s.img} alt="" className="h-28 w-28" />
        </div>
        <p className="text-meta text-ink-secondary">{i + 1} dari {slides.length}</p>
        <h1 className="text-display">{s.title}</h1>
        <p className="max-w-sm text-body text-ink-secondary">{s.body}</p>
        {i === slides.length - 1 && <p className="text-[1rem] font-semibold text-primary">Bijak Konsumsi, Kurangi Sisa, Jaga Bumi.</p>}
      </section>
      <div className="mb-6 flex justify-center gap-2" aria-hidden="true">
        {slides.map((_, k) => (
          <span key={k} className={`h-2 rounded-full transition-all duration-micro ${k === i ? 'w-6 bg-primary' : 'w-2 bg-line'}`} />
        ))}
      </div>
      {i < slides.length - 1 ? (
        <div className="flex gap-2">
          {i > 0 && <Button variant="secondary" className="flex-1" onClick={() => setI(i - 1)}>Sebelumnya</Button>}
          <Button className="flex-[2]" onClick={() => setI(i + 1)}>Lanjut</Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <Button onClick={() => finish('/peran')}>Mulai</Button>
          <Button variant="secondary" onClick={() => finish('/masuk')}>Saya sudah punya akun</Button>
        </div>
      )}
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
      <img src="/img/logo-lestari-pangan.png" alt="Lestari Pangan" className="h-14 w-auto self-start" />
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
  const options: { role: Role; icon: JSX.Element; title: string; desc: string }[] = [
    { role: 'pemberi', icon: <Storefront size={28} />, title: 'Pemberi donasi', desc: 'Restoran, UMKM, atau rumah tangga dengan surplus pangan' },
    { role: 'penerima', icon: <UsersThree size={28} />, title: 'Penerima donasi', desc: 'Panti asuhan, panti jompo, atau komunitas berbagi makanan' },
  ]
  return (
    <main className="flex min-h-screen flex-col bg-surface px-6 pb-8 pt-10">
      <HandHeart size={40} className="text-primary" aria-hidden="true" />
      <h1 className="mt-4 text-page-title">Anda bergabung sebagai</h1>
      <p className="text-body text-ink-secondary">Pilihan ini menentukan menu dan profil yang perlu dilengkapi.</p>
      <fieldset className="mt-6 flex flex-col gap-3">
        <legend className="sr-only">Peran</legend>
        {options.map((o) => (
          <label key={o.role} className={`tap flex cursor-pointer items-center gap-4 rounded-card border-2 p-4 ${role === o.role ? 'border-primary bg-primary-container' : 'border-line bg-surface'}`}>
            <input type="radio" name="role" className="sr-only" checked={role === o.role} onChange={() => setRole(o.role)} />
            <span aria-hidden="true" className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-surface text-primary ring-1 ring-line">{o.icon}</span>
            <span>
              <span className="block text-card-title">{o.title}</span>
              <span className="block text-meta text-ink-secondary">{o.desc}</span>
            </span>
          </label>
        ))}
      </fieldset>
      <div className="mt-auto pt-8">
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
      </div>
    </main>
  )
}
