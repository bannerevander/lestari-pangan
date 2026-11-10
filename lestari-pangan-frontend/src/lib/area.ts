/**
 * Wilayah pengguna disimpan sebagai satu teks: "Kecamatan, Kab/Kota" atau "Kab/Kota" saja.
 * Daftar 514 kab/kota (38 provinsi, Kepmendagri No 300.2.2-2138 Tahun 2025) ada di data/kota.json,
 * dimuat terpisah agar tidak memperbesar bundle utama.
 */

export type City = [name: string, province: string]

let cache: Promise<City[]> | null = null
export const loadCities = () => (cache ??= import('../data/kota.json').then((m) => m.default as City[]))

/** "Coblong, Kota Bandung" → { district: "Coblong", city: "Kota Bandung" } */
export function splitArea(area: string) {
  const i = area.lastIndexOf(',')
  return i < 0 ? { district: '', city: area.trim() } : { district: area.slice(0, i).trim(), city: area.slice(i + 1).trim() }
}

export const joinArea = (district: string, city: string) => (district.trim() ? `${district.trim()}, ${city.trim()}` : city.trim())

/** Kab/kota dari teks wilayah, dipakai untuk mencocokkan promosi dan penawaran sekitar. */
export const cityOf = (area: string) => splitArea(area).city

/** Nama pendek untuk tampilan ringkas: "Kota Bandung" → "Bandung", "Kabupaten Bogor" → "Kab. Bogor". */
export const shortCity = (city: string) => city.replace(/^Kota /, '').replace(/^Kabupaten /, 'Kab. ')
