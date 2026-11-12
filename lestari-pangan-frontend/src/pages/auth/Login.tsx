import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Field, inputCls, Notice, Segmented } from '../../components/ui'
import { asset } from '../../lib/format'
import { messageOf } from '../../lib/supabase/errors'
import { demoSignIn, isDemoEmail, sendEmailOtp, signInWithPassword } from '../../services/auth'
import { isEmail, writeDraft } from './draft'
import { useFinishSignIn } from './useFinishSignIn'

/* ---------- U03 Masuk ---------- */

export function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  // Dua metode masuk untuk semua akun: kode verifikasi email atau kata sandi.
  const [method, setMethod] = useState<'kode' | 'sandi'>('kode')
  const withPassword = method === 'sandi'
  const [password, setPassword] = useState('')
  const finish = useFinishSignIn()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isEmail(email)) return setError('Isi email yang valid, mis. nama@contoh.id.')
    if (withPassword && !password) return setError('Isi kata sandi.')
    setError('')
    setBusy(true)
    try {
      if (withPassword) {
        await signInWithPassword(email, password)
        await finish({ email: email.trim(), mode: 'login' })
        return
      }
      if (isDemoEmail(email)) {
        // Akun uji tidak menerima email: langsung masuk tanpa kode.
        await demoSignIn(email)
        await finish({ email: email.trim(), mode: 'login' })
        return
      }
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
        <Segmented
          label="Metode masuk"
          value={method}
          onChange={(m) => (setMethod(m), setError(''))}
          options={[
            { value: 'kode', label: 'Kode verifikasi' },
            { value: 'sandi', label: 'Kata sandi' },
          ]}
        />
        <Field label="Email" error={error}>
          {(p) => <input {...p} type="email" inputMode="email" autoComplete="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} />}
        </Field>
        {withPassword ? (
          <Field label="Kata sandi" hint="Belum punya kata sandi? Masuk dengan kode verifikasi, lalu buat di Pengaturan → Keamanan akses.">
            {(p) => <input {...p} type="password" autoComplete="current-password" className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} />}
          </Field>
        ) : (
          <Notice tone="info">Kami kirim kode 6 angka ke email ini. Tidak perlu kata sandi.</Notice>
        )}
        <Button type="submit" loading={busy} loadingLabel={withPassword ? 'Masuk…' : 'Mengirim kode…'}>{withPassword ? 'Masuk' : 'Kirim kode'}</Button>
        <Button variant="ghost" onClick={() => navigate('/daftar')}>Belum punya akun? Daftar</Button>
      </form>
      <Link to="/admin/masuk" className="mt-auto pt-8 text-center text-caption text-ink-secondary underline">Masuk sebagai staf operasional</Link>
    </main>
  )
}
