import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CaretRight, ChatCircleText, Clock, Flag, MapPin, Tray } from '@phosphor-icons/react'
import { RootHeader } from '../components/Layouts'
import { AppBar, Button, ButtonLink, DemoNote, Field, inputCls, KeyValue, Notice, Segmented, StatePanel, StatusBadge, StickyFooter } from '../components/ui'
import { FoodPhoto } from '../components/FoodPhoto'
import { useApp, useProfile } from '../state/AppState'
import { NotAvailable } from './Donasi'
import type { Transfer } from '../data/types'

/* ---------- L01 / L01R Aktivitas ---------- */

type Tab = 'tindakan' | 'berjalan' | 'riwayat'

export function ActivitiesTab() {
  const { state } = useApp()
  const profile = useProfile()
  const donor = state.role === 'pemberi'
  const [tab, setTab] = useState<Tab>('tindakan')

  const mine = state.transfers.filter((t) => (donor ? t.donorName : t.recipientName) === profile.name)
  const myRequests = donor
    ? state.requests.filter((r) => r.status === 'Diajukan' && state.offers.some((o) => o.id === r.offerId && o.donorName === profile.name))
    : state.requests.filter((r) => r.recipientName === profile.name && r.status !== 'Disetujui')

  const needsAction = (t: Transfer) =>
    donor ? t.status === 'Terjadwal' : t.status === 'Diserahkan' || ((t.status === 'Diterima penuh' || t.status === 'Diterima sebagian') && !t.distributionReported)
  const finished = (t: Transfer) => t.status === 'Diterima penuh' || t.status === 'Diterima sebagian' || t.status === 'Ditolak'

  const action = mine.filter(needsAction)
  const running = mine.filter((t) => !needsAction(t) && !finished(t))
  const history = mine.filter((t) => finished(t) && !needsAction(t))
  const pendingRequests = donor ? myRequests : myRequests.filter((r) => r.status === 'Diajukan')
  const closedRequests = donor ? [] : myRequests.filter((r) => r.status !== 'Diajukan')

  const counts = {
    tindakan: action.length + (donor && pendingRequests.length ? 1 : 0),
    berjalan: running.length + (donor ? 0 : pendingRequests.length),
    riwayat: history.length + closedRequests.length,
  }

  return (
    <>
      <RootHeader title="Aktivitas" subtitle={donor ? 'Permintaan masuk dan penyerahan' : 'Permintaan, jadwal, dan penerimaan'} />
      <div className="flex flex-col gap-4 px-4 pt-4">
        <Segmented
          label="Kelompok aktivitas"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'tindakan', label: 'Perlu tindakan', count: counts.tindakan },
            { value: 'berjalan', label: 'Berjalan', count: counts.berjalan },
            { value: 'riwayat', label: 'Riwayat', count: counts.riwayat },
          ]}
        />

        <h2 className="sr-only">Daftar aktivitas</h2>
        {tab === 'tindakan' && (
          <>
            {donor && pendingRequests.length > 0 && (
              <Link to="/aktivitas/permintaan" className="tap card flex items-center gap-3 border-warning/40 p-4 hover:bg-page">
                <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-warning-container text-warning">
                  <Tray size={22} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{pendingRequests.length} permintaan masuk</span>
                  <span className="block text-meta text-ink-secondary">Tinjau jumlah, kapasitas, dan jadwal penerima</span>
                </span>
                <CaretRight size={20} aria-hidden="true" className="text-ink-secondary" />
              </Link>
            )}
            {action.map((t) => (
              <TransferCard key={t.id} t={t} donor={donor} />
            ))}
            {counts.tindakan === 0 && <StatePanel title="Tidak ada yang perlu ditindaklanjuti">Aktivitas yang memerlukan tindakan Anda akan muncul di sini.</StatePanel>}
          </>
        )}

        {tab === 'berjalan' && (
          <>
            {!donor &&
              pendingRequests.map((r) => {
                const o = state.offers.find((x) => x.id === r.offerId)
                return (
                  <Link key={r.id} to={`/permintaan/${r.id}`} className="tap card flex items-center gap-3 p-4 hover:bg-page">
                    <div className="min-w-0 flex-1">
                      <StatusBadge status={r.status} />
                      <p className="mt-2 font-semibold">{o?.name}</p>
                      <p className="text-meta text-ink-secondary">{r.quantity} {r.unit} · {r.pickupTime}</p>
                    </div>
                    <CaretRight size={20} aria-hidden="true" className="text-ink-secondary" />
                  </Link>
                )
              })}
            {running.map((t) => (
              <TransferCard key={t.id} t={t} donor={donor} />
            ))}
            {counts.berjalan === 0 && <StatePanel title="Belum ada aktivitas berjalan" />}
          </>
        )}

        {tab === 'riwayat' && (
          <>
            {history.map((t) => (
              <TransferCard key={t.id} t={t} donor={donor} />
            ))}
            {closedRequests.map((r) => (
              <Link key={r.id} to={`/permintaan/${r.id}`} className="tap card flex items-center gap-3 p-4 hover:bg-page">
                <div className="min-w-0 flex-1">
                  <StatusBadge status={r.status} />
                  <p className="mt-2 font-semibold">{state.offers.find((o) => o.id === r.offerId)?.name}</p>
                  <p className="text-meta text-ink-secondary">{r.quantity} {r.unit}</p>
                </div>
                <CaretRight size={20} aria-hidden="true" className="text-ink-secondary" />
              </Link>
            ))}
            {counts.riwayat === 0 && <StatePanel title="Belum ada riwayat" />}
          </>
        )}
        <DemoNote />
      </div>
    </>
  )
}

function nextAction(t: Transfer, donor: boolean): { label: string; to: string } | null {
  if (donor && t.status === 'Terjadwal') return { label: 'Catat penyerahan', to: `/aktivitas/${t.id}/serahkan` }
  if (!donor && (t.status === 'Terjadwal' || t.status === 'Diserahkan')) return { label: 'Konfirmasi penerimaan', to: `/aktivitas/${t.id}/terima` }
  if (!donor && (t.status === 'Diterima penuh' || t.status === 'Diterima sebagian') && !t.distributionReported)
    return { label: 'Catat penggunaan/distribusi', to: `/aktivitas/${t.id}/distribusi` }
  return null
}

function TransferCard({ t, donor }: { t: Transfer; donor: boolean }) {
  const next = nextAction(t, donor)
  const finished = t.received !== undefined
  return (
    <article className="card overflow-hidden">
      <Link to={`/aktivitas/${t.id}`} className="tap block p-4 hover:bg-page">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={t.status} />
          <span className="text-caption text-ink-secondary">{t.id}</span>
        </div>
        <div className="mt-2 flex gap-3">
          <FoodPhoto src={t.photo} alt="" className="h-14 w-14 shrink-0 rounded-control" iconSize={24} />
          <div className="min-w-0">
            <h3 className="text-[1.0625rem] font-semibold leading-6">
              {finished ? `${t.received} ${t.unit} diterima` : `${t.agreed} ${t.unit} disepakati`} · {t.foodName}
            </h3>
            <p className="text-meta text-ink-secondary">{donor ? `Penerima: ${t.recipientName}` : `Pemberi: ${t.donorName}`}</p>
          </div>
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-meta text-ink-secondary">
          <Clock size={18} aria-hidden="true" /> {t.date}, {t.timeStart}–{t.timeEnd} WIB · {t.method}
        </p>
        {t.status === 'Diterima sebagian' && <p className="mt-1 text-meta text-warning">{t.rejected} {t.unit} tidak diterima</p>}
      </Link>
      {next && (
        <div className="px-4 pb-4">
          <ButtonLink to={next.to} block>
            {next.label}
          </ButtonLink>
        </div>
      )}
    </article>
  )
}

/* ---------- L02 Detail penyaluran ---------- */

export function TransferDetail() {
  const { id } = useParams()
  const { state } = useApp()
  const t = state.transfers.find((x) => x.id === id)
  if (!t) return <NotAvailable />
  const donor = state.role === 'pemberi'
  const next = nextAction(t, donor)

  return (
    <>
      <AppBar title="Detail penyaluran" />
      <main className="flex flex-col gap-4 px-4 pb-32 pt-4">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={t.status} />
          <span className="text-caption text-ink-secondary">{t.id}</span>
        </div>
        <h1 className="text-page-title">{t.foodName}</h1>
        {next ? (
          <Notice tone="info" title="Langkah berikutnya">{next.label}.</Notice>
        ) : t.status === 'Terjadwal' || t.status === 'Diserahkan' ? (
          <Notice tone="info">Menunggu {donor ? 'penerima mengonfirmasi penerimaan' : 'pemberi mencatat penyerahan'}.</Notice>
        ) : null}

        <section className="card p-4">
          <h2 className="mb-2 text-card-title">Jumlah</h2>
          <dl className="grid grid-cols-3 gap-2 text-center">
            {[
              ['Disepakati', t.agreed],
              ['Diserahkan', t.handedOver],
              ['Diterima', t.received],
            ].map(([k, v]) => (
              <div key={k as string} className="rounded-control bg-page p-2">
                <dt className="text-caption text-ink-secondary">{k}</dt>
                <dd className="text-[1.125rem] font-bold">{v ?? '—'}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-2 text-caption text-ink-secondary">Satuan: {t.unit}. “Diterima” berbeda dari “didistribusikan”.</p>
        </section>

        <section className="card p-4">
          <dl className="divide-y divide-line">
            <KeyValue label={donor ? 'Penerima' : 'Pemberi'}>{donor ? t.recipientName : t.donorName}</KeyValue>
            <KeyValue label="Jadwal">{t.date}, {t.timeStart}–{t.timeEnd} WIB</KeyValue>
            <KeyValue label="Cara">{t.method}</KeyValue>
            <KeyValue label="Biaya pengiriman">{t.method === 'Ambil sendiri' ? 'Tanpa biaya pengiriman dari platform' : 'Biaya belum tersedia'}</KeyValue>
            <KeyValue label="Lokasi">
              <span className="flex items-start gap-1"><MapPin size={18} aria-hidden="true" className="mt-0.5 shrink-0" />Jl. Contoh No. 12, Coblong (alamat demo)</span>
            </KeyValue>
          </dl>
        </section>

        <section aria-labelledby="tl" className="card p-4">
          <h2 id="tl" className="mb-3 text-card-title">Riwayat kegiatan</h2>
          <ol className="relative flex flex-col gap-4 border-l-2 border-line pl-5">
            {t.timeline.map((e, i) => (
              <li key={i} className="relative">
                <span aria-hidden="true" className={`absolute -left-[27px] top-1 h-3 w-3 rounded-full ring-4 ring-surface ${i === t.timeline.length - 1 ? 'bg-primary' : 'bg-line-control'}`} />
                <p className="font-semibold">{e.label}</p>
                <p className="text-meta text-ink-secondary">{e.at} · {e.by}</p>
                {e.note && <p className="text-meta">{e.note}</p>}
              </li>
            ))}
          </ol>
        </section>

        <div className="grid grid-cols-2 gap-2">
          <ButtonLink to={`/aktivitas/${t.id}/koordinasi`} variant="secondary" icon={<ChatCircleText size={20} />}>
            Koordinasi
          </ButtonLink>
          <ButtonLink to={`/aktivitas/${t.id}/masalah`} variant="secondary" icon={<Flag size={20} />}>
            Laporkan masalah
          </ButtonLink>
        </div>
      </main>
      {next && (
        <StickyFooter>
          <ButtonLink to={next.to} block>
            {next.label}
          </ButtonLink>
        </StickyFooter>
      )}
    </>
  )
}

/* ---------- L05 Penyerahan (pemberi) ---------- */

export function Handover() {
  const { id } = useParams()
  const { state, dispatch } = useApp()
  const navigate = useNavigate()
  const t = state.transfers.find((x) => x.id === id)
  const [qty, setQty] = useState(String(t?.agreed ?? ''))
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  if (!t) return <NotAvailable />
  const submit = () => {
    const n = Number(qty)
    if (!Number.isInteger(n) || n <= 0) return setError('Isi jumlah yang benar-benar diserahkan.')
    if (n > t.agreed) return setError(`Melebihi jumlah disepakati (${t.agreed} ${t.unit}). Ajukan penyesuaian bila perlu.`)
    setBusy(true)
    window.setTimeout(() => {
      dispatch({ type: 'handover', id: t.id, quantity: n })
      navigate(`/aktivitas/${t.id}`, { replace: true })
    }, 600)
  }
  return (
    <>
      <AppBar title="Catat penyerahan" />
      <main className="mx-auto flex max-w-[560px] flex-col gap-4 px-4 pb-32 pt-4">
        <h1 className="text-card-title">{t.foodName}</h1>
        <p className="text-body text-ink-secondary">Kepada {t.recipientName} · disepakati {t.agreed} {t.unit}</p>
        <Field label={`Jumlah diserahkan (${t.unit})`} error={error}>
          {(p) => <input {...p} inputMode="numeric" className={inputCls} value={qty} onChange={(e) => setQty(e.target.value.replace(/\D/g, ''))} />}
        </Field>
        <Notice tone="info">Penyerahan belum berarti diterima. Penerima akan mengonfirmasi jumlah yang diterima.</Notice>
      </main>
      <StickyFooter>
        <Button block loading={busy} onClick={submit}>Konfirmasi penyerahan</Button>
      </StickyFooter>
    </>
  )
}

/* ---------- L06 Konfirmasi penerimaan (penerima) ---------- */

export function Receive() {
  const { id } = useParams()
  const { state, dispatch } = useApp()
  const navigate = useNavigate()
  const t = state.transfers.find((x) => x.id === id)
  const [choice, setChoice] = useState<'penuh' | 'sebagian' | 'tolak' | ''>('')
  const [qty, setQty] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  if (!t) return <NotAvailable />
  const base = t.handedOver ?? t.agreed

  const submit = () => {
    let received = base
    if (!choice) return setError('Pilih hasil penerimaan.')
    if (choice === 'sebagian') {
      const n = Number(qty)
      if (!Number.isInteger(n) || n <= 0 || n >= base) return setError(`Isi jumlah antara 1 dan ${base - 1} ${t.unit}.`)
      received = n
    }
    if (choice === 'tolak') received = 0
    if (choice !== 'penuh' && !reason) return setError('Tulis alasan agar pemberi memahami selisihnya.')
    setBusy(true)
    window.setTimeout(() => {
      dispatch({ type: 'receive', id: t.id, received, reason })
      navigate(`/aktivitas/${t.id}`, { replace: true })
    }, 600)
  }

  return (
    <>
      <AppBar title="Konfirmasi penerimaan" />
      <main className="mx-auto flex max-w-[560px] flex-col gap-4 px-4 pb-32 pt-4">
        <section className="card p-4">
          <h1 className="text-card-title">{t.foodName}</h1>
          <p className="text-meta text-ink-secondary">Dari {t.donorName} · {t.id}</p>
          <dl className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-control bg-page p-3"><dt className="text-caption text-ink-secondary">Disepakati</dt><dd className="text-[1.125rem] font-bold">{t.agreed} {t.unit}</dd></div>
            <div className="rounded-control bg-page p-3"><dt className="text-caption text-ink-secondary">Diserahkan</dt><dd className="text-[1.125rem] font-bold">{t.handedOver !== undefined ? `${t.handedOver} ${t.unit}` : 'Belum dicatat'}</dd></div>
          </dl>
        </section>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1.5 text-label">Hasil penerimaan</legend>
          {[
            ['penuh', `Terima penuh (${base} ${t.unit})`],
            ['sebagian', 'Terima sebagian'],
            ['tolak', 'Tolak seluruhnya'],
          ].map(([v, l]) => (
            <label key={v} className={`tap flex min-h-14 items-center gap-3 rounded-control border px-4 ${choice === v ? 'border-primary bg-primary-container' : 'border-line bg-surface'}`}>
              <input type="radio" name="hasil" checked={choice === v} onChange={() => { setChoice(v as typeof choice); setError('') }} className="h-5 w-5 accent-primary" />
              <span className="font-medium">{l}</span>
            </label>
          ))}
        </fieldset>
        {choice === 'sebagian' && (
          <Field label={`Jumlah diterima (${t.unit})`}>
            {(p) => <input {...p} inputMode="numeric" className={inputCls} value={qty} onChange={(e) => setQty(e.target.value.replace(/\D/g, ''))} />}
          </Field>
        )}
        {choice && choice !== 'penuh' && (
          <Field label="Alasan atau kondisi yang dilaporkan">
            {(p) => <textarea {...p} rows={3} className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Contoh: 2 kemasan rusak" />}
          </Field>
        )}
        {error && <Notice tone="danger">{error}</Notice>}
        <p className="text-caption text-ink-secondary">Melaporkan penolakan atau selisih secara jujur tidak dikenai sanksi. Foto wajah tidak diperlukan.</p>
      </main>
      <StickyFooter>
        <Button block loading={busy} onClick={submit}>Konfirmasi penerimaan</Button>
      </StickyFooter>
    </>
  )
}

/* ---------- C06 Laporan penggunaan/distribusi ---------- */

export function Distribution() {
  const { id } = useParams()
  const { state, dispatch } = useApp()
  const navigate = useNavigate()
  const t = state.transfers.find((x) => x.id === id)
  const [v, setV] = useState({ distributed: '', used: '', wasted: '' })
  const [busy, setBusy] = useState(false)
  if (!t || t.received === undefined) return <NotAvailable />
  const n = (s: string) => Number(s || 0)
  const total = n(v.distributed) + n(v.used) + n(v.wasted)
  const left = t.received - total
  const invalid = left < 0

  return (
    <>
      <AppBar title="Penggunaan dan distribusi" />
      <main className="mx-auto flex max-w-[560px] flex-col gap-4 px-4 pb-32 pt-4">
        <section className="rounded-card bg-primary-container p-4">
          <p className="text-meta">Diterima terkonfirmasi</p>
          <p className="text-display text-primary">{t.received} {t.unit}</p>
          <p className="text-meta text-ink-secondary">{t.foodName} · dari {t.donorName}</p>
        </section>
        {(['distributed', 'used', 'wasted'] as const).map((k) => (
          <Field key={k} label={`${k === 'distributed' ? 'Didistribusikan' : k === 'used' ? 'Digunakan sendiri' : 'Terbuang'} (${t.unit})`} hint={k === 'wasted' ? 'Laporan terbuang tetap berguna dan tidak dikenai sanksi.' : undefined}>
            {(p) => <input {...p} inputMode="numeric" className={inputCls} value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value.replace(/\D/g, '') })} placeholder="0" />}
          </Field>
        ))}
        <div className={`rounded-control p-4 ${invalid ? 'bg-danger-container' : 'bg-page'}`} aria-live="polite">
          <p className="text-meta text-ink-secondary">Sisa setelah laporan</p>
          <p className={`text-card-title ${invalid ? 'text-danger' : ''}`}>
            {invalid ? `Total melebihi ${t.received} ${t.unit} yang diterima` : `${left} ${t.unit} masih tersedia`}
          </p>
        </div>
      </main>
      <StickyFooter>
        <Button
          block
          loading={busy}
          disabled={invalid || total === 0}
          onClick={() => {
            setBusy(true)
            window.setTimeout(() => {
              dispatch({ type: 'reportDistribution', id: t.id, distributed: n(v.distributed), used: n(v.used), wasted: n(v.wasted) })
              navigate(`/aktivitas/${t.id}`, { replace: true })
            }, 500)
          }}
        >
          Simpan laporan
        </Button>
      </StickyFooter>
    </>
  )
}

/* ---------- L09 Notifikasi ---------- */

export function Notifications() {
  const { state, dispatch } = useApp()
  const navigate = useNavigate()
  const list = state.notifications.filter((n) => n.role === state.role)
  return (
    <>
      <AppBar title="Notifikasi" />
      <main className="flex flex-col px-4 pb-10 pt-2">
        {list.length === 0 && <StatePanel title="Belum ada notifikasi" />}
        <ul className="flex flex-col divide-y divide-line">
          {list.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => {
                  dispatch({ type: 'readNotification', id: n.id })
                  navigate(n.to)
                }}
                className="tap flex w-full gap-3 px-1 py-4 text-left hover:bg-surface"
              >
                <span aria-hidden="true" className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${n.read ? 'bg-transparent' : 'bg-primary'}`} />
                <span className="min-w-0 flex-1">
                  <span className={`block ${n.read ? '' : 'font-semibold'}`}>{n.title}{!n.read && <span className="sr-only"> (belum dibaca)</span>}</span>
                  <span className="block text-meta text-ink-secondary">{n.body}</span>
                  <span className="mt-1 block text-caption text-ink-secondary">{n.kind} · {n.at}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </main>
    </>
  )
}

/* ---------- L08 / L10 placeholder berlabel ---------- */

export function Coordination() {
  const { id } = useParams()
  return (
    <>
      <AppBar title="Koordinasi" />
      <main className="p-4">
        <StatePanel icon={<ChatCircleText size={40} className="text-primary" />} title="Koordinasi segera hadir" action={<ButtonLink to={`/aktivitas/${id}`} variant="secondary">Kembali ke penyaluran</ButtonLink>}>
          Bentuk koordinasi (chat atau kontak terbatas) masih menunggu keputusan OD-09.
        </StatePanel>
      </main>
    </>
  )
}

export function ReportIssue() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [cat, setCat] = useState('')
  const [desc, setDesc] = useState('')
  const [sent, setSent] = useState(false)
  return (
    <>
      <AppBar title="Laporkan masalah" />
      <main className="mx-auto flex max-w-[560px] flex-col gap-4 px-4 pb-32 pt-4">
        {sent ? (
          <Notice tone="success" title="Laporan terkirim">Status awal: Dikirim. Tim akan meninjau dan memberi kabar lewat notifikasi.</Notice>
        ) : (
          <>
            <p className="text-meta text-ink-secondary">Kegiatan: {id}</p>
            <fieldset className="flex flex-col">
              <legend className="mb-1.5 text-label">Kategori</legend>
              {['Tidak datang', 'Terlambat', 'Jumlah berbeda', 'Kondisi pangan tidak sesuai', 'Kendala pengiriman', 'Lainnya'].map((c) => (
                <label key={c} className="flex min-h-12 items-center gap-3">
                  <input type="radio" name="cat" checked={cat === c} onChange={() => setCat(c)} className="h-5 w-5 accent-primary" />
                  {c}
                </label>
              ))}
            </fieldset>
            <Field label="Ceritakan yang terjadi">
              {(p) => <textarea {...p} rows={4} className={inputCls} value={desc} onChange={(e) => setDesc(e.target.value)} />}
            </Field>
          </>
        )}
      </main>
      <StickyFooter>
        {sent ? (
          <Button block variant="secondary" onClick={() => navigate(-1)}>Kembali</Button>
        ) : (
          <Button block disabled={!cat || !desc} onClick={() => setSent(true)}>Kirim laporan</Button>
        )}
      </StickyFooter>
    </>
  )
}
