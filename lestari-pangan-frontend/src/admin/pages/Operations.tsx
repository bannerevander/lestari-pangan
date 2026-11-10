import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, CheckCircle, FilePdf, MagnifyingGlass, MapPin, Phone, ShieldCheck, Truck, Warning } from '@phosphor-icons/react'
import { Badge, Button, ButtonLink, Field, inputCls, Notice, PolicyNote, StageList, Toaster, toast } from '../../components/ui'
import { asset } from '../../lib/format'
import { useAdmin } from '../store'
import type { Chain } from '../data'
import { messageOf } from '../../lib/supabase/errors'
import { sendEmailOtp, signOut, verifyEmailOtp } from '../../services/auth'
import { fetchMyProfile } from '../../services/identity'
import { verificationDocUrl } from '../../services/admin'
import { assignCourier, verifyReceipt } from '../../services/adminActions'
import { DecisionPanel, Filters, PageHeader, Panel, rp, Stat, Status, Table, td } from '../ui'

/* ---------- AD01 Masuk admin ---------- */

export function AdminLogin() {
  const { state, dispatch } = useAdmin()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState<{ email?: string; code?: string }>({})
  const [busy, setBusy] = useState(false)
  if (state.signedIn) return <Navigate to="/admin" replace />
  const emailOk = /\S+@\S+\.\S+/.test(email)

  // Mode live: email + kode OTP, lalu profil harus berperan admin.
  const submitLive = async () => {
    if (!emailOk) return setErr({ email: 'Isi email staf yang valid.' })
    if (sent && !/^\d{6}$/.test(code.trim())) return setErr({ code: 'Isi 6 angka kode dari email.' })
    setErr({})
    setBusy(true)
    try {
      if (!sent) {
        await sendEmailOtp(email)
        setSent(true)
        toast('Kode masuk dikirim ke email staf.', 'info')
      } else {
        await verifyEmailOtp(email, code.trim())
        const me = await fetchMyProfile()
        if (me?.role !== 'admin') {
          await signOut()
          throw new Error('Akun ini bukan akun staf. Gunakan aplikasi Lestari Pangan.')
        }
        dispatch({ type: 'signIn', staff: { name: me.org_name, scope: me.admin_scope ?? '' } })
        navigate('/admin', { replace: true })
      }
    } catch (e) {
      setErr({ [sent ? 'code' : 'email']: e instanceof Error && !('code' in e) ? e.message : messageOf(e) })
    } finally {
      setBusy(false)
    }
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    void submitLive()
  }
  return (
    <div className="grid min-h-screen bg-page lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-primary p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <span aria-hidden="true" className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/5" />
        <span aria-hidden="true" className="absolute -bottom-32 left-10 h-80 w-80 rounded-full bg-white/5" />
        <div className="relative flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-control bg-white">
            <img src={asset('img/logo-mark.png')} alt="" className="h-9 w-9" />
          </span>
          <span className="text-[1.25rem] font-bold">Lestari Pangan</span>
        </div>
        <div className="relative max-w-md animate-rise-in">
          <p className="text-display">Konsol operasi untuk penyaluran yang transparan</p>
          <p className="mt-3 text-[1.0625rem] leading-7 text-white/85">Antrean verifikasi, kendala lapangan, dan transparansi dana dalam satu tempat. Setiap keputusan tercatat di log audit.</p>
        </div>
        <p className="relative text-meta text-white/70">Panel internal · hak akses terbatas sesuai kebijakan OD-02</p>
      </section>
      <section className="flex items-center justify-center px-4 py-10">
        <form onSubmit={submit} noValidate className="w-full max-w-[420px] animate-rise-in">
          <img src={asset('img/logo-mark.png')} alt="" className="mb-4 h-12 w-12 lg:hidden" />
          <h1 className="text-page-title">Masuk staf operasional</h1>
          <p className="mt-1 text-body text-ink-secondary">Akses khusus pengelolaan verifikasi, penyaluran, dan transparansi.</p>
          <div className="mt-6 flex flex-col gap-4">
            <Field label="Email staf" error={err.email}>
              {(p) => <input {...p} type="email" autoComplete="username" className={inputCls} value={email} disabled={sent} onChange={(e) => setEmail(e.target.value)} />}
            </Field>
            {sent && (
              <Field label="Kode masuk" hint="6 angka dari email. Berlaku beberapa menit." error={err.code}>
                {(p) => <input {...p} inputMode="numeric" autoComplete="one-time-code" maxLength={6} className={`${inputCls} tabular tracking-[0.3em]`} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} />}
              </Field>
            )}
            <Button type="submit" block loading={busy} loadingLabel="Memeriksa…">{sent ? 'Masuk ke konsol' : 'Kirim kode masuk'}</Button>
            {sent && <button type="button" onClick={() => (setSent(false), setCode(''))} className="text-center text-[0.875rem] font-semibold text-primary hover:underline">Ganti email</button>}
            <Link to="/" className="text-center text-[0.875rem] font-semibold text-primary hover:underline">Kembali ke aplikasi</Link>
          </div>
        </form>
      </section>
      <Toaster />
    </div>
  )
}

/* ---------- AD02 Dashboard operasi ---------- */

export function Dashboard() {
  const { data } = useAdmin()
  const { orgs, issues, opOffers, txns } = data
  const pendingOrgs = orgs.filter((o) => /Menunggu/.test(o.status))
  const openIssues = issues.filter((i) => !/Selesai/.test(i.status))
  const active = opOffers.filter((o) => o.status === 'Aktif')
  const offer = { reserved: active.reduce((n, o) => n + o.reserved, 0), available: active.reduce((n, o) => n + o.available, 0) }
  const cashIn = txns.filter((t) => t.kind === 'Masuk').reduce((s, t) => s + t.amount, 0)
  const cashOut = txns.filter((t) => t.kind === 'Keluar').reduce((s, t) => s + t.amount, 0)
  return (
    <>
      <PageHeader title="Dashboard operasi" desc="Antrean verifikasi, tindak lanjut penyaluran, dan saldo dana relawan seluruh wilayah." />
      <div className="stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Antrean verifikasi" value={pendingOrgs.length} unit="organisasi" hint={pendingOrgs[0] ? `Berkas ${pendingOrgs[0].name} menunggu peninjauan.` : 'Tidak ada antrean.'} to="/admin/pengguna" cta="Buka antrean" />
        <Stat label="Jumlah direservasi" value={offer.reserved} unit={`di ${active.length} penawaran aktif`} hint={`Sisa ${offer.available} di katalog (semua satuan).`} to="/admin/penyaluran" cta="Lihat alokasi" />
        <Stat label="Kendala terbuka" value={openIssues.length} unit="kasus" hint="Batas respons pangan siap santap 60 menit." to="/admin/kendala" cta="Tindak lanjuti" />
        <Stat label="Kas subsidi ongkir" value={cashIn - cashOut} format={rp} hint={`Masuk ${rp(cashIn)} · terpakai ${rp(cashOut)}`} to="/admin/dana" cta="Buka buku kas" />
      </div>
      <div className="grid gap-4 2xl:grid-cols-[1fr_360px]">
        <Panel title="Penyaluran yang perlu perhatian" desc="Kegiatan dengan selisih atau penyesuaian jumlah." actions={<ButtonLink to="/admin/penyaluran" variant="ghost" className="min-h-10 text-[0.875rem]">Semua penyaluran</ButtonLink>}>
          {openIssues.length === 0 && <p className="text-body text-ink-secondary">Tidak ada penyaluran dengan kendala terbuka.</p>}
          <Table label="Penyaluran yang perlu perhatian" head={['Kegiatan', 'Pihak', 'Kendala', 'Usia', '']}>
            {openIssues.slice(0, 5).map((i) => (
              <tr key={i.id}>
                <td className={td}><p className="font-semibold">{i.transferId}</p><p className="text-ink-secondary">{i.food}</p></td>
                <td className={td}>{i.reporter} · {i.reported}</td>
                <td className={td}><Badge tone="warning">{i.category}</Badge></td>
                <td className={td}>{i.age} lalu<br /><span className="text-ink-secondary">{i.status}</span></td>
                <td className={`${td} text-right`}><ButtonLink to={`/admin/kendala/${i.id}`} className="min-h-10 px-3 text-[0.875rem]">Periksa</ButtonLink></td>
              </tr>
            ))}
          </Table>
        </Panel>
        <Panel title="Antrean kredensial" actions={pendingOrgs.length ? <Badge tone="warning">{pendingOrgs.length} menunggu</Badge> : undefined}>
          {pendingOrgs.length ? (
            <div className="flex flex-col gap-3">
              {pendingOrgs.map((o) => (
                <Link key={o.id} to={`/admin/pengguna/${o.id}`} className="tap tap-soft rounded-control border border-line bg-page p-3 hover:border-line-control">
                  <p className="flex flex-wrap items-center justify-between gap-2 font-semibold">{o.name}<span className="text-caption font-normal text-ink-secondary">{o.submitted}</span></p>
                  <p className="text-meta text-ink-secondary">{o.role} ({o.type}) · {o.pic}</p>
                  <p className="mt-2 flex items-center gap-1.5 text-meta font-medium text-primary"><FilePdf size={18} aria-hidden="true" />{o.doc}</p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="flex items-center gap-2 text-body text-ink-secondary"><CheckCircle size={22} weight="fill" className="text-primary" aria-hidden="true" />Semua berkas sudah ditinjau.</p>
          )}
        </Panel>
      </div>
    </>
  )
}

/* ---------- AD03 Pengguna dan verifikasi ---------- */

export function Users() {
  const { data } = useAdmin()
  const { orgs } = data
  const [role, setRole] = useState<'all' | 'Pemberi' | 'Penerima'>('all')
  const [q, setQ] = useState('')
  const list = orgs.filter((o) => (role === 'all' || o.role === role) && (o.name + o.pic).toLowerCase().includes(q.toLowerCase()))
  return (
    <>
      <PageHeader title="Pengguna dan verifikasi" desc="Tinjau kredensial organisasi pemberi dan penerima." />
      <Panel>
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Filters
            label="Filter peran"
            value={role}
            onChange={setRole}
            options={[
              { value: 'all', label: 'Semua', count: orgs.length },
              { value: 'Pemberi', label: 'Pemberi', count: orgs.filter((o) => o.role === 'Pemberi').length },
              { value: 'Penerima', label: 'Penerima', count: orgs.filter((o) => o.role === 'Penerima').length },
            ]}
          />
          <label className="relative block md:w-72">
            <span className="sr-only">Cari organisasi</span>
            <MagnifyingGlass size={18} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-secondary" />
            <input type="search" className={`${inputCls} min-h-11 py-2 pl-10`} placeholder="Cari nama atau penanggung jawab" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
        </div>
        <Table label="Daftar organisasi" head={['Organisasi', 'Peran dan wilayah', 'Penanggung jawab', 'Dokumen', 'Status', '']}>
          {list.map((o) => {
            const st = o.status
            return (
              <tr key={o.id} className="hover:bg-page">
                <td className={td}><p className="font-semibold">{o.name}</p><p className="break-all text-ink-secondary">{o.email || o.id}</p></td>
                <td className={td}>{o.role} ({o.type})<br /><span className="text-ink-secondary">{o.area}</span></td>
                <td className={td}>{o.pic}<br /><span className="text-ink-secondary">{o.phone} (privat)</span></td>
                <td className={td}><span className="inline-flex items-center gap-1 font-medium text-primary"><FilePdf size={16} aria-hidden="true" />{o.doc}</span><br /><span className="text-ink-secondary">{o.docMeta}</span></td>
                <td className={td}><Status status={st} /></td>
                <td className={`${td} text-right`}>
                  <ButtonLink to={`/admin/pengguna/${o.id}`} variant={/Menunggu/.test(st) ? 'primary' : 'secondary'} className="min-h-10 px-3 text-[0.875rem]">{/Menunggu/.test(st) ? 'Periksa berkas' : 'Lihat'}</ButtonLink>
                </td>
              </tr>
            )
          })}
        </Table>
        {list.length === 0 && <p className="py-6 text-center text-body text-ink-secondary">Tidak ada organisasi yang cocok.</p>}
      </Panel>
      <PolicyNote title="Batas kebijakan verifikasi (OD-02)">Verifikasi memastikan keabsahan narahubung lembaga, bukan sertifikasi keamanan atau mutu pangan.</PolicyNote>
    </>
  )
}

/* ---------- AD04 Pemeriksaan berkas ---------- */

export function UserReview() {
  const { id } = useParams()
  const { data } = useAdmin()
  const [opening, setOpening] = useState(false)
  const o = data.orgs.find((x) => x.id === id)
  if (!o) return <Navigate to="/admin/pengguna" replace />
  const st = o.status
  return (
    <>
      <PageHeader back="/admin/pengguna" title={`Pemeriksaan berkas: ${o.name}`} desc="Tinjau kredensial operasional sebelum izin penawaran dibuka." actions={<Status status={st} />} />
      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <div className="flex min-w-0 flex-col gap-4">
          <Panel title="Profil pendaftar">
            <dl className="grid gap-4 sm:grid-cols-2">
              {[
                ['Nama', o.name],
                ['Peran', `${o.role} (${o.type})`],
                ['Wilayah publik', o.area],
                ['Penanggung jawab', o.pic],
              ].map(([k, v]) => (
                <div key={k}><dt className="text-meta text-ink-secondary">{k}</dt><dd className="font-medium">{v}</dd></div>
              ))}
              <div className="sm:col-span-2 rounded-control bg-page p-3">
                <dt className="flex items-center gap-1.5 text-meta text-ink-secondary"><ShieldCheck size={16} aria-hidden="true" />Kontak privat (hanya admin)</dt>
                <dd className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-meta"><span className="inline-flex items-center gap-1"><Phone size={16} aria-hidden="true" />{o.phone}</span>{o.email && <span className="break-all">{o.email}</span>}</dd>
              </div>
            </dl>
          </Panel>
          <Panel title="Dokumen pengajuan" desc={`${o.doc} · ${o.docMeta}`}>
            {o.docPath ? (
                <Button
                  variant="secondary"
                  loading={opening}
                  icon={<FilePdf size={18} />}
                  onClick={() => {
                    setOpening(true)
                    verificationDocUrl(o.docPath!)
                      .then((url) => window.open(url, '_blank', 'noopener'))
                      .catch((e) => toast(messageOf(e), 'info'))
                      .finally(() => setOpening(false))
                  }}
                >
                  Buka berkas (tautan 5 menit)
                </Button>
              ) : (
                <p className="text-body text-ink-secondary">Pendaftar belum mengunggah berkas verifikasi.</p>
              )}
          </Panel>
          <Panel title="Kronologi peninjauan">
            <StageList
              label="Kronologi"
              current={/Menunggu/.test(st) ? 1 : 2}
              stages={[
                { title: 'Dokumen diunggah', detail: o.submitted },
                { title: 'Masuk antrean peninjau', detail: 'Ditinjau admin operasional' },
                { title: 'Keputusan', detail: /Menunggu/.test(st) ? 'Belum diputuskan' : st },
              ]}
            />
          </Panel>
        </div>
        <div className="xl:sticky xl:top-8 xl:self-start">
          <DecisionPanel
            target={o.id}
            current={st}
            options={[
              { value: 'Terverifikasi', label: 'Setujui verifikasi', desc: 'Identitas dan kontak penanggung jawab sesuai dokumen.' },
              { value: 'Perlu perbaikan', label: 'Minta perbaikan', desc: 'Dokumen kurang jelas; pendaftar diminta mengunggah ulang.' },
              { value: 'Ditolak', label: 'Tolak', desc: 'Data tidak sesuai atau tidak dapat dikonfirmasi.' },
            ]}
          />
        </div>
      </div>
    </>
  )
}

/* ---------- AD05 Penawaran dan penyaluran ---------- */

export function Distribution() {
  const { opOffers } = useAdmin().data
  const [f, setF] = useState<'all' | 'Aktif' | 'Selesai'>('all')
  const list = opOffers.filter((o) => f === 'all' || o.status === f)
  return (
    <>
      <PageHeader title="Penawaran dan penyaluran" desc="Pantau reservasi jumlah dan rantai pergerakan pangan." />
      <Filters label="Filter status" value={f} onChange={setF} options={[{ value: 'all', label: 'Semua', count: opOffers.length }, { value: 'Aktif', label: 'Aktif', count: opOffers.filter((o) => o.status === 'Aktif').length }, { value: 'Selesai', label: 'Selesai', count: opOffers.filter((o) => o.status === 'Selesai').length }]} />
      <div className="stagger flex flex-col gap-4">
        {list.length === 0 && <Panel><p className="text-body text-ink-secondary">Belum ada penawaran.</p></Panel>}
        {list.map((o) => {
          const pct = (n: number) => `${o.initial ? (n / o.initial) * 100 : 0}%`
          return (
            <Panel key={o.id}>
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 text-caption font-semibold text-primary">#{o.id}<Status status={o.status} /></p>
                  <h2 className="mt-1 text-card-title">{o.name} <span className="font-normal text-ink-secondary">· {o.donor}</span></h2>
                  <p className="flex items-center gap-1 text-meta text-ink-secondary"><MapPin size={16} aria-hidden="true" />{o.area} · terbit {o.published} · batas {o.deadline}</p>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex flex-wrap justify-between gap-2 text-meta">
                  <span><strong>{o.reserved}</strong> direservasi · <strong>{o.available}</strong> tersedia</span>
                  <span className="text-ink-secondary">Total awal {o.initial} {o.unit}</span>
                </div>
                <div className="mt-2 flex h-2.5 origin-left animate-grow-x overflow-hidden rounded-full bg-line" aria-hidden="true">
                  <span className="bg-info" style={{ width: pct(o.reserved) }} />
                  <span className="bg-primary" style={{ width: pct(o.available) }} />
                </div>
              </div>
              <div className="mt-4">
                <Table label={`Permintaan untuk ${o.id}`} head={['Pemohon', 'Jumlah', 'Jadwal', 'Status', '']}>
                  {o.requests.map((r) => (
                    <tr key={r.id}>
                      <td className={td}><p className="font-semibold">{r.org}</p><p className="text-ink-secondary">{r.id}</p></td>
                      <td className={td}>{r.asked} {o.unit}{r.proposed !== undefined && <><br /><span className="text-warning">Usulan {r.proposed} {o.unit}</span></>}</td>
                      <td className={td}>{r.time}<br /><span className="text-ink-secondary">{r.method}</span></td>
                      <td className={td}><Status status={r.status} /></td>
                      <td className={`${td} text-right`}>
                        {r.transferId ? (
                          <Link to={`/admin/penyaluran/${r.transferId}`} className="inline-flex min-h-10 items-center gap-1 font-semibold text-primary hover:underline">Rantai {r.transferId}<ArrowRight size={14} weight="bold" aria-hidden="true" /></Link>
                        ) : (
                          <span className="text-ink-secondary">Menunggu pemberi</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </Table>
              </div>
            </Panel>
          )
        })}
      </div>
    </>
  )
}

/* ---------- AD06 Rantai operasi dan koreksi ---------- */

export function OperationDetail() {
  const { id = '' } = useParams()
  const { data } = useAdmin()
  const chain = data.chains[id]
  const issue = data.issues.find((i) => i.transferId === id)
  if (!chain)
    return (
      <>
        <PageHeader back="/admin/penyaluran" title={`Rantai ${id}`} />
        <Notice tone="info">Penyaluran tidak ditemukan.</Notice>
      </>
    )
  return (
    <>
      <PageHeader back="/admin/penyaluran" title={`Rantai operasi ${chain.id}`} desc="Penawaran → permintaan → pengambilan → penerimaan → pemanfaatan." actions={<Status status={chain.status ?? 'Diterima sebagian'} />} />
      <ol className="stagger grid gap-3 md:grid-cols-5">
        {chain.steps.map((s, i) => (
          <li key={s.title} className={`card relative p-4 ${s.tone === 'warn' ? 'border-warning/40 bg-warning-container' : s.tone === 'wait' ? 'opacity-70' : ''}`}>
            <p className="text-caption font-semibold text-ink-secondary">Langkah {i + 1}</p>
            <p className="mt-1 font-semibold leading-6">{s.title}</p>
            <p className={`mt-2 text-[1.125rem] font-bold ${s.tone === 'warn' ? 'text-warning' : 'text-primary-pressed'}`}>{s.value}</p>
            <p className="text-meta text-ink-secondary">{s.who}</p>
          </li>
        ))}
      </ol>
      {chain.pendingReceipt && <ReceiptReview chain={chain} />}
      <Panel title="Rekonsiliasi jumlah" desc="Satu satuan per penyaluran; setiap angka punya sumber.">
        <Table label="Rekonsiliasi" head={['Komponen', 'Jumlah', 'Sumber data']}>
          {chain.ledger.map(([k, v, src]) => (
            <tr key={k}>
              <td className={`${td} font-semibold`}>{k}</td>
              <td className={`${td} tabular`}>{v}</td>
              <td className={`${td} text-ink-secondary`}>{src}</td>
            </tr>
          ))}
        </Table>
      </Panel>
      <PolicyNote title="Audit tanpa sanksi">Selisih dicatat terbuka. Koreksi hanya lewat alasan resmi dan tercatat di riwayat perubahan.</PolicyNote>
      <div className="flex flex-wrap gap-2">
        {issue && <ButtonLink to={`/admin/kendala/${issue.id}`}>Buka kasus {issue.id}</ButtonLink>}
        <ButtonLink to="/admin/audit" variant="secondary">Riwayat perubahan</ButtonLink>
      </div>
    </>
  )
}

/** OD-03: staf ops menyetujui atau mengembalikan laporan penerimaan sebagian/penolakan. */
function ReceiptReview({ chain }: { chain: Chain }) {
  const { refresh } = useAdmin()
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState<'ok' | 'back' | null>(null)
  const [err, setErr] = useState('')
  const p = chain.pendingReceipt!
  const decide = (approve: boolean) => {
    if (!note.trim()) return setErr('Tulis catatan pemeriksaan untuk penerima dan audit.')
    setBusy(approve ? 'ok' : 'back')
    verifyReceipt(chain.dbId, approve, note.trim())
      .then(refresh)
      .then(() => toast(approve ? 'Penerimaan disetujui dan tercatat.' : 'Dikembalikan ke penerima untuk konfirmasi ulang.', 'success'))
      .catch((e) => setErr(messageOf(e)))
      .finally(() => setBusy(null))
  }
  return (
    <Panel title="Verifikasi penerimaan" desc="Penerima melaporkan jumlah lebih kecil dari yang diserahkan. Dampak belum dihitung sampai disetujui.">
      <div className="flex max-w-[720px] flex-col gap-3">
        <p className="text-body"><strong>{p.received} dari {p.base} {p.unit}</strong> diterima. Alasan: “{p.reason}”</p>
        <Field label="Catatan pemeriksaan" error={err}>
          {(f) => <textarea {...f} rows={2} className={inputCls} value={note} onChange={(e) => (setNote(e.target.value), setErr(''))} />}
        </Field>
        <div className="flex flex-wrap gap-2">
          <Button loading={busy === 'ok'} disabled={!!busy} onClick={() => decide(true)}>Setujui dan catat</Button>
          <Button variant="secondary" loading={busy === 'back'} disabled={!!busy} onClick={() => decide(false)}>Kembalikan ke penerima</Button>
        </div>
      </div>
    </Panel>
  )
}

/* ---------- AD07 Antrean kendala ---------- */

export function Issues() {
  const { data } = useAdmin()
  const { issues } = data
  const [f, setF] = useState<'all' | 'open' | 'review' | 'done'>('open')
  const withStatus = issues.map((i) => ({ ...i, st: i.status }))
  const groups = {
    open: withStatus.filter((i) => /Menunggu/.test(i.st)),
    review: withStatus.filter((i) => /Sedang/.test(i.st)),
    done: withStatus.filter((i) => /Selesai/.test(i.st)),
  }
  const list = f === 'all' ? withStatus : groups[f]
  return (
    <>
      <PageHeader title="Antrean kendala" desc="Ketidaksesuaian serah terima, kondisi pangan, dan pengantaran." actions={<Button variant="secondary" className="min-h-11" onClick={() => toast('Ekspor CSV disiapkan untuk rilis berikutnya.', 'info')}>Ekspor CSV</Button>} />
      <div className="stagger grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <Stat label="Perlu tindakan" value={groups.open.length} unit="kasus" hint="Batas respons 60 menit" />
        <Stat label="Sedang ditinjau" value={groups.review.length} unit="kasus" hint="Investigasi lapangan" />
        <Stat label="Selesai" value={groups.done.length} unit="kasus" hint="Pekan ini" />
      </div>
      <Panel>
        <div className="mb-4">
          <Filters label="Filter status" value={f} onChange={setF} options={[{ value: 'open', label: 'Perlu tindakan', count: groups.open.length }, { value: 'review', label: 'Sedang ditinjau', count: groups.review.length }, { value: 'done', label: 'Selesai', count: groups.done.length }, { value: 'all', label: 'Semua', count: issues.length }]} />
        </div>
        <Table label="Daftar kendala" head={['Kasus', 'Pelapor dan terlapor', 'Kategori', 'Usia', 'Status', '']}>
          {list.map((i) => (
            <tr key={i.id} className="hover:bg-page">
              <td className={td}><p className="font-semibold">{i.id}</p><p className="text-ink-secondary">{i.transferId} · {i.food}</p></td>
              <td className={td}>{i.reporter} <span className="text-ink-secondary">({i.reporterRole})</span><br /><span className="text-ink-secondary">terhadap</span> {i.reported}</td>
              <td className={td}><p className="font-medium">{i.category}</p><p className="text-ink-secondary">{i.summary}</p></td>
              <td className={`${td} whitespace-nowrap`}>{i.priority === 'Tinggi' && <Warning size={16} weight="fill" aria-label="Prioritas tinggi" className="mr-1 inline text-danger" />}{i.age}</td>
              <td className={td}><Status status={i.st} /></td>
              <td className={`${td} text-right`}><ButtonLink to={`/admin/kendala/${i.id}`} variant={/Selesai/.test(i.st) ? 'secondary' : 'primary'} className="min-h-10 px-3 text-[0.875rem]">{/Selesai/.test(i.st) ? 'Lihat' : 'Tindak lanjuti'}</ButtonLink></td>
            </tr>
          ))}
        </Table>
        {list.length === 0 && <p className="py-6 text-center text-body text-ink-secondary">Tidak ada kasus di filter ini.</p>}
      </Panel>
    </>
  )
}

/* ---------- AD08 Penanganan masalah ---------- */

export function IssueDetail() {
  const { id } = useParams()
  const { data } = useAdmin()
  const i = data.issues.find((x) => x.id === id)
  if (!i) return <Navigate to="/admin/kendala" replace />
  const st = i.status
  return (
    <>
      <PageHeader back="/admin/kendala" title={`Kasus ${i.id}`} desc={`${i.category} · ${i.food}`} actions={<><Badge tone={i.priority === 'Tinggi' ? 'danger' : 'neutral'}>Prioritas {i.priority.toLowerCase()}</Badge><Status status={st} /></>} />
      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <div className="flex min-w-0 flex-col gap-4">
          <Panel title="Ringkasan kasus" desc={`Terkait ${i.transferId}`} actions={<Link to={`/admin/penyaluran/${i.transferId}`} className="inline-flex min-h-10 items-center gap-1 text-[0.875rem] font-semibold text-primary hover:underline">Buka rantai <ArrowRight size={14} weight="bold" aria-hidden="true" /></Link>}>
            <p className="text-body">{i.summary}</p>
            {i.resolution && <p className="mt-3 rounded-control bg-page p-3 text-meta"><span className="font-semibold">Resolusi:</span> {i.resolution}</p>}
            {i.id === 'ISS-8821-01' && (
              <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                {[['Disepakati', 12, 'bg-page'], ['Diterima layak', 10, 'bg-primary-container text-primary'], ['Selisih', 2, 'bg-warning-container text-warning']].map(([k, v, c]) => (
                  <div key={k as string} className={`rounded-control p-3 ${c}`}><dd className="text-[1.5rem] font-bold">{v}</dd><dt className="text-caption font-semibold">{k}</dt></div>
                ))}
              </dl>
            )}
          </Panel>
          <div className="grid gap-4 md:grid-cols-2">
            <Panel title="Pelapor"><p className="font-semibold">{i.reporter}</p><p className="text-meta text-ink-secondary">{i.reporterRole}</p></Panel>
            <Panel title="Terlapor"><p className="font-semibold">{i.reported}</p><p className="text-meta text-ink-secondary">{i.reportedRole}</p></Panel>
          </div>
          <Panel title="Kronologi serah terima" desc="Zona waktu WIB">
            <StageList
              label="Kronologi"
              current={i.timeline?.length ?? 3}
              stages={
                i.timeline ?? [
                  { title: '16.15 · Pemberi menyatakan siap ambil', detail: '12 porsi di titik temu' },
                  { title: '16.30 · Relawan mengambil', detail: 'Kemasan diperiksa di lokasi' },
                  { title: '16.38 · Penerima mencatat 10 layak, 2 rusak', detail: 'Laporan otomatis dari konfirmasi penerimaan' },
                ]
              }
            />
          </Panel>
        </div>
        <div className="xl:sticky xl:top-8 xl:self-start">
          <DecisionPanel
            target={i.id}
            current={st}
            title="Tindak lanjut"
            options={[
              { value: 'Sedang ditinjau', label: 'Tinjau di lapangan', desc: 'Hubungi kedua pihak, kumpulkan keterangan.' },
              { value: 'Selesai', label: 'Selesaikan kasus', desc: 'Selisih dicatat; tidak ada sanksi.' },
              { value: 'Ditolak', label: 'Tolak laporan', desc: 'Laporan tidak didukung data serah terima.' },
            ]}
          />
        </div>
      </div>
    </>
  )
}

/* ---------- AD09 Penugasan pengiriman ---------- */

export function Deliveries() {
  const { data, refresh } = useAdmin()
  const [f, setF] = useState('all')
  const [courier, setCourier] = useState<Record<string, number>>({})
  const [busy, setBusy] = useState<string | null>(null)
  const rows = data.deliveries.map((d) => ({ ...d, st: d.status }))
  const list = rows.filter((d) => f === 'all' || d.st === f)
  const n = (s: string) => rows.filter((d) => d.st === s).length
  return (
    <>
      <PageHeader title="Penugasan pengiriman" desc="Koordinasi relawan kurir dan mitra pengantaran bersponsor." />
      <div className="stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Total" value={rows.length} unit="tugas" />
        <Stat label="Menunggu kurir" value={n('Menunggu kurir')} unit="tugas" />
        <Stat label="Dalam pengantaran" value={n('Dalam pengantaran')} unit="tugas" />
        <Stat label="Selesai" value={n('Selesai')} unit="tugas" />
      </div>
      <Panel>
        <div className="mb-4">
          <Filters label="Filter status" value={f} onChange={setF} options={[{ value: 'all', label: 'Semua', count: rows.length }, ...['Menunggu kurir', 'Dalam pengantaran', 'Selesai'].map((s) => ({ value: s, label: s, count: n(s) }))]} />
        </div>
        <Table label="Daftar pengiriman" head={['Tugas', 'Rute', 'Metode', 'Biaya', 'Status', '']}>
          {list.map((d) => (
            <tr key={d.id} className="hover:bg-page">
              <td className={td}><p className="font-semibold">{d.id}</p><p className="text-ink-secondary">{d.transferId} · {d.load}</p></td>
              <td className={td}>{d.from}<br /><span className="text-ink-secondary">→ {d.to}</span></td>
              <td className={td}><span className="inline-flex items-center gap-1"><Truck size={16} aria-hidden="true" />{d.method}</span>{d.courier && <><br /><span className="text-ink-secondary">{d.courier}</span></>}</td>
              <td className={`${td} tabular`}>{d.cost ? rp(d.cost) : 'Rp0'}<br /><span className="text-ink-secondary">{d.cost ? 'Subsidi sponsor' : 'Tanpa biaya'}</span></td>
              <td className={td}><Status status={d.st} /></td>
              <td className={`${td} text-right`}>
                {d.st === 'Menunggu kurir' || d.st === 'Gagal' ? (
                  (
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <label className="sr-only" htmlFor={`kurir-${d.id}`}>Kurir untuk {d.id}</label>
                      <select id={`kurir-${d.id}`} className={`${inputCls} min-h-10 w-44 py-1.5`} value={courier[d.id] ?? ''} onChange={(e) => setCourier({ ...courier, [d.id]: Number(e.target.value) })}>
                        <option value="">Pilih kurir</option>
                        {data.couriers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      <Button
                        className="min-h-10 px-3 text-[0.875rem]"
                        disabled={!courier[d.id]}
                        loading={busy === d.id}
                        onClick={() => {
                          setBusy(d.id)
                          assignCourier(d.transferDbId!, courier[d.id], d.cost)
                            .then(refresh)
                            .then(() => toast(`${d.transferId} ditugaskan ke kurir.`))
                            .catch((e) => toast(messageOf(e), 'info'))
                            .finally(() => setBusy(null))
                        }}
                      >
                        Tugaskan
                      </Button>
                    </div>
                  )
                ) : (
                  <span className="text-ink-secondary">—</span>
                )}
              </td>
            </tr>
          ))}
        </Table>
      </Panel>
    </>
  )
}
