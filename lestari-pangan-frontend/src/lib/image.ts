/**
 * Perkecil foto di perangkat sebelum diunggah: sisi terpanjang ≤ max px, JPEG.
 * Foto kamera HP (3–8 MB) jadi ±150–400 KB sehingga lolos batas bucket 2 MB, dan
 * encode ulang lewat canvas membuang EXIF (termasuk lokasi GPS) dari berkas asli.
 */
export async function shrinkImage(file: File, max = 1280, quality = 0.82): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('encode'))), 'image/jpeg', quality))
}

/**
 * Potong tengah (seperti object-fit: cover) lalu ubah ke ukuran tepat w × h, JPEG.
 * Admin bisa memilih foto apa saja: rasio dan ukuran berkas diurus otomatis.
 */
export async function fitImage(file: File, w: number, h: number, quality = 0.86): Promise<File> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  drawCover(canvas.getContext('2d')!, bitmap, 0, 0, w, h)
  bitmap.close()
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('encode'))), 'image/jpeg', quality))
  return new File([blob], 'gambar.jpg', { type: 'image/jpeg' })
}

/** Gambar sumber memenuhi kotak tujuan, bagian tengah dipertahankan. */
export function drawCover(ctx: CanvasRenderingContext2D, img: CanvasImageSource & { width: number; height: number }, x: number, y: number, w: number, h: number) {
  const s = Math.max(w / img.width, h / img.height)
  const sw = w / s
  const sh = h / s
  ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, x, y, w, h)
}
