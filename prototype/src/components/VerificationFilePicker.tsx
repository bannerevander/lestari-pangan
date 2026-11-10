import { FilePdf, UploadSimple, X } from '@phosphor-icons/react'
import { toast } from './ui'
import { VERIFICATION_MAX_BYTES } from '../services/identity'

/** Pilih berkas bukti verifikasi (PDF/JPG/PNG ≤ 5 MB). Unggah dilakukan oleh pemanggil. */
export function VerificationFilePicker({ file, onChange }: { file: File | null; onChange: (file: File | null) => void }) {
  if (file) {
    return (
      <div className="flex animate-rise-in items-center gap-3 rounded-control border border-primary bg-primary-container p-3">
        <FilePdf size={28} aria-hidden="true" className="shrink-0 text-danger" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{file.name}</p>
          <p className="text-caption text-ink-secondary">{(file.size / 1024 / 1024).toFixed(1)} MB · siap ditinjau</p>
        </div>
        <button type="button" aria-label="Hapus berkas" onClick={() => onChange(null)} className="tap flex h-11 w-11 items-center justify-center rounded-full hover:bg-surface"><X size={18} aria-hidden="true" /></button>
      </div>
    )
  }
  return (
    <label className="tap flex cursor-pointer flex-col items-center gap-2 rounded-card border-2 border-dashed border-line-control bg-page px-4 py-8 text-center hover:border-primary hover:bg-primary-container/40 focus-within:border-primary">
      <span aria-hidden="true" className="flex h-12 w-12 items-center justify-center rounded-full bg-surface text-primary shadow-card"><UploadSimple size={24} /></span>
      <span className="font-semibold">Pilih berkas bukti</span>
      <span className="text-caption text-ink-secondary">PDF, JPG, atau PNG, maksimal 5 MB</span>
      <input
        type="file"
        accept="application/pdf,image/jpeg,image/png"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (!f) return
          if (f.size > VERIFICATION_MAX_BYTES) return toast('Berkas lebih dari 5 MB. Pilih berkas lain.', 'info')
          onChange(f)
        }}
      />
    </label>
  )
}
