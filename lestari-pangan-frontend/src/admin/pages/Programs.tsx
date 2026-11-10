import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { CheckCircle, Lightbulb, Plus, CookingPot, X } from '@phosphor-icons/react'
import { Badge, Button, ButtonLink, Chip, Field, inputCls, PolicyNote, RadioCard, toast } from '../../components/ui'
import { useAdmin } from '../store'
import { ImagePicker } from '../ImagePicker'
import { uploadMedia } from '../../services/promotions'
import { messageOf } from '../../lib/supabase/errors'
import { METRIC_UNIT, type ChallengeMetric } from '../../data/engagement'
import { proposeAppreciation, publishContent, saveChallenge, saveContent, saveRewardPack } from '../../services/adminActions'
import { DecisionPanel, Filters, PageHeader, Panel, Stat, Status, Table, td } from '../ui'

/* ---------- AD10 Konten edukasi ---------- */

export function ContentList() {
  const { data } = useAdmin()
  const [f, setF] = useState('all')
  const rows = data.contents.map((c) => ({ ...c, st: c.status }))
  const list = rows.filter((c) => f === 'all' || c.kind === f || c.st === f)
  return (
    <>
      <PageHeader title="Konten edukasi" desc="Kurasi tips anti food waste dan resep dari sisa." actions={<ButtonLink to="/admin/konten/baru" icon={<Plus size={18} />} className="min-h-11">Konten baru</ButtonLink>} />
      <div className="stagger grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <Stat label="Terbit" value={rows.filter((c) => c.st === 'Terbit').length} unit="konten" hint="Dapat dibaca pengguna" />
        <Stat label="Antrean review" value={rows.filter((c) => c.st === 'Menunggu review').length} unit="konten" hint="Perlu tinjauan kurator" />
        <Stat label="Draf" value={rows.filter((c) => c.st === 'Draf').length} unit="konten" />
      </div>
      <Panel>
        <div className="mb-4">
          <Filters
            label="Filter konten"
            value={f}
            onChange={setF}
            options={[
              { value: 'all', label: 'Semua', count: rows.length },
              { value: 'Tips', label: 'Tips', count: rows.filter((c) => c.kind === 'Tips').length },
              { value: 'Resep', label: 'Resep', count: rows.filter((c) => c.kind === 'Resep').length },
              { value: 'Menunggu review', label: 'Menunggu review', count: rows.filter((c) => c.st === 'Menunggu review').length },
            ]}
          />
        </div>
        <Table label="Daftar konten" head={['Konten', 'Jenis', 'Versi', 'Diperbarui', 'Status', '']}>
          {list.map((c) => (
            <tr key={c.id} className="hover:bg-page">
              <td className={td}><p className="font-semibold">{c.title}</p><p className="text-ink-secondary">{c.id} · {c.category}</p></td>
              <td className={td}><span className="inline-flex items-center gap-1">{c.kind === 'Tips' ? <Lightbulb size={16} aria-hidden="true" /> : <CookingPot size={16} aria-hidden="true" />}{c.kind}</span></td>
              <td className={`${td} tabular`}>{c.version}</td>
              <td className={td}>{c.updated}<br /><span className="text-ink-secondary">{c.author}</span></td>
              <td className={td}><Status status={c.st} /></td>
              <td className={`${td} text-right`}><ButtonLink to={`/admin/konten/${c.id}`} variant={c.st === 'Menunggu review' ? 'primary' : 'secondary'} className="min-h-10 px-3 text-[0.875rem]">{c.st === 'Menunggu review' ? 'Review' : 'Buka'}</ButtonLink></td>
            </tr>
          ))}
        </Table>
      </Panel>
    </>
  )
}

/* ---------- AD11 Editor konten ---------- */

const CONTENT_CHECKS = ['Bebas klaim komersial atau merek', 'Tidak menjanjikan keamanan pangan absolut', 'Langkah dapat dilakukan di rumah', 'Sumber atau adaptasi dicantumkan']

export function ContentEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, refresh } = useAdmin()
  const base = data.contents.find((c) => c.id === id)
  const isNew = id === 'baru'
  const [title, setTitle] = useState(base?.title ?? '')
  const [kind, setKind] = useState<'Tips' | 'Resep'>(base?.kind ?? 'Tips')
  const [points, setPoints] = useState<string[]>(base?.points ?? [''])
  const [checks, setChecks] = useState<string[]>([])
  const [cover, setCover] = useState<File | null>(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  if (!base && !isNew) return <Navigate to="/admin/konten" replace />
  const st = base ? base.status : 'Draf'

  const save = (after: 'Draf' | 'Terbit') => {
    if (!title.trim() || points.every((p) => !p.trim())) return setErr('Isi judul dan minimal satu poin panduan.')
    if (after === 'Terbit' && checks.length < CONTENT_CHECKS.length) return setErr('Lengkapi semua daftar periksa kebijakan sebelum menerbitkan.')
    setBusy(true)
    const lines = points.map((p) => p.trim()).filter(Boolean)
    const old = (base?.body ?? {}) as { steps?: { title: string; minutes: number; tip?: string }[] }
    // Resep: poin = isi langkah; judul dan durasi langkah lama dipertahankan.
    const body = kind === 'Tips' ? lines : { ...old, steps: lines.map((b, i) => ({ title: old.steps?.[i]?.title ?? `Langkah ${i + 1}`, minutes: old.steps?.[i]?.minutes ?? 5, body: b })) }
    const slug = base?.id ?? `${title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'konten'}-${Date.now().toString(36)}`
    const fields = { slug, kind, title: title.trim(), category: base?.category ?? (kind === 'Tips' ? 'Umum' : 'Olahan sisa'), summary: base?.summary || lines[0].slice(0, 140), body }
    ;(cover ? uploadMedia('konten', cover) : Promise.resolve(undefined))
      .then((photo_path) => saveContent(base?.dbId ?? null, photo_path ? { ...fields, photo_path } : fields, after === 'Terbit'))
      .then((v) => (after === 'Terbit' && v ? publishContent(v.id) : undefined))
      .then(refresh)
      .then(() => {
        toast(after === 'Terbit' ? 'Konten diterbitkan.' : 'Draf disimpan.')
        navigate('/admin/konten')
      })
      .catch((e) => {
        setErr(messageOf(e))
        setBusy(false)
      })
  }

  return (
    <>
      <PageHeader back="/admin/konten" title={isNew ? 'Konten baru' : `Editor ${base!.id}`} desc={isNew ? 'Susun tips atau resep untuk ditinjau kurator.' : `${base!.version} · diperbarui ${base!.updated}`} actions={<Status status={st} />} />
      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <Panel title="Isi konten">
          <div className="flex flex-col gap-4">
            <Field label="Judul" hint="Deskriptif dan aplikatif, tanpa kesan bombastis.">
              {(p) => <input {...p} className={inputCls} value={title} onChange={(e) => (setTitle(e.target.value), setErr(''))} />}
            </Field>
            <fieldset>
              <legend className="text-label">Jenis konten</legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <RadioCard name="kind" checked={kind === 'Tips'} onChange={() => setKind('Tips')} title="Tips Anti Food Waste" />
                <RadioCard name="kind" checked={kind === 'Resep'} onChange={() => setKind('Resep')} title="Resep dari Sisa" />
              </div>
            </fieldset>
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-label">Poin panduan</legend>
              {points.map((p, i) => (
                <div key={i} className="flex animate-rise-in items-start gap-2">
                  <span aria-hidden="true" className="mt-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-container text-[0.8125rem] font-bold text-primary">{i + 1}</span>
                  <label className="sr-only" htmlFor={`pt-${i}`}>Poin {i + 1}</label>
                  <textarea id={`pt-${i}`} rows={2} className={inputCls} value={p} onChange={(e) => setPoints(points.map((x, j) => (j === i ? e.target.value : x)))} />
                  <button type="button" aria-label={`Hapus poin ${i + 1}`} disabled={points.length === 1} onClick={() => setPoints(points.filter((_, j) => j !== i))} className="tap mt-1.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-control text-ink-secondary hover:bg-danger-container hover:text-danger disabled:opacity-40">
                    <X size={18} aria-hidden="true" />
                  </button>
                </div>
              ))}
              <Button variant="ghost" className="self-start" icon={<Plus size={18} />} onClick={() => setPoints([...points, ''])}>Tambah poin</Button>
            </fieldset>
          </div>
        </Panel>
        <div className="flex flex-col gap-4 xl:sticky xl:top-8 xl:self-start">
          <Panel title="Foto sampul" desc="Opsional. Tampil di kartu tips dan artikel.">
            <ImagePicker file={cover} currentUrl={base?.photo} onChange={setCover} width={1200} height={800} label="Gambar sampul" />
          </Panel>
          <Panel title="Daftar periksa kebijakan" desc="Wajib lengkap sebelum terbit.">
            <ul className="flex flex-col gap-2">
              {CONTENT_CHECKS.map((c) => {
                const on = checks.includes(c)
                return (
                  <li key={c}>
                    <label className="tap flex min-h-11 cursor-pointer items-start gap-3 rounded-control p-2 hover:bg-page">
                      <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-primary" checked={on} onChange={() => (setChecks(on ? checks.filter((x) => x !== c) : [...checks, c]), setErr(''))} />
                      <span className="text-meta">{c}</span>
                    </label>
                  </li>
                )
              })}
            </ul>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line" aria-hidden="true">
              <span className="block h-full origin-left rounded-full bg-primary transition-transform duration-page ease-enter" style={{ transform: `scaleX(${checks.length / CONTENT_CHECKS.length})` }} />
            </div>
          </Panel>
          {err && <p role="alert" className="text-meta font-medium text-danger">{err}</p>}
          <Button block loading={busy} loadingLabel="Menyimpan…" onClick={() => save('Terbit')}>Terbitkan</Button>
          <Button block variant="secondary" disabled={busy} onClick={() => save('Draf')}>Simpan draf</Button>
        </div>
      </div>
    </>
  )
}

/* ---------- AD12 Eco Challenge ---------- */

export function ChallengeList() {
  const { data } = useAdmin()
  const { challenges, participants } = data
  const pending = participants.filter((p) => p.status === 'Menunggu verifikasi')
  const [f, setF] = useState<'Aktif' | 'Draf' | 'Arsip'>('Aktif')
  const list = challenges.filter((c) => c.status === f)
  const n = (s: string) => challenges.filter((c) => c.status === s).length
  return (
    <>
      <PageHeader title="Eco Challenge" desc="Program kebiasaan baik tanpa kompetisi volume donasi." actions={<ButtonLink to="/admin/challenge/baru" icon={<Plus size={18} />} className="min-h-11">Tantangan baru</ButtonLink>} />
      <div className="stagger grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <Stat label="Tantangan aktif" value={n('Aktif')} unit="program" hint="Periode Oktober 2026" />
        <Stat label="Menunggu evaluasi" value={pending.length} unit="capaian" {...(pending[0] ? { to: `/admin/capaian/${pending[0].id}`, cta: `Periksa ${pending[0].id}` } : {})} />
        <Stat label="Mitra berpartisipasi" value={new Set(participants.map((p) => p.org)).size} unit="mitra" hint={`${participants.length} keikutsertaan`} />
      </div>
      {pending.length > 0 && (
        <Panel title="Capaian menunggu pemeriksaan">
          <Table label="Capaian menunggu pemeriksaan" head={['Capaian', 'Mitra', 'Progres', '']}>
            {pending.map((p) => (
              <tr key={p.id}>
                <td className={td}><p className="font-semibold">{p.id}</p><p className="text-ink-secondary">{p.title}</p></td>
                <td className={td}>{p.org}</td>
                <td className={`${td} tabular`}>{p.progress} / {p.target} {p.unit}</td>
                <td className={`${td} text-right`}><ButtonLink to={`/admin/capaian/${p.id}`} className="min-h-10 px-3 text-[0.875rem]">Periksa</ButtonLink></td>
              </tr>
            ))}
          </Table>
        </Panel>
      )}
      <Filters label="Filter status" value={f} onChange={setF} options={(['Aktif', 'Draf', 'Arsip'] as const).map((s) => ({ value: s, label: s, count: n(s) }))} />
      <div className="stagger grid gap-4 md:grid-cols-2">
        {list.map((c) => (
          <Panel key={c.id}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-caption font-semibold text-primary">{c.id}</p>
              <Status status={c.status} />
            </div>
            <h2 className="mt-1 text-card-title">{c.title}</h2>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-meta">
              <div><dt className="text-ink-secondary">Periode</dt><dd>{c.period}</dd></div>
              <div><dt className="text-ink-secondary">Peserta</dt><dd>{c.roles}</dd></div>
              <div className="col-span-2"><dt className="text-ink-secondary">Target</dt><dd>{c.target}</dd></div>
            </dl>
            <div className="mt-4 flex items-center justify-between gap-2 border-t border-line pt-3">
              <span className="text-meta text-ink-secondary">{c.participants} mitra ikut</span>
              <ButtonLink to={`/admin/challenge/${c.id}`} variant="secondary" className="min-h-10 px-3 text-[0.875rem]">Ubah</ButtonLink>
            </div>
          </Panel>
        ))}
      </div>
    </>
  )
}

/* ---------- AD13 Editor challenge ---------- */

export function ChallengeEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, refresh } = useAdmin()
  const base = data.challenges.find((c) => c.id === id)
  const [title, setTitle] = useState(base?.title ?? '')
  const [roles, setRoles] = useState(base?.roles ?? 'Pemberi dan penerima')
  const [target, setTarget] = useState(base?.target ?? '')
  const [start, setStart] = useState(base?.periodStart ?? '2026-11-01')
  const [end, setEnd] = useState(base?.periodEnd ?? '2026-11-30')
  const [metric, setMetric] = useState<ChallengeMetric>(base?.metric ?? 'catat_pangan')
  const [count, setCount] = useState(base?.targetCount ?? 3)
  const [points, setPoints] = useState(base?.points ?? 50)
  // Ada peserta: aturan terkunci, kecuali periode digeser setelah periode lama selesai (periode berikutnya).
  const nextPeriod = !!base?.periodEnd && start > base.periodEnd
  const locked = !!base && base.participants > 0 && !nextPeriod
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  if (!base && id !== 'baru') return <Navigate to="/admin/challenge" replace />
  const submit = () => {
    if (!title.trim()) return setErr('Isi judul challenge.')
    if (end <= start) return setErr('Tanggal selesai harus setelah tanggal mulai.')
    if (/peringkat|terbanyak|juara/i.test(title + target)) return setErr('Hindari bahasa kompetisi (peringkat, terbanyak, juara). Challenge mengukur kebiasaan, bukan volume.')
    setBusy(true)
    const roleList = roles === 'Pemberi' ? ['pemberi'] : roles === 'Penerima' ? ['penerima'] : ['pemberi', 'penerima']
    // Aturan terkunci setelah ada peserta (FR-EC-03): hanya judul, deskripsi, dan status yang dikirim.
    const fields = locked
      ? { title: title.trim(), description: target.trim(), status: 'Aktif' }
      : { title: title.trim(), description: target.trim(), roles: roleList, period_start: start, period_end: end, metric, target_count: count, points, status: 'Aktif' }
    saveChallenge(base?.dbId ?? null, fields)
      .then(refresh)
      .then(() => {
        toast('Challenge dipublikasikan.')
        navigate('/admin/challenge')
      })
      .catch((e) => {
        setErr(messageOf(e))
        setBusy(false)
      })
  }
  return (
    <>
      <PageHeader back="/admin/challenge" title={base ? `Editor ${base.id}` : 'Tantangan baru'} desc="Target logis, kriteria peserta, dan periode." />
      <Panel>
        <div className="flex max-w-[720px] flex-col gap-5">
          <Field label="Judul program" hint="Utamakan kebiasaan baik, tanpa jargon kompetitif.">{(p) => <input {...p} className={inputCls} value={title} onChange={(e) => (setTitle(e.target.value), setErr(''))} />}</Field>
          <fieldset>
            <legend className="text-label">Peran yang memenuhi syarat</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {['Pemberi dan penerima', 'Pemberi', 'Penerima'].map((r) => <Chip key={r} selected={roles === r} onClick={() => setRoles(r)}>{r}</Chip>)}
            </div>
          </fieldset>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Mulai" hint={base && base.participants > 0 ? `Untuk periode berikutnya, isi tanggal setelah ${base.periodEnd}.` : undefined}>{(p) => <input {...p} type="date" className={inputCls} value={start} onChange={(e) => setStart(e.target.value)} />}</Field>
            <Field label="Selesai">{(p) => <input {...p} type="date" className={inputCls} value={end} onChange={(e) => setEnd(e.target.value)} />}</Field>
          </div>
          {(
            <div className="grid gap-4 sm:grid-cols-[1fr_140px_140px]">
              <Field label="Ukuran dari log sistem" hint={locked ? 'Terkunci karena sudah ada peserta.' : 'Progres dihitung otomatis dari kegiatan.'}>
                {(p) => (
                  <select {...p} className={inputCls} disabled={locked} value={metric} onChange={(e) => setMetric(e.target.value as ChallengeMetric)}>
                    <option value="catat_pangan">Hari berbeda dengan Catat Pangan</option>
                    <option value="penawaran_alergen">Penawaran dengan info alergen</option>
                    <option value="laporan_distribusi_24j">Laporan distribusi ≤ 24 jam</option>
                    <option value="penyaluran_selesai">Penyaluran diterima</option>
                  </select>
                )}
              </Field>
              <Field label={`Target (${METRIC_UNIT[metric]})`}>
                {(p) => <input {...p} type="number" min={1} className={inputCls} disabled={locked} value={count} onChange={(e) => setCount(Math.max(1, Number(e.target.value)))} />}
              </Field>
              <Field label="Poin">
                {(p) => <input {...p} type="number" min={0} className={inputCls} disabled={locked} value={points} onChange={(e) => setPoints(Math.max(0, Number(e.target.value)))} />}
              </Field>
            </div>
          )}
          <Field label="Deskripsi untuk peserta" hint="Harus bisa dicek dari log sistem, mis. jumlah sesi Catat Pangan.">{(p) => <textarea {...p} rows={2} className={inputCls} value={target} onChange={(e) => (setTarget(e.target.value), setErr(''))} />}</Field>
          {err && <p role="alert" className="text-meta font-medium text-danger">{err}</p>}
          <div className="flex flex-wrap gap-2">
            <Button loading={busy} loadingLabel="Menyimpan…" onClick={submit}>Simpan dan publikasikan</Button>
            <Button variant="secondary" onClick={() => navigate('/admin/challenge')}>Batal</Button>
          </div>
        </div>
      </Panel>
      <PolicyNote title="Prinsip anti-eksploitasi">Tidak ada peringkat kilogram donasi. Reward tidak memberi prioritas memperoleh pangan.</PolicyNote>
    </>
  )
}

/* ---------- AD14 Pemeriksaan capaian ---------- */

export function AchievementReview() {
  const { id = '' } = useParams()
  const { data } = useAdmin()
  const p = data.participants.find((x) => x.id === id)
  if (!p) return <Navigate to="/admin/challenge" replace />
  const st = p.status
  return (
    <>
      <PageHeader back="/admin/challenge" title={`Pemeriksaan capaian ${id}`} desc={`${p.org} · ${p.title}`} actions={<Status status={st} />} />
      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <div className="flex min-w-0 flex-col gap-4">
          <Panel title="Target dan progres">
            <p className="text-body">Target: <strong>{p.target} {p.unit}</strong></p>
            <div className="mt-3 flex gap-1.5" aria-hidden="true">
              {Array.from({ length: p.target }, (_, i) => <span key={i} className={`h-2 flex-1 origin-left animate-grow-x rounded-full ${i < p.progress ? 'bg-primary' : 'bg-line'}`} style={{ animationDelay: `${120 + i * 120}ms` }} />)}
            </div>
            <p className="mt-2 text-meta text-ink-secondary">{Math.min(p.progress, p.target)} dari {p.target} {p.unit} tercatat di log sistem (dihitung server).</p>
          </Panel>
        </div>
        <div className="xl:sticky xl:top-8 xl:self-start">
          <DecisionPanel
            target={id}
            current={st}
            options={[
              { value: 'Valid', label: 'Capaian valid', desc: 'Bukti sah dan terpisah; hak klaim reward dibuka.' },
              { value: 'Tidak valid', label: 'Capaian tidak valid', desc: 'Bukti duplikat atau tidak sesuai target.' },
            ]}
          />
        </div>
      </div>
    </>
  )
}

/* ---------- AD15 + AD16 Reward dan klaim ---------- */

export function Rewards() {
  const { data, refresh } = useAdmin()
  const { rewardPacks, claims } = data
  const [adding, setAdding] = useState(false)
  const [pack, setPack] = useState({ title: '', detail: '', sponsor: '', quota: 10, cost: 50 })
  const [packErr, setPackErr] = useState('')
  const [busy, setBusy] = useState(false)
  const addPack = () => {
    if (!pack.title.trim() || !pack.sponsor.trim() || pack.quota < 1) return setPackErr('Isi nama paket, sponsor, dan kuota minimal 1.')
    setBusy(true)
    saveRewardPack(null, { ...pack, title: pack.title.trim(), sponsor: pack.sponsor.trim(), eligible_roles: ['pemberi', 'penerima'] })
      .then(refresh)
      .then(() => {
        setAdding(false)
        setPack({ title: '', detail: '', sponsor: '', quota: 10, cost: 50 })
        toast('Paket reward ditambahkan.')
      })
      .catch((e) => setPackErr(messageOf(e)))
      .finally(() => setBusy(false))
  }
  const total = rewardPacks.reduce((s, r) => s + r.quota, 0)
  const used = rewardPacks.reduce((s, r) => s + r.claimed, 0)
  return (
    <>
      <PageHeader title="Reward dan klaim" desc="Kuota paket apresiasi dan antrean klaim. Satu hak klaim per akun terverifikasi." actions={<Button variant="secondary" className="min-h-11" icon={<Plus size={18} />} onClick={() => setAdding(!adding)}>Tambah paket</Button>} />
      {adding && (
        <Panel title="Paket reward baru" desc="Dari sponsor yang sudah berkomitmen. Kuota tidak bisa dialokasikan berlebih.">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nama paket">{(p) => <input {...p} className={inputCls} value={pack.title} onChange={(e) => setPack({ ...pack, title: e.target.value })} />}</Field>
            <Field label="Sponsor">{(p) => <input {...p} className={inputCls} value={pack.sponsor} onChange={(e) => setPack({ ...pack, sponsor: e.target.value })} />}</Field>
            <Field label="Isi paket" optional>{(p) => <input {...p} className={inputCls} value={pack.detail} onChange={(e) => setPack({ ...pack, detail: e.target.value })} />}</Field>
            <Field label="Kuota">{(p) => <input {...p} type="number" min={1} className={inputCls} value={pack.quota} onChange={(e) => setPack({ ...pack, quota: Number(e.target.value) })} />}</Field>
            <Field label="Harga (poin)">{(p) => <input {...p} type="number" min={0} className={inputCls} value={pack.cost} onChange={(e) => setPack({ ...pack, cost: Math.max(0, Number(e.target.value)) })} />}</Field>
          </div>
          {packErr && <p role="alert" className="mt-3 text-meta font-medium text-danger">{packErr}</p>}
          <div className="mt-4 flex gap-2">
            <Button loading={busy} onClick={addPack}>Simpan paket</Button>
            <Button variant="secondary" onClick={() => setAdding(false)}>Batal</Button>
          </div>
        </Panel>
      )}
      <div className="stagger grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <Stat label="Total kuota" value={total} unit="paket" hint={`${rewardPacks.length} kategori`} />
        <Stat label="Sudah diklaim" value={used} unit="klaim" />
        <Stat label="Sisa stok" value={total - used} unit="paket" hint="Tidak ada alokasi berlebih" />
      </div>
      <Panel title="Paket reward">
        <Table label="Paket reward" head={['Paket', 'Sponsor', 'Kuota', 'Terpakai']}>
          {rewardPacks.map((r) => (
            <tr key={r.id}>
              <td className={td}><p className="font-semibold">{r.title}</p><p className="text-ink-secondary">{r.id} · {r.cost} poin · {r.detail}</p></td>
              <td className={td}>{r.sponsor}</td>
              <td className={`${td} tabular`}>{r.quota} paket<br /><span className="text-ink-secondary">sisa {r.quota - r.claimed}</span></td>
              <td className={`${td} w-48`}>
                <div className="h-2 overflow-hidden rounded-full bg-line" role="img" aria-label={`${r.claimed} dari ${r.quota} terpakai`}>
                  <span className="block h-full origin-left animate-grow-x rounded-full bg-accent" style={{ width: `${r.quota ? (r.claimed / r.quota) * 100 : 0}%` }} />
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </Panel>
      <Panel title="Antrean klaim">
        <Table label="Antrean klaim" head={['Klaim', 'Mitra', 'Paket', 'Status', '']}>
          {claims.map((c) => {
            const st = c.status
            return (
              <tr key={c.id} className="hover:bg-page">
                <td className={td}><p className="font-semibold">{c.id}</p><p className="text-ink-secondary">{c.at}</p></td>
                <td className={td}>{c.org}<br /><span className="text-ink-secondary">{c.challenge}</span></td>
                <td className={td}>{rewardPacks.find((r) => r.id === c.pack)?.title}</td>
                <td className={td}><Status status={st} /></td>
                <td className={`${td} text-right`}><ButtonLink to={`/admin/klaim/${c.id}`} variant={st === 'Siap disalurkan' || st === 'Diajukan' ? 'primary' : 'secondary'} className="min-h-10 px-3 text-[0.875rem]">{st === 'Siap disalurkan' || st === 'Diajukan' ? 'Proses' : 'Lihat'}</ButtonLink></td>
              </tr>
            )
          })}
        </Table>
      </Panel>
    </>
  )
}

export function ClaimDetail() {
  const { id } = useParams()
  const { data } = useAdmin()
  const c = data.claims.find((x) => x.id === id)
  const pack = data.rewardPacks.find((r) => r.id === c?.pack)
  if (!c || !pack) return <Navigate to="/admin/reward" replace />
  const st = c.status
  return (
    <>
      <PageHeader back="/admin/reward" title={`Klaim ${c.id}`} desc={`${c.org} · ${pack.title}`} actions={<Status status={st} />} />
      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <div className="flex min-w-0 flex-col gap-4">
          <Panel title="Pemeriksaan hak">
            <ul className="stagger flex flex-col gap-2">
              {[
                ['Poin dipakai', c.challenge],
                ['Saldo poin', 'Diperiksa server saat klaim; poin kembali bila klaim ditolak'],
                ['Kuota paket', `Sisa ${pack.quota - pack.claimed} dari ${pack.quota}`],
                ['Biaya penyerahan', 'Rp0 platform (digital atau ambil di posko)'],
              ].map(([k, v]) => (
                <li key={k} className="flex items-start gap-3 rounded-control bg-page p-3">
                  <CheckCircle size={20} weight="fill" aria-hidden="true" className="mt-0.5 shrink-0 text-primary" />
                  <p className="text-meta"><span className="font-semibold">{k}:</span> {v}</p>
                </li>
              ))}
            </ul>
          </Panel>
          <ButtonLink to="/admin/apresiasi" variant="secondary" className="self-start">Siapkan materi apresiasi</ButtonLink>
        </div>
        <div className="xl:sticky xl:top-8 xl:self-start">
          <DecisionPanel
            target={c.id}
            current={st}
            title="Status penyerahan"
            options={[
              st === 'Diajukan'
                ? { value: 'Siap disalurkan', label: 'Siap disalurkan', desc: 'Hak klaim sah; paket disiapkan untuk diserahkan.' }
                : { value: 'Diserahkan', label: 'Tandai diserahkan', desc: 'Paket sudah diterima mitra.' },
              { value: 'Ditolak', label: 'Tolak klaim', desc: 'Hak klaim tidak sah atau duplikat; kuota dikembalikan.' },
            ]}
          />
        </div>
      </div>
    </>
  )
}

/* ---------- AD17 Materi apresiasi ---------- */

export function Appreciation() {
  const { data, refresh } = useAdmin()
  const [partner, setPartner] = useState<number | ''>('')
  const [image, setImage] = useState<File | null>(null)
  const st = 'Draf'
  const [quote, setQuote] = useState('Apresiasi atas komitmen aktif mencegah susut pangan dan koordinasi pembagian makanan yang transparan di wilayahnya.')
  const [channels, setChannels] = useState<string[]>(['Profil mitra di aplikasi'])
  const [busy, setBusy] = useState(false)
  const toggle = (c: string) => setChannels(channels.includes(c) ? channels.filter((x) => x !== c) : [...channels, c])
  return (
    <>
      <PageHeader title="Materi apresiasi" desc="Narasi apresiasi mitra. Tidak tayang tanpa persetujuan mitra." actions={<Status status={st} />} />
      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <Panel title="Materi baru" desc="Pilih mitra, tulis kalimat apresiasi, lalu kirim untuk disetujui.">
          <div className="flex flex-col gap-5">
            {(
              <Field label="Mitra">
                {(p) => (
                  <select {...p} className={inputCls} value={partner} onChange={(e) => setPartner(e.target.value ? Number(e.target.value) : '')}>
                    <option value="">Pilih mitra</option>
                    {data.partners.map((m) => <option key={m.id} value={m.id}>{m.name} · {m.area}</option>)}
                  </select>
                )}
              </Field>
            )}
            <Field label="Kalimat apresiasi" hint="Faktual, tanpa klaim keamanan pangan atau angka spekulatif.">
              {(p) => <textarea {...p} rows={3} className={inputCls} value={quote} onChange={(e) => setQuote(e.target.value)} />}
            </Field>
            <fieldset>
              <legend className="text-label">Kanal publikasi berizin</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {['Profil mitra di aplikasi', 'Laporan bulanan', 'Media sosial program'].map((c) => <Chip key={c} selected={channels.includes(c)} onClick={() => toggle(c)}>{c}</Chip>)}
              </div>
            </fieldset>
          </div>
        </Panel>
        <div className="flex flex-col gap-4 xl:sticky xl:top-8 xl:self-start">
          <Panel title="Gambar apresiasi" desc="Opsional: poster atau sertifikat yang sudah sesuai template.">
            <ImagePicker file={image} onChange={setImage} width={1200} height={900} label="Gambar materi" />
          </Panel>
          <Panel title="Pratinjau">
            <figure className="rounded-card border border-line bg-gradient-to-br from-primary-container to-surface p-5">
              <Badge tone="success">Mitra apresiasi</Badge>
              <blockquote className="mt-3 text-body italic">“{quote}”</blockquote>
              <figcaption className="mt-3 text-meta font-semibold">{data.partners.find((m) => m.id === partner)?.name ?? 'Nama mitra'}</figcaption>
            </figure>
          </Panel>
          <Button
            block
            loading={busy}
            loadingLabel="Mengirim…"
            disabled={!partner || quote.trim().length < 10}
            onClick={() => {
              setBusy(true)
              ;(image ? uploadMedia('apresiasi', image) : Promise.resolve(undefined))
                .then((path) => proposeAppreciation(Number(partner), quote.trim(), path))
                .then(refresh)
                .then(() => toast('Materi dikirim ke mitra untuk persetujuan.'))
                .catch((e) => toast(messageOf(e), 'info'))
                .finally(() => setBusy(false))
            }}
          >
            Kirim ke pratinjau mitra
          </Button>
          {data.materials.length > 0 && (
            <Panel title="Materi terkirim">
              <ul className="flex flex-col gap-2">
                {data.materials.map((m) => (
                  <li key={m.id} className="rounded-control border border-line p-3 text-meta">
                    <p className="flex flex-wrap items-center justify-between gap-2 font-semibold">{m.org} · v{m.version}<Status status={m.status === 'Draf' ? 'Menunggu persetujuan mitra' : m.status} /></p>
                    <p className="text-ink-secondary">{m.caption}</p>
                    {m.note && <p className="mt-1">Catatan mitra: {m.note}</p>}
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>
      </div>
    </>
  )
}
