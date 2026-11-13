import { useEffect, useRef, useState } from 'react'
import { DeviceMobile, ImageSquare } from '@phosphor-icons/react'
import { Field, inputCls } from '../components/ui'
import { drawBanner, LIMITS, loadBannerFonts, type BannerText } from './banner'

/** Pembuat banner untuk orang awam: pilih satu foto, ketik tiga teks, lihat hasilnya seperti di HP. */
export function BannerMaker({ photo, onPhoto, text, onText }: { photo: File | null; onPhoto: (f: File | null) => void; text: BannerText; onText: (t: BannerText) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null)
  const [fontsReady, setFontsReady] = useState(false)

  useEffect(() => {
    void loadBannerFonts().then(() => setFontsReady(true))
  }, [])
  useEffect(() => {
    if (!photo) return setBitmap(null)
    let alive = true
    createImageBitmap(photo, { imageOrientation: 'from-image' }).then((b) => (alive ? setBitmap(b) : b.close()), () => setBitmap(null))
    return () => {
      alive = false
    }
  }, [photo])
  useEffect(() => {
    if (canvas.current) drawBanner(canvas.current, bitmap, text)
  }, [bitmap, text, fontsReady])

  const field = (k: keyof BannerText, label: string, hint: string) => (
    <Field label={label} hint={`${hint} ${text[k].length}/${LIMITS[k]} huruf.`}>
      {(p) => <input {...p} maxLength={LIMITS[k]} className={inputCls} value={text[k]} onChange={(e) => onText({ ...text, [k]: e.target.value })} />}
    </Field>
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <p className="text-label">1. Foto</p>
        <label className="tap inline-flex min-h-12 cursor-pointer items-center gap-2 self-start rounded-control border border-line bg-surface px-4 font-semibold text-primary hover:border-line-control focus-within:border-primary">
          <ImageSquare size={20} aria-hidden="true" />
          {photo ? 'Ganti foto' : 'Pilih foto dari komputer/HP'}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              onPhoto(e.target.files?.[0] ?? null)
              e.target.value = ''
            }}
          />
        </label>
        <p className="text-caption text-ink-secondary">Foto apa saja. Bagian tengahnya otomatis ditaruh di sisi kanan banner. Hindari foto wajah orang tanpa izin.</p>
      </div>
      <p className="-mb-2 text-label">2. Tulisan pada banner</p>
      {field('title', 'Judul', 'Singkat dan mengajak, mis. "Ada makanan berlebih?".')}
      {field('sentence', 'Kalimat penjelas', 'Satu kalimat, tampil maksimal 2 baris.')}
      {field('button', 'Tulisan tombol', 'Kata kerja, mis. "Tawarkan pangan".')}
      <div className="flex flex-col gap-2">
        <p className="flex items-center gap-1.5 text-label">
          <DeviceMobile size={18} aria-hidden="true" /> 3. Pratinjau di HP
        </p>
        {/* Lebar ±360 px = lebar banner di layar HP, jadi admin melihat apakah tulisan cukup besar. */}
        <canvas ref={canvas} role="img" aria-label={`Pratinjau banner: ${text.title}. ${text.sentence}`} className="aspect-[3/1] w-full max-w-[360px] rounded-card border border-line" />
        <p className="text-caption text-ink-secondary">Inilah ukuran banner di layar HP pengguna. Kalau tulisan terasa kecil, persingkat kalimatnya.</p>
      </div>
    </div>
  )
}
