import { AreaField } from '../../components/AreaField'
import { useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Button, Chip, Field, inputCls, RadioCard, toast } from '../../components/ui'
import { useApp } from '../../state/AppState'
import { messageOf } from '../../lib/supabase/errors'
import { completeOnboarding, saveProfile } from '../../services/identity'
import { LocationPicker, type PickedLocation } from '../../components/LocationPicker'
import { readDraft, writeDraft } from './draft'
import { SignupShell } from './SignupShell'

/* ---------- U08 / U09 Lengkapi profil ---------- */

const STORAGE_OPTIONS = ['Suhu ruang dan pendingin', 'Hanya suhu ruang', 'Freezer untuk bahan mentah']

export function ProfileSetup() {
  const { state, dispatch } = useApp()
  const navigate = useNavigate()
  const draft = readDraft()
  const donor = state.role === 'pemberi'
  const [f, setF] = useState({ pic: draft?.name ?? '', org: '', phone: '', area: '', address: '', capacity: '30' })
  const [storage, setStorage] = useState(STORAGE_OPTIONS[0])
  const [pickup, setPickup] = useState('Ambil sendiri')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [point, setPoint] = useState<{ lat: number; lng: number } | null>(null)
  // Titik dari peta mengisi kab/kota dan alamat; alamat yang sudah diubah pengguna (mis. tambah patokan) tidak ditimpa.
  const auto = useRef('')
  const onPick = (p: PickedLocation) => {
    setPoint({ lat: p.lat, lng: p.lng })
    if (p.address === undefined) return
    setF((x) => {
      const keep = x.address.trim() && x.address !== auto.current
      if (!keep) auto.current = p.address!
      return { ...x, area: p.area || x.area, address: keep ? x.address : p.address! }
    })
  }
  if (!draft?.verified) return <Navigate to="/masuk" replace />

  const submit = async () => {
    const e: Record<string, string> = {
      pic: f.pic.trim().length >= 3 ? '' : 'Isi nama penanggung jawab (minimal 3 huruf).',
      org: donor || f.org.trim() ? '' : 'Isi nama komunitas atau yayasan.',
      phone: f.phone.replace(/\D/g, '').length >= 9 ? '' : 'Isi nomor telepon minimal 9 angka.',
      area: f.area ? '' : 'Pilih kabupaten/kota dari daftar.',
      address: f.address.trim().length >= 10 ? '' : 'Isi alamat lengkap dengan patokan.',
      capacity: donor || Number(f.capacity) >= 1 ? '' : 'Isi kapasitas minimal 1 porsi.',
    }
    setErrors(e)
    if (Object.values(e).some(Boolean)) return requestAnimationFrame(() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus())
    const capacity = donor ? undefined : `${f.capacity} porsi per hari`
    setBusy(true)
    try {
      await completeOnboarding({
        role: state.role,
        // Rumah tangga boleh tanpa nama usaha: nama penanggung jawab dipakai sebagai nama tampil.
        orgName: f.org.trim() || f.pic.trim(),
        orgType: draft.kind ?? (donor ? 'Rumah tangga' : 'Komunitas'),
        area: f.area.trim(),
        pic: f.pic.trim(),
        phone: f.phone.trim(),
        address: f.address.trim(),
        capacity,
        storage: donor ? undefined : storage,
      })
      if (point) await saveProfile(point)
      // OD-02: cukup email + OTP; langkah unggah bukti verifikasi dilewati untuk saat ini.
      writeDraft(null)
      dispatch({ type: 'signIn', role: state.role })
      toast('Akun dibuat. Selamat datang di Lestari Pangan.')
      navigate('/', { replace: true })
    } catch (err) {
      setErrors({ org: messageOf(err) })
      setBusy(false)
    }
  }

  return (
    <SignupShell step={4} title={donor ? 'Lengkapi profil pemberi' : 'Lengkapi profil penerima'} desc={donor ? 'Penerima mengenali penawaran Anda dari informasi publik.' : 'Pemberi menyesuaikan jumlah dengan kapasitas Anda.'}>
      <div className="flex flex-1 flex-col gap-5">
        <section className="flex flex-col gap-4">
          <h2 className="flex items-center gap-2 text-card-title">Informasi publik <span className="rounded-full bg-primary-container px-2 py-0.5 text-caption text-primary">Tampil di katalog</span></h2>
          <Field label={donor ? 'Nama usaha atau dapur' : 'Nama komunitas atau yayasan'} optional={donor} hint={donor ? 'Boleh dikosongkan untuk rumah tangga.' : undefined} error={errors.org}>
            {(p) => <input {...p} autoComplete="organization" className={inputCls} value={f.org} onChange={(e) => setF({ ...f, org: e.target.value })} />}
          </Field>
          <AreaField value={f.area} onChange={(area) => setF({ ...f, area })} error={errors.area} />
          <p className="-mt-2 text-caption text-ink-secondary">Hanya wilayah ini yang terlihat di pencarian.</p>
        </section>
        <section className="flex flex-col gap-3">
          <h2 className="flex items-center gap-2 text-card-title">{donor ? 'Lokasi penjemputan di peta' : 'Lokasi distribusi di peta'} <span className="rounded-full bg-page px-2 py-0.5 text-caption text-ink-secondary">Privat</span></h2>
          <p className="-mt-1 text-meta text-ink-secondary">Kab/kota dan alamat terisi otomatis. Titik ini membantu penerima dan driver ojek online menemukan lokasi lewat Google Maps.</p>
          <LocationPicker value={point} onPick={onPick} />
        </section>
        <section className="flex flex-col gap-4">
          <h2 className="flex items-center gap-2 text-card-title">Kontak koordinasi <span className="rounded-full bg-page px-2 py-0.5 text-caption text-ink-secondary">Privat</span></h2>
          <Field label="Nama penanggung jawab" error={errors.pic}>
            {(p) => <input {...p} autoComplete="name" className={inputCls} value={f.pic} onChange={(e) => setF({ ...f, pic: e.target.value })} />}
          </Field>
          <Field label="Nomor telepon" error={errors.phone}>
            {(p) => <input {...p} type="tel" inputMode="tel" autoComplete="tel" className={inputCls} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />}
          </Field>
          <Field label={donor ? 'Alamat titik penjemputan' : 'Alamat titik distribusi'} hint="Terisi dari peta. Tambahkan patokan, mis. pagar hijau atau pintu samping. Dibuka hanya setelah permintaan disetujui." error={errors.address}>
            {(p) => <textarea {...p} rows={2} autoComplete="street-address" className={inputCls} value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} />}
          </Field>
        </section>
        {!donor && (
          <section className="flex flex-col gap-4">
            <h2 className="text-card-title">Kapasitas</h2>
            <Field label="Jumlah maksimal per pengambilan" error={errors.capacity}>
              {(p) => (
                <div className="flex items-center gap-2">
                  <input {...p} inputMode="numeric" className={`${inputCls} max-w-[7rem] text-center font-bold`} value={f.capacity} onChange={(e) => setF({ ...f, capacity: e.target.value.replace(/\D/g, '') })} />
                  <span className="text-ink-secondary">porsi</span>
                </div>
              )}
            </Field>
            <fieldset>
              <legend className="text-label">Penyimpanan</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {STORAGE_OPTIONS.map((x) => <Chip key={x} selected={storage === x} onClick={() => setStorage(x)}>{x}</Chip>)}
              </div>
            </fieldset>
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-label">Cara pengambilan</legend>
              <RadioCard name="pickup" checked={pickup === 'Ambil sendiri'} onChange={() => setPickup('Ambil sendiri')} title="Relawan ambil sendiri" />
              <RadioCard name="pickup" checked={pickup === 'Perlu antar'} onChange={() => setPickup('Perlu antar')} title="Perlu bantuan pengantaran" description="Lewat ojek online (GoSend/GrabExpress) atau diantar pemberi." />
            </fieldset>
          </section>
        )}
        <div className="mt-auto pt-2">
          <Button block loading={busy} loadingLabel="Menyimpan…" onClick={submit}>Simpan dan lanjut</Button>
        </div>
      </div>
    </SignupShell>
  )
}
