import { useEffect, useId, useState } from 'react'
import { Field, inputCls } from './ui'
import { joinArea, loadCities, splitArea, type City } from '../lib/area'

/**
 * Isian wilayah: kecamatan (opsional, bebas ketik) + kab/kota dari daftar resmi seluruh Indonesia.
 * onChange menerima teks gabungan, atau '' bila kab/kota belum dipilih dari daftar.
 */
export function AreaField({ value, onChange, error, cityOnly = false }: { value: string; onChange: (area: string) => void; error?: string; cityOnly?: boolean }) {
  const init = splitArea(value)
  const [district, setDistrict] = useState(init.district)
  const [city, setCity] = useState(init.city)
  const [cities, setCities] = useState<City[]>([])
  const listId = useId()
  // Ikuti nilai dari luar (mis. terisi dari titik peta); '' = ketikan pengguna belum valid, jangan dihapus.
  const [seen, setSeen] = useState(value)
  if (value !== seen) {
    setSeen(value)
    if (value) {
      const next = splitArea(value)
      setDistrict(next.district)
      setCity(next.city)
    }
  }

  useEffect(() => {
    let alive = true
    loadCities().then((c) => alive && setCities(c))
    return () => {
      alive = false
    }
  }, [])

  const valid = cities.some(([name]) => name === city)
  const emit = (d: string, c: string) => onChange(cities.some(([name]) => name === c) ? joinArea(cityOnly ? '' : d, c) : '')

  return (
    <div className="flex flex-col gap-3">
      <Field label="Kabupaten/kota" hint={valid ? cities.find(([n]) => n === city)?.[1] : 'Ketik lalu pilih dari daftar, mis. "Kota Bandung" atau "Kabupaten Sleman".'} error={error}>
        {(p) => (
          <>
            <input
              {...p}
              list={listId}
              autoComplete="off"
              className={inputCls}
              value={city}
              onChange={(e) => {
                setCity(e.target.value)
                emit(district, e.target.value)
              }}
              placeholder={cities.length ? 'Cari kabupaten/kota' : 'Memuat daftar…'}
            />
            <datalist id={listId}>
              {cities.map(([name, prov]) => (
                <option key={name} value={name}>{prov}</option>
              ))}
            </datalist>
          </>
        )}
      </Field>
      {!cityOnly && (
        <Field label="Kecamatan" optional hint="Membantu mitra di sekitar Anda menemukan lokasi.">
          {(p) => (
            <input
              {...p}
              className={inputCls}
              value={district}
              onChange={(e) => {
                setDistrict(e.target.value)
                emit(e.target.value, city)
              }}
            />
          )}
        </Field>
      )}
    </div>
  )
}
