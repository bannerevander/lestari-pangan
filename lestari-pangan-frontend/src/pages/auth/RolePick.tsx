import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Info, Storefront, UsersThree } from '@phosphor-icons/react'
import { Button, Chip } from '../../components/ui'
import { useApp } from '../../state/AppState'
import type { Role } from '../../data/types'
import { readDraft, writeDraft } from './draft'

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
          <span>Langkah 3 dari 5 · Peran</span>
          <span className="font-semibold text-primary">60%</span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line" aria-hidden="true"><span className="block h-full w-3/5 origin-left animate-grow-x rounded-full bg-primary" /></div>
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
            dispatch({ type: 'setRole', role: role! })
            const draft = readDraft()
            if (draft) writeDraft({ ...draft, kind: kind || undefined })
            navigate('/daftar/profil')
          }}
        >
          Lanjutkan
        </Button>
      </div>
    </main>
  )
}
