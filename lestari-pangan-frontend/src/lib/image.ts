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
