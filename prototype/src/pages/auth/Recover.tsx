import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ArrowLeft, LockKey } from '@phosphor-icons/react'
import { Button, Field, inputCls, Notice, SuccessMark } from '../../components/ui'
import { isLive } from '../../lib/supabase/client'

/* ---------- U06 Pulihkan akses ---------- */

export function Recover() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  // Login tanpa kata sandi: memulihkan akses = meminta kode masuk baru.
  if (isLive) return <Navigate to="/masuk" replace />
  return (
    <main className="flex min-h-screen flex-col bg-surface px-6 pb-8">
      <div className="-mx-5 flex min-h-14 items-center">
        <button type="button" aria-label="Kembali" onClick={() => navigate('/masuk')} className="tap flex h-12 w-12 items-center justify-center rounded-full hover:bg-page">
          <ArrowLeft size={24} aria-hidden="true" />
        </button>
      </div>
      {sent ? (
        <div className="flex flex-1 animate-rise-in flex-col items-center gap-3 pt-10 text-center">
          <SuccessMark />
          <h1 className="text-page-title">Cek email Anda</h1>
          <p className="max-w-[34ch] text-body text-ink-secondary">Jika <span className="break-all font-semibold text-ink">{email}</span> terdaftar, petunjuk pemulihan dikirim dalam beberapa menit.</p>
          <Notice tone="info">Sesi demo: tidak ada email yang benar-benar dikirim.</Notice>
          <div className="mt-auto flex w-full flex-col gap-2">
            <Button block onClick={() => navigate('/masuk')}>Kembali ke Masuk</Button>
            <Button block variant="ghost" onClick={() => setSent(false)}>Pakai email lain</Button>
          </div>
        </div>
      ) : (
        <form
          noValidate
          className="flex flex-1 flex-col gap-4 pt-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (!/\S+@\S+\.\S+/.test(email)) return setErr('Isi email terdaftar yang valid.')
            setBusy(true)
            window.setTimeout(() => (setBusy(false), setSent(true)), 700)
          }}
        >
          <span aria-hidden="true" className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-container text-primary"><LockKey size={28} /></span>
          <h1 className="text-page-title">Pulihkan akses</h1>
          <p className="text-body text-ink-secondary">Masukkan email akun. Kami kirim tautan untuk membuat kata sandi baru.</p>
          <Field label="Email terdaftar" error={err}>
            {(p) => <input {...p} type="email" inputMode="email" autoComplete="email" className={inputCls} value={email} onChange={(e) => (setEmail(e.target.value), setErr(''))} />}
          </Field>
          <div className="mt-auto flex flex-col gap-2 pt-4">
            <Button type="submit" block loading={busy} loadingLabel="Mengirim…">Kirim petunjuk</Button>
            <Link to="/bantuan" className="text-center text-meta font-semibold text-primary">Butuh bantuan? Pusat bantuan</Link>
          </div>
        </form>
      )}
    </main>
  )
}
