import { useState } from 'react'
import { DownloadSimple, Plus } from '@phosphor-icons/react'
import { Button, Field, inputCls, Notice, toast } from '../../components/ui'
import { AreaField } from '../../components/AreaField'
import { asset } from '../../lib/format'
import { messageOf } from '../../lib/supabase/errors'
import { PLACEMENTS, uploadMedia, type Placement, type Promotion } from '../../services/promotions'
import { savePromotion } from '../../services/adminActions'
import { useAdmin } from '../store'
import { ImagePicker } from '../ImagePicker'
import { Filters, PageHeader, Panel, Status, Table, td } from '../ui'

/* ---------- Promosi (admin konten) ---------- */

/** Rute aplikasi yang boleh dituju banner (server hanya menerima rute internal). */
const LINKS: [string, string][] = [
  ['', 'Tanpa tautan'],
  ['/dukung', 'Dukung Lestari Pangan'],
  ['/tantangan', 'Eco Challenge'],
  ['/reward', 'Reward'],
  ['/tips', 'Tips'],
  ['/resep', 'Resep'],
  ['/donasi', 'Cari/tawarkan pangan'],
  ['/transparansi', 'Transparansi dana'],
]

type Form = { title: string; placement: Placement; link: string; area: string; startsOn: string; endsOn: string; active: boolean; sort: number }
const blank: Form = { title: '', placement: 'beranda', link: '', area: '', startsOn: '', endsOn: '', active: true, sort: 0 }

export function Promotions() {
  const { data } = useAdmin()
  const [f, setF] = useState<'all' | Placement>('all')
  const [editing, setEditing] = useState<Promotion | 'baru' | null>(null)
  const list = data.promotions.filter((p) => f === 'all' || p.placement === f)
  return (
    <>
      <PageHeader
        title="Promosi"
        desc="Banner di Beranda, Tips, Resep, Reward, dan Dukung. Tampil sesuai periode dan wilayah yang dipilih."
        actions={
          <>
            <a href={asset('templates/template-promosi-1200x400.svg')} download className="tap inline-flex min-h-11 items-center gap-2 rounded-control border border-line bg-surface px-4 text-[0.875rem] font-semibold text-primary hover:border-line-control">
              <DownloadSimple size={18} aria-hidden="true" /> Unduh template
            </a>
            <Button className="min-h-11" icon={<Plus size={18} />} onClick={() => setEditing('baru')}>Promosi baru</Button>
          </>
        }
      />
      <Notice tone="info" title="Cara membuat banner">
        Unduh template 1200 × 400 px, buka di Canva atau Figma, ganti teks dan gambar di dalam zona aman, lalu ekspor JPG/PNG/WebP maksimal 2 MB.
      </Notice>
      {editing && <Editor key={editing === 'baru' ? 'baru' : editing.id} base={editing === 'baru' ? null : editing} onClose={() => setEditing(null)} />}
      <Filters
        label="Penempatan"
        value={f}
        onChange={setF}
        options={[{ value: 'all' as const, label: 'Semua', count: data.promotions.length }, ...(Object.keys(PLACEMENTS) as Placement[]).map((k) => ({ value: k, label: PLACEMENTS[k].label, count: data.promotions.filter((p) => p.placement === k).length }))]}
      />
      <Panel>
        <Table label="Daftar promosi" head={['Banner', 'Penempatan', 'Wilayah', 'Periode', 'Status', '']}>
          {list.map((p) => (
            <tr key={p.id} className="hover:bg-page">
              <td className={td}>
                <img src={p.image} alt="" className="mb-2 aspect-[3/1] w-48 rounded-control border border-line object-cover" />
                <p className="font-semibold">{p.title}</p>
                <p className="text-ink-secondary">{p.id}{p.link ? ` · ke ${p.link}` : ''}</p>
              </td>
              <td className={td}>{PLACEMENTS[p.placement].label}</td>
              <td className={td}>{p.area ?? 'Semua wilayah'}</td>
              <td className={td}>{p.startsOn || p.endsOn ? `${p.startsOn ?? '…'} s.d. ${p.endsOn ?? '…'}` : 'Tanpa batas'}</td>
              <td className={td}><Status status={p.active ? 'Aktif' : 'Nonaktif'} /></td>
              <td className={`${td} text-right`}><Button variant="secondary" className="min-h-10 px-3 text-[0.875rem]" onClick={() => setEditing(p)}>Ubah</Button></td>
            </tr>
          ))}
        </Table>
        {list.length === 0 && <p className="py-6 text-center text-body text-ink-secondary">Belum ada promosi.</p>}
      </Panel>
    </>
  )
}

function Editor({ base, onClose }: { base: Promotion | null; onClose: () => void }) {
  const { refresh } = useAdmin()
  const [form, setForm] = useState<Form>(
    base
      ? { title: base.title, placement: base.placement, link: base.link ?? '', area: base.area ?? '', startsOn: base.startsOn ?? '', endsOn: base.endsOn ?? '', active: base.active, sort: base.sort }
      : blank,
  )
  const [file, setFile] = useState<File | null>(null)
  const [allAreas, setAllAreas] = useState(!base?.area)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const tpl = PLACEMENTS[form.placement]
  const set = <K extends keyof Form>(k: K, v: Form[K]) => (setForm({ ...form, [k]: v }), setErr(''))

  const save = async () => {
    if (form.title.trim().length < 3) return setErr('Isi judul promosi (minimal 3 huruf).')
    if (!file && !base) return setErr('Pilih gambar banner.')
    if (!allAreas && !form.area) return setErr('Pilih kabupaten/kota dari daftar, atau pilih semua wilayah.')
    if (form.startsOn && form.endsOn && form.endsOn < form.startsOn) return setErr('Tanggal selesai harus setelah tanggal mulai.')
    setBusy(true)
    try {
      const imagePath = file ? await uploadMedia('promo', file) : base!.imagePath
      await savePromotion(base?.dbId ?? null, {
        title: form.title.trim(),
        placement: form.placement,
        image_path: imagePath,
        link: form.link,
        area: allAreas ? '' : form.area,
        starts_on: form.startsOn || null,
        ends_on: form.endsOn || null,
        active: form.active,
        sort: form.sort,
      })
      await refresh()
      toast(base ? 'Promosi diperbarui.' : 'Promosi dibuat.')
      onClose()
    } catch (e) {
      setErr(messageOf(e))
      setBusy(false)
    }
  }

  return (
    <Panel title={base ? `Ubah ${base.id}` : 'Promosi baru'} desc="Perubahan langsung tampil di aplikasi setelah disimpan.">
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-4">
          <Field label="Judul (dibaca pembaca layar)">{(p) => <input {...p} className={inputCls} value={form.title} onChange={(e) => set('title', e.target.value)} />}</Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Penempatan">
              {(p) => (
                <select {...p} className={inputCls} value={form.placement} onChange={(e) => set('placement', e.target.value as Placement)}>
                  {(Object.keys(PLACEMENTS) as Placement[]).map((k) => <option key={k} value={k}>{PLACEMENTS[k].label}</option>)}
                </select>
              )}
            </Field>
            <Field label="Tautan saat diketuk">
              {(p) => (
                <select {...p} className={inputCls} value={form.link} onChange={(e) => set('link', e.target.value)}>
                  {LINKS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              )}
            </Field>
            <Field label="Mulai tayang" optional>{(p) => <input {...p} type="date" className={inputCls} value={form.startsOn} onChange={(e) => set('startsOn', e.target.value)} />}</Field>
            <Field label="Selesai tayang" optional>{(p) => <input {...p} type="date" className={inputCls} value={form.endsOn} onChange={(e) => set('endsOn', e.target.value)} />}</Field>
            <Field label="Urutan" hint="Angka kecil tampil lebih dulu.">{(p) => <input {...p} type="number" className={inputCls} value={form.sort} onChange={(e) => set('sort', Number(e.target.value))} />}</Field>
          </div>
          <fieldset className="flex flex-col gap-2">
            <legend className="text-label">Wilayah tayang</legend>
            <label className="tap flex min-h-11 cursor-pointer items-center gap-3">
              <input type="checkbox" className="h-5 w-5 accent-primary" checked={allAreas} onChange={(e) => setAllAreas(e.target.checked)} />
              <span className="text-meta">Semua wilayah Indonesia</span>
            </label>
            {!allAreas && <AreaField cityOnly value={form.area} onChange={(a) => set('area', a)} />}
          </fieldset>
          <label className="tap flex min-h-11 cursor-pointer items-center gap-3">
            <input type="checkbox" className="h-5 w-5 accent-primary" checked={form.active} onChange={(e) => set('active', e.target.checked)} />
            <span className="text-meta">Aktif (tampil di aplikasi selama periode berlaku)</span>
          </label>
        </div>
        <ImagePicker file={file} currentUrl={base?.image} onChange={setFile} width={tpl.width} height={tpl.height} label={`Gambar ${tpl.label.toLowerCase()}`} />
      </div>
      {err && <p role="alert" className="mt-3 text-meta font-medium text-danger">{err}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button loading={busy} loadingLabel="Menyimpan…" onClick={save}>{base ? 'Simpan perubahan' : 'Terbitkan promosi'}</Button>
        <Button variant="secondary" onClick={onClose}>Batal</Button>
      </div>
    </Panel>
  )
}
