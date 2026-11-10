import { useId, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, Bell, CalendarBlank, CaretRight, ChatCircleText, Clock, Flag, Gift, Info, LockSimple, MapPin, Package, Truck, Tray } from '@phosphor-icons/react'
import { RootHeader } from '../components/Layouts'
import { AppBar, Badge, BottomSheet, Button, ButtonLink, Chip, Field, inputCls, MenuRow, Notice, PartiesRow, PhotoUploadPlaceholder, PolicyNote, QtyStepper, RadioCard, Segmented, StageList, StatePanel, StatusBadge, StickyFooter, ChipRow, toast } from '../components/ui'
import { FoodPhoto } from '../components/FoodPhoto'
import { useApp } from '../state/AppState'
import { useCommand } from '../state/useCommand'
import { useLiveData } from '../state/LiveData'
import { messageOf } from '../lib/supabase/errors'
import { reportIssue } from '../services/issues'
import { isLive } from '../lib/supabase/client'
import { useProfile } from '../state/useProfile'
import { NotAvailable } from '../components/NotAvailable'
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
      <div className="stagger flex flex-col gap-4 px-4 pt-4">
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
      </div>
    </>
  )
}

function nextAction(t: Transfer, donor: boolean): { label: string; to: string } | null {
  // Persiapan (L04) didahulukan sebelum penyerahan bila daftar periksa belum lengkap.
  if (donor && t.status === 'Terjadwal')
    return (t.prep?.length ?? 0) < 4 ? { label: 'Siapkan pangan', to: `/aktivitas/${t.id}/persiapan` } : { label: 'Catat penyerahan', to: `/aktivitas/${t.id}/serahkan` }
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

const STAGES = ['Kesepakatan', 'Persiapan pangan', 'Penyerahan', 'Penerimaan', 'Laporan distribusi'] as const

/** Tahap aktif (0–4); 5 berarti semua tahap selesai. */
function stageOf(t: Transfer) {
  if (t.status === 'Terjadwal') return 1
  if (t.status === 'Diserahkan') return 3
  if (t.status === 'Ditolak') return 5
  return t.distributionReported ? 5 : 4
}

function stageDetails(t: Transfer): string[] {
  return [
    `${t.agreed} ${t.unit} disepakati`,
    t.status === 'Terjadwal' ? `${t.donorName} menyiapkan pangan` : 'Selesai',
    t.handedOver !== undefined ? `${t.handedOver} ${t.unit} diserahkan` : `${t.date}, ${t.timeStart}–${t.timeEnd} WIB`,
    t.received !== undefined ? `${t.received} ${t.unit} diterima` : `Dikonfirmasi oleh ${t.recipientName}`,
    t.distributionReported ? 'Laporan tersimpan' : t.status === 'Ditolak' ? 'Tidak diperlukan' : 'Diisi penerima setelah menerima',
  ]
}

export function TransferDetail() {
  const { id } = useParams()
  const { state } = useApp()
  const run = useCommand()
  const [busy, setBusy] = useState<'accept' | 'reject' | null>(null)
  const t = state.transfers.find((x) => x.id === id)
  if (!t) return <NotAvailable />
  const donor = state.role === 'pemberi'
  const next = nextAction(t, donor)
  const stage = stageOf(t)
  const details = stageDetails(t)
  const issues = state.issues.filter((i) => i.transferId === t.id)
  const respond = (accept: boolean) => {
    setBusy(accept ? 'accept' : 'reject')
    run({ type: 'respondSchedule', id: t.id, accept })
      .then(() => toast(accept ? 'Jadwal baru disetujui.' : 'Jadwal lama tetap berlaku.', accept ? 'success' : 'info'))
      .catch((err) => toast(messageOf(err), 'info'))
      .finally(() => setBusy(null))
  }

  return (
    <>
      <AppBar title="Detail penyaluran" />
      <main className="stagger flex flex-col gap-4 px-4 pb-32 pt-4">
        <section className="card flex flex-col gap-3 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <StatusBadge status={t.status} />
            <span className="text-caption text-ink-secondary">
              {stage >= STAGES.length ? 'Semua tahap selesai' : `Tahap ${stage + 1} dari ${STAGES.length}`} · {t.id}
            </span>
          </div>
          <div className="flex gap-3">
            <FoodPhoto src={t.photo} alt="" className="h-16 w-16 shrink-0 rounded-control" iconSize={26} />
            <div className="min-w-0">
              <h1 className="text-card-title">{t.foodName}</h1>
              <p className="text-meta text-ink-secondary">{t.agreed} {t.unit} disepakati</p>
            </div>
          </div>
          <PartiesRow donor={t.donorName} recipient={t.recipientName} />
        </section>

        {t.pendingSchedule && (
          <section aria-live="polite" className="animate-rise-in rounded-card border border-warning/40 bg-warning-container p-4">
            <p className="flex items-center gap-2 font-semibold"><CalendarBlank size={20} aria-hidden="true" className="text-warning" />Usulan jadwal baru dari {t.donorName}</p>
            <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-control bg-surface p-3">
              <div className="min-w-0">
                <p className="text-caption text-ink-secondary">Berlaku sekarang</p>
                <p className="text-meta">{t.date}, {t.timeStart}–{t.timeEnd}</p>
              </div>
              <ArrowRight size={18} aria-label="menjadi" className="text-ink-secondary" />
              <div className="min-w-0">
                <p className="text-caption font-semibold text-primary">Usulan</p>
                <p className="text-meta font-semibold">{t.pendingSchedule.date}, {t.pendingSchedule.timeStart}–{t.pendingSchedule.timeEnd}</p>
              </div>
            </div>
            {t.pendingSchedule.reason && <p className="mt-2 text-meta">Alasan: “{t.pendingSchedule.reason}”</p>}
            {donor ? (
              <p className="mt-3 text-meta text-ink-secondary">Menunggu persetujuan {t.recipientName}. Jadwal lama tetap berlaku.</p>
            ) : (
              <div className="mt-3 flex gap-2">
                <Button className="flex-1" loading={busy === 'accept'} disabled={!!busy} onClick={() => respond(true)}>Setujui</Button>
                <Button variant="secondary" className="flex-1" loading={busy === 'reject'} disabled={!!busy} onClick={() => respond(false)}>Tetap jadwal lama</Button>
              </div>
            )}
          </section>
        )}

        {next ? (
          <Notice tone="info" title="Langkah berikutnya">{next.label}.</Notice>
        ) : t.status === 'Terjadwal' || t.status === 'Diserahkan' ? (
          <Notice tone="info">Menunggu {donor ? 'penerima mengonfirmasi penerimaan' : 'pemberi mencatat penyerahan'}.</Notice>
        ) : null}

        <section aria-labelledby="jadwal" className="card p-4">
          <h2 id="jadwal" className="sr-only">Jadwal dan lokasi</h2>
          <ul className="stagger flex flex-col gap-3">
            <li className="flex gap-3">
              <CalendarBlank size={22} aria-hidden="true" className="mt-0.5 shrink-0 text-primary" />
              <div>
                <p className="text-meta text-ink-secondary">Jadwal penyerahan</p>
                <p className="font-semibold">{t.date}, {t.timeStart}–{t.timeEnd} WIB</p>
              </div>
            </li>
            <li className="flex gap-3">
              <MapPin size={22} aria-hidden="true" className="mt-0.5 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="text-meta text-ink-secondary">Lokasi pengambilan</p>
                <p className="font-semibold">{t.donorName}, Coblong, Kota Bandung</p>
                <div className="mt-2 rounded-control border border-line bg-page p-3">
                  <p className="flex items-center gap-1.5 text-caption font-semibold text-ink-secondary">
                    <LockSimple size={16} aria-hidden="true" /> Alamat lengkap, hanya untuk pihak yang terlibat
                  </p>
                  <p className="mt-1">Jl. Contoh No. 12, Coblong</p>
                  <p className="text-caption text-ink-secondary">Alamat demo</p>
                </div>
              </div>
            </li>
            <li className="flex gap-3">
              <Truck size={22} aria-hidden="true" className="mt-0.5 shrink-0 text-primary" />
              <div>
                <p className="text-meta text-ink-secondary">Cara pengambilan</p>
                <p className="font-semibold">{t.method}</p>
                <p className="text-meta text-ink-secondary">
                  {t.method === 'Ambil sendiri' ? 'Tanpa biaya pengiriman dari platform' : 'Biaya pengiriman belum tersedia'}
                </p>
              </div>
            </li>
          </ul>
        </section>

        <section className="card p-4">
          <h2 className="mb-3 text-card-title">Tahapan penyaluran</h2>
          <StageList
            label="Tahapan penyaluran"
            current={stage}
            stages={STAGES.map((title, i) => ({ title, detail: details[i] }))}
          />
        </section>

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

        <nav aria-label="Bantuan penyaluran" className="card divide-y divide-line overflow-hidden">
          <MenuRow
            to={`/aktivitas/${t.id}/koordinasi`}
            icon={<ChatCircleText size={20} />}
            title="Koordinasi"
            subtitle={`Hubungi ${donor ? t.recipientName : t.donorName}`}
          />
          <MenuRow to={`/aktivitas/${t.id}/status`} icon={<Truck size={20} />} title="Status penyaluran" subtitle="Linimasa serah terima" />
          {t.status === 'Terjadwal' && <MenuRow to={`/aktivitas/${t.id}/metode`} icon={<Package size={20} />} title="Metode dan biaya" subtitle={`${t.method} · pangan Rp0`} />}
          {donor && t.status === 'Terjadwal' && <MenuRow to={`/aktivitas/${t.id}/persiapan`} icon={<Tray size={20} />} title="Persiapan pangan" subtitle={`${t.prep?.length ?? 0}/4 daftar periksa`} />}
          {issues.map((i) => (
            <MenuRow key={i.id} to={`/masalah/${i.id}`} icon={<Flag size={20} />} title={`Laporan ${i.id}`} subtitle={`${i.status} · ${i.category}`} />
          ))}
          <MenuRow to={`/aktivitas/${t.id}/masalah`} icon={<Flag size={20} />} title="Laporkan masalah" subtitle="Tidak datang, terlambat, atau jumlah berbeda" />
        </nav>
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

/** Ringkasan kegiatan yang dipakai di L05/L06/L10. */
function ActivitySummary({ t, children }: { t: Transfer; children?: React.ReactNode }) {
  return (
    <section className="card flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2">
        <span className="text-caption font-semibold uppercase tracking-wide text-ink-secondary">Kegiatan</span>
        <span className="rounded-full bg-primary-container px-2.5 py-0.5 text-caption font-semibold text-primary">{t.id}</span>
      </div>
      <div>
        <p className="text-caption text-ink-secondary">Pangan</p>
        <p className="font-semibold">{t.foodName}</p>
      </div>
      <PartiesRow donor={t.donorName} recipient={t.recipientName} />
      {children}
    </section>
  )
}

/* ---------- L05 Penyerahan (pemberi) ---------- */

export function Handover() {
  const { id } = useParams()
  const { state } = useApp()
  const run = useCommand()
  const navigate = useNavigate()
  const t = state.transfers.find((x) => x.id === id)
  const [qty, setQty] = useState(t?.agreed ?? 0)
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const qid = useId()
  if (!t) return <NotAvailable />
  const submit = () => {
    if (qty <= 0) return setError('Isi jumlah yang benar-benar diserahkan.')
    if (qty > t.agreed) return setError(`Melebihi jumlah disepakati (${t.agreed} ${t.unit}).`)
    setBusy(true)
    run({ type: 'handover', id: t.id, quantity: qty, note: note.trim() || undefined })
      .then(() => navigate(`/aktivitas/${t.id}`, { replace: true }))
      .catch((err) => {
        setError(messageOf(err))
        setBusy(false)
      })
  }
  return (
    <>
      <AppBar title="Catat penyerahan" actions={<span className="mr-3 rounded-full bg-primary-container px-2.5 py-1 text-caption font-semibold text-primary">Tahap 3 dari 5</span>} />
      <main className="mx-auto flex max-w-[560px] flex-col gap-4 px-4 pb-32 pt-4">
        <div>
          <h1 className="text-page-title">Catat penyerahan pangan</h1>
          <p className="mt-1 text-body text-ink-secondary">Isi jumlah porsi yang benar-benar diserahkan kepada penerima.</p>
        </div>
        <ActivitySummary t={t}>
          <div className="flex items-center justify-between border-t border-line pt-3">
            <span className="text-ink-secondary">Jumlah disepakati</span>
            <span className="font-bold">{t.agreed} {t.unit}</span>
          </div>
        </ActivitySummary>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={qid} className="text-label">Jumlah diserahkan ({t.unit})</label>
          <QtyStepper id={qid} value={qty} onChange={(n) => { setQty(n); setError('') }} min={0} max={t.agreed} unit={t.unit} describedBy={`${qid}-h`} />
          <p id={`${qid}-h`} className={`text-meta ${error ? 'font-medium text-danger' : 'text-ink-secondary'}`}>
            {error || 'Kurangi angka ini jika ada porsi yang batal diserahkan.'}
          </p>
        </div>

        <Field label="Catatan kondisi" optional>
          {(p) => (
            <textarea {...p} rows={3} className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Contoh: dikemas dalam 1 kardus tertutup, sambal terpisah." />
          )}
        </Field>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1.5 text-label">Cara pencatatan</legend>
          <RadioCard name="bukti" checked onChange={() => {}} title="Diperiksa bersama di lokasi" description="Kedua pihak melihat jumlah dan kondisi pangan saat serah terima." />
          <p className="text-caption text-ink-secondary">Kode atau tanda tangan digital belum tersedia.</p>
        </fieldset>

        <Notice tone="info">Penyerahan belum berarti diterima. {t.recipientName} akan mengonfirmasi jumlah yang diterima, dan selisih tidak dikenai sanksi.</Notice>
      </main>
      <StickyFooter>
        <Button block loading={busy} onClick={submit}>Konfirmasi penyerahan ({qty} {t.unit})</Button>
      </StickyFooter>
    </>
  )
}

/* ---------- L06 Konfirmasi penerimaan (penerima) ---------- */

const RECEIVE_REASONS = [
  ['Kemasan rusak atau tumpah', 'Kondisi kemasan tidak memungkinkan pangan disalurkan.'],
  ['Kualitas menurun', 'Aroma, rasa, atau tampilan tidak layak dikonsumsi.'],
  ['Jumlah fisik kurang', 'Porsi yang datang lebih sedikit dari yang dicatat.'],
  ['Alasan lain', 'Jelaskan di catatan.'],
] as const

export function Receive() {
  const { id } = useParams()
  const { state } = useApp()
  const run = useCommand()
  const navigate = useNavigate()
  const t = state.transfers.find((x) => x.id === id)
  const base = t ? t.handedOver ?? t.agreed : 0
  const [qty, setQty] = useState(base)
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const qid = useId()
  if (!t) return <NotAvailable />
  const notReceived = base - qty

  const submit = () => {
    if (notReceived > 0 && !reason) return setError('Pilih alasan agar pemberi memahami selisihnya.')
    if (reason === 'Alasan lain' && !note.trim()) return setError('Tulis catatan singkat untuk alasan lain.')
    setBusy(true)
    run({ type: 'receive', id: t.id, received: qty, reason: notReceived > 0 ? reason.toLowerCase() : undefined, note: note.trim() || undefined })
      .then(() => navigate(`/aktivitas/${t.id}`, { replace: true }))
      .catch((err) => {
        setError(messageOf(err))
        setBusy(false)
      })
  }

  return (
    <>
      <AppBar title="Konfirmasi penerimaan" actions={<span className="mr-3 rounded-full bg-primary-container px-2.5 py-1 text-caption font-semibold text-primary">Tahap 4 dari 5</span>} />
      <main className="mx-auto flex max-w-[560px] flex-col gap-4 px-4 pb-40 pt-4">
        <div>
          <h1 className="text-page-title">Periksa pangan yang diterima</h1>
          <p className="mt-1 text-body text-ink-secondary">Cocokkan jumlah dan kondisi pangan dari {t.donorName}. Laporkan apa adanya.</p>
        </div>
        <ActivitySummary t={t}>
          <dl className="grid grid-cols-2 gap-2 border-t border-line pt-3">
            <div>
              <dt className="text-caption text-ink-secondary">Disepakati</dt>
              <dd className="text-[1.125rem] font-bold">{t.agreed} <span className="text-meta font-normal text-ink-secondary">{t.unit}</span></dd>
            </div>
            <div>
              <dt className="text-caption text-ink-secondary">Diserahkan</dt>
              <dd className={`text-[1.125rem] font-bold ${t.handedOver !== undefined ? 'text-primary' : 'text-ink-secondary'}`}>
                {t.handedOver !== undefined ? <>{t.handedOver} <span className="text-meta font-normal text-ink-secondary">{t.unit}</span></> : 'Belum dicatat'}
              </dd>
            </div>
          </dl>
        </ActivitySummary>

        <section aria-labelledby="periksa" className="card flex flex-col gap-4 p-4">
          <h2 id="periksa" className="text-card-title">Hasil pemeriksaan</h2>
          <div className="flex flex-col gap-1.5">
            <label htmlFor={qid} className="text-label">Jumlah diterima dan layak disalurkan ({t.unit})</label>
            <QtyStepper id={qid} value={qty} onChange={(n) => { setQty(n); setError('') }} min={0} max={base} unit={t.unit} />
          </div>
          <dl className="grid grid-cols-2 gap-2" aria-live="polite">
            <div className="rounded-control bg-primary-container p-3">
              <dt className="text-caption text-ink-secondary">Diterima</dt>
              <dd className="font-bold text-primary">{qty} {t.unit}</dd>
            </div>
            <div className={`rounded-control p-3 ${notReceived > 0 ? 'bg-warning-container' : 'bg-page'}`}>
              <dt className="text-caption text-ink-secondary">Tidak diterima</dt>
              <dd className={`font-bold ${notReceived > 0 ? 'text-warning' : ''}`}>{notReceived} {t.unit}</dd>
            </div>
          </dl>
          <p className="text-caption text-ink-secondary">Total diperiksa: {qty} + {notReceived} = {base} {t.unit}.</p>

          {notReceived > 0 && (
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1.5 text-label">Alasan selisih</legend>
              {RECEIVE_REASONS.map(([title, desc]) => (
                <RadioCard key={title} name="alasan" checked={reason === title} onChange={() => { setReason(title); setError('') }} title={title} description={desc} />
              ))}
            </fieldset>
          )}
          <Field label="Catatan kondisi pangan" optional={reason !== 'Alasan lain'}>
            {(p) => <textarea {...p} rows={3} className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Contoh: 2 kotak kuahnya tumpah, sisanya dalam kondisi baik." />}
          </Field>
          {error && <Notice tone="danger">{error}</Notice>}
        </section>

        <PolicyNote title="Pelaporan tanpa sanksi">
          Selisih atau pangan rusak dicatat sebagai data evaluasi. Tidak ada pemotongan poin, denda, atau sanksi bagi penerima maupun pemberi. Foto wajah tidak diperlukan.
        </PolicyNote>
        {qty > 0 && (
          <p className="rounded-control border border-dashed border-line p-3 text-meta text-ink-secondary">
            Setelah konfirmasi, {qty} {t.unit} masuk ke Catat Pangan Anda, lalu Anda dapat mengisi laporan penggunaan.
          </p>
        )}
      </main>
      <StickyFooter>
        <Button block loading={busy} variant={qty === 0 ? 'danger' : 'primary'} onClick={submit}>
          {qty === 0 ? 'Tolak seluruhnya' : `Konfirmasi penerimaan (${qty} ${t.unit})`}
        </Button>
      </StickyFooter>
    </>
  )
}

/* ---------- C06 Laporan penggunaan/distribusi ---------- */

export function Distribution() {
  const { id } = useParams()
  const { state } = useApp()
  const run = useCommand()
  const navigate = useNavigate()
  const t = state.transfers.find((x) => x.id === id)
  const [v, setV] = useState({ distributed: '', used: '', wasted: '' })
  const [busy, setBusy] = useState(false)
  if (!t || t.received === undefined) return <NotAvailable />
  const n = (s: string) => Number(s || 0)
  const total = n(v.distributed) + n(v.used) + n(v.wasted)
  const left = t.received - total
  const invalid = left < 0
  const rows = [
    { k: 'distributed', label: 'Didistribusikan', hint: 'Dibagikan ke warga atau penerima manfaat' },
    { k: 'used', label: 'Digunakan sendiri', hint: 'Dimasak atau dikonsumsi di posko' },
    { k: 'wasted', label: 'Terbuang', hint: 'Dicatat tanpa sanksi' },
  ] as const

  return (
    <>
      <AppBar title="Laporan penggunaan" />
      <main className="mx-auto flex max-w-[560px] flex-col gap-4 px-4 pb-32 pt-4">
        <section className="card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Badge tone="success">Terkonfirmasi {t.id}</Badge>
            <span className="text-caption text-ink-secondary">{t.date}</span>
          </div>
          <h1 className="mt-2 text-card-title">{t.foodName}</h1>
          <p className="text-meta text-ink-secondary">Dari {t.donorName}</p>
          <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
            <span className="text-ink-secondary">Diterima</span>
            <span className="text-[1.25rem] font-bold text-primary">{t.received} {t.unit}</span>
          </div>
        </section>

        <section aria-labelledby="rincian" className="card flex flex-col gap-4 p-4">
          <h2 id="rincian" className="text-card-title">Rincian penggunaan</h2>
          {rows.map((r, i) => (
            <Field key={r.k} label={`${i + 1}. ${r.label}`} hint={r.hint}>
              {(p) => (
                <div className="flex items-stretch gap-2">
                  <input {...p} inputMode="numeric" className={inputCls} value={v[r.k]} onChange={(e) => setV({ ...v, [r.k]: e.target.value.replace(/\D/g, '') })} placeholder="0" />
                  <span className="flex min-w-[4.5rem] items-center justify-center rounded-control bg-page px-3 text-meta text-ink-secondary">{t.unit}</span>
                </div>
              )}
            </Field>
          ))}
        </section>

        <section aria-live="polite" className={`rounded-card border p-4 ${invalid ? 'border-danger/40 bg-danger-container' : 'border-primary/30 bg-primary-container'}`}>
          <p className={`text-caption font-semibold uppercase tracking-wide ${invalid ? 'text-danger' : 'text-primary'}`}>Sisa dihitung otomatis</p>
          {invalid ? (
            <p className="mt-1 text-card-title text-danger">Total melebihi {t.received} {t.unit} yang diterima</p>
          ) : (
            <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
              <p className="text-display text-primary">{left} {t.unit}</p>
              <Badge tone="success" icon={false}>Masih tersedia</Badge>
            </div>
          )}
          <p className="mt-2 border-t border-primary/20 pt-2 text-caption text-ink-secondary">
            Sisa tidak dianggap habis. Jumlah ini tetap tercatat di Catat Pangan Anda.
          </p>
        </section>
      </main>
      <StickyFooter>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => navigate(-1)}>Batal</Button>
          <Button
            block
            loading={busy}
            disabled={invalid || total === 0}
            onClick={() => {
              setBusy(true)
              run({ type: 'reportDistribution', id: t.id, distributed: n(v.distributed), used: n(v.used), wasted: n(v.wasted) })
                .then(() => navigate(`/aktivitas/${t.id}`, { replace: true }))
                .catch((err) => {
                  toast(messageOf(err), 'info')
                  setBusy(false)
                })
            }}
          >
            Simpan laporan
          </Button>
        </div>
      </StickyFooter>
    </>
  )
}

/* ---------- L09 Notifikasi ---------- */

type NotifFilter = 'Semua' | 'Kegiatan' | 'Reward' | 'Sistem'

const notifStyle = {
  Kegiatan: { icon: <Package size={22} />, cls: 'bg-primary-container text-primary', label: 'Kegiatan penyaluran' },
  Reward: { icon: <Gift size={22} />, cls: 'bg-accent-soft text-ink', label: 'Apresiasi' },
  Sistem: { icon: <Info size={22} />, cls: 'bg-info-container text-info', label: 'Info' },
} as const

export function Notifications() {
  const { state } = useApp()
  const run = useCommand()
  const navigate = useNavigate()
  const [filter, setFilter] = useState<NotifFilter>('Semua')
  const all = state.notifications.filter((n) => n.role === state.role)
  const list = filter === 'Semua' ? all : all.filter((n) => n.kind === filter)
  const unread = all.filter((n) => !n.read).length
  return (
    <>
      <AppBar
        title="Notifikasi"
        actions={
          unread > 0 ? (
            <button type="button" onClick={() => run({ type: 'readAllNotifications' }).catch((err) => toast(messageOf(err), 'info'))} className="tap mr-1 min-h-12 rounded-control px-3 text-[0.875rem] font-semibold text-primary hover:bg-primary-container">
              Tandai dibaca
            </button>
          ) : undefined
        }
      />
      <main className="flex flex-col gap-3 pb-10">
      <ChipRow className="flex gap-2 overflow-x-auto border-b border-line bg-surface px-4 py-2" role="group" aria-label="Saring notifikasi">
        {(['Semua', 'Kegiatan', 'Reward', 'Sistem'] as const).map((f) => (
          <Chip key={f} selected={filter === f} onClick={() => setFilter(f)}>
            {f === 'Semua' ? `Semua (${all.length})` : f === 'Reward' ? 'Apresiasi' : f === 'Sistem' ? 'Info' : 'Kegiatan'}
          </Chip>
        ))}
      </ChipRow>
      <div className="stagger flex flex-col gap-3 px-4 pt-1">
        {list.length === 0 && <StatePanel icon={<Bell size={40} className="text-ink-secondary" />} title="Belum ada notifikasi" />}
        <ul className="stagger flex flex-col gap-3">
          {list.map((n) => {
            const st = notifStyle[n.kind]
            return (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => {
                    if (!n.read) run({ type: 'readNotification', id: n.id }).catch(() => {}) // gagal tandai dibaca tidak menghalangi navigasi
                    navigate(n.to)
                  }}
                  className={`tap card flex w-full gap-3 p-4 text-left hover:bg-page ${n.read ? '' : 'border-primary/40 ring-1 ring-primary/20'}`}
                >
                  <span aria-hidden="true" className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-control ${st.cls}`}>{st.icon}</span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-caption font-semibold uppercase tracking-wide text-ink-secondary">{st.label}</span>
                      {!n.read && <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />}
                    </span>
                    <span className={`mt-0.5 block ${n.read ? 'font-medium' : 'font-semibold'}`}>
                      {n.title}
                      {!n.read && <span className="sr-only"> (belum dibaca)</span>}
                    </span>
                    <span className="block text-meta text-ink-secondary">{n.body}</span>
                    <span className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-caption text-ink-secondary">{n.at}</span>
                      {n.cta && (
                        <span className="inline-flex items-center gap-1 text-[0.875rem] font-semibold text-primary">
                          {n.cta} <CaretRight size={14} weight="bold" aria-hidden="true" />
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
        <p className="pt-4 text-center text-caption text-ink-secondary">Notifikasi tidak menampilkan alamat atau kontak pribadi.</p>
      </div>
      </main>
    </>
  )
}

/* ---------- L08 / L10 ---------- */

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

const ISSUE_CATEGORIES = [
  ['Kondisi pangan tidak sesuai', 'Kemasan rusak, kuah tumpah, atau tidak layak konsumsi.'],
  ['Jumlah berbeda', 'Jumlah fisik berbeda dari yang disepakati.'],
  ['Tidak datang atau terlambat', 'Salah satu pihak tidak hadir sesuai jadwal.'],
  ['Kendala pengiriman', 'Kendaraan, rute, atau mitra pengiriman bermasalah.'],
  ['Lainnya', 'Lokasi sulit ditemukan, kontak tidak aktif, atau hal lain.'],
] as const

export function ReportIssue() {
  const { id } = useParams()
  const { state, dispatch } = useApp()
  const { refresh } = useLiveData()
  const [clientId] = useState(() => crypto.randomUUID())
  const navigate = useNavigate()
  const t = state.transfers.find((x) => x.id === id)
  const [cat, setCat] = useState('')
  const [desc, setDesc] = useState('')
  const [busy, setBusy] = useState(false)
  const send = async () => {
    setBusy(true)
    if (isLive) {
      try {
        const code = await reportIssue(clientId, id ?? '', cat, desc.trim())
        await refresh()
        toast('Laporan terkirim. Tim meninjau dalam 60 menit.')
        navigate(`/masalah/${code}`, { replace: true })
      } catch (err) {
        toast(messageOf(err), 'info')
        setBusy(false)
      }
      return
    }
    const issueId = `ISS-${state.seq + 1}`
    window.setTimeout(() => {
      dispatch({ type: 'reportIssue', transferId: id ?? '', category: cat, description: desc.trim() })
      toast('Laporan terkirim. Tim meninjau dalam 60 menit.')
      navigate(`/masalah/${issueId}`, { replace: true })
    }, 700)
  }
  return (
    <>
      <AppBar title="Laporkan masalah" />
      <main className="mx-auto flex max-w-[560px] flex-col gap-4 px-4 pb-40 pt-4">
            <section className="card p-4">
              <p className="text-caption font-semibold uppercase tracking-wide text-ink-secondary">Kegiatan terkait</p>
              <p className="mt-1 font-semibold">{t ? `${t.foodName} (${t.agreed} ${t.unit})` : id}</p>
              {t && <p className="text-meta text-ink-secondary">{t.id} · {state.role === 'pemberi' ? `Penerima: ${t.recipientName}` : `Pemberi: ${t.donorName}`}</p>}
            </section>
            <fieldset className="card flex flex-col gap-2 p-4">
              <legend className="sr-only">Kategori masalah</legend>
              <p aria-hidden="true" className="mb-1 text-card-title">Kategori masalah</p>
              {ISSUE_CATEGORIES.map(([title, d]) => (
                <RadioCard key={title} name="cat" checked={cat === title} onChange={() => setCat(title)} title={title} description={d} />
              ))}
            </fieldset>
            <section className="card flex flex-col gap-4 p-4">
              <Field label="Ceritakan yang terjadi" hint="Tulis fakta di lapangan: jumlah, waktu, dan kondisi.">
                {(p) => <textarea {...p} rows={4} className={inputCls} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Contoh: 2 kotak kemasan rusak saat diambil, 10 porsi lain dalam kondisi baik." />}
              </Field>
              <div className="flex flex-col gap-1.5">
                <p className="text-label">Foto kondisi <span className="font-normal text-ink-secondary">(opsional)</span></p>
                <PhotoUploadPlaceholder label="Unggah foto belum tersedia" hint="Nanti cukup foto kemasan atau pangan. Foto wajah tidak diperlukan." />
              </div>
            </section>
            <PolicyNote title="Pelaporan tanpa hukuman">
              Laporan kendala dipakai untuk memperbaiki koordinasi, bukan untuk menghukum siapa pun.
            </PolicyNote>
      </main>
      <StickyFooter>
        <div className="flex flex-col gap-2">
          <Button block disabled={!cat || desc.trim().length < 10} loading={busy} onClick={send}>Kirim laporan</Button>
          {(!cat || desc.trim().length < 10) && <p className="text-center text-caption text-ink-secondary">Pilih kategori dan tulis minimal 10 karakter.</p>}
        </div>
      </StickyFooter>
    </>
  )
}

/* ---------- L11 Detail dan tindak lanjut masalah ---------- */

export function IssueDetail() {
  const { id } = useParams()
  const { state } = useApp()
  const run = useCommand()
  const issue = state.issues.find((i) => i.id === id)
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  if (!issue) return <NotAvailable />
  const t = state.transfers.find((x) => x.id === issue.transferId)
  const step = { Dikirim: 0, 'Sedang ditinjau': 1, Selesai: 3, 'Keberatan diajukan': 1 }[issue.status]
  return (
    <>
      <AppBar title="Tindak lanjut masalah" />
      <main className="stagger mx-auto flex max-w-[560px] flex-col gap-4 px-4 pb-10 pt-4">
        <section className="card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Badge tone={issue.status === 'Selesai' ? 'success' : issue.status === 'Dikirim' ? 'info' : 'warning'}>{issue.status}</Badge>
            <span className="text-caption text-ink-secondary">{issue.id} · {issue.at}</span>
          </div>
          <h1 className="mt-2 text-card-title">{issue.category}</h1>
          <p className="mt-1 text-body text-ink-secondary">{issue.description}</p>
          {t && (
            <Link to={`/aktivitas/${t.id}`} className="tap mt-3 flex items-center gap-3 rounded-control bg-page p-3 hover:bg-primary-container">
              <FoodPhoto src={t.photo} alt="" className="h-10 w-10 shrink-0 rounded-control" iconSize={18} />
              <span className="min-w-0 flex-1 text-meta"><span className="block font-semibold">{t.foodName}</span>{t.id} · {t.agreed} {t.unit} disepakati{t.received !== undefined && `, ${t.received} diterima`}</span>
              <CaretRight size={18} aria-hidden="true" className="text-ink-secondary" />
            </Link>
          )}
        </section>
        <section className="card p-4">
          <h2 className="mb-3 text-card-title">Tahap penanganan</h2>
          <StageList
            label="Tahap penanganan"
            current={step}
            stages={[
              { title: 'Laporan diterima', detail: issue.at },
              { title: 'Ditinjau tim operasional', detail: 'Target respons 60 menit untuk pangan siap santap' },
              { title: 'Resolusi', detail: issue.resolution ? 'Hasil tersedia di bawah' : 'Belum ada' },
            ]}
          />
        </section>
        <section className="card p-4">
          <h2 className="mb-3 text-card-title">Kronologi</h2>
          <ol className="relative flex flex-col gap-4 border-l-2 border-line pl-5">
            {issue.timeline.map((e, i) => (
              <li key={i} className="relative">
                <span aria-hidden="true" className={`absolute -left-[27px] top-1 h-3 w-3 rounded-full ring-4 ring-surface ${i === issue.timeline.length - 1 ? 'bg-primary' : 'bg-line-control'}`} />
                <p className="font-semibold">{e.label}</p>
                <p className="text-meta text-ink-secondary">{e.at} · {e.by}</p>
                {e.note && <p className="text-meta">{e.note}</p>}
              </li>
            ))}
          </ol>
        </section>
        {issue.resolution && <PolicyNote title="Resolusi operasional">{issue.resolution}</PolicyNote>}
        {issue.status === 'Selesai' && (
          <section className="card flex flex-col gap-3 p-4">
            <p className="font-semibold">Punya sanggahan atas kronologi?</p>
            <p className="text-meta text-ink-secondary">Keberatan ditinjau ulang oleh staf yang berbeda.</p>
            <Button variant="secondary" onClick={() => setOpen(true)}>Ajukan keberatan</Button>
          </section>
        )}
        <div className="flex flex-col gap-2">
          <ButtonLink to="/aktivitas" variant="ghost" block>Kembali ke Aktivitas</ButtonLink>
          <ButtonLink to="/dampak" variant="ghost" block>Lihat dampak terkoreksi</ButtonLink>
        </div>
      </main>
      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title="Ajukan keberatan"
        footer={
          <Button
            block
            disabled={note.trim().length < 10}
            loading={busy}
            onClick={() => {
              setBusy(true)
              run({ type: 'objectIssue', id: issue.id, note: note.trim() })
                .then(() => {
                  setOpen(false)
                  setNote('')
                  toast('Keberatan dikirim untuk ditinjau ulang.')
                })
                .catch((err) => toast(messageOf(err), 'info'))
                .finally(() => setBusy(false))
            }}
          >
            Kirim keberatan
          </Button>
        }
      >
        <Field label="Bagian mana yang tidak sesuai?" hint="Minimal 10 karakter. Sertakan jumlah atau waktu yang benar.">
          {(p) => <textarea {...p} rows={4} className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} />}
        </Field>
      </BottomSheet>
    </>
  )
}
