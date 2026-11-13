import { useState } from 'react'
import { methodLabel } from '../lib/format'
import { useNavigate, useParams } from 'react-router-dom'
import { Bicycle, CheckSquare, HandArrowDown, Info, Truck, Warning } from '@phosphor-icons/react'
import { AppBar, Badge, Button, ButtonLink, Notice, PolicyNote, StickyFooter, toast } from '../components/ui'
import { FoodPhoto } from '../components/FoodPhoto'
import { useApp } from '../state/AppState'
import { useCommand } from '../state/useCommand'
import { messageOf } from '../lib/supabase/errors'
import type { Transfer } from '../data/types'
import { NotAvailable } from '../components/NotAvailable'

/* ---------- L03 Metode, jadwal, dan biaya ---------- */

const METHODS: { value: Transfer['method']; icon: typeof Truck; title: string; desc: string; cost: string; available: boolean }[] = [
  { value: 'Ambil sendiri', icon: HandArrowDown, title: 'Ambil sendiri oleh penerima', desc: 'Relawan penerima datang ke titik temu dengan wadah atau tas higienis.', cost: 'Rp0', available: true },
  { value: 'Antar pemberi', icon: Bicycle, title: 'Diantar pemberi', desc: 'Pemberi mengantar sendiri bila jaraknya dekat.', cost: 'Rp0 (sukarela)', available: true },
  { value: 'Mitra pengiriman', icon: Truck, title: 'Ojek online (GoSend/GrabExpress)', desc: 'Pihak yang menanggung ongkir memesan sendiri lewat aplikasi Gojek atau Grab.', cost: 'Ongkir dibayar langsung ke driver', available: true },
]

export function MethodPage() {
  const { id } = useParams()
  const { state } = useApp()
  const run = useCommand()
  const navigate = useNavigate()
  const t = state.transfers.find((x) => x.id === id)
  const [method, setMethod] = useState(t?.method)
  const [busy, setBusy] = useState(false)
  if (!t) return <NotAvailable />
  const locked = t.status !== 'Terjadwal'
  return (
    <>
      <AppBar title="Metode dan biaya" />
      <main className="stagger mx-auto flex max-w-[560px] flex-col gap-4 px-4 pb-36 pt-4">
        <section className="card flex gap-3 p-3">
          <FoodPhoto src={t.photo} alt="" className="h-14 w-14 shrink-0 rounded-control" iconSize={22} />
          <div className="min-w-0">
            <p className="font-semibold">{t.foodName} ({t.agreed} {t.unit})</p>
            <p className="text-meta text-ink-secondary">{t.date}, {t.timeStart}–{t.timeEnd} WIB</p>
          </div>
        </section>
        <fieldset className="flex flex-col gap-3" disabled={locked}>
          <legend className="float-left mb-3 text-section-title">Cara serah terima</legend>
          {METHODS.map((m) => {
            const on = method === m.value
            return (
              <label
                key={m.value}
                className={`tap flex gap-3 rounded-card border-2 bg-surface p-4 transition-[border-color,box-shadow] ${m.available ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'} ${on ? 'border-primary shadow-card' : 'border-line'}`}
              >
                <input type="radio" name="method" className="sr-only" checked={on} disabled={!m.available} onChange={() => setMethod(m.value)} />
                <span aria-hidden="true" className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-control ${on ? 'bg-primary text-white' : 'bg-primary-container text-primary'}`}>
                  <m.icon size={24} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2 font-semibold">
                    {m.title}
                    {m.value === 'Ambil sendiri' && <Badge tone="success" icon={false}>Disarankan</Badge>}
                  </span>
                  <span className="block text-meta text-ink-secondary">{m.desc}</span>
                  <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-caption font-semibold ${m.available ? 'bg-primary-container text-primary' : 'bg-warning-container text-warning'}`}>
                    Biaya pengiriman: {m.cost}
                  </span>
                </span>
              </label>
            )
          })}
        </fieldset>
        {locked && <Notice tone="info">Cara serah terima tidak bisa diubah setelah pangan diserahkan.</Notice>}
        <PolicyNote title="Pangan selalu Rp0">Biaya pengiriman, bila ada, ditampilkan terpisah dan disepakati sebelum serah terima. Tidak disamarkan sebagai harga pangan.</PolicyNote>
      </main>
      {!locked && (
        <StickyFooter>
          <Button
            block
            disabled={method === t.method}
            loading={busy}
            onClick={() => {
              setBusy(true)
              run({ type: 'setMethod', id: t.id, method: method! })
                .then(() => {
                  toast('Cara serah terima diperbarui dan dicatat di riwayat.')
                  navigate(-1)
                })
                .catch((err) => {
                  toast(messageOf(err), 'info')
                  setBusy(false)
                })
            }}
          >
            {method === t.method ? 'Tidak ada perubahan' : `Pakai: ${method}`}
          </Button>
        </StickyFooter>
      )}
    </>
  )
}

/* ---------- L04 Persiapan (pemberi) ---------- */

const PREP = [
  ['jumlah', 'Jumlah sesuai kesepakatan', 'Wadah disiapkan merata.'],
  ['pisah', 'Lauk berkuah dan sambal dipisah', 'Agar tidak tumpah dan tidak cepat basi.'],
  ['kemasan', 'Kemasan bersih dan tertutup rapat', 'Siap dipindahkan ke wadah angkut.'],
  ['cek', 'Pemeriksaan fisik mandiri', 'Aroma dan tampilan layak konsumsi.'],
] as const

export function PrepPage() {
  const { id } = useParams()
  const { state } = useApp()
  const run = useCommand()
  const navigate = useNavigate()
  const t = state.transfers.find((x) => x.id === id)
  if (!t) return <NotAvailable />
  const checks = t.prep ?? []
  const done = checks.length
  const toggle = (k: string) =>
    run({ type: 'setPrep', id: t.id, checks: checks.includes(k) ? checks.filter((x) => x !== k) : [...checks, k] }).catch((err) => toast(messageOf(err), 'info'))
  return (
    <>
      <AppBar title="Persiapan pangan" />
      <main className="stagger mx-auto flex max-w-[560px] flex-col gap-4 px-4 pb-36 pt-4">
        <section className="card p-4">
          <p className="font-semibold">{t.foodName}</p>
          <p className="text-meta text-ink-secondary">{t.agreed} {t.unit} untuk {t.recipientName} · batas {t.timeEnd} WIB</p>
          <div className="mt-3 flex items-center justify-between text-meta">
            <span className="text-ink-secondary">Daftar periksa</span>
            <span className="font-semibold tabular">{done}/{PREP.length} selesai</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-line" aria-hidden="true">
            <span className="block h-full origin-left rounded-full bg-primary transition-transform duration-page ease-enter" style={{ transform: `scaleX(${done / PREP.length})` }} />
          </div>
        </section>
        <ul className="flex flex-col gap-2">
          {PREP.map(([k, title, desc]) => {
            const on = checks.includes(k)
            return (
              <li key={k}>
                <label className={`tap flex min-h-16 cursor-pointer items-start gap-3 rounded-card border p-4 transition-colors duration-micro ${on ? 'border-primary bg-primary-container' : 'border-line bg-surface'}`}>
                  <input type="checkbox" checked={on} onChange={() => toggle(k)} className="mt-0.5 h-5 w-5 shrink-0 accent-primary" />
                  <span>
                    <span className={`block font-semibold ${on ? 'text-primary-pressed' : ''}`}>{title}</span>
                    <span className="block text-meta text-ink-secondary">{desc}</span>
                  </span>
                </label>
              </li>
            )
          })}
        </ul>
        <Notice tone="warning" title="Informasi alergen">Bila bahan atau alergen belum diketahui, sampaikan langsung ke penerima saat serah terima.</Notice>
        <p className="flex items-start gap-2 text-caption text-ink-secondary"><Info size={16} aria-hidden="true" className="mt-0.5 shrink-0" />Daftar periksa membantu persiapan, bukan sertifikasi keamanan pangan.</p>
      </main>
      <StickyFooter>
        {done === PREP.length ? (
          <ButtonLink to={`/aktivitas/${t.id}/serahkan`} block icon={<CheckSquare size={20} />}>Siap, catat penyerahan</ButtonLink>
        ) : (
          <Button block variant="secondary" onClick={() => navigate(-1)}>Simpan dan lanjutkan nanti</Button>
        )}
      </StickyFooter>
    </>
  )
}

/* ---------- L07 Status pengiriman ---------- */

export function DeliveryStatus() {
  const { id } = useParams()
  const { state } = useApp()
  const t = state.transfers.find((x) => x.id === id)
  if (!t) return <NotAvailable />
  const prepped = (t.prep?.length ?? 0) === PREP.length
  const steps = [
    { title: 'Pangan disiapkan pemberi', detail: prepped ? 'Daftar periksa lengkap' : 'Belum dikonfirmasi', done: prepped || t.status !== 'Terjadwal' },
    { title: t.method === 'Antar pemberi' ? 'Pemberi menuju titik temu' : 'Relawan menuju titik temu', detail: 'Dikoordinasikan lewat Koordinasi', done: t.status !== 'Terjadwal' },
    { title: 'Pemeriksaan dan serah terima', detail: t.handedOver !== undefined ? `${t.handedOver} ${t.unit} diserahkan` : `Perkiraan ${t.timeStart} WIB`, done: t.handedOver !== undefined },
    { title: 'Konfirmasi penerimaan', detail: t.received !== undefined ? `${t.received} ${t.unit} diterima` : 'Diisi penerima', done: t.received !== undefined },
  ]
  const current = steps.findIndex((s) => !s.done)
  return (
    <>
      <AppBar title="Status penyaluran" />
      <main className="stagger mx-auto flex max-w-[560px] flex-col gap-4 px-4 pb-10 pt-4">
        <section className="card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Badge tone="info">{methodLabel(t.method)}</Badge>
            <span className="text-caption text-ink-secondary">{t.id}</span>
          </div>
          <p className="mt-2 font-semibold">{t.foodName}</p>
          <p className="text-meta text-ink-secondary">{t.agreed} {t.unit} · {t.date}, {t.timeStart}–{t.timeEnd} WIB</p>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-meta">
            <div className="rounded-control bg-page p-2"><dt className="text-caption text-ink-secondary">Harga pangan</dt><dd className="font-semibold">Rp0</dd></div>
            <div className="rounded-control bg-page p-2"><dt className="text-caption text-ink-secondary">Biaya pengiriman</dt><dd className="font-semibold">{t.method === 'Mitra pengiriman' ? 'Dibayar ke driver' : 'Rp0'}</dd></div>
          </dl>
        </section>
        <section className="card p-4">
          <h2 className="text-card-title">Linimasa</h2>
          <p className="text-caption text-ink-secondary">Dicatat manual oleh para pihak · tanpa pelacakan GPS</p>
          <ol className="mt-4 flex flex-col">
            {steps.map((s, i) => {
              const active = i === current
              return (
                <li key={s.title} className="relative flex gap-3 pb-5 last:pb-0" aria-current={active ? 'step' : undefined}>
                  {i < steps.length - 1 && <span aria-hidden="true" className={`absolute left-[11px] top-7 h-[calc(100%-1.5rem)] w-0.5 ${s.done ? 'bg-primary' : 'bg-line'}`} />}
                  <span aria-hidden="true" className={`relative z-[1] mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${s.done ? 'bg-primary' : active ? 'border-2 border-primary bg-surface' : 'border-2 border-line bg-surface'}`}>
                    {active && <span className="h-2.5 w-2.5 animate-ping rounded-full bg-primary/60" />}
                  </span>
                  <div>
                    <p className={`font-semibold ${s.done || active ? '' : 'text-ink-secondary'}`}>{s.title}<span className="sr-only">{s.done ? ' (selesai)' : active ? ' (berlangsung)' : ''}</span></p>
                    <p className="text-meta text-ink-secondary">{s.detail}</p>
                  </div>
                </li>
              )
            })}
          </ol>
        </section>
        <section className="flex items-center gap-3 rounded-card border border-line bg-surface p-4">
          <Warning size={22} aria-hidden="true" className="shrink-0 text-warning" />
          <p className="flex-1 text-meta">Ada kendala jadwal penjemputan?</p>
          <ButtonLink to={`/aktivitas/${t.id}/koordinasi`} variant="secondary" className="min-h-11 px-3 text-[0.875rem]">Koordinasi</ButtonLink>
        </section>
      </main>
    </>
  )
}
