import { useEffect, useRef, useState } from 'react'
import type { Map as LeafletMap } from 'leaflet'
import { CircleNotch, Crosshair, MagnifyingGlass, MapPin } from '@phosphor-icons/react'
import { inputCls, toast } from './ui'
import { reverseGeocode, searchPlaces, type Place } from '../services/geocode'

export interface PickedLocation {
  lat: number
  lng: number
  /** Terisi setelah alamat titik ditemukan. */
  address?: string
  area?: string
}

const INDONESIA: [number, number] = [-2.5, 118]
const round = (n: number) => Math.round(n * 1e6) / 1e6

/**
 * Pilih titik lokasi tanpa mengetik alamat: pakai GPS, cari tempat, atau geser peta (pin selalu di tengah).
 * Setiap titik baru dikirim lewat onPick; alamat dan kab/kota menyusul setelah ditemukan dari peta.
 * Peta OpenStreetMap lewat Leaflet, dimuat hanya saat komponen tampil.
 */
export function LocationPicker({ value, onPick }: { value: { lat: number; lng: number } | null; onPick: (p: PickedLocation) => void }) {
  const box = useRef<HTMLDivElement>(null)
  const map = useRef<LeafletMap | null>(null)
  const pick = useRef(onPick)
  pick.current = onPick
  const timer = useRef<number>()
  const [ready, setReady] = useState(false)
  const [status, setStatus] = useState(value ? 'Pin sudah tersimpan. Geser peta bila lokasinya kurang tepat.' : 'Pakai lokasi Anda sekarang, cari nama tempat, atau geser peta.')
  const [finding, setFinding] = useState(false)
  const [q, setQ] = useState('')
  const [results, setResults] = useState<Place[] | null>(null)
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    let alive = true
    void Promise.all([import('leaflet'), import('leaflet/dist/leaflet.css')]).then(([{ default: L }]) => {
      if (!alive || !box.current) return
      const m = L.map(box.current, { zoomControl: true, attributionControl: true }).setView(value ? [value.lat, value.lng] : INDONESIA, value ? 17 : 4)
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(m)
      // Hanya geseran oleh pengguna (atau GPS/cari) yang mengubah titik; tampilan awal tidak menimpa alamat tersimpan.
      m.on('moveend', () => {
        if (m.getZoom() < 14) return setStatus('Perbesar peta sampai terlihat jalan, lalu taruh pin tepat di lokasi.')
        const c = m.getCenter()
        const lat = round(c.lat)
        const lng = round(c.lng)
        pick.current({ lat, lng })
        setFinding(true)
        window.clearTimeout(timer.current)
        timer.current = window.setTimeout(() => {
          reverseGeocode(lat, lng)
            .then((p) => {
              pick.current({ lat, lng, address: p.address, area: p.area })
              setStatus(`Terdeteksi: ${p.address}${p.area ? ` · ${p.area}` : ''}`)
            })
            .catch((e: Error) => setStatus(e.message))
            .finally(() => setFinding(false))
        }, 900)
      })
      map.current = m
      setReady(true)
    })
    return () => {
      alive = false
      window.clearTimeout(timer.current)
      map.current?.remove()
      map.current = null
    }
    // Peta dibuat sekali; nilai awal hanya untuk posisi pertama.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const useGps = () => {
    if (!navigator.geolocation) return toast('Perangkat ini tidak mendukung lokasi otomatis. Cari tempat atau geser peta.', 'info')
    setStatus('Mencari lokasi Anda…')
    navigator.geolocation.getCurrentPosition(
      (pos) => map.current?.setView([pos.coords.latitude, pos.coords.longitude], 18),
      (err) =>
        setStatus(err.code === err.PERMISSION_DENIED ? 'Izin lokasi ditolak. Izinkan di pengaturan browser, atau cari tempat dan geser peta.' : 'Lokasi belum didapat. Coba lagi di luar ruangan, atau geser peta.'),
      { enableHighAccuracy: true, timeout: 15000 },
    )
  }

  const search = async () => {
    if (q.trim().length < 3) return
    setSearching(true)
    try {
      setResults(await searchPlaces(q.trim()))
    } catch (e) {
      toast((e as Error).message, 'info')
    } finally {
      setSearching(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <button type="button" onClick={useGps} disabled={!ready} className="tap inline-flex min-h-12 items-center justify-center gap-2 rounded-control bg-primary px-4 font-semibold text-white hover:bg-primary-hover disabled:opacity-50">
        <Crosshair size={20} aria-hidden="true" /> Pakai lokasi saya sekarang
      </button>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault()
          void search()
        }}
        className="flex gap-2"
      >
        <label htmlFor="cari-tempat" className="sr-only">Cari tempat</label>
        <input id="cari-tempat" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama usaha, jalan, atau patokan" className={`${inputCls} flex-1`} />
        <button type="submit" disabled={searching || q.trim().length < 3} aria-label="Cari tempat" className="tap flex h-12 w-12 shrink-0 items-center justify-center rounded-control border border-line bg-surface text-primary disabled:opacity-50">
          {searching ? <CircleNotch size={20} aria-hidden="true" className="animate-spin" /> : <MagnifyingGlass size={20} aria-hidden="true" />}
        </button>
      </form>
      {results && (
        <ul className="flex flex-col divide-y divide-line overflow-hidden rounded-control border border-line bg-surface">
          {results.length === 0 && <li className="p-3 text-meta text-ink-secondary">Tidak ditemukan. Coba nama jalan atau patokan terdekat.</li>}
          {results.map((r) => (
            <li key={`${r.lat},${r.lng}`}>
              <button
                type="button"
                onClick={() => {
                  map.current?.setView([r.lat, r.lng], 18)
                  setResults(null)
                }}
                className="tap flex w-full items-start gap-2 p-3 text-left text-meta hover:bg-page"
              >
                <MapPin size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-primary" />
                {r.label}
              </button>
            </li>
          ))}
        </ul>
      )}
      {/* isolate: lapisan Leaflet (z-index 400–1000) tidak menimpa header dan tombol bawah aplikasi. */}
      <div className="relative isolate overflow-hidden rounded-control border border-line">
        <div ref={box} className="h-64 w-full bg-page" aria-label="Peta. Geser peta agar pin tepat di lokasi." />
        {/* Pin tetap di tengah; peta yang digeser. Ujung bawah pin = titik yang disimpan. */}
        <MapPin size={40} weight="fill" aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 z-[500] -translate-x-1/2 -translate-y-full text-danger drop-shadow" />
      </div>
      <p role="status" className="flex items-start gap-1.5 text-meta text-ink-secondary">
        {finding && <CircleNotch size={16} aria-hidden="true" className="mt-0.5 shrink-0 animate-spin text-primary" />}
        {status}
      </p>
    </div>
  )
}
