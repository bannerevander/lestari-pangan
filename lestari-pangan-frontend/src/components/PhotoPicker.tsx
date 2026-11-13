import { useEffect, useState } from 'react'
import { Camera, X } from '@phosphor-icons/react'

/** Pilih satu foto (kamera atau galeri) dengan pratinjau 16:9 seperti di kartu penawaran. Unggah dilakukan pemanggil. */
export function PhotoPicker({ file, onChange, label = 'Foto pangan', hint }: { file: File | null; onChange: (file: File | null) => void; label?: string; hint?: string }) {
  const [preview, setPreview] = useState<string | null>(null)

  useEffect(() => {
    if (!file) return setPreview(null)
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const input = (
    <input
      type="file"
      accept="image/*"
      className="sr-only"
      onChange={(e) => {
        onChange(e.target.files?.[0] ?? null)
        e.target.value = '' // pilih berkas yang sama lagi tetap memicu onChange
      }}
    />
  )

  if (preview) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-label">{label}</p>
        <div className="relative overflow-hidden rounded-control border border-line">
          <img src={preview} alt="Pratinjau foto pangan" className="aspect-[16/9] w-full object-cover" />
          <button type="button" aria-label="Hapus foto" onClick={() => onChange(null)} className="tap absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full bg-surface/90 shadow-card">
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <label className="tap inline-flex min-h-12 cursor-pointer items-center gap-2 self-start rounded-control px-2 font-semibold text-primary hover:bg-primary-container focus-within:ring-2 focus-within:ring-primary/30">
          <Camera size={20} aria-hidden="true" />
          Ganti foto
          {input}
        </label>
      </div>
    )
  }
  return (
    <label className="tap flex min-h-[96px] cursor-pointer items-center gap-3 rounded-control border border-dashed border-line-control bg-surface p-4 hover:border-primary hover:bg-primary-container/40 focus-within:border-primary">
      <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-container text-primary">
        <Camera size={24} />
      </span>
      <span className="flex-1">
        <span className="block font-semibold">{label} (opsional)</span>
        <span className="block text-meta text-ink-secondary">{hint ?? 'Ambil foto atau pilih dari galeri.'}</span>
      </span>
      {input}
    </label>
  )
}
