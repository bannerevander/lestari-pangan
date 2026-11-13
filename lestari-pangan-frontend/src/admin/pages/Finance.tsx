import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowRight, DownloadSimple, LockSimple, Package } from '@phosphor-icons/react'
import { Badge, Button, ButtonLink, CountUp, Field, inputCls, Notice, PolicyNote, toast } from '../../components/ui'
import { useAdmin } from '../store'
import type { Txn } from '../data'
import { DecisionPanel, Filters, PageHeader, Panel, rp, Stat, Status, Table, td } from '../ui'
import { messageOf } from '../../lib/supabase/errors'
import { recordLedger, saveProgram } from '../../services/adminActions'

/** Kas dihitung hanya dari entri buku kas yang sah; dukungan yang belum divalidasi tidak dihitung. */
const cash = (txns: Txn[]) => {
  const valid = txns.filter((t) => t.status === 'Tervalidasi' || t.status === 'Pembalik')
  const inn = valid.filter((t) => t.kind === 'Masuk').reduce((s, t) => s + t.amount, 0)
  const out = valid.filter((t) => t.kind === 'Keluar').reduce((s, t) => s + t.amount, 0)
  return { inn, out, left: inn - out }
}

const FUNDS = [
  ['operasional', 'Operasional'],
  ['pengiriman', 'Subsidi ongkir'],
  ['bantuan_langsung', 'Bantuan langsung'],
  ['program', 'Program'],
] as const

/** Formulir entri buku kas (admin keuangan). Uang tidak pernah diubah; koreksi = entri pembalik. */
function LedgerForm({ onClose }: { onClose: () => void }) {
  const { data, refresh } = useAdmin()
  const [f, setF] = useState({ kind: 'Keluar' as 'Masuk' | 'Keluar', fund: 'pengiriman', amount: '', source: '', note: '', programId: '' })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = () => {
    const amount = Number(f.amount)
    if (!(amount > 0) || !f.source.trim() || !f.note.trim()) return setErr('Isi nominal, sumber/penerima, dan keterangan.')
    if (f.fund === 'program' && !f.programId) return setErr('Pilih program.')
    setBusy(true)
    recordLedger({ kind: f.kind, fund: f.fund, amount, source: f.source.trim(), note: f.note.trim(), programId: f.fund === 'program' ? Number(f.programId) : undefined })
      .then(refresh)
      .then(() => {
        toast('Entri buku kas tersimpan.')
        onClose()
      })
      .catch((e) => setErr(messageOf(e)))
      .finally(() => setBusy(false))
  }
  return (
    <Panel title="Entri buku kas" desc="Tercatat permanen. Pengeluaran tidak boleh melebihi saldo dana tujuannya.">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Jenis">{(p) => <select {...p} className={inputCls} value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value as 'Masuk' | 'Keluar' })}><option value="Keluar">Pengeluaran</option><option value="Masuk">Dana masuk</option></select>}</Field>
        <Field label="Dana">{(p) => <select {...p} className={inputCls} value={f.fund} onChange={(e) => setF({ ...f, fund: e.target.value })}>{FUNDS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>}</Field>
        {f.fund === 'program' && (
          <Field label="Program">{(p) => <select {...p} className={inputCls} value={f.programId} onChange={(e) => setF({ ...f, programId: e.target.value })}><option value="">Pilih program</option>{data.programs.map((g) => <option key={g.id} value={g.dbId}>{g.title}</option>)}</select>}</Field>
        )}
        <Field label="Nominal (Rp)">{(p) => <input {...p} inputMode="numeric" className={inputCls} value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value.replace(/\D/g, '') })} />}</Field>
        <Field label={f.kind === 'Masuk' ? 'Sumber dana' : 'Dibayarkan ke'}>{(p) => <input {...p} className={inputCls} value={f.source} onChange={(e) => setF({ ...f, source: e.target.value })} />}</Field>
        <Field label="Keterangan">{(p) => <input {...p} className={inputCls} value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} />}</Field>
      </div>
      {err && <p role="alert" className="mt-3 text-meta font-medium text-danger">{err}</p>}
      <div className="mt-4 flex gap-2">
        <Button loading={busy} onClick={submit}>Simpan entri</Button>
        <Button variant="secondary" onClick={onClose}>Batal</Button>
      </div>
    </Panel>
  )
}

/* ---------- AD18 Dana dan transaksi ---------- */

export function Funds() {
  const { txns } = useAdmin().data
  const [f, setF] = useState<'all' | 'Masuk' | 'Keluar' | 'Barang'>('all')
  const [adding, setAdding] = useState(false)
  const { inn, out, left } = cash(txns)
  const list = txns.filter((t) => f === 'all' || t.kind === f)
  return (
    <>
      <PageHeader
        title="Dana dan transaksi"
        desc="Kas program, biaya logistik, dan bantuan barang dicatat terpisah (OD-07)."
        actions={<><ButtonLink to="/admin/laporan" variant="secondary" className="min-h-11">Pratinjau laporan</ButtonLink><Button className="min-h-11" onClick={() => setAdding(!adding)}>Catat transaksi</Button></>}
      />
      <div className="stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Dana masuk" value={inn} format={rp} hint="Tervalidasi di buku kas" />
        <Stat label="Realisasi" value={out} format={rp} hint={`${inn ? Math.round((out / inn) * 100) : 0}% dari dana masuk`} />
        <Stat label="Sisa kas" value={left} format={rp} hint="Siap dialokasikan" />
        <Stat label="Bantuan barang" value={txns.filter((t) => t.kind === 'Barang').length} unit="catatan" hint="Tidak dikonversi ke rupiah" />
      </div>
      {adding && <LedgerForm onClose={() => setAdding(false)} />}
      <Panel title="Buku transaksi">
        <div className="mb-4">
          <Filters label="Jenis transaksi" value={f} onChange={setF} options={[{ value: 'all', label: 'Semua' }, { value: 'Masuk', label: 'Dana masuk' }, { value: 'Keluar', label: 'Pengeluaran' }, { value: 'Barang', label: 'Barang/jasa' }]} />
        </div>
        <Table label="Buku transaksi" head={['Tanggal dan referensi', 'Tujuan', 'Sumber', 'Nominal', 'Status', '']}>
          {list.map((t) => (
            <tr key={t.id} className="hover:bg-page">
              <td className={td}><p className="font-semibold">{t.id}</p><p className="text-ink-secondary">{t.date}</p></td>
              <td className={td}>{t.purpose}</td>
              <td className={td}>{t.source}</td>
              <td className={`${td} whitespace-nowrap font-semibold tabular ${t.kind === 'Masuk' ? 'text-primary' : t.kind === 'Keluar' ? 'text-ink' : 'text-ink-secondary'}`}>
                {t.kind === 'Barang' ? t.goods : `${t.kind === 'Masuk' ? '+' : '−'}${rp(t.amount)}`}
              </td>
              <td className={td}><Status status={t.status} /></td>
              <td className={`${td} text-right`}>
                <Link to={`/admin/dana/${t.id}`} className="inline-flex min-h-10 items-center gap-1 font-semibold text-primary hover:underline">Detail<ArrowRight size={14} weight="bold" aria-hidden="true" /></Link>
              </td>
            </tr>
          ))}
        </Table>
        {list.length === 0 && <p className="py-6 text-center text-body text-ink-secondary">Belum ada transaksi.</p>}
      </Panel>
    </>
  )
}

/* ---------- AD19 Detail transaksi ---------- */

export function FundDetail() {
  const { id } = useParams()
  const { data } = useAdmin()
  const t = data.txns.find((x) => x.id === id)
  if (!t) return <Navigate to="/admin/dana" replace />
  const st = t.status
  return (
    <>
      <PageHeader back="/admin/dana" title={t.id} desc={`${t.purpose} · ${t.date}`} actions={<Status status={st} />} />
      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="flex min-w-0 flex-col gap-4">
          <Panel>
            <p className="text-caption font-semibold uppercase tracking-wide text-ink-secondary">{t.kind === 'Barang' ? 'Jumlah fisik' : 'Nominal bersih'}</p>
            <p className="mt-1 text-[2.5rem] font-bold leading-[3rem] text-primary-pressed">{t.kind === 'Barang' ? t.goods : <CountUp value={t.amount} format={rp} />}</p>
            <p className="text-meta text-ink-secondary">{t.kind} · {t.purpose}</p>
          </Panel>
          <Panel title="Bukti dan keterkaitan" actions={<Badge tone="neutral" icon={false}><LockSimple size={14} aria-hidden="true" className="mr-1 inline" />Akses keuangan</Badge>}>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div><dt className="text-meta text-ink-secondary">Sumber</dt><dd className="font-medium">{t.source}</dd></div>
              <div><dt className="text-meta text-ink-secondary">Keterkaitan penyaluran</dt><dd className="font-medium">{t.linked ? <Link className="text-primary hover:underline" to={`/admin/penyaluran/${t.linked}`}>{t.linked}</Link> : 'Tidak terkait kegiatan tertentu'}</dd></div>
            </dl>
          </Panel>
        </div>
        {t.id.startsWith('DKG') && t.status === 'Menunggu verifikasi' ? (
            <DecisionPanel target={t.id} current={st} title="Validasi dukungan" options={[
              { value: 'Tervalidasi', label: 'Validasi', desc: 'Dana sudah masuk rekening; dicatat ke buku kas.' },
              { value: 'Dibatalkan', label: 'Batalkan', desc: 'Dana tidak diterima atau dibatalkan pendukung.' },
            ]} />
          ) : t.id.startsWith('INK') && t.status === 'Menunggu peninjauan' ? (
            <DecisionPanel target={t.id} current={st} title="Peninjauan bantuan barang" options={[
              { value: 'Dicatat fisik', label: 'Catat fisik', desc: 'Barang/jasa diterima; dicatat dalam jumlah fisik.' },
              { value: 'Ditolak', label: 'Tolak', desc: 'Tidak sesuai kebutuhan atau tidak tersedia.' },
            ]} />
          ) : t.id.startsWith('TRX') && t.status === 'Tervalidasi' ? (
            <DecisionPanel target={t.id} current={st} title="Koreksi entri" options={[
              { value: 'Dibalik', label: 'Buat entri pembalik', desc: 'Entri lama tetap ada; entri baru membatalkan nominalnya.' },
            ]} />
          ) : (
            <Panel title="Status"><p className="text-body text-ink-secondary">Tidak ada tindakan untuk transaksi ini.</p></Panel>
          )}
      </div>
    </>
  )
}

/* ---------- AD20 Program dan sponsor ---------- */

export function Programs() {
  const { data, refresh } = useAdmin()
  const { programs } = data
  const [adding, setAdding] = useState(false)
  const [f, setF] = useState({ title: '', sponsor: '', start: '', end: '', budget: '' })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = () => {
    if (!f.title.trim() || !f.sponsor.trim() || !f.start || !f.end) return setErr('Isi judul, sponsor, dan periode.')
    if (f.end < f.start) return setErr('Tanggal selesai harus setelah tanggal mulai.')
    setBusy(true)
    saveProgram(null, { title: f.title.trim(), sponsor: f.sponsor.trim(), period_start: f.start, period_end: f.end, budget: Number(f.budget) || 0 })
      .then(refresh)
      .then(() => {
        toast('Program dibuat.')
        setAdding(false)
        setF({ title: '', sponsor: '', start: '', end: '', budget: '' })
      })
      .catch((e) => setErr(messageOf(e)))
      .finally(() => setBusy(false))
  }
  return (
    <>
      <PageHeader title="Program dan sponsor" desc="Laporan program disusun dari porsi terverifikasi. Tidak menjual klaim prioritas." actions={<Button className="min-h-11" onClick={() => setAdding(!adding)}>Program baru</Button>} />
      {adding && (
        <Panel title="Program baru">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Judul program">{(p) => <input {...p} className={inputCls} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />}</Field>
            <Field label="Sponsor">{(p) => <input {...p} className={inputCls} value={f.sponsor} onChange={(e) => setF({ ...f, sponsor: e.target.value })} />}</Field>
            <Field label="Mulai">{(p) => <input {...p} type="date" className={inputCls} value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })} />}</Field>
            <Field label="Selesai">{(p) => <input {...p} type="date" className={inputCls} value={f.end} onChange={(e) => setF({ ...f, end: e.target.value })} />}</Field>
            <Field label="Anggaran komitmen (Rp)" optional>{(p) => <input {...p} inputMode="numeric" className={inputCls} value={f.budget} onChange={(e) => setF({ ...f, budget: e.target.value.replace(/\D/g, '') })} />}</Field>
          </div>
          {err && <p role="alert" className="mt-3 text-meta font-medium text-danger">{err}</p>}
          <div className="mt-4 flex gap-2">
            <Button loading={busy} onClick={submit}>Simpan program</Button>
            <Button variant="secondary" onClick={() => setAdding(false)}>Batal</Button>
          </div>
        </Panel>
      )}
      <div className="stagger flex flex-col gap-4">
        {programs.length === 0 && <Panel><p className="text-body text-ink-secondary">Belum ada program.</p></Panel>}
        {programs.map((p) => (
          <Panel key={p.id}>
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-caption font-semibold text-primary">{p.id}</p>
                <h2 className="text-card-title">{p.title}</h2>
                <p className="text-meta text-ink-secondary">Sponsor {p.sponsor} · {p.period}</p>
              </div>
              <Status status={p.status} />
            </div>
            {p.budget ? (
              <>
                <dl className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-control bg-page p-3"><dt className="text-caption text-ink-secondary">Anggaran</dt><dd className="font-bold tabular">{rp(p.budget)}</dd></div>
                  <div className="rounded-control bg-page p-3"><dt className="text-caption text-ink-secondary">Terpakai</dt><dd className="font-bold tabular">{rp(p.used)}</dd></div>
                  <div className="rounded-control bg-primary-container p-3"><dt className="text-caption text-ink-secondary">Kegiatan terkait</dt><dd className="font-bold text-primary">{p.transfers} kegiatan</dd></div>
                </dl>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-line" role="img" aria-label={`${Math.round((p.used / p.budget) * 100)}% anggaran terpakai`}>
                  <span className="block h-full origin-left animate-grow-x rounded-full bg-primary" style={{ width: `${(p.used / p.budget) * 100}%` }} />
                </div>
              </>
            ) : (
              <p className="mt-3 text-meta text-ink-secondary">Belum ada dana masuk. Program tampil publik setelah komitmen sponsor diterima.</p>
            )}
          </Panel>
        ))}
      </div>
      <Panel title="Dukungan nontunai terintegrasi" actions={<Package size={22} aria-hidden="true" className="text-primary" />}>
        <p className="text-body text-ink-secondary">
          {data.txns.filter((t) => t.kind === 'Barang' && t.status === 'Dicatat fisik').map((t) => `${t.goods} ${t.purpose.toLowerCase()} dari ${t.source}`).join(' · ') || 'Belum ada bantuan barang yang dicatat.'}
        </p>
      </Panel>
    </>
  )
}

/* ---------- AD21 Laporan terbuka ---------- */

/** Buku kas sebagai CSV (UTF-8 dengan BOM agar Excel membaca huruf Indonesia dengan benar). */
function downloadLedgerCsv(txns: Txn[]) {
  const cell = (v: string | number | undefined) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const rows = [
    ['Kode', 'Tanggal', 'Jenis', 'Tujuan', 'Sumber', 'Jumlah (Rp)', 'Barang', 'Terkait', 'Status'],
    ...txns.map((t) => [t.id, t.date, t.kind, t.purpose, t.source, t.kind === 'Barang' ? '' : t.amount, t.goods, t.linked, t.status]),
  ]
  const csv = '\ufeff' + rows.map((r) => r.map(cell).join(',')).join('\r\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const a = Object.assign(document.createElement('a'), { href: url, download: `buku-kas-lestari-pangan-${new Date().toISOString().slice(0, 10)}.csv` })
  a.click()
  URL.revokeObjectURL(url)
}

export function Reports() {
  const { data } = useAdmin()
  const [period, setPeriod] = useState('Semua periode')
  const [unit, setUnit] = useState<'porsi' | 'kg' | 'kemasan'>('porsi')
  const { inn, out, left } = cash(data.txns)
  const impact = data.impact[unit] ?? { offered: 0, received: 0, rejected: 0, distributed: 0 }
  const empty = impact.offered === 0
  return (
    <>
      <PageHeader
        title="Laporan terbuka"
        desc="Agregat dana dan dampak fisik untuk publik dan sponsor."
        actions={
          <>
            <Button variant="secondary" className="min-h-11 print:hidden" icon={<DownloadSimple size={18} />} onClick={() => downloadLedgerCsv(data.txns)}>Ekspor CSV</Button>
            {/* Dialog cetak browser punya pilihan "Simpan sebagai PDF"; menu admin disembunyikan lewat kelas print:. */}
            <Button className="min-h-11 print:hidden" onClick={() => window.print()}>Cetak / simpan PDF</Button>
          </>
        }
      />
      <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center md:gap-6">
        <Filters label="Periode" value={period} onChange={setPeriod} options={['Semua periode'].map((v) => ({ value: v, label: v }))} />
        <Filters label="Satuan" value={unit} onChange={setUnit} options={[{ value: 'porsi', label: 'Porsi' }, { value: 'kg', label: 'Kilogram' }, { value: 'kemasan', label: 'Kemasan' }]} />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="1. Realisasi kas" desc="Sumber: mutasi terbuka">
          <dl className="grid grid-cols-3 gap-2">
            {[['Pemasukan', inn], ['Pengeluaran', out], ['Sisa kas', left]].map(([k, v]) => (
              <div key={k as string} className="rounded-control bg-page p-3"><dt className="text-caption text-ink-secondary">{k}</dt><dd className="font-bold tabular"><CountUp value={v as number} format={rp} /></dd></div>
            ))}
          </dl>
        </Panel>
        <Panel title={`2. Dampak fisik (${unit})`} desc="Satuan tidak pernah dijumlahkan silang.">
          {empty ? (
            <p className="rounded-control border border-dashed border-line p-4 text-center text-body text-ink-secondary">Belum ada data dalam satuan {unit} pada periode ini.</p>
          ) : (
            <ul key={unit} className="flex flex-col gap-3">
              {[
                ['Ditawarkan', impact.offered, 'bg-line-control'],
                ['Diterima penerima', impact.received, 'bg-primary'],
                ['Tidak diterima saat serah terima', impact.rejected, 'bg-accent'],
                ['Dibagikan ke warga', impact.distributed, 'bg-leaf'],
              ].map(([k, v, c]) => (
                <li key={k as string}>
                  <div className="flex justify-between text-meta"><span>{k}</span><span className="font-semibold tabular">{v} {unit}</span></div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-page"><span className={`block h-full origin-left animate-grow-x rounded-full ${c}`} style={{ width: `${((v as number) / impact.offered) * 100}%` }} /></div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
      <PolicyNote title="Prinsip laporan">Tidak memuat estimasi emisi atau nilai rupiah pangan yang diselamatkan. Angka dari konfirmasi penerimaan dan laporan distribusi.</PolicyNote>
    </>
  )
}

/* ---------- AD22 Riwayat perubahan ---------- */

export function AuditLog() {
  const { data } = useAdmin()
  const [q, setQ] = useState('')
  const list = data.audit.filter((a) => (a.target + a.actor + a.reason).toLowerCase().includes(q.toLowerCase()))
  return (
    <>
      <PageHeader title="Riwayat perubahan" desc="Log append-only: setiap entri memuat waktu, pelaku, nilai sebelum dan sesudah, serta alasan." actions={<Button variant="secondary" className="min-h-11" icon={<DownloadSimple size={18} />} onClick={() => toast('Unduhan log bertanda tangan tersedia di produksi.', 'info')}>Unduh log</Button>} />
      <Notice tone="info" title="Tidak dapat diubah atau dihapus">Koreksi dilakukan dengan entri baru, bukan menimpa entri lama (NFR-02).</Notice>
      <Panel title={`${list.length} entri`}>
        <label className="mb-4 block md:w-80">
          <span className="sr-only">Cari entitas, pelaku, atau alasan</span>
          <input type="search" className={`${inputCls} min-h-11 py-2`} placeholder="Cari entitas, pelaku, atau alasan" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <Table label="Log audit" head={['Waktu', 'Pelaku', 'Entitas', 'Sebelum → sesudah', 'Alasan']}>
          {list.map((a) => (
            <tr key={a.id}>
              <td className={`${td} whitespace-nowrap`}><p className="font-semibold tabular">{a.at}</p><p className="text-ink-secondary">{a.id}</p></td>
              <td className={td}>{a.actor}</td>
              <td className={`${td} font-semibold`}>{a.target}</td>
              <td className={td}><span className="text-ink-secondary line-through">{a.before}</span><br /><span className="font-medium">{a.after}</span></td>
              <td className={`${td} text-ink-secondary`}>{a.reason}</td>
            </tr>
          ))}
        </Table>
      </Panel>
    </>
  )
}
