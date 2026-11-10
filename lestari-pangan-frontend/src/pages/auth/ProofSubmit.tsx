import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ShieldCheck } from '@phosphor-icons/react'
import { Button, PolicyNote, toast } from '../../components/ui'
import { useApp } from '../../state/AppState'
import { messageOf } from '../../lib/supabase/errors'
import { submitVerification } from '../../services/identity'
import { VerificationFilePicker } from '../../components/VerificationFilePicker'
import { readDraft, writeDraft } from './draft'
import { SignupShell } from './SignupShell'

/* ---------- U10 Pengajuan bukti verifikasi ---------- */

export function ProofSubmit() {
  const { state, dispatch } = useApp()
  const navigate = useNavigate()
  const draft = readDraft()
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  if (!draft?.verified) return <Navigate to="/masuk" replace />

  const finish = async (withFile: boolean) => {
    setBusy(true)
    try {
      if (withFile && file) await submitVerification(file)
      writeDraft(null)
      dispatch({ type: 'signIn', role: state.role })
      toast(withFile ? 'Akun dibuat. Berkas masuk antrean peninjauan.' : 'Akun dibuat. Unggah bukti kapan saja dari menu Akun.')
      navigate(withFile ? '/akun/verifikasi' : '/', { replace: true })
    } catch (err) {
      toast(messageOf(err), 'info')
      setBusy(false)
    }
  }

  return (
    <SignupShell step={5} title="Verifikasi identitas" desc="Diperlukan sebelum penawaran atau permintaan pertama disetujui.">
      <div className="flex flex-1 flex-col gap-4">
        <ul className="flex flex-col gap-2 rounded-card border border-line p-4">
          {['Identitas penanggung jawab', state.role === 'pemberi' ? 'Surat keterangan usaha (UMKM/RT/RW)' : 'Surat keterangan lembaga atau komunitas', 'Nomor kontak aktif'].map((x) => (
            <li key={x} className="flex items-center gap-2 text-meta"><ShieldCheck size={18} aria-hidden="true" className="shrink-0 text-primary" />{x}</li>
          ))}
        </ul>
        <VerificationFilePicker file={file} onChange={setFile} />
        <PolicyNote title="Berkas bersifat privat">Hanya tim peninjau yang bisa membuka. Verifikasi memeriksa identitas, bukan sertifikasi keamanan pangan.</PolicyNote>
        <div className="mt-auto flex flex-col gap-2 pt-2">
          <Button block disabled={!file} loading={busy && !!file} onClick={() => finish(true)}>Kirim untuk ditinjau</Button>
          <Button block variant="ghost" disabled={busy} onClick={() => finish(false)}>Lewati, unggah nanti</Button>
        </div>
      </div>
    </SignupShell>
  )
}
