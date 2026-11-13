import { useEffect, useState } from 'react'
import { CircleNotch, DeviceMobile, ImageSquare } from '@phosphor-icons/react'
import { Field, inputCls, toast } from '../components/ui'
import { PromoSlide } from '../components/PromoBanner'
import { fitImage } from '../lib/image'

/** Ukuran foto banner (16:9) dan batas tulisan agar tetap terbaca di HP. */
const BANNER = { width: 1200, height: 675 }
const LIMITS = { headline: 32, body: 80, cta: 18 }

export interface BannerText {
  headline: string
  body: string
  cta: string
}

/**
 * Pembuat banner untuk orang awam: pilih satu foto, ketik tulisan, lihat hasilnya persis seperti di HP.
 * Foto dipotong tengah ke 16:9 dan dikecilkan otomatis; tulisan disimpan sebagai teks (bukan ditanam di gambar).
 */
export function BannerMaker({
  photo,
  currentUrl,
  onPhoto,
  text,
  onText,
}: {
  photo: File | null
  currentUrl?: string
  onPhoto: (f: File | null) => void
  text: BannerText
  onText: (t: BannerText) => void
}) {
  const [preview, setPreview] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!photo) return setPreview(null)
    const url = URL.createObjectURL(photo)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [photo])

  const field = (k: keyof BannerText, label: string, hint: string, optional = false) => (
    <Field label={label} optional={optional} hint={`${hint} ${text[k].length}/${LIMITS[k]} huruf.`}>
      {(p) => <input {...p} maxLength={LIMITS[k]} className={inputCls} value={text[k]} onChange={(e) => onText({ ...text, [k]: e.target.value })} />}
    </Field>
  )

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-label">Foto</p>
          <label className="tap inline-flex min-h-12 cursor-pointer items-center gap-2 self-start rounded-control border border-line bg-surface px-4 font-semibold text-primary hover:border-line-control focus-within:border-primary">
            {busy ? <CircleNotch size={20} aria-hidden="true" className="animate-spin" /> : <ImageSquare size={20} aria-hidden="true" />}
            {photo || currentUrl ? 'Ganti foto' : 'Pilih foto dari komputer/HP'}
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
                  onPhoto(await fitImage(f, BANNER.width, BANNER.height))
                } catch {
                  toast('Foto tidak bisa dibaca. Pilih foto JPG atau PNG.', 'info')
                } finally {
                  setBusy(false)
                }
              }}
            />
          </label>
          <p className="text-caption text-ink-secondary">Foto apa saja; bagian tengahnya dipakai. Objek utama sebaiknya di sisi kanan foto karena sisi kiri tertutup tulisan. Hindari wajah orang tanpa izin.</p>
        </div>
        {field('headline', 'Judul', 'Singkat dan mengajak, mis. "Ada makanan berlebih?".')}
        {field('body', 'Kalimat penjelas', 'Satu kalimat, tampil maksimal 2 baris.', true)}
        {field('cta', 'Tulisan tombol', 'Kata kerja, mis. "Tawarkan pangan".', true)}
        <p className="text-caption text-ink-secondary">Gambar Anda sudah berisi tulisan sendiri? Kosongkan Judul agar gambar tampil apa adanya.</p>
      </div>
      <div className="flex flex-col gap-2">
        <p className="flex items-center gap-1.5 text-label">
          <DeviceMobile size={18} aria-hidden="true" /> Tampilan di HP pengguna
        </p>
        {/* Lebar 360 px = lebar banner di layar HP, jadi admin melihat ukuran tulisan yang sebenarnya. */}
        <div className="w-full max-w-[360px]">
          <PromoSlide p={{ title: text.headline, image: preview ?? currentUrl ?? '', headline: text.headline.trim() || undefined, body: text.body.trim() || undefined, cta: text.cta.trim() || undefined }} />
        </div>
        <p className="text-caption text-ink-secondary">Di aplikasi, beberapa banner bergeser otomatis dan bisa digeser dengan jari.</p>
      </div>
    </div>
  )
}
