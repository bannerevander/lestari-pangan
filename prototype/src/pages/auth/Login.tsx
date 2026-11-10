import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Field, inputCls, Notice } from '../../components/ui'
import { useApp } from '../../state/AppState'
import { asset } from '../../lib/format'
import { isLive } from '../../lib/supabase/client'
import { messageOf } from '../../lib/supabase/errors'
import { sendEmailOtp } from '../../services/auth'
import { isEmail, writeDraft } from './draft'

/* ---------- U03 Masuk ---------- */

export function Login() {
  const navigate = useNavigate()
  const { dispatch } = useApp()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isEmail(email)) return setError('Isi email yang valid, mis. nama@contoh.id.')
    setError('')
    setBusy(true)
    if (!isLive) {
      window.setTimeout(() => {
        dispatch({ type: 'signIn' })
        navigate('/', { replace: true })
      }, 600)
      return
    }
    try {
      await sendEmailOtp(email)
      writeDraft({ email: email.trim(), mode: 'login' })
      navigate('/daftar/konfirmasi')
    } catch (err) {
      setError(messageOf(err))
      setBusy(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-surface px-6 pb-8 pt-10">
      <img src={asset('img/logo-lestari-pangan.png')} alt="Lestari Pangan" width={175} height={64} className="h-16 w-auto animate-rise-in self-start" />
      <h1 className="mt-8 text-page-title">Masuk</h1>
      <p className="text-body text-ink-secondary">Lanjutkan berbagi dan menerima pangan.</p>
      <form onSubmit={submit} className="mt-6 flex flex-col gap-4" noValidate>
        <Field label="Email" error={error}>
          {(p) => <input {...p} type="email" inputMode="email" autoComplete="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} />}
        </Field>
        {isLive ? (
          <Notice tone="info">Kami kirim kode 6 angka ke email ini. Tidak perlu kata sandi.</Notice>
        ) : (
          <Notice tone="info">Mode demo tanpa server: email apa pun langsung masuk ke akun demo.</Notice>
        )}
        <Button type="submit" loading={busy} loadingLabel={isLive ? 'Mengirim kode…' : 'Memeriksa…'}>{isLive ? 'Kirim kode' : 'Masuk'}</Button>
        {!isLive && <Link to="/pulihkan" className="-mt-1 self-end text-[0.875rem] font-semibold text-primary">Lupa akses?</Link>}
        <Button variant="ghost" onClick={() => navigate('/daftar')}>Belum punya akun? Daftar</Button>
      </form>
      <Link to="/admin/masuk" className="mt-auto pt-8 text-center text-caption text-ink-secondary underline">Masuk sebagai staf operasional</Link>
    </main>
  )
}
