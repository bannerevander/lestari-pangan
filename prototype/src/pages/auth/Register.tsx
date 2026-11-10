import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Field, inputCls } from '../../components/ui'
import { isLive } from '../../lib/supabase/client'
import { messageOf } from '../../lib/supabase/errors'
import { sendEmailOtp } from '../../services/auth'
import { isEmail, readDraft, writeDraft } from './draft'
import { SignupShell } from './SignupShell'

/* ---------- U04 Daftar (email + OTP, tanpa kata sandi: AR-05) ---------- */

export function Register() {
  const navigate = useNavigate()
  const prev = readDraft()
  const [f, setF] = useState({ name: prev?.name ?? '', email: prev?.email ?? '' })
  const [agree, setAgree] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)

  const check = (k: 'name' | 'email', v: string) =>
    k === 'name' ? (v.trim().length >= 3 ? '' : 'Isi nama penanggung jawab (minimal 3 huruf).') : isEmail(v) ? '' : 'Isi email yang valid, mis. nama@contoh.id.'

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const next = { name: check('name', f.name), email: check('email', f.email), agree: agree ? '' : 'Setujui ketentuan untuk melanjutkan.' }
    setErrors(next)
    if (Object.values(next).some(Boolean)) return requestAnimationFrame(() => document.querySelector<HTMLElement>('[aria-invalid="true"], #agree')?.focus())
    setBusy(true)
    try {
      await sendEmailOtp(f.email)
      writeDraft({ name: f.name.trim(), email: f.email.trim(), mode: 'register' })
      navigate('/daftar/konfirmasi')
    } catch (err) {
      setErrors({ email: messageOf(err) })
      setBusy(false)
    }
  }

  return (
    <SignupShell step={1} title="Buat akun" desc="Untuk menawarkan atau menerima pangan surplus di sekitar Anda.">
      <form onSubmit={submit} noValidate className="flex flex-1 flex-col gap-4">
        <Field label="Nama penanggung jawab" error={errors.name}>
          {(p) => <input {...p} autoComplete="name" className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} onBlur={(e) => setErrors({ ...errors, name: check('name', e.target.value) })} />}
        </Field>
        <Field label="Email" hint={isLive ? 'Kode masuk dikirim ke email ini. Tidak perlu kata sandi.' : undefined} error={errors.email}>
          {(p) => <input {...p} type="email" inputMode="email" autoComplete="email" className={inputCls} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} onBlur={(e) => setErrors({ ...errors, email: check('email', e.target.value) })} />}
        </Field>
        <div>
          <label className="tap flex min-h-12 cursor-pointer items-start gap-3 rounded-control p-1">
            <input id="agree" type="checkbox" checked={agree} onChange={(e) => (setAgree(e.target.checked), setErrors({ ...errors, agree: '' }))} aria-invalid={errors.agree ? true : undefined} className="mt-0.5 h-5 w-5 shrink-0 accent-primary" />
            <span className="text-meta">
              Saya menyetujui <Link to="/tentang" className="font-semibold text-primary underline">ketentuan layanan dan kebijakan privasi</Link>.
            </span>
          </label>
          {errors.agree && <p className="mt-1 text-meta font-medium text-danger">{errors.agree}</p>}
        </div>
        <div className="mt-auto flex flex-col gap-2 pt-4">
          <Button type="submit" block loading={busy} loadingLabel="Mengirim kode…">Lanjut</Button>
          <p className="text-center text-meta text-ink-secondary">
            Sudah punya akun? <Link to="/masuk" className="font-semibold text-primary">Masuk</Link>
          </p>
        </div>
      </form>
    </SignupShell>
  )
}
