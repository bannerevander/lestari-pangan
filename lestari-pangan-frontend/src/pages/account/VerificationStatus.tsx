import { useState } from 'react'
import { AppBar, Badge, Button, ButtonLink, Notice, PolicyNote, StageList, toast } from '../../components/ui'
import { VerificationFilePicker } from '../../components/VerificationFilePicker'
import { useProfile } from '../../state/useProfile'
import { useMyProfile } from '../../state/MyProfile'
import { submitVerification } from '../../services/identity'
import { messageOf } from '../../lib/supabase/errors'

/* ---------- A04 Status verifikasi ---------- */

const COPY = {
  Terverifikasi: { tone: 'success', badge: 'Terverifikasi', title: 'Identitas pengelola sudah sesuai', body: 'Lencana verifikasi tampil di profil publik dan penawaran Anda.', stage: 3 },
  'Menunggu pemeriksaan': { tone: 'warning', badge: 'Sedang ditinjau tim', title: 'Berkas Anda sedang diperiksa', body: 'Tim memastikan kesesuaian data penanggung jawab. Anda tetap bisa menyiapkan penawaran selama menunggu.', stage: 1 },
  'Belum diajukan': { tone: 'warning', badge: 'Belum diajukan', title: 'Unggah bukti untuk verifikasi', body: 'Verifikasi membantu pihak lain mempercayai profil Anda.', stage: 0 },
  Ditolak: { tone: 'danger', badge: 'Perlu diperbaiki', title: 'Pengajuan belum diterima', body: 'Periksa alasan di notifikasi, lalu unggah bukti yang sesuai.', stage: 0 },
} as const

export function VerificationStatus() {
  const profile = useProfile()
  const { refresh } = useMyProfile()
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const c = COPY[profile.verification]
  const canUpload = (profile.verification === 'Belum diajukan' || profile.verification === 'Ditolak')

  const send = async () => {
    if (!file) return
    setBusy(true)
    try {
      await submitVerification(file)
      await refresh()
      setFile(null)
      toast('Berkas masuk antrean peninjauan.')
    } catch (err) {
      toast(messageOf(err), 'info')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <AppBar title="Status verifikasi" />
      <main className="stagger mx-auto flex max-w-[560px] flex-col gap-4 px-4 pb-8 pt-4">
        <section className={`relative overflow-hidden rounded-greet p-5 ${c.tone === 'success' ? 'bg-primary-container' : c.tone === 'danger' ? 'bg-danger-container' : 'bg-warning-container'}`}>
          <Badge tone={c.tone}>{c.badge}</Badge>
          <h2 className="mt-3 text-section-title">{c.title}</h2>
          <p className="mt-1 text-body text-ink-secondary">{c.body}</p>
          {profile.verification === 'Menunggu pemeriksaan' && (
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/70" aria-hidden="true">
              <span className="block h-full w-1/3 animate-shimmer rounded-full bg-warning/60" />
            </div>
          )}
        </section>

        {canUpload ? (
          <section className="card flex flex-col gap-3 p-4">
            <h2 className="text-card-title">Unggah bukti</h2>
            <VerificationFilePicker file={file} onChange={setFile} />
            <Button block disabled={!file} loading={busy} loadingLabel="Mengunggah…" onClick={send}>Kirim untuk ditinjau</Button>
          </section>
        ) : (
          <section className="card p-4">
            <h2 className="mb-3 text-card-title">Tahap verifikasi</h2>
            <StageList
              label="Tahap verifikasi"
              current={c.stage}
              stages={[
                { title: 'Berkas diunggah' },
                { title: 'Peninjauan oleh validator', detail: c.stage >= 3 ? 'Selesai' : 'Dalam antrean' },
                { title: 'Keputusan verifikasi', detail: c.stage >= 3 ? 'Disetujui' : 'Anda akan menerima notifikasi' },
              ]}
            />
          </section>
        )}

        <PolicyNote title="Yang diperiksa verifikasi">
          Keabsahan kontak dan penanggung jawab lembaga. Verifikasi bukan sertifikasi atau jaminan keamanan pangan.
        </PolicyNote>
        {profile.verification === 'Menunggu pemeriksaan' && (
          <ButtonLink to="/bantuan" variant="secondary" block>
            Tanya status ke Pusat bantuan
          </ButtonLink>
        )}
        <Notice tone="info">Berkas hanya bisa dibuka oleh tim peninjau.</Notice>
      </main>
    </>
  )
}
