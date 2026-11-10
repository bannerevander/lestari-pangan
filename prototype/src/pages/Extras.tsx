import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { BookmarkSimple, CaretRight, Check, CheckCircle, Crosshair, Lightbulb, MagnifyingGlass, MapPin, Trash } from '@phosphor-icons/react'
import { AppBar, Badge, Button, ButtonLink, Field, inputCls, Notice, PhotoUploadPlaceholder, PolicyNote, RadioCard, StatePanel, StickyFooter, SuccessMark, toast } from '../components/ui'
import { useApp } from '../state/AppState'
import { useProfile } from '../state/useProfile'
import { packStyle } from './Support'
import { useSave } from './Settings'
import { useCommand } from '../state/useCommand'
import { messageOf } from '../lib/supabase/errors'
import { isLive } from '../lib/supabase/client'
import { NotAvailable } from '../components/NotAvailable'

/* ---------- H04 Pilih area ---------- */

const AREAS = [
  ['Coblong, Bandung', 'Area penyaluran utama'],
  ['Sukasari, Bandung', '±3,2 km dari Coblong'],
  ['Cidadap, Bandung', '±4,1 km dari Coblong'],
  ['Lengkong, Bandung', '±5,0 km dari Coblong'],
  ['Sumur Bandung, Bandung', '±5,4 km dari Coblong'],
]

export function AreaPicker() {
  const profile = useProfile()
  const [q, setQ] = useState('')
  const [pick, setPick] = useState(profile.area)
  const { busy, save } = useSave(`Area diubah ke ${pick}.`)
  const [locating, setLocating] = useState(false)
  const list = AREAS.filter(([a]) => a.toLowerCase().includes(q.toLowerCase()))
  return (
    <>
      <AppBar title="Pilih area" />
      <main className="stagger mx-auto flex max-w-[560px] flex-col gap-4 px-4 pb-36 pt-4">
        <label className="relative block">
          <span className="sr-only">Cari kecamatan atau kota</span>
          <MagnifyingGlass size={20} aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-secondary" />
          <input type="search" className={`${inputCls} pl-11`} placeholder="Cari kecamatan atau kota" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <Button
          variant="secondary"
          block
          loading={locating}
          loadingLabel="Mencari area terdekat…"
          icon={<Crosshair size={20} />}
          onClick={() => {
            // Prototipe tidak meminta izin GPS; lokasi demo selalu Coblong.
            setLocating(true)
            window.setTimeout(() => (setLocating(false), setPick(AREAS[0][0]), toast('Area terdekat: Coblong, Bandung.', 'info')), 700)
          }}
        >
          Gunakan lokasi saat ini
        </Button>
        <p className="-mt-2 text-caption text-ink-secondary">Izin lokasi hanya dipakai saat tombol ditekan.</p>
        <fieldset>
          <legend className="mb-2 text-caption font-semibold uppercase tracking-wide text-ink-secondary">{list.length} kecamatan</legend>
          <div className="card divide-y divide-line overflow-hidden">
            {list.map(([a, d]) => {
              const on = pick === a
              return (
                <label key={a} className={`tap flex min-h-16 cursor-pointer items-center gap-3 px-4 py-3 ${on ? 'bg-primary-container' : 'hover:bg-page'}`}>
                  <input type="radio" name="area" className="sr-only" checked={on} onChange={() => setPick(a)} />
                  <MapPin size={22} weight={on ? 'fill' : 'regular'} aria-hidden="true" className={on ? 'text-primary' : 'text-ink-secondary'} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{a}</span>
                    <span className="block text-meta text-ink-secondary">{d}</span>
                  </span>
                  {on && <Check size={20} weight="bold" aria-hidden="true" className="animate-pop text-primary" />}
                </label>
              )
            })}
            {list.length === 0 && <p className="p-4 text-meta text-ink-secondary">Belum ada layanan di area itu.</p>}
          </div>
        </fieldset>
        <p className="text-meta text-ink-secondary">Donasi bersifat lokal agar pangan tetap segar dan mudah dijemput.</p>
      </main>
      <StickyFooter>
        <Button
          block
          disabled={pick === profile.area}
          loading={busy}
          onClick={() => save({ area: pick })}
        >
          {pick === profile.area ? 'Area saat ini' : `Gunakan ${pick.split(',')[0]}`}
        </Button>
      </StickyFooter>
    </>
  )
}

/* ---------- T03 Tips tersimpan ---------- */

export function SavedTips() {
  const { state } = useApp()
  const run = useCommand()
  const list = state.tips.filter((t) => state.savedTips.includes(t.id))
  return (
    <>
      <AppBar title="Tips tersimpan" />
      <main className="stagger mx-auto flex max-w-[560px] flex-col gap-3 px-4 pb-10 pt-4">
        {list.length === 0 ? (
          <StatePanel icon={<BookmarkSimple size={40} className="text-ink-secondary" />} title="Belum ada tips tersimpan" action={<ButtonLink to="/tips">Jelajahi tips</ButtonLink>}>
            Tekan Simpan di halaman artikel.
          </StatePanel>
        ) : (
          list.map((t) => (
            <div key={t.id} className="card flex items-center gap-3 p-3">
              <Link to={`/tips/${t.id}`} className="tap flex min-w-0 flex-1 items-center gap-3 rounded-control">
                {t.photo ? <img src={t.photo} alt="" className="h-16 w-16 shrink-0 rounded-control object-cover" /> : <span aria-hidden="true" className="flex h-16 w-16 shrink-0 items-center justify-center rounded-control bg-primary-container text-primary"><Lightbulb size={28} /></span>}
                <span className="min-w-0">
                  <span className="text-caption font-semibold text-primary">{t.category}</span>
                  <span className="block font-semibold">{t.title}</span>
                  <span className="block text-caption text-ink-secondary">Versi aktif v1.0</span>
                </span>
              </Link>
              <button
                type="button"
                aria-label={`Hapus ${t.title} dari tersimpan`}
                onClick={() => run({ type: 'toggleTip', id: t.id }).then(() => toast('Dihapus dari tips tersimpan.', 'info')).catch((err) => toast(messageOf(err), 'info'))}
                className="tap flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-primary hover:bg-primary-container"
              >
                <BookmarkSimple size={22} weight="fill" aria-hidden="true" />
              </button>
            </div>
          ))
        )}
      </main>
    </>
  )
}

/* ---------- A10 Permintaan bantuan ---------- */

const TOPICS = ['Jadwal dan serah terima', 'Penyesuaian jumlah atau permintaan', 'Status verifikasi akun', 'Fitur Catat Pangan', 'Lainnya atau masukan']

export function HelpRequest() {
  const { state } = useApp()
  const navigate = useNavigate()
  const [topic, setTopic] = useState('')
  const [related, setRelated] = useState('')
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState<string | null>(null)
  const activities = state.transfers.slice(0, 4)
  if (sent)
    return (
      <>
        <AppBar title="Permintaan bantuan" />
        <main className="flex flex-col items-center gap-3 px-6 pt-12 text-center">
          <SuccessMark />
          <h1 className="text-page-title">Pesan terkirim</h1>
          <p className="max-w-[34ch] text-body text-ink-secondary">Nomor tiket <span className="font-semibold text-ink">{sent}</span>. Tim membalas lewat notifikasi dalam 1 hari kerja.</p>
          <div className="mt-4 flex w-full max-w-[320px] flex-col gap-2">
            <Button block onClick={() => navigate('/bantuan', { replace: true })}>Kembali ke Pusat bantuan</Button>
          </div>
        </main>
      </>
    )
  return (
    <>
      <AppBar title="Permintaan bantuan" dirty={!!msg.trim() && !busy} />
      <main className="stagger mx-auto flex max-w-[560px] flex-col gap-4 px-4 pb-36 pt-4">
        <p className="text-body text-ink-secondary">Sampaikan kendala teknis atau pertanyaan koordinasi. Tim pendamping memproses pesan secara berurutan.</p>
        <fieldset className="flex flex-col gap-2">
          <legend className="float-left mb-2 text-label">Topik</legend>
          {TOPICS.map((t) => <RadioCard key={t} name="topic" checked={topic === t} onChange={() => (setTopic(t), setErr({ ...err, topic: '' }))} title={t} />)}
          {err.topic && <p className="text-meta font-medium text-danger">{err.topic}</p>}
        </fieldset>
        <Field label="Kegiatan terkait" optional hint="Mempercepat pengecekan tim.">
          {(p) => (
            <select {...p} className={inputCls} value={related} onChange={(e) => setRelated(e.target.value)}>
              <option value="">Tidak terkait kegiatan tertentu</option>
              {activities.map((t) => <option key={t.id} value={t.id}>{t.id} · {t.foodName}</option>)}
            </select>
          )}
        </Field>
        <Field label="Pesan" hint="Jangan cantumkan kata sandi atau data pribadi rahasia." error={err.msg}>
          {(p) => <textarea {...p} rows={5} className={inputCls} value={msg} onChange={(e) => (setMsg(e.target.value), setErr({ ...err, msg: '' }))} />}
        </Field>
        <PhotoUploadPlaceholder label="Lampiran belum tersedia" hint="Nanti bisa melampirkan foto atau dokumen pendukung." />
      </main>
      <StickyFooter>
        <Button
          block
          loading={busy}
          loadingLabel="Mengirim…"
          onClick={() => {
            const e = { topic: topic ? '' : 'Pilih topik bantuan.', msg: msg.trim().length >= 10 ? '' : 'Ceritakan kendala minimal 10 karakter.' }
            setErr(e)
            if (e.topic || e.msg) return
            setBusy(true)
            window.setTimeout(() => (setBusy(false), setSent(`BTN-${state.seq + 1}`)), 700)
          }}
        >
          Kirim pesan
        </Button>
      </StickyFooter>
    </>
  )
}

/* ---------- A12 Permintaan penghapusan ---------- */

export function DeletionRequest() {
  const navigate = useNavigate()
  const { state } = useApp()
  const [scope, setScope] = useState('')
  const [reason, setReason] = useState('')
  const [ack, setAck] = useState(false)
  const [busy, setBusy] = useState(false)
  const running = state.transfers.filter((t) => t.status === 'Terjadwal' || t.status === 'Diserahkan').length
  const fullClose = scope === 'Tutup akun dan hapus profil'
  return (
    <>
      <AppBar title="Penghapusan data" />
      <main className="stagger mx-auto flex max-w-[560px] flex-col gap-4 px-4 pb-40 pt-4">
        <section className="card p-4">
          <h2 className="text-card-title">Yang terjadi pada data Anda</h2>
          <ul className="mt-3 flex flex-col gap-3 text-meta">
            <li className="flex gap-2"><Trash size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-danger" /><span><span className="font-semibold">Dihapus:</span> profil publik, kontak pribadi, dan berkas identitas yang tidak terkait sengketa aktif.</span></li>
            <li className="flex gap-2"><CheckCircle size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-primary" /><span><span className="font-semibold">Diarsipkan:</span> nomor referensi serah terima untuk audit, tanpa identitas Anda.</span></li>
          </ul>
        </section>
        {running > 0 && fullClose && <Notice tone="warning" title={`${running} penyaluran masih berjalan`}>Selesaikan atau batalkan dulu sebelum akun ditutup.</Notice>}
        <fieldset className="flex flex-col gap-2">
          <legend className="float-left mb-2 text-label">Cakupan</legend>
          <RadioCard name="scope" checked={fullClose} onChange={() => setScope('Tutup akun dan hapus profil')} title="Tutup akun dan hapus profil" description="Akun tidak dapat diakses lagi setelah peninjauan selesai." />
          <RadioCard name="scope" checked={scope === 'Hapus riwayat dan draf saja'} onChange={() => setScope('Hapus riwayat dan draf saja')} title="Hapus riwayat pencarian dan draf saja" description="Profil dan peran aktif tetap tersimpan." />
        </fieldset>
        <Field label="Alasan" optional>
          {(p) => <textarea {...p} rows={3} className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)} />}
        </Field>
        <label className="tap flex min-h-12 cursor-pointer items-start gap-3 rounded-control p-1">
          <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-danger" checked={ack} onChange={(e) => setAck(e.target.checked)} />
          <span className="text-meta">Saya memahami permintaan ini ditinjau tim operasional dan tidak dapat dibatalkan setelah diproses.</span>
        </label>
        <PolicyNote title="Waktu proses">Tim menghubungi Anda dalam 3 hari kerja untuk konfirmasi.</PolicyNote>
      </main>
      <StickyFooter>
        <Button
          variant="danger"
          block
          disabled={!scope || !ack || (fullClose && running > 0)}
          loading={busy}
          loadingLabel="Mengirim…"
          onClick={() => {
            setBusy(true)
            window.setTimeout(() => {
              toast('Permintaan penghapusan dikirim untuk ditinjau.', 'info')
              navigate('/pengaturan/privasi', { replace: true })
            }, 700)
          }}
        >
          Kirim permintaan penghapusan
        </Button>
      </StickyFooter>
    </>
  )
}

/* ---------- E05 Detail reward & E06 Tinjauan klaim ---------- */

const PACK_ITEMS: Record<string, [string, string][]> = {
  'RW-BESEK': [
    ['10 wadah besek bambu', 'Food grade dan dapat terurai'],
    ['2 gulung kertas pembungkus', 'Tanpa pemutih klorin'],
    ['1 paket stiker waktu masak dan alergen', 'Label untuk penerima'],
    ['1 lembar panduan higienitas dasar', 'Kebersihan wadah pangan'],
  ],
  'RW-POKOK': [
    ['Beras lokal 5 kg', 'Untuk dapur komunitas'],
    ['Minyak nabati 2 liter', 'Untuk pengolahan'],
  ],
}

export function RewardDetail() {
  const { id } = useParams()
  const { state } = useApp()
  const i = state.rewardPacks.findIndex((x) => x.id === id)
  if (i < 0) return <NotAvailable />
  const r = { ...state.rewardPacks[i], ...packStyle(i) }
  const claimed = !!state.rewardClaim
  const canClaim = !isLive || !!state.claimRight
  return (
    <>
      <AppBar title="Detail paket" />
      <main className="stagger mx-auto flex max-w-[560px] flex-col gap-4 px-4 pb-36 pt-4">
        <section className="flex flex-col items-center gap-3 rounded-greet bg-accent-soft px-6 py-6 text-center">
          <span aria-hidden="true" className="flex h-16 w-16 animate-pop items-center justify-center rounded-card bg-surface text-accent-ink shadow-card"><r.icon size={32} /></span>
          <p className="text-caption font-semibold uppercase tracking-wide text-ink-secondary">{r.tag}</p>
          <h1 className="text-page-title">{r.title}</h1>
          <Badge tone="warning">Menunggu konfirmasi program</Badge>
        </section>
        <section className="card p-4">
          <h2 className="text-card-title">Isi paket (perkiraan)</h2>
          <ol className="mt-3 flex flex-col gap-3">
            {(PACK_ITEMS[r.id] ?? [[r.title, r.desc]]).map(([t, d], i) => (
              <li key={t} className="flex gap-3">
                <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-page text-caption font-bold">{String(i + 1).padStart(2, '0')}</span>
                <div><p className="font-semibold">{t}</p><p className="text-meta text-ink-secondary">{d}</p></div>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-caption text-ink-secondary">Isi ilustratif. Spesifikasi aktual mengikuti ketersediaan mitra pengadaan.</p>
        </section>
        <section className="card p-4">
          <dl className="flex flex-col gap-2 text-meta">
            <div className="flex justify-between gap-3"><dt className="text-ink-secondary">Sponsor</dt><dd className="text-right font-medium">{r.sponsor}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-ink-secondary">Periode</dt><dd className="text-right font-medium">Oktober 2026</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-ink-secondary">Biaya</dt><dd className="text-right font-medium">Rp0</dd></div>
          </dl>
        </section>
      </main>
      <StickyFooter>
        {claimed ? (
          <ButtonLink to="/reward" variant="secondary" block>Anda sudah mengajukan klaim</ButtonLink>
        ) : !canClaim ? (
          <ButtonLink to="/tantangan" variant="secondary" block>Selesaikan challenge untuk klaim</ButtonLink>
        ) : (
          <ButtonLink to={`/reward/${r.id}/klaim`} block>Pilih paket ini</ButtonLink>
        )}
      </StickyFooter>
    </>
  )
}

export function ClaimReview() {
  const { id } = useParams()
  const { state } = useApp()
  const run = useCommand()
  const navigate = useNavigate()
  const i = state.rewardPacks.findIndex((x) => x.id === id)
  const r = i < 0 ? undefined : { ...state.rewardPacks[i], ...packStyle(i) }
  const [method, setMethod] = useState('Ambil di posko')
  const [ack, setAck] = useState(false)
  const [busy, setBusy] = useState(false)
  if (!r) return <NotAvailable />
  if (state.rewardClaim || (isLive && !state.claimRight)) return <NotAvailable />
  return (
    <>
      <AppBar title="Tinjau klaim" />
      <main className="stagger mx-auto flex max-w-[560px] flex-col gap-4 px-4 pb-40 pt-4">
        <Notice tone="info" title="Apresiasi, bukan belanja poin">Ketersediaan aktual menunggu konfirmasi kuota dari sponsor program.</Notice>
        <Link to={`/reward/${r.id}`} className="tap card flex items-center gap-3 p-4 hover:bg-page">
          <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-control bg-accent-soft text-accent-ink"><r.icon size={24} /></span>
          <span className="min-w-0 flex-1"><span className="block font-semibold">{r.title}</span><span className="block text-meta text-ink-secondary">1 pilihan per akun</span></span>
          <CaretRight size={18} aria-hidden="true" className="text-ink-secondary" />
        </Link>
        <section className="card p-4">
          <h2 className="text-card-title">Pemeriksaan hak</h2>
          <dl className="mt-2 divide-y divide-line text-meta">
            {[['Capaian', 'Menunggu pemeriksaan tim'], ['Kuota', 'Menunggu konfirmasi program'], ['Biaya paket', 'Rp0']].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 py-2.5"><dt className="text-ink-secondary">{k}</dt><dd className="text-right font-medium">{v}</dd></div>
            ))}
          </dl>
        </section>
        <fieldset className="flex flex-col gap-2">
          <legend className="float-left mb-2 text-label">Cara serah terima</legend>
          <RadioCard name="m" checked={method === 'Ambil di posko'} onChange={() => setMethod('Ambil di posko')} title="Ambil di posko transit" description="Posko Coblong, dikoordinasikan setelah kuota aktif. Tanpa biaya." />
          <RadioCard name="m" checked={method === 'Dikirim'} onChange={() => setMethod('Dikirim')} title="Dikirim ke alamat operasional" description="Bila ada alokasi kurir relawan. Alamat dibuka hanya untuk kurir." />
        </fieldset>
        <label className="tap flex min-h-12 cursor-pointer items-start gap-3 rounded-control p-1">
          <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-primary" checked={ack} onChange={(e) => setAck(e.target.checked)} />
          <span className="text-meta">Saya memahami pilihan tidak bisa diganti setelah diajukan.</span>
        </label>
      </main>
      <StickyFooter>
        <Button
          block
          disabled={!ack}
          loading={busy}
          loadingLabel="Mengajukan…"
          onClick={() => {
            setBusy(true)
            run({ type: 'claimReward', id: r.id, participant: state.claimRight ?? undefined })
              .then(() => {
                toast('Klaim diajukan. Kami kabari saat program mengonfirmasi.')
                navigate('/reward', { replace: true })
              })
              .catch((err) => {
                toast(messageOf(err), 'info')
                setBusy(false)
              })
          }}
        >
          Ajukan klaim
        </Button>
      </StickyFooter>
    </>
  )
}
