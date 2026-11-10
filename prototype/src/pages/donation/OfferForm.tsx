import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Camera, Check } from '@phosphor-icons/react'
import { AppBar, BottomSheet, Button, Chip, Field, inputCls, Notice, StickyFooter, toast } from '../../components/ui'
import { useApp } from '../../state/AppState'
import { useProfile } from '../../state/useProfile'
import type { FoodCategory, Offer, Unit } from '../../data/types'
import { isoToLabel, timeLabel } from '../../lib/format'
import { isLive } from '../../lib/supabase/client'
import { messageOf } from '../../lib/supabase/errors'
import { publishOffer } from '../../services/donation'
import { useLiveData } from '../../state/LiveData'

/** D02 Form penawaran tiga langkah (design.md §11.1). */

interface Draft {
  name: string
  category: FoodCategory | ''
  quantity: string
  unit: Unit
  estimate: boolean
  storage: string
  preparedAt: string
  labelDate: string
  allergensKnown: 'ya' | 'tidak' | ''
  allergens: string
  description: string
  area: string
  date: string
  start: string
  end: string
  methods: Offer['methods']
  instructions: string
}

/** Tanggal hari ini (zona perangkat) sebagai YYYY-MM-DD. */
function todayIso() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const empty: Draft = {
  name: '',
  category: '',
  quantity: '',
  unit: 'porsi',
  estimate: false,
  storage: '',
  preparedAt: '',
  labelDate: '',
  allergensKnown: '',
  allergens: '',
  description: '',
  area: 'Kec. Coblong, Bandung',
  date: todayIso(),
  start: '16:00',
  end: '18:00',
  methods: ['Ambil sendiri'],
  instructions: '',
}

const steps = ['Informasi pangan', 'Penyaluran', 'Tinjauan']

export default function OfferForm() {
  const { state, dispatch } = useApp()
  const profile = useProfile()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const fromRecord = state.records.find((r) => r.id === params.get('dari'))
  const [step, setStep] = useState(0)
  const [d, setD] = useState<Draft>(() =>
    fromRecord
      ? { ...empty, name: fromRecord.name, category: fromRecord.category, quantity: String(fromRecord.quantity), unit: fromRecord.unit, estimate: fromRecord.estimate, storage: fromRecord.storage }
      : empty,
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [clientId] = useState(() => crypto.randomUUID()) // kirim ulang tidak membuat penawaran ganda
  const { refresh } = useLiveData()
  const [leaving, setLeaving] = useState(false)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const dirty = JSON.stringify(d) !== JSON.stringify(empty)

  useEffect(() => {
    headingRef.current?.focus()
    window.scrollTo(0, 0)
  }, [step])

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => {
    setD((p) => ({ ...p, [k]: v }))
    if (errors[k]) setErrors((e) => ({ ...e, [k]: '' }))
  }

  const validate = (s: number) => {
    const e: Record<string, string> = {}
    if (s === 0) {
      if (!d.name.trim()) e.name = 'Isi nama pangan.'
      if (!d.category) e.category = 'Pilih kategori pangan.'
      const n = Number(d.quantity.replace(',', '.'))
      if (!d.quantity || !(n > 0)) e.quantity = 'Isi jumlah lebih dari 0.'
      else if ((d.unit === 'porsi' || d.unit === 'kemasan' || d.unit === 'bungkus' || d.unit === 'unit') && !Number.isInteger(n))
        e.quantity = `Jumlah ${d.unit} harus bilangan bulat.`
      if (!d.storage.trim()) e.storage = 'Isi cara penyimpanan saat ini.'
      if (!d.allergensKnown) e.allergensKnown = 'Pilih apakah bahan/alergen diketahui.'
      if (d.allergensKnown === 'ya' && !d.allergens.trim()) e.allergens = 'Tulis bahan atau alergen yang diketahui.'
    }
    if (s === 1) {
      if (!d.date) e.date = 'Pilih tanggal pengambilan.'
      if (!d.start || !d.end) e.end = 'Isi jam mulai dan selesai.'
      else if (d.end <= d.start) e.end = 'Jam selesai harus setelah jam mulai.'
      else if (d.date && new Date(`${d.date}T${d.end}`) <= new Date()) e.end = 'Jam selesai sudah lewat. Pilih waktu yang akan datang.'
      if (d.methods.length === 0) e.methods = 'Pilih minimal satu cara penyaluran.'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const next = () => {
    if (validate(step)) setStep(step + 1)
  }

  const publish = async (asDraft: boolean) => {
    setSubmitting(true)
    if (isLive) {
      try {
        await publishOffer({
          clientId,
          name: d.name.trim(),
          category: d.category,
          unit: d.unit,
          quantity: Number(d.quantity.replace(',', '.')),
          storage: d.storage,
          area: d.area,
          pickupStart: new Date(`${d.date}T${d.start}`),
          pickupEnd: new Date(`${d.date}T${d.end}`),
          methods: d.methods,
          estimate: d.estimate,
          preparedAt: d.preparedAt ? new Date(d.preparedAt) : undefined,
          labelDate: d.labelDate || undefined,
          allergens: d.allergensKnown === 'ya' ? d.allergens : null,
          description: [d.description.trim(), d.instructions.trim() && `Petunjuk pengambilan: ${d.instructions.trim()}`].filter(Boolean).join('. ') || undefined,
          recordCode: fromRecord?.id,
        })
        await refresh()
        navigate('/donasi', { replace: true })
      } catch (err) {
        toast(messageOf(err), 'info')
        setSubmitting(false)
      }
      return
    }
    // Simulasi respons server; status baru tampil setelah "server" menerima.
    window.setTimeout(() => {
      dispatch({
        type: 'publishOffer',
        recordId: fromRecord?.id,
        offer: {
          name: d.name.trim(),
          category: d.category as FoodCategory,
          unit: d.unit,
          initial: Number(d.quantity.replace(',', '.')),
          estimate: d.estimate,
          storage: d.storage,
          preparedAt: d.preparedAt ? d.preparedAt.replace('T', ', ').replace(':', '.') + ' WIB' : undefined,
          labelDate: d.labelDate ? isoToLabel(d.labelDate) : undefined,
          allergens: d.allergensKnown === 'ya' ? d.allergens : null,
          description: d.description || undefined,
          donorName: profile.name,
          donorType: 'UMKM',
          donorVerified: true,
          area: d.area,
          pickupDate: isoToLabel(d.date),
          pickupStart: timeLabel(d.start),
          pickupEnd: timeLabel(d.end),
          methods: d.methods,
          status: asDraft ? 'Draf' : 'Tersedia',
        },
      })
      navigate('/donasi', { replace: true })
    }, 700)
  }

  const back = () => {
    if (step > 0) setStep(step - 1)
    else if (dirty) setLeaving(true)
    else navigate(-1)
  }

  const [declared, setDeclared] = useState(false)
  const [declareError, setDeclareError] = useState(false)
  const errorList = Object.entries(errors).filter(([, v]) => v)

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line bg-surface">
        <div className="flex min-h-14 items-center gap-1 px-1">
          <button type="button" onClick={back} aria-label={step > 0 ? 'Langkah sebelumnya' : 'Kembali'} className="tap flex h-12 w-12 items-center justify-center rounded-full hover:bg-page">
            <svg aria-hidden="true" viewBox="0 0 256 256" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"><path d="M216 128H40M112 56l-72 72 72 72" /></svg>
          </button>
          <p className="flex-1 text-[1.125rem] font-semibold">Tawarkan Pangan</p>
          {!isLive && (
            <Button variant="ghost" className="min-h-12 text-[0.875rem]" onClick={() => validate(0) && publish(true)}>
              Simpan draf
            </Button>
          )}
        </div>
        <div className="px-4 pb-3">
          <p className="text-meta text-ink-secondary">
            Langkah {step + 1} dari 3 · <span className="font-semibold text-ink">{steps[step]}</span>
          </p>
          <div className="mt-2 flex gap-1.5" aria-hidden="true">
            {steps.map((s, i) => (
              <span key={s} className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                {/* Segmen terisi dari kiri saat maju, mengosong ke kiri saat mundur. */}
                <span className={`block h-full origin-left rounded-full bg-primary transition-transform duration-page ease-enter ${i <= step ? 'scale-x-100' : 'scale-x-0'}`} />
              </span>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-[560px] flex-col gap-5 px-4 pb-36 pt-4">
        <h1 ref={headingRef} tabIndex={-1} className="text-page-title focus:outline-none">
          {steps[step]}
        </h1>

        {errorList.length > 1 && (
          <Notice tone="danger" title={`Periksa ${errorList.length} isian`}>
            <ul className="list-disc pl-4">
              {errorList.map(([k, v]) => (
                <li key={k}>{v}</li>
              ))}
            </ul>
          </Notice>
        )}

        {fromRecord && step === 0 && (
          <Notice tone="success" title="Diisi dari Catat Pangan">
            {fromRecord.name} ({fromRecord.id}). Anda tetap bisa memperbaiki informasinya.
          </Notice>
        )}

        {step === 0 && (
          <>
            <Field label="Nama pangan" error={errors.name}>
              {(p) => <input {...p} className={inputCls} value={d.name} onChange={(e) => set('name', e.target.value)} placeholder="Contoh: Nasi kotak ayam dan sayur" />}
            </Field>
            <fieldset>
              <legend className="mb-1.5 text-label">Kategori</legend>
              <div className="flex flex-wrap gap-2">
                {(['Makanan matang', 'Bahan pangan', 'Produk kemasan'] as FoodCategory[]).map((c) => (
                  <Chip key={c} selected={d.category === c} onClick={() => set('category', c)}>
                    {c}
                  </Chip>
                ))}
              </div>
              {errors.category && <p className="mt-1.5 text-meta font-medium text-danger">{errors.category}</p>}
            </fieldset>
            <div className="grid grid-cols-[1fr_auto] gap-3">
              <Field label="Jumlah" error={errors.quantity}>
                {(p) => <input {...p} inputMode="decimal" className={inputCls} value={d.quantity} onChange={(e) => set("quantity", e.target.value)} />}
              </Field>
              <Field label="Satuan">
                {(p) => (
                  <select {...p} className={`${inputCls} pr-8`} value={d.unit} onChange={(e) => set('unit', e.target.value as Unit)}>
                    {['porsi', 'kg', 'kemasan', 'bungkus', 'unit'].map((u) => (
                      <option key={u}>{u}</option>
                    ))}
                  </select>
                )}
              </Field>
            </div>
            <label className="-mt-2 flex min-h-12 items-center gap-3">
              <input type="checkbox" checked={d.estimate} onChange={(e) => set('estimate', e.target.checked)} className="h-5 w-5 accent-primary" />
              <span>Jumlah ini perkiraan</span>
            </label>
            <div className="flex min-h-[96px] items-center gap-3 rounded-control border border-dashed border-line-control bg-surface p-4">
              <Camera size={28} aria-hidden="true" className="text-primary" />
              <div className="flex-1">
                <p className="font-semibold">Foto pangan (opsional)</p>
                <p className="text-meta text-ink-secondary">Unggah foto belum tersedia.</p>
              </div>
            </div>
            <Field label="Penyimpanan saat ini" error={errors.storage}>
              {(p) => <input {...p} className={inputCls} value={d.storage} onChange={(e) => set('storage', e.target.value)} placeholder="Contoh: Kulkas, wadah tertutup" />}
            </Field>
            {d.category === 'Makanan matang' && (
              <Field label="Waktu persiapan" optional hint="Kapan pangan selesai dimasak atau dibuka.">
                {(p) => <input {...p} type="datetime-local" className={inputCls} value={d.preparedAt} onChange={(e) => set('preparedAt', e.target.value)} />}
              </Field>
            )}
            {d.category === 'Produk kemasan' && (
              <Field label="Tanggal pada label" optional>
                {(p) => <input {...p} type="date" className={inputCls} value={d.labelDate} onChange={(e) => set('labelDate', e.target.value)} />}
              </Field>
            )}
            <fieldset>
              <legend className="mb-1.5 text-label">Bahan dan alergen</legend>
              <div className="flex flex-col">
                {[
                  ['ya', 'Saya tahu bahan/alergen utamanya'],
                  ['tidak', 'Belum diketahui'],
                ].map(([v, l]) => (
                  <label key={v} className="flex min-h-12 items-center gap-3">
                    <input type="radio" name="allergen" checked={d.allergensKnown === v} onChange={() => set('allergensKnown', v as Draft['allergensKnown'])} className="h-5 w-5 accent-primary" />
                    {l}
                  </label>
                ))}
              </div>
              {errors.allergensKnown && <p className="text-meta font-medium text-danger">{errors.allergensKnown}</p>}
              {d.allergensKnown === 'tidak' && <p className="text-meta text-ink-secondary">Penerima akan melihat “Belum diketahui oleh pemberi”.</p>}
            </fieldset>
            {d.allergensKnown === 'ya' && (
              <Field label="Bahan/alergen yang diketahui" error={errors.allergens}>
                {(p) => <input {...p} className={inputCls} value={d.allergens} onChange={(e) => set('allergens', e.target.value)} placeholder="Contoh: telur, kacang, santan" />}
              </Field>
            )}
            <Field label="Deskripsi" optional>
              {(p) => <textarea {...p} rows={3} className={inputCls} value={d.description} onChange={(e) => set('description', e.target.value)} />}
            </Field>
          </>
        )}

        {step === 1 && (
          <>
            <Field label="Area umum" hint="Area ini terlihat oleh penerima. Alamat lengkap dibuka setelah permintaan disetujui.">
              {(p) => <input {...p} className={inputCls} value={d.area} onChange={(e) => set('area', e.target.value)} />}
            </Field>
            <Field label="Tanggal pengambilan" error={errors.date}>
              {(p) => <input {...p} type="date" className={inputCls} value={d.date} onChange={(e) => set('date', e.target.value)} />}
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Mulai (WIB)">{(p) => <input {...p} type="time" className={inputCls} value={d.start} onChange={(e) => set('start', e.target.value)} />}</Field>
              <Field label="Selesai (WIB)" error={errors.end}>
                {(p) => <input {...p} type="time" className={inputCls} value={d.end} onChange={(e) => set('end', e.target.value)} />}
              </Field>
            </div>
            <fieldset>
              <legend className="mb-1.5 text-label">Cara penyaluran yang bisa Anda layani</legend>
              <div className="flex flex-col gap-2">
                {(['Ambil sendiri', 'Antar pemberi', 'Mitra pengiriman'] as const).map((m) => {
                  const on = d.methods.includes(m)
                  return (
                    <label key={m} className={`tap flex min-h-14 items-center gap-3 rounded-control border px-4 ${on ? 'border-primary bg-primary-container' : 'border-line bg-surface'}`}>
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => set('methods', on ? d.methods.filter((x) => x !== m) : [...d.methods, m])}
                        className="h-5 w-5 accent-primary"
                      />
                      <span className="flex-1">
                        <span className="block font-medium">{m === 'Ambil sendiri' ? 'Penerima ambil sendiri' : m === 'Antar pemberi' ? 'Saya antar' : 'Mitra pengiriman'}</span>
                        {m === 'Mitra pengiriman' && <span className="block text-meta text-ink-secondary">Biaya belum tersedia; dibahas sebelum disetujui.</span>}
                      </span>
                    </label>
                  )
                })}
              </div>
              {errors.methods && <p className="mt-1.5 text-meta font-medium text-danger">{errors.methods}</p>}
            </fieldset>
            <Field label="Instruksi pengambilan" optional>
              {(p) => <textarea {...p} rows={3} className={inputCls} value={d.instructions} onChange={(e) => set('instructions', e.target.value)} placeholder="Contoh: Hubungi kasir di pintu samping." />}
            </Field>
          </>
        )}

        {step === 2 && (
          <>
            <Notice tone="info">Periksa kembali detail sebelum penawaran terlihat oleh penerima di sekitar Anda.</Notice>
            <Review title="Pangan" onEdit={() => setStep(0)} rows={[
              ['Nama', d.name],
              ['Kategori', d.category],
              ['Jumlah', `${d.quantity} ${d.unit}${d.estimate ? ' (perkiraan)' : ''}`],
              ['Penyimpanan', d.storage],
              ['Bahan/alergen', d.allergensKnown === 'ya' ? d.allergens : 'Belum diketahui oleh pemberi'],
            ]} />
            <Review title="Penyaluran" onEdit={() => setStep(1)} rows={[
              ['Area (publik)', d.area],
              ['Pengambilan', `${isoToLabel(d.date)}, ${timeLabel(d.start)}–${timeLabel(d.end)} WIB`],
              ['Alamat lengkap', 'Terkunci sampai ada kesepakatan dengan penerima'],
              ['Cara', d.methods.join(', ')],
              ['Biaya pengiriman', d.methods.includes('Mitra pengiriman') ? 'Mitra pengiriman: biaya belum tersedia' : 'Tanpa biaya pengiriman dari platform'],
            ]} />
            <label className={`flex items-start gap-3 rounded-card border p-4 ${declareError ? 'border-danger bg-danger-container' : 'border-primary/30 bg-primary-container'}`}>
              <input type="checkbox" checked={declared} onChange={(e) => { setDeclared(e.target.checked); setDeclareError(false) }} className="mt-0.5 h-5 w-5 shrink-0 accent-primary" aria-describedby="declare-err" />
              <span className="text-meta text-ink">Saya menyatakan pangan ini layak dikonsumsi saat disiapkan dan informasinya sesuai kondisi sebenarnya.</span>
            </label>
            {declareError && <p id="declare-err" className="-mt-3 text-meta font-medium text-danger">Centang pernyataan ini sebelum menerbitkan.</p>}
            <p className="text-caption text-ink-secondary">Penawaran belum dihitung sebagai donasi berhasil. Jumlah diterima dicatat setelah serah terima.</p>
          </>
        )}
      </main>

      <StickyFooter>
        <div className="flex gap-2">
          {step > 0 && (
            <Button variant="secondary" className="flex-1" onClick={() => setStep(step - 1)}>
              Kembali
            </Button>
          )}
          {step < 2 ? (
            <Button className="flex-[2]" onClick={next}>
              Lanjut
            </Button>
          ) : (
            <Button className="flex-[2]" loading={submitting} loadingLabel="Menerbitkan…" icon={<Check size={20} weight="bold" />} onClick={() => (declared ? publish(false) : setDeclareError(true))}>
              Terbitkan penawaran
            </Button>
          )}
        </div>
      </StickyFooter>

      <BottomSheet open={leaving} onClose={() => setLeaving(false)} title="Tinggalkan formulir?">
        <p className="mb-4 text-body text-ink-secondary">Perubahan belum tersimpan.</p>
        <div className="flex flex-col gap-2">
          <Button onClick={() => setLeaving(false)}>Lanjut mengedit</Button>
          {!isLive && (
            <Button variant="secondary" onClick={() => (validate(0) ? publish(true) : setLeaving(false))}>
              Simpan draf
            </Button>
          )}
          <Button variant="danger" onClick={() => navigate(-1)}>
            Buang perubahan
          </Button>
        </div>
      </BottomSheet>
    </>
  )
}

function Review({ title, rows, onEdit }: { title: string; rows: [string, string][]; onEdit: () => void }) {
  return (
    <section className="card p-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-card-title">{title}</h2>
        <button type="button" onClick={onEdit} className="tap min-h-12 rounded-control px-3 text-[0.875rem] font-semibold text-primary hover:bg-primary-container">
          Ubah
        </button>
      </div>
      <dl className="divide-y divide-line">
        {rows.map(([k, v]) => (
          <div key={k} className="flex flex-col gap-0.5 py-2.5">
            <dt className="text-meta text-ink-secondary">{k}</dt>
            <dd className="text-body">{v || '—'}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

export { AppBar }
