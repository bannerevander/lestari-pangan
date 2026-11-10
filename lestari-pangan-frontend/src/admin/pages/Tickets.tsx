import { useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { Button, ButtonLink, Field, inputCls, Notice, RadioCard, toast } from '../../components/ui'
import { messageOf } from '../../lib/supabase/errors'
import { replyTicket } from '../../services/adminActions'
import { useAdmin } from '../store'
import { Filters, PageHeader, Panel, Status, Table, td } from '../ui'

/* ---------- Tiket bantuan dan penghapusan data (admin ops) ---------- */

export function Tickets() {
  const { data } = useAdmin()
  const [f, setF] = useState<'open' | 'done' | 'all'>('open')
  const open = data.tickets.filter((t) => t.status !== 'Selesai')
  const list = f === 'all' ? data.tickets : f === 'open' ? open : data.tickets.filter((t) => t.status === 'Selesai')
  return (
    <>
      <PageHeader title="Tiket bantuan" desc="Pertanyaan pengguna dan permintaan penghapusan data. Balasan dikirim sebagai notifikasi." />
      <Filters
        label="Status tiket"
        value={f}
        onChange={setF}
        options={[
          { value: 'open', label: 'Perlu dibalas', count: open.length },
          { value: 'done', label: 'Selesai', count: data.tickets.length - open.length },
          { value: 'all', label: 'Semua', count: data.tickets.length },
        ]}
      />
      <Panel>
        <Table label="Daftar tiket" head={['Tiket', 'Pengirim', 'Topik', 'Status', '']}>
          {list.map((t) => (
            <tr key={t.id} className="hover:bg-page">
              <td className={td}><p className="font-semibold">{t.id}</p><p className="text-ink-secondary">{t.at}</p></td>
              <td className={td}>{t.org}</td>
              <td className={td}><p className="font-medium">{t.kind === 'Hapus data' ? 'Penghapusan data · ' : ''}{t.topic}</p><p className="line-clamp-2 text-ink-secondary">{t.message}</p></td>
              <td className={td}><Status status={t.status === 'Dikirim' ? 'Menunggu balasan' : t.status} /></td>
              <td className={`${td} text-right`}><ButtonLink to={`/admin/tiket/${t.id}`} variant={t.status === 'Selesai' ? 'secondary' : 'primary'} className="min-h-10 px-3 text-[0.875rem]">{t.status === 'Selesai' ? 'Lihat' : 'Balas'}</ButtonLink></td>
            </tr>
          ))}
        </Table>
        {list.length === 0 && <p className="py-6 text-center text-body text-ink-secondary">Tidak ada tiket di filter ini.</p>}
      </Panel>
    </>
  )
}

export function TicketDetail() {
  const { id } = useParams()
  const { data, refresh } = useAdmin()
  const t = data.tickets.find((x) => x.id === id)
  const [status, setStatus] = useState<'Ditangani' | 'Selesai'>('Selesai')
  const [reply, setReply] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  if (!t) return <Navigate to="/admin/tiket" replace />
  const send = () => {
    if (reply.trim().length < 5) return setErr('Tulis balasan minimal 5 karakter.')
    setBusy(true)
    replyTicket(t.dbId, status, reply.trim())
      .then(refresh)
      .then(() => {
        setReply('')
        toast('Balasan terkirim ke pengguna.')
      })
      .catch((e) => setErr(messageOf(e)))
      .finally(() => setBusy(false))
  }
  return (
    <>
      <PageHeader back="/admin/tiket" title={`Tiket ${t.id}`} desc={`${t.org} · ${t.at}`} actions={<Status status={t.status} />} />
      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <Panel title={t.kind === 'Hapus data' ? `Permintaan penghapusan: ${t.topic}` : t.topic} desc={t.related ? `Terkait ${t.related}` : undefined}>
          <p className="whitespace-pre-line text-body">{t.message || 'Tanpa pesan tambahan.'}</p>
          {t.kind === 'Hapus data' && (
            <Notice tone="warning" title="Proses penghapusan">
              Hubungi pengguna untuk konfirmasi. Hapus akun lewat Supabase Auth setelah tidak ada penyaluran berjalan; riwayat serah terima tetap diarsipkan untuk audit.
            </Notice>
          )}
          {t.reply && <p className="mt-4 rounded-control bg-primary-container p-3 text-meta"><span className="font-semibold">Balasan terakhir:</span> {t.reply}</p>}
        </Panel>
        {t.status !== 'Selesai' && (
          <Panel title="Balas tiket" desc="Balasan dicatat di log audit.">
            <fieldset className="flex flex-col gap-2">
              <legend className="sr-only">Status setelah dibalas</legend>
              <RadioCard name="st" checked={status === 'Ditangani'} onChange={() => setStatus('Ditangani')} title="Masih ditangani" description="Pengguna tahu tiket sedang diproses." />
              <RadioCard name="st" checked={status === 'Selesai'} onChange={() => setStatus('Selesai')} title="Selesai" description="Tiket ditutup setelah balasan ini." />
            </fieldset>
            <div className="mt-4">
              <Field label="Balasan" error={err}>{(p) => <textarea {...p} rows={4} className={inputCls} value={reply} onChange={(e) => (setReply(e.target.value), setErr(''))} />}</Field>
            </div>
            <Button block className="mt-4" loading={busy} loadingLabel="Mengirim…" onClick={send}>Kirim balasan</Button>
          </Panel>
        )}
      </div>
    </>
  )
}
