import { drawCover } from '../lib/image'

/**
 * Menyusun banner promosi 1200 × 400 dari satu foto + teks, mengikuti template merek
 * (teks di kiri berlatar hijau muda, foto 440 × 400 di kanan). Huruf dibuat lebih besar dari
 * template agar tetap terbaca saat banner tampil selebar layar HP (±360 px).
 */

export const BANNER = { width: 1200, height: 400 }
export const LIMITS = { title: 26, sentence: 70, button: 18 }

export interface BannerText {
  title: string
  sentence: string
  button: string
}

const GREEN = '#2E7D32'
const INK = '#12212B'
const MUTED = '#3D4C55'
const TEXT_X = 64
const TEXT_W = 760 - TEXT_X - 40 // area teks berhenti sebelum panel foto

/** Pecah kalimat jadi paling banyak `max` baris selebar `width`; kata sisanya tidak ditampilkan (batas huruf di form mencegah ini). */
function wrap(ctx: CanvasRenderingContext2D, text: string, width: number, max: number): string[] {
  const lines: string[] = []
  let line = ''
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const next = line ? `${line} ${word}` : word
    if (ctx.measureText(next).width <= width || !line) line = next
    else {
      lines.push(line)
      line = word
      if (lines.length === max) break
    }
  }
  if (lines.length < max && line) lines.push(line)
  return lines.slice(0, max)
}

/** Pastikan font Inter termuat sebelum menggambar ke canvas (kalau belum, browser memakai font cadangan). */
export const loadBannerFonts = () =>
  Promise.all(['600 28px Inter', '700 60px Inter', '500 34px Inter', '600 30px Inter'].map((f) => document.fonts.load(f))).catch(() => undefined)

export function drawBanner(canvas: HTMLCanvasElement, photo: ImageBitmap | null, t: BannerText) {
  const { width: W, height: H } = BANNER
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  const bg = ctx.createLinearGradient(0, 0, 760, H)
  bg.addColorStop(0, '#E8F5E9')
  bg.addColorStop(1, '#FFFFFF')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  if (photo) drawCover(ctx, photo, 760, 0, 440, H)
  else {
    ctx.fillStyle = '#C8E6C9'
    ctx.fillRect(760, 0, 440, H)
    ctx.fillStyle = GREEN
    ctx.font = '600 28px Inter, Arial, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Foto di sini', 980, 210)
    ctx.textAlign = 'left'
  }

  // Judul satu baris: huruf mengecil sampai muat.
  let titleSize = 60
  ctx.font = `700 ${titleSize}px Inter, Arial, sans-serif`
  while (titleSize > 40 && ctx.measureText(t.title).width > TEXT_W) {
    titleSize -= 2
    ctx.font = `700 ${titleSize}px Inter, Arial, sans-serif`
  }
  ctx.font = '500 34px Inter, Arial, sans-serif'
  const lines = t.sentence.trim() ? wrap(ctx, t.sentence.trim(), TEXT_W, 2) : []
  const hasButton = !!t.button.trim()

  // Susun blok teks lalu letakkan di tengah tinggi banner.
  const block = 26 + 18 + titleSize + (lines.length ? 14 + lines.length * 42 : 0) + (hasButton ? 26 + 64 : 0)
  let y = Math.max(32, (H - block) / 2)

  ctx.textBaseline = 'top'
  ctx.fillStyle = GREEN
  ctx.font = '600 26px Inter, Arial, sans-serif'
  ctx.fillText('LESTARI PANGAN', TEXT_X, y)
  y += 26 + 18

  ctx.fillStyle = INK
  ctx.font = `700 ${titleSize}px Inter, Arial, sans-serif`
  ctx.fillText(t.title.trim() || 'Judul banner', TEXT_X, y)
  y += titleSize

  if (lines.length) {
    y += 14
    ctx.fillStyle = MUTED
    ctx.font = '500 34px Inter, Arial, sans-serif'
    for (const l of lines) {
      ctx.fillText(l, TEXT_X, y)
      y += 42
    }
  }

  if (hasButton) {
    y += 26
    ctx.font = '600 30px Inter, Arial, sans-serif'
    const bw = ctx.measureText(t.button.trim()).width + 64
    ctx.fillStyle = GREEN
    ctx.beginPath()
    ctx.roundRect(TEXT_X, y, bw, 64, 32)
    ctx.fill()
    ctx.fillStyle = '#FFFFFF'
    ctx.textBaseline = 'middle'
    ctx.fillText(t.button.trim(), TEXT_X + 32, y + 33)
  }
}

/** Gambar banner final sebagai berkas JPEG siap unggah. */
export async function composeBanner(photo: File, t: BannerText): Promise<File> {
  await loadBannerFonts()
  const bitmap = await createImageBitmap(photo, { imageOrientation: 'from-image' })
  const canvas = document.createElement('canvas')
  drawBanner(canvas, bitmap, t)
  bitmap.close()
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('encode'))), 'image/jpeg', 0.88))
  return new File([blob], 'banner.jpg', { type: 'image/jpeg' })
}
