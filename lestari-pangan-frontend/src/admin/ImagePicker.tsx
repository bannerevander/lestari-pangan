import { useEffect, useState } from 'react'
import { ImageSquare, X } from '@phosphor-icons/react'
import { toast } from '../components/ui'
import { MEDIA_MAX_BYTES } from '../services/promotions'

/**
 * Pilih gambar untuk diunggah admin. Pratinjau memakai rasio template sehingga admin melihat
 * potongan yang sama dengan di aplikasi; ukuran yang tidak sesuai template diberi peringatan.
 * Unggah dilakukan pemanggil saat menyimpan (services/promotions.ts uploadMedia).
 */
export function ImagePicker({
  file,
  currentUrl,
  onChange,
  width,
  height,
  label = 'Gambar',
}: {
  file: File | null
  currentUrl?: string
  onChange: (file: File | null) => void
  width: number
  height: number
  label?: string
}) {
  const [preview, setPreview] = useState<string | null>(null)
  const [size, setSize] = useState<{ w: number; h: number } | null>(null)

  useEffect(() => {
    if (!file) return setPreview(null)
    const url = URL.createObjectURL(file)
    setPreview(url)
    const img = new Image()
    img.onload = () => setSize({ w: img.naturalWidth, h: img.naturalHeight })
    img.src = url
    return () => URL.revokeObjectURL(url)
  }, [file])

  const shown = preview ?? currentUrl
  const ratioOff = size && Math.abs(size.w / size.h - width / height) > 0.05

  return (
    <div className="flex flex-col gap-2">
      <p className="text-label">{label}</p>
      <div className="relative overflow-hidden rounded-control border border-dashed border-line-control bg-page" style={{ aspectRatio: `${width} / ${height}` }}>
        {shown ? (
          <img src={shown} alt="Pratinjau" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-1 text-center text-ink-secondary">
            <ImageSquare size={28} aria-hidden="true" />
            <span className="text-meta">
              {width} × {height} px
            </span>
          </div>
        )}
        {file && (
          <button type="button" aria-label="Hapus gambar terpilih" onClick={() => onChange(null)} className="tap absolute right-2 top-2 flex h-10 w-10 items-center justify-center rounded-full bg-surface shadow-card">
            <X size={18} aria-hidden="true" />
          </button>
        )}
      </div>
      <label className="tap inline-flex min-h-11 cursor-pointer items-center justify-center self-start rounded-control border border-line bg-surface px-4 text-[0.875rem] font-semibold text-primary hover:border-line-control focus-within:border-primary">
        {shown ? 'Ganti gambar' : 'Pilih gambar'}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0]
            e.target.value = ''
            if (!f) return
            if (f.size > MEDIA_MAX_BYTES) return toast('Gambar lebih dari 2 MB. Kompres atau pilih gambar lain.', 'info')
            setSize(null)
            onChange(f)
          }}
        />
      </label>
      <p className={`text-caption ${ratioOff ? 'font-medium text-warning' : 'text-ink-secondary'}`}>
        {ratioOff
          ? `Ukuran ${size!.w} × ${size!.h} px tidak sesuai template ${width} × ${height} px; gambar akan terpotong.`
          : `JPG, PNG, atau WebP maksimal 2 MB. Template ${width} × ${height} px.`}
      </p>
    </div>
  )
}
