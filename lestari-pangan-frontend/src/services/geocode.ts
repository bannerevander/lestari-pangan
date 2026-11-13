import { joinArea, loadCities, type City } from '../lib/area'

/**
 * Geocoding gratis lewat Nominatim (OpenStreetMap). Kebijakan pemakaian: maksimal 1 permintaan/detik dan
 * tanpa pencarian saat mengetik, jadi pencarian hanya saat tombol Cari ditekan dan alamat dari titik
 * hanya diminta setelah peta berhenti digeser.
 * shortcut: layanan publik tanpa SLA; ganti ke penyedia berbayar (mis. Google Places) bila pengguna bertambah.
 */

const BASE = 'https://nominatim.openstreetmap.org'

export interface Place {
  lat: number
  lng: number
  /** Alamat ringkas: jalan + nomor, kelurahan, kecamatan. */
  address: string
  /** "Kecamatan, Kab/Kota" sesuai daftar AreaField, atau '' bila kab/kota tidak dikenali. */
  area: string
  label: string
}

interface NominatimAddress {
  road?: string
  house_number?: string
  neighbourhood?: string
  village?: string
  suburb?: string
  city_district?: string
  district?: string
  city?: string
  town?: string
  municipality?: string
  county?: string
  regency?: string
  state?: string
}

interface NominatimResult {
  lat: string
  lon: string
  display_name: string
  address?: NominatimAddress
}

const strip = (s: string) => s.replace(/^(Kota|Kabupaten|Kab\.)\s+/i, '').trim().toLowerCase()

/** Cocokkan kota/kabupaten hasil OSM ke daftar resmi; "city" condong ke Kota, "county/regency" ke Kabupaten. */
function matchCity(a: NominatimAddress, cities: City[]): string {
  const tries: [string | undefined, 'Kota' | 'Kabupaten'][] = [
    [a.city, 'Kota'],
    [a.municipality, 'Kota'],
    [a.town, 'Kabupaten'],
    [a.regency, 'Kabupaten'],
    [a.county, 'Kabupaten'],
  ]
  for (const [raw, prefer] of tries) {
    if (!raw) continue
    const hits = cities.filter(([name]) => strip(name) === strip(raw))
    if (!hits.length) continue
    const sameProvince = hits.filter(([, prov]) => !a.state || prov.toLowerCase() === a.state.toLowerCase())
    const pool = sameProvince.length ? sameProvince : hits
    return (pool.find(([name]) => name.startsWith(prefer)) ?? pool[0])[0]
  }
  return ''
}

async function toPlace(r: NominatimResult): Promise<Place> {
  const a = r.address ?? {}
  const cities = await loadCities()
  const city = matchCity(a, cities)
  const district = (a.city_district ?? a.district ?? '').replace(/^Kecamatan\s+/i, '')
  const street = [a.road, a.house_number].filter(Boolean).join(' ')
  const parts = [street, a.neighbourhood, a.village ?? a.suburb, district].filter(Boolean)
  return {
    lat: Number(r.lat),
    lng: Number(r.lon),
    address: (parts.length ? [...new Set(parts)] : r.display_name.split(',').slice(0, 3)).join(', '),
    area: city ? joinArea(district, city) : '',
    label: r.display_name,
  }
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`Layanan peta sedang sibuk (${res.status}). Coba lagi sebentar.`)
  return res.json() as Promise<T>
}

/** Alamat dari titik peta. */
export async function reverseGeocode(lat: number, lng: number): Promise<Place> {
  const r = await get<NominatimResult & { error?: string }>(`/reverse?format=jsonv2&addressdetails=1&zoom=18&accept-language=id&lat=${lat}&lon=${lng}`)
  if (r.error) throw new Error('Alamat titik ini tidak ditemukan. Geser pin sedikit.')
  return toPlace(r)
}

/** Cari tempat di Indonesia (nama usaha, jalan, atau patokan). */
export async function searchPlaces(q: string): Promise<Place[]> {
  const rows = await get<NominatimResult[]>(`/search?format=jsonv2&addressdetails=1&countrycodes=id&limit=5&accept-language=id&q=${encodeURIComponent(q)}`)
  return Promise.all(rows.map(toPlace))
}
