import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HandHeart, LockSimple, MapTrifold, ShieldCheck } from '@phosphor-icons/react'
import { Button } from '../../components/ui'
import { useApp } from '../../state/AppState'
import { asset } from '../../lib/format'

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
          <img src={asset('img/logo-mark.png')} alt="" width={32} height={32} className="h-8 w-8 shrink-0" />
          <span className="text-[1.125rem] font-bold tracking-tight text-primary-pressed">Lestari Pangan</span>
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
          <Button onClick={() => finish('/daftar')}>Mulai</Button>
        ) : (
          <Button onClick={() => setI(i + 1)}>Lanjut</Button>
        )}
        {i > 0 && !last ? (
          <Button variant="secondary" onClick={() => setI(i - 1)}>Sebelumnya</Button>
        ) : (
          <Button variant="secondary" onClick={() => finish('/masuk')}>Saya sudah punya akun</Button>
        )}
        <p className="flex items-center justify-center gap-1.5 pt-1 text-caption text-ink-secondary">
          <ShieldCheck size={16} aria-hidden="true" /> Tanpa transaksi jual beli pangan
        </p>
      </div>
    </main>
  )
}
