import { useEffect, useState } from 'react'
import { CircleNotch, ImageSquare, X } from '@phosphor-icons/react'
import { toast } from '../components/ui'
import { fitImage } from '../lib/image'

/**
 * Pilih gambar untuk diunggah admin. Foto apa saja diterima: langsung dipotong tengah ke ukuran
 * template dan dikecilkan, jadi admin tidak perlu mengatur ukuran atau mengompres sendiri.
 * Pratinjau = hasil akhir yang tampil di aplikasi. Unggah dilakukan pemanggil saat menyimpan.
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
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!file) return setPreview(null)
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const shown = preview ?? currentUrl

  return (
    <div className="flex flex-col gap-2">
      <p className="text-label">{label}</p>
      <div className="relative overflow-hidden rounded-control border border-dashed border-line-control bg-page" style={{ aspectRatio: `${width} / ${height}` }}>
        {shown ? (
          <img src={shown} alt="Pratinjau" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-1 px-4 text-center text-ink-secondary">
            <ImageSquare size={28} aria-hidden="true" />
            <span className="text-meta">Belum ada gambar</span>
          </div>
        )}
        {busy && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface/70">
            <CircleNotch size={28} aria-hidden="true" className="animate-spin text-primary" />
          </div>
        )}
        {file && !busy && (
          <button type="button" aria-label="Hapus gambar terpilih" onClick={() => onChange(null)} className="tap absolute right-2 top-2 flex h-10 w-10 items-center justify-center rounded-full bg-surface shadow-card">
            <X size={18} aria-hidden="true" />
          </button>
        )}
      </div>
      <label className="tap inline-flex min-h-11 cursor-pointer items-center justify-center self-start rounded-control border border-line bg-surface px-4 text-[0.875rem] font-semibold text-primary hover:border-line-control focus-within:border-primary">
        {shown ? 'Ganti gambar' : 'Pilih gambar dari komputer/HP'}
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          disabled={busy}
          onChange={async (e) => {
            const f = e.target.files?.[0]
            e.target.value = ''
            if (!f) return
            setBusy(true)
            try {
              onChange(await fitImage(f, width, height))
            } catch {
              toast('Gambar tidak bisa dibaca. Pilih foto JPG atau PNG.', 'info')
            } finally {
              setBusy(false)
            }
          }}
        />
      </label>
      <p className="text-caption text-ink-secondary">Foto apa saja bisa dipakai. Bagian tengah foto otomatis dipotong pas dan ukurannya dikecilkan; pratinjau di atas adalah hasil akhirnya.</p>
    </div>
  )
}
