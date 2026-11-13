import { useState } from 'react'
import { DownloadSimple, Plus } from '@phosphor-icons/react'
import { Button, Field, inputCls, Notice, Segmented, toast } from '../../components/ui'
import { AreaField } from '../../components/AreaField'
import { asset } from '../../lib/format'
import { messageOf } from '../../lib/supabase/errors'
import { AUDIENCES, PLACEMENTS, uploadMedia, type Audience, type Placement, type Promotion } from '../../services/promotions'
import { savePromotion } from '../../services/adminActions'
import { useAdmin } from '../store'
import { ImagePicker } from '../ImagePicker'
import { BannerMaker } from '../BannerMaker'
import { BANNER, composeBanner, type BannerText } from '../banner'
import { Filters, PageHeader, Panel, Status, Table, td } from '../ui'

/* ---------- Promosi (admin konten) ---------- */

/** Rute aplikasi yang boleh dituju banner (server hanya menerima rute internal). */
const LINKS: [string, string][] = [
  ['', 'Tidak membuka apa-apa'],
  ['/donasi/baru', 'Formulir tawarkan pangan (untuk pemberi)'],
  ['/donasi', 'Daftar pangan / penawaran'],
  ['/tips', 'Halaman Tips'],
  ['/resep', 'Halaman Resep'],
  ['/tantangan', 'Eco Challenge'],
  ['/reward', 'Reward'],
  ['/dukung', 'Dukung Lestari Pangan'],
  ['/transparansi', 'Transparansi dana'],
]

/** Tempat banner muncul, dijelaskan dengan bahasa pengguna; tautan bawaan yang paling masuk akal. */
const WHERE: Record<Placement, { hint: string; link: string }> = {
  beranda: { hint: 'Paling atas halaman Beranda.', link: '/donasi' },
  tips: { hint: 'Di atas daftar Tips.', link: '/tips' },
  resep: { hint: 'Di atas halaman Resep.', link: '/resep' },
  reward: { hint: 'Di halaman Reward.', link: '/tantangan' },
  dukung: { hint: 'Di halaman Dukung Lestari Pangan.', link: '/transparansi' },
}

type Form = { title: string; placement: Placement; audience: Audience; link: string; area: string; startsOn: string; endsOn: string; active: boolean; sort: number }
const blank: Form = { title: '', placement: 'beranda', audience: 'semua', link: WHERE.beranda.link, area: '', startsOn: '', endsOn: '', active: true, sort: 0 }

export function Promotions() {
  const { data } = useAdmin()
  const [f, setF] = useState<'all' | Placement>('all')
  const [editing, setEditing] = useState<Promotion | 'baru' | null>(null)
  const list = data.promotions.filter((p) => f === 'all' || p.placement === f)
  return (
    <>
      <PageHeader
        title="Promosi"
        desc="Banner di Beranda, Tips, Resep, Reward, dan Dukung. Perubahan langsung tampil di semua HP pengguna."
        actions={<Button className="min-h-11" icon={<Plus size={18} />} onClick={() => setEditing('baru')}>Buat banner</Button>}
      />
      {editing && <Editor key={editing === 'baru' ? 'baru' : editing.id} base={editing === 'baru' ? null : editing} onClose={() => setEditing(null)} />}
      <Filters
        label="Halaman"
        value={f}
        onChange={setF}
        options={[{ value: 'all' as const, label: 'Semua', count: data.promotions.length }, ...(Object.keys(PLACEMENTS) as Placement[]).map((k) => ({ value: k, label: PLACEMENTS[k].label, count: data.promotions.filter((p) => p.placement === k).length }))]}
      />
      <Panel>
        <Table label="Daftar promosi" head={['Banner', 'Halaman', 'Untuk', 'Wilayah', 'Periode', 'Status', '']}>
          {list.map((p) => (
            <tr key={p.id} className="hover:bg-page">
              <td className={td}>
                <img src={p.image} alt="" className="mb-2 aspect-[3/1] w-48 rounded-control border border-line object-cover" />
                <p className="font-semibold">{p.title}</p>
                <p className="text-ink-secondary">{p.id}{p.link ? ` · membuka ${LINKS.find(([v]) => v === p.link)?.[1] ?? p.link}` : ''}</p>
              </td>
              <td className={td}>{PLACEMENTS[p.placement].label}</td>
              <td className={td}>{AUDIENCES[p.audience]}</td>
              <td className={td}>{p.area ?? 'Semua wilayah'}</td>
              <td className={td}>{p.startsOn || p.endsOn ? `${p.startsOn ?? '…'} s.d. ${p.endsOn ?? '…'}` : 'Tanpa batas'}</td>
              <td className={td}><Status status={p.active ? 'Aktif' : 'Nonaktif'} /></td>
              <td className={`${td} text-right`}><Button variant="secondary" className="min-h-10 px-3 text-[0.875rem]" onClick={() => setEditing(p)}>Ubah</Button></td>
            </tr>
          ))}
        </Table>
        {list.length === 0 && <p className="py-6 text-center text-body text-ink-secondary">Belum ada promosi. Klik Buat banner untuk mulai.</p>}
      </Panel>
    </>
  )
}

function Editor({ base, onClose }: { base: Promotion | null; onClose: () => void }) {
  const { refresh } = useAdmin()
  const [form, setForm] = useState<Form>(
    base
      ? { title: base.title, placement: base.placement, audience: base.audience, link: base.link ?? '', area: base.area ?? '', startsOn: base.startsOn ?? '', endsOn: base.endsOn ?? '', active: base.active, sort: base.sort }
      : blank,
  )
  // Banner baru: dibuat dari foto + teks. Banner lama: gambarnya dipertahankan kecuali diganti.
  const [mode, setMode] = useState<'buat' | 'jadi'>(base ? 'jadi' : 'buat')
  const [photo, setPhoto] = useState<File | null>(null)
  const [text, setText] = useState<BannerText>({ title: '', sentence: '', button: '' })
  const [file, setFile] = useState<File | null>(null)
  const [allAreas, setAllAreas] = useState(!base?.area)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const set = <K extends keyof Form>(k: K, v: Form[K]) => (setForm((f) => ({ ...f, [k]: v })), setErr(''))
  const pickPlacement = (p: Placement) =>
    setForm((f) => ({ ...f, placement: p, link: base || f.link !== WHERE[f.placement].link ? f.link : WHERE[p].link }))

  const save = async () => {
    if (mode === 'buat') {
      if (!photo) return setErr('Pilih foto untuk banner.')
      if (text.title.trim().length < 3) return setErr('Isi judul banner (minimal 3 huruf).')
    } else {
      if (!file && !base) return setErr('Pilih gambar banner.')
      if (form.title.trim().length < 3) return setErr('Tulis ulang teks yang ada di banner (minimal 3 huruf).')
    }
    if (!allAreas && !form.area) return setErr('Pilih kabupaten/kota dari daftar, atau centang Semua wilayah.')
    if (form.startsOn && form.endsOn && form.endsOn < form.startsOn) return setErr('Tanggal selesai harus setelah tanggal mulai.')
    setBusy(true)
    try {
      const image = mode === 'buat' ? await composeBanner(photo!, text) : file
      const imagePath = image ? await uploadMedia('promo', image) : base!.imagePath
      // Teks alternatif untuk pembaca layar = tulisan pada banner.
      const title = mode === 'buat' ? [text.title, text.sentence].map((s) => s.trim()).filter(Boolean).join('. ') : form.title.trim()
      await savePromotion(base?.dbId ?? null, {
        title,
        placement: form.placement,
        audience: form.audience,
        image_path: imagePath,
        link: form.link,
        area: allAreas ? '' : form.area,
        starts_on: form.startsOn || null,
        ends_on: form.endsOn || null,
        active: form.active,
        sort: form.sort,
      })
      await refresh()
      toast(base ? 'Banner diperbarui dan langsung tampil di aplikasi.' : 'Banner diterbitkan dan langsung tampil di aplikasi.')
      onClose()
    } catch (e) {
      setErr(messageOf(e))
      setBusy(false)
    }
  }

  return (
    <Panel title={base ? `Ubah banner ${base.id}` : 'Buat banner'} desc="Tiga langkah: pilih tempat, buat banner, lalu terbitkan.">
      <div className="flex max-w-[720px] flex-col gap-6">
        <section className="flex flex-col gap-3">
          <h3 className="text-card-title">Langkah 1 · Tampil di mana dan untuk siapa?</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Halaman" hint={WHERE[form.placement].hint}>
              {(p) => (
                <select {...p} className={inputCls} value={form.placement} onChange={(e) => pickPlacement(e.target.value as Placement)}>
                  {(Object.keys(PLACEMENTS) as Placement[]).map((k) => <option key={k} value={k}>{PLACEMENTS[k].label}</option>)}
                </select>
              )}
            </Field>
            <Field label="Untuk siapa" hint="Ajakan menawarkan pangan sebaiknya hanya untuk pemberi.">
              {(p) => (
                <select {...p} className={inputCls} value={form.audience} onChange={(e) => set('audience', e.target.value as Audience)}>
                  {(Object.keys(AUDIENCES) as Audience[]).map((k) => <option key={k} value={k}>{AUDIENCES[k]}</option>)}
                </select>
              )}
            </Field>
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h3 className="text-card-title">Langkah 2 · Banner</h3>
          <Segmented
            label="Cara membuat banner"
            value={mode}
            onChange={setMode}
            options={[
              { value: 'buat', label: base ? 'Buat ulang dari foto' : 'Buat dari foto (disarankan)' },
              { value: 'jadi', label: base ? 'Pakai/ganti gambar jadi' : 'Sudah punya banner jadi' },
            ]}
          />
          {mode === 'buat' ? (
            <BannerMaker photo={photo} onPhoto={setPhoto} text={text} onText={setText} />
          ) : (
            <>
              <ImagePicker file={file} currentUrl={base?.image} onChange={setFile} width={BANNER.width} height={BANNER.height} label="Gambar banner" />
              <Field label="Tulisan yang ada di banner" hint="Ketik ulang tulisannya agar pengguna tunanetra tetap tahu isi banner.">
                {(p) => <input {...p} className={inputCls} value={form.title} onChange={(e) => set('title', e.target.value)} />}
              </Field>
              <a href={asset('templates/template-promosi-1200x400.svg')} download className="inline-flex items-center gap-1.5 self-start text-[0.875rem] font-semibold text-primary hover:underline">
                <DownloadSimple size={16} aria-hidden="true" /> Unduh template desain (untuk Canva/Figma)
              </a>
            </>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <h3 className="text-card-title">Langkah 3 · Saat banner diketuk, buka…</h3>
          <Field label="Halaman tujuan">
            {(p) => (
              <select {...p} className={inputCls} value={form.link} onChange={(e) => set('link', e.target.value)}>
                {LINKS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                {form.link && !LINKS.some(([v]) => v === form.link) && <option value={form.link}>{form.link}</option>}
              </select>
            )}
          </Field>
        </section>

        <details className="rounded-control border border-line bg-page p-4">
          <summary className="tap min-h-11 cursor-pointer font-semibold">Pengaturan lanjutan (opsional): jadwal, wilayah, urutan</summary>
          <div className="mt-4 flex flex-col gap-4">
            <p className="text-meta text-ink-secondary">Biarkan kosong agar banner tampil terus di semua wilayah.</p>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Mulai tampil" optional>{(p) => <input {...p} type="date" className={inputCls} value={form.startsOn} onChange={(e) => set('startsOn', e.target.value)} />}</Field>
              <Field label="Berhenti tampil" optional>{(p) => <input {...p} type="date" className={inputCls} value={form.endsOn} onChange={(e) => set('endsOn', e.target.value)} />}</Field>
              <Field label="Urutan" hint="Bila ada beberapa banner di halaman yang sama, angka kecil tampil lebih dulu.">{(p) => <input {...p} type="number" min={0} className={inputCls} value={form.sort} onChange={(e) => set('sort', Number(e.target.value))} />}</Field>
            </div>
            <fieldset className="flex flex-col gap-2">
              <legend className="text-label">Wilayah</legend>
              <label className="tap flex min-h-11 cursor-pointer items-center gap-3">
                <input type="checkbox" className="h-5 w-5 accent-primary" checked={allAreas} onChange={(e) => setAllAreas(e.target.checked)} />
                <span className="text-meta">Semua wilayah Indonesia</span>
              </label>
              {!allAreas && <AreaField cityOnly value={form.area} onChange={(a) => set('area', a)} />}
            </fieldset>
            <label className="tap flex min-h-11 cursor-pointer items-center gap-3">
              <input type="checkbox" className="h-5 w-5 accent-primary" checked={form.active} onChange={(e) => set('active', e.target.checked)} />
              <span className="text-meta">Tampilkan banner ini (hapus centang untuk menyembunyikan sementara)</span>
            </label>
          </div>
        </details>

        {err && <Notice tone="danger">{err}</Notice>}
        <div className="flex flex-wrap gap-2">
          <Button loading={busy} loadingLabel="Menyimpan…" onClick={save}>{base ? 'Simpan perubahan' : 'Terbitkan banner'}</Button>
          <Button variant="secondary" onClick={onClose}>Batal</Button>
        </div>
      </div>
    </Panel>
  )
}
