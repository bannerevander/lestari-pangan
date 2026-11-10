import { useEffect, useRef, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { EnvelopeSimple } from '@phosphor-icons/react'
import { Button, Notice, toast } from '../../components/ui'
import { isLive } from '../../lib/supabase/client'
import { messageOf } from '../../lib/supabase/errors'
import { sendEmailOtp, verifyEmailOtp } from '../../services/auth'
import { readDraft } from './draft'
import { SignupShell } from './SignupShell'
import { useFinishSignIn } from './useFinishSignIn'

/* ---------- U05 Konfirmasi kode email ---------- */

const RESEND_SECONDS = 60

export function VerifyCode() {
  const draft = readDraft()
  const finish = useFinishSignIn()
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''))
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [wait, setWait] = useState(RESEND_SECONDS)
  const refs = useRef<(HTMLInputElement | null)[]>([])
  useEffect(() => {
    if (wait <= 0) return
    const t = window.setTimeout(() => setWait(wait - 1), 1000)
    return () => window.clearTimeout(t)
  }, [wait])
  useEffect(() => refs.current[0]?.focus(), [])
  if (!draft) return <Navigate to="/masuk" replace />

  const code = digits.join('')
  const set = (i: number, v: string) => {
    const clean = v.replace(/\D/g, '')
    if (clean.length > 1) {
      // Tempel kode utuh dari email.
      setDigits(clean.slice(0, 6).split('').concat(Array(6).fill('')).slice(0, 6))
      refs.current[Math.min(clean.length, 5)]?.focus()
      return
    }
    const next = [...digits]
    next[i] = clean
    setDigits(next)
    setErr('')
    if (clean && i < 5) refs.current[i + 1]?.focus()
  }

  const submit = async () => {
    if (code.length < 6) return setErr('Masukkan 6 angka kode.')
    setBusy(true)
    try {
      await verifyEmailOtp(draft.email, code)
      await finish(draft)
    } catch (e) {
      setErr(messageOf(e))
      setBusy(false)
    }
  }

  const resend = async () => {
    setWait(RESEND_SECONDS)
    try {
      await sendEmailOtp(draft.email)
      toast(isLive ? 'Kode baru dikirim.' : 'Kode demo dikirim ulang.', 'info')
    } catch (e) {
      setErr(messageOf(e))
    }
  }

  const register = draft.mode === 'register'
  return (
    <SignupShell step={register ? 2 : undefined} title="Periksa email Anda" desc="Masukkan 6 angka kode yang kami kirim.">
      <div className="flex flex-1 flex-col gap-5">
        <div className="flex items-center gap-3 rounded-control bg-primary-container p-3">
          <EnvelopeSimple size={22} aria-hidden="true" className="shrink-0 text-primary" />
          <p className="min-w-0 break-all text-meta"><span className="font-semibold">{draft.email}</span></p>
          <Link to={register ? '/daftar' : '/masuk'} className="ml-auto shrink-0 text-[0.875rem] font-semibold text-primary">Ubah</Link>
        </div>
        {isLive ? (
          <Notice tone="info">Kode berlaku sebentar. Jangan bagikan kode ini kepada siapa pun, termasuk yang mengaku petugas.</Notice>
        ) : (
          <Notice tone="info">Mode demo: tidak ada email yang dikirim. Ketik 6 angka apa saja.</Notice>
        )}
        <fieldset>
          <legend className="text-label">Kode verifikasi</legend>
          <div className="mt-2 flex justify-between gap-2" onPaste={(e) => (e.preventDefault(), set(0, e.clipboardData.getData('text')))}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => (refs.current[i] = el)}
                inputMode="numeric"
                autoComplete={i === 0 ? 'one-time-code' : 'off'}
                aria-label={`Angka ke-${i + 1}`}
                aria-invalid={err ? true : undefined}
                maxLength={6}
                value={d}
                onChange={(e) => set(i, e.target.value)}
                onKeyDown={(e) => e.key === 'Backspace' && !d && i > 0 && refs.current[i - 1]?.focus()}
                className={`h-14 w-full min-w-0 rounded-control border-2 bg-surface text-center text-[1.5rem] font-bold tabular transition-[border-color,transform] duration-micro focus:border-primary focus:outline-none ${d ? 'scale-[1.03] border-primary' : 'border-line-control'} ${err ? 'border-danger' : ''}`}
              />
            ))}
          </div>
          {err && <p role="alert" className="mt-2 text-meta font-medium text-danger">{err}</p>}
        </fieldset>
        <p className="text-meta text-ink-secondary" aria-live="polite">
          Tidak menerima kode? Periksa folder spam.{' '}
          {wait > 0 ? (
            <span>Kirim ulang dalam <span className="tabular font-semibold">{wait}</span> detik</span>
          ) : (
            <button type="button" className="font-semibold text-primary underline" onClick={resend}>Kirim ulang kode</button>
          )}
        </p>
        <div className="mt-auto pt-4">
          <Button block loading={busy} loadingLabel="Memeriksa…" disabled={code.length < 6 && !err} onClick={submit}>Verifikasi</Button>
        </div>
      </div>
    </SignupShell>
  )
}
