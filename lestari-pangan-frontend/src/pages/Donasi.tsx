import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  BookmarkSimple,
  CaretRight,
  Clock,
  Funnel,
  HandHeart,
  House,
  LockSimple,
  MagnifyingGlass,
  MapPin,
  MinusCircle,
  PencilSimple,
  Plus,
  SealCheck,
  Truck,
  Warning,
  WarningCircle,
  X,
  XCircle,
} from '@phosphor-icons/react'
import { RootHeader } from '../components/Layouts'
import {
  AppBar,
  Badge,
  BottomSheet,
  Button,
  ButtonLink,
  Chip,
  DemoNote,
  Field,
  IconButton,
  inputCls,
  KeyValue,
  MenuRow,
  Notice,
  RadioCard,
  Segmented,
  StatePanel,
  StatusBadge,
  StickyFooter,
} from '../components/ui'
import { FoodCardCompact, FoodCardSearch, pickupLabel } from '../components/FoodCard'
import { FoodPhoto } from '../components/FoodPhoto'
import { useApp, useProfile } from '../state/AppState'
import type { FoodCategory, Offer } from '../data/types'

/* ---------- D01 Penawaran saya (pemberi) ---------- */

function MyOffers() {
  const { state } = useApp()
  const profile = useProfile()
  const [tab, setTab] = useState<'aktif' | 'draf' | 'selesai'>('aktif')
  const [q, setQ] = useState('')
  const mine = state.offers.filter((o) => o.donorName === profile.name)
  const groups = {
    aktif: mine.filter((o) => o.status === 'Tersedia'),
    draf: mine.filter((o) => o.status === 'Draf'),
    selesai: mine.filter((o) => o.status === 'Ditutup'),
  }
  const list = groups[tab].filter((o) => o.name.toLowerCase().includes(q.toLowerCase()))

  return (
    <>
      <RootHeader title="Penawaran saya" subtitle={`${profile.name} · ${profile.area}`} />
      <div className="flex flex-col gap-4 px-4 pt-4">
        <Segmented
          label="Status penawaran"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'aktif', label: 'Aktif', count: groups.aktif.length },
            { value: 'draf', label: 'Draf', count: groups.draf.length },
            { value: 'selesai', label: 'Selesai', count: groups.selesai.length },
          ]}
        />
        <SearchInput value={q} onChange={setQ} placeholder="Cari penawaran saya" />
        <ButtonLink to="/donasi/baru" block icon={<Plus size={22} weight="bold" />}>
          Tawarkan Pangan
        </ButtonLink>
        <h2 className="sr-only">Daftar penawaran</h2>
        {list.length === 0 ? (
          <StatePanel title={q ? 'Tidak ada penawaran yang cocok' : 'Belum ada penawaran di sini'}>
            {q ? 'Coba kata kunci lain.' : 'Penawaran yang Anda buat akan muncul di bagian ini.'}
          </StatePanel>
        ) : (
          list.map((o) => {
            const pending = state.requests.filter((r) => r.offerId === o.id && r.status === 'Diajukan').length
            return (
              <FoodCardCompact
                key={o.id}
                offer={o}
                to={`/donasi/kelola/${o.id}`}
                extra={
                  pending > 0 ? (
                    <Link to="/aktivitas/permintaan" className="tap mx-3 mb-3 flex min-h-12 items-center gap-2 rounded-control bg-warning-container px-3 text-[0.875rem] font-semibold text-warning">
                      <WarningCircle size={18} weight="fill" aria-hidden="true" />
                      <span className="flex-1">{pending} permintaan masuk</span>
                      <span>Tinjau</span>
                    </Link>
                  ) : null
                }
              />
            )
          })
        )}
        <DemoNote>Data demo · Verifikasi identitas bukan jaminan mutu pangan</DemoNote>
      </div>
    </>
  )
}

function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="flex min-h-[52px] items-center gap-2 rounded-control border border-line-control bg-surface px-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/30">
      <MagnifyingGlass size={22} aria-hidden="true" className="shrink-0 text-ink-secondary" />
      <input
        type="search"
        aria-label={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent py-3 text-body outline-none placeholder:text-ink-secondary [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button type="button" aria-label="Hapus pencarian" onClick={() => onChange('')} className="tap -mr-2 flex h-12 w-12 items-center justify-center rounded-full text-ink-secondary hover:bg-page">
          <X size={20} aria-hidden="true" />
        </button>
      )}
    </div>
  )
}

/* ---------- D06 Cari pangan + D07 filter (penerima) ---------- */

const categories: FoodCategory[] = ['Makanan matang', 'Bahan pangan', 'Produk kemasan']

function SearchFood() {
  const { state } = useApp()
  const profile = useProfile()
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const cat = (params.get('kategori') as FoodCategory | null) ?? null
  const method = params.get('cara')
  const [sheet, setSheet] = useState(false)
  const [draftMethod, setDraftMethod] = useState<string | null>(method)

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params)
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)))
    setParams(next, { replace: true })
  }

  const results = useMemo(
    () =>
      state.offers.filter(
        (o) =>
          o.status === 'Tersedia' &&
          o.available > 0 &&
          (!q || `${o.name} ${o.category}`.toLowerCase().includes(q.toLowerCase())) &&
          (!cat || o.category === cat) &&
          (!method || o.methods.includes(method as Offer['methods'][number])),
      ),
    [state.offers, q, cat, method],
  )
  const activeFilters = method ? 1 : 0

  return (
    <>
      <RootHeader title="Cari pangan" subtitle={profile.area} />
      <div className="flex flex-col gap-4 px-4 pt-4">
        <SearchInput value={q} onChange={(v) => update({ q: v || null })} placeholder="Cari nama atau jenis pangan" />
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          <button
            type="button"
            onClick={() => {
              setDraftMethod(method)
              setSheet(true)
            }}
            className="tap inline-flex min-h-12 shrink-0 items-center gap-1.5 rounded-full border border-line bg-surface px-4 text-[0.875rem] font-semibold hover:border-line-control"
          >
            <Funnel size={18} aria-hidden="true" /> Filter
            {activeFilters > 0 && <span className="rounded-full bg-primary-container px-2 text-primary">{activeFilters}</span>}
          </button>
          <Chip selected={!cat} onClick={() => update({ kategori: null })}>Semua</Chip>
          {categories.map((c) => (
            <Chip key={c} selected={cat === c} onClick={() => update({ kategori: cat === c ? null : c })}>
              {c}
            </Chip>
          ))}
        </div>
        <Notice tone="info">
          <strong>Donasi pangan gratis.</strong> Biaya pengiriman, jika memakai mitra, ditampilkan terpisah sebelum disetujui.
        </Notice>
        <p className="text-meta text-ink-secondary" aria-live="polite">
          {results.length} penawaran tersedia · diurutkan menurut waktu pengambilan
        </p>
        <h2 className="sr-only">Hasil pencarian</h2>
        {results.length === 0 ? (
          <StatePanel
            title="Belum ada penawaran sesuai filter ini"
            action={
              <Button variant="secondary" onClick={() => setParams({}, { replace: true })}>
                Ubah filter
              </Button>
            }
          />
        ) : (
          results.map((o) => <FoodCardSearch key={o.id} offer={o} />)
        )}
        <DemoNote />
      </div>

      <BottomSheet
        open={sheet}
        onClose={() => setSheet(false)}
        title="Filter dan urutkan"
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setDraftMethod(null)}>
              Reset
            </Button>
            <Button
              className="flex-[2]"
              onClick={() => {
                update({ cara: draftMethod })
                setSheet(false)
              }}
            >
              Terapkan
            </Button>
          </div>
        }
      >
        <fieldset>
          <legend className="mb-2 text-label">Cara penyaluran</legend>
          <div className="flex flex-wrap gap-2">
            {['Ambil sendiri', 'Antar pemberi', 'Mitra pengiriman'].map((m) => (
              <Chip key={m} selected={draftMethod === m} onClick={() => setDraftMethod(draftMethod === m ? null : m)}>
                {m}
              </Chip>
            ))}
          </div>
        </fieldset>
        <div className="mt-6">
          <p className="mb-2 text-label">Urutan</p>
          <p className="rounded-control bg-page p-3 text-meta text-ink-secondary">
            Waktu pengambilan terdekat. Urutan tidak dipengaruhi sponsor, poin, atau pembayaran.
          </p>
        </div>
      </BottomSheet>
    </>
  )
}

export function DonasiTab() {
  const { state } = useApp()
  return state.role === 'pemberi' ? <MyOffers /> : <SearchFood />
}

/* ---------- D08 Detail pangan (penerima) ---------- */

export function OfferDetail() {
  const { id } = useParams()
  const { state } = useApp()
  const navigate = useNavigate()
  const offer = state.offers.find((o) => o.id === id)
  const [saved, setSaved] = useState(false)

  if (!offer) return <NotAvailable />
  const myActive = state.requests.find((r) => r.offerId === offer.id && r.recipientName === 'Komunitas Berbagi' && r.status === 'Diajukan')
  const closed = offer.status !== 'Tersedia' || offer.available === 0

  return (
    <>
      <AppBar
        title="Detail pangan"
        actions={
          <IconButton label={saved ? 'Hapus dari tersimpan' : 'Simpan penawaran'} onClick={() => setSaved(!saved)}>
            <BookmarkSimple size={24} weight={saved ? 'fill' : 'regular'} aria-hidden="true" className={saved ? 'text-primary' : ''} />
          </IconButton>
        }
      />
      <main className="pb-32">
        <div className="relative">
          <FoodPhoto src={offer.photo} alt={offer.name} className="aspect-[4/3] w-full" iconSize={64} />
          <div className="absolute bottom-3 left-4 right-4 flex flex-wrap gap-2">
            <StatusBadge status={closed ? 'Ditutup' : 'Tersedia'} />
            <span className="rounded-full bg-surface px-2.5 py-1 text-[0.8125rem] font-semibold">{offer.category}</span>
          </div>
        </div>
        <div className="flex flex-col gap-4 px-4 pt-4">
          <div>
            <h1 className="text-page-title">{offer.name}</h1>
            <p className="mt-1 text-[1.25rem] font-bold leading-7 text-primary">
              {offer.available} {offer.unit} tersedia
              {offer.estimate && <span className="ml-2 align-middle text-caption font-semibold text-warning">Perkiraan</span>}
            </p>
            {offer.reserved > 0 && <p className="text-meta text-ink-secondary">{offer.reserved} {offer.unit} sudah direservasi dari {offer.initial} {offer.unit} awal</p>}
          </div>

          <Link to={`/mitra/${encodeURIComponent(offer.donorName)}`} className="tap card flex items-center gap-3 p-3 hover:bg-page">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-container font-bold text-primary">
              {offer.donorName.split(' ').map((w) => w[0]).join('').slice(0, 2)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-1.5 font-semibold">
                {offer.donorName}
                {offer.donorVerified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary-container px-2 py-0.5 text-caption text-primary">
                    <SealCheck size={14} weight="fill" aria-hidden="true" /> Identitas terverifikasi
                  </span>
                )}
              </span>
              <span className="block text-meta text-ink-secondary">{offer.donorType} · {offer.area}</span>
            </span>
          </Link>
          <p className="-mt-2 text-caption text-ink-secondary">
            Verifikasi memeriksa identitas mitra, bukan jaminan mutu pangan. Alamat lengkap dibuka setelah permintaan disetujui.
          </p>

          <section className="card p-4" aria-labelledby="jadwal-h">
            <h2 id="jadwal-h" className="mb-3 flex items-center gap-2 text-card-title">
              <Clock size={22} aria-hidden="true" className="text-primary" /> Jadwal pengambilan
            </h2>
            <dl>
              <KeyValue label="Rentang pengambilan">{pickupLabel(offer)}</KeyValue>
              <KeyValue label="Batas pengambilan">{offer.pickupDate}, {offer.pickupEnd} WIB</KeyValue>
              <KeyValue label="Area">{offer.area}</KeyValue>
            </dl>
          </section>

          <section className="card p-4" aria-labelledby="info-h">
            <h2 id="info-h" className="mb-3 text-card-title">Informasi pangan</h2>
            {offer.description && <p className="mb-3 text-body">{offer.description}</p>}
            <dl className="divide-y divide-line">
              <KeyValue label="Penyimpanan">{offer.storage}</KeyValue>
              {offer.preparedAt && <KeyValue label="Waktu persiapan">{offer.preparedAt}</KeyValue>}
              {offer.labelDate && <KeyValue label="Tanggal pada label">{offer.labelDate}</KeyValue>}
              <KeyValue label="Bahan dan alergen yang diketahui">
                {offer.allergens ?? <span className="text-warning">Belum diketahui oleh pemberi</span>}
              </KeyValue>
            </dl>
            <div className="mt-3">
              <Notice tone="warning">Periksa kondisi pangan saat serah terima. Informasi tanggal atau foto tidak otomatis membuktikan keamanan konsumsi.</Notice>
            </div>
          </section>

          <section className="card p-4" aria-labelledby="cara-h">
            <h2 id="cara-h" className="mb-3 text-card-title">Cara penyaluran</h2>
            <ul className="flex flex-col gap-3">
              {offer.methods.map((m) => (
                <li key={m} className="flex gap-3">
                  <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-container text-primary">
                    {m === 'Ambil sendiri' ? <House size={20} /> : <Truck size={20} />}
                  </span>
                  <div>
                    <p className="font-semibold">{m}</p>
                    <p className="text-meta text-ink-secondary">
                      {m === 'Ambil sendiri'
                        ? 'Tanpa biaya pengiriman dari platform. Transportasi Anda sendiri.'
                        : m === 'Antar pemberi'
                          ? 'Pemberi mengantar sesuai kesepakatan.'
                          : 'Biaya belum tersedia. Akan ditampilkan sebelum disetujui.'}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
          <DemoNote />
        </div>
      </main>
      <StickyFooter>
        {closed ? (
          <Button block disabled>
            Penawaran melewati batas pengambilan
          </Button>
        ) : myActive ? (
          <ButtonLink to={`/permintaan/${myActive.id}`} block variant="secondary">
            Lihat permintaan Anda
          </ButtonLink>
        ) : (
          <Button block icon={<HandHeart size={22} />} onClick={() => navigate(`/donasi/${offer.id}/minta`)}>
            Ajukan Permintaan
          </Button>
        )}
      </StickyFooter>
    </>
  )
}

/* ---------- D03 Kelola penawaran (pemberi) ---------- */

export function OfferManage() {
  const { id } = useParams()
  const { state } = useApp()
  const offer = state.offers.find((o) => o.id === id)
  if (!offer) return <NotAvailable />
  const reqs = state.requests.filter((r) => r.offerId === offer.id)
  const pending = reqs.filter((r) => r.status === 'Diajukan')
  const pct = (n: number) => (offer.initial ? Math.round((n / offer.initial) * 100) : 0)

  return (
    <>
      <AppBar title="Kelola penawaran" />
      <main className="flex flex-col gap-4 px-4 pb-32 pt-4">
        <section className="card flex flex-col gap-3 p-4">
          <div className="flex gap-3">
            <FoodPhoto src={offer.photo} alt={offer.name} className="h-20 w-20 shrink-0 rounded-control" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <StatusBadge status={offer.status} />
                <Badge tone="neutral" icon={false}>{offer.category}</Badge>
              </div>
              <h1 className="mt-1 text-card-title">{offer.name}</h1>
              <p className="flex items-start gap-1 text-meta text-ink-secondary">
                <MapPin size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
                <span className="min-w-0">{offer.area} · #{offer.id}</span>
              </p>
            </div>
          </div>
          <p className="flex items-center gap-2 rounded-control border border-line px-3 py-2 text-meta">
            <Clock size={18} aria-hidden="true" className="shrink-0 text-primary" />
            <span>Pengambilan {pickupLabel(offer)}</span>
          </p>
        </section>

        <section aria-labelledby="jumlah-h" className="card p-4">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-2">
            <h2 id="jumlah-h" className="text-card-title">Alokasi jumlah</h2>
            <span className="text-meta text-ink-secondary">Total awal {offer.initial} {offer.unit}</span>
          </div>
          <dl className="grid grid-cols-3 gap-2 text-center">
            {[
              ['Tersedia', offer.available, 'Masih bisa diminta', 'bg-primary-container text-primary'],
              ['Direservasi', offer.reserved, 'Menunggu serah terima', 'bg-info-container text-info'],
              ['Diserahkan', offer.handedOver, 'Sudah dicatat', 'bg-page text-ink'],
            ].map(([label, value, hint, cls]) => (
              <div key={label as string} className={`flex flex-col rounded-control p-2 ${cls}`}>
                <dt className="order-2 text-caption font-semibold">{label}</dt>
                <dd className="order-1 text-[1.25rem] font-bold leading-7">{value}</dd>
                <dd className="order-3 text-[0.75rem] leading-4 text-ink-secondary">{hint}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-line" aria-hidden="true">
            <span className="bg-primary" style={{ width: `${pct(offer.available)}%` }} />
            <span className="bg-info" style={{ width: `${pct(offer.reserved)}%` }} />
            <span className="bg-ink-secondary" style={{ width: `${pct(offer.handedOver)}%` }} />
          </div>
          <p className="mt-3 text-caption text-ink-secondary">Satuan: {offer.unit}. Direservasi belum berarti diterima; jumlah diterima dicatat penerima saat serah terima.</p>
        </section>

        <section aria-labelledby="req-h" className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="req-h" className="text-section-title">Permintaan ({reqs.length})</h2>
            {pending.length > 0 && <Badge tone="warning">{pending.length} perlu ditinjau</Badge>}
          </div>
          {reqs.length === 0 && <p className="text-body text-ink-secondary">Belum ada permintaan.</p>}
          {reqs.map((r) => {
            const over = r.status === 'Diajukan' && r.quantity > offer.available
            return (
              <Link key={r.id} to={r.status === 'Diajukan' ? `/permintaan/${r.id}/tinjau` : `/permintaan/${r.id}`} className="tap card flex flex-col gap-2 p-4 hover:bg-page">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{r.recipientName}</p>
                    <p className="text-meta text-ink-secondary">{r.method} · {r.pickupTime}</p>
                  </div>
                  <span className="shrink-0 text-right">
                    <span className="block text-[1.125rem] font-bold">{r.quantity} {r.unit}</span>
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <StatusBadge status={r.status} />
                  <span className="inline-flex items-center gap-1 text-[0.875rem] font-semibold text-primary">
                    {r.status === 'Diajukan' ? 'Tinjau' : 'Lihat detail'} <CaretRight size={14} weight="bold" aria-hidden="true" />
                  </span>
                </div>
                {over && (
                  <p className="flex items-start gap-1.5 rounded-control bg-warning-container p-2 text-meta text-ink">
                    <WarningCircle size={18} weight="fill" aria-hidden="true" className="mt-px shrink-0 text-warning" />
                    Melebihi sisa tersedia ({offer.available} {offer.unit}). Perlu penyesuaian jumlah.
                  </p>
                )}
              </Link>
            )
          })}
        </section>

        {offer.status === 'Tersedia' && (
          <nav aria-labelledby="aksi-h" className="flex flex-col gap-2">
            <h2 id="aksi-h" className="text-section-title">Tindakan penawaran</h2>
            <div className="card divide-y divide-line overflow-hidden">
              <MenuRow to={`/donasi/kelola/${offer.id}/ubah`} icon={<PencilSimple size={20} />} title="Ubah informasi penawaran" />
              <Link to={`/donasi/kelola/${offer.id}/tutup`} className="tap flex min-h-16 items-center gap-3 px-4 py-3 hover:bg-danger-container">
                <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-danger-container text-danger">
                  <XCircle size={20} />
                </span>
                <span className="min-w-0 flex-1 font-medium text-danger">Tutup penawaran lebih awal</span>
                <CaretRight size={20} aria-hidden="true" className="shrink-0 text-ink-secondary" />
              </Link>
            </div>
          </nav>
        )}
        <DemoNote />
      </main>
      {pending.length > 0 && (
        <StickyFooter>
          <ButtonLink to="/aktivitas/permintaan" block>
            Tinjau {pending.length} permintaan
          </ButtonLink>
        </StickyFooter>
      )}
    </>
  )
}

/* ---------- D05 Tutup penawaran ---------- */

const CLOSE_REASONS = [
  ['Pangan sudah habis', 'Semua pangan sudah tersalurkan atau terpakai.'],
  ['Pangan dipakai sendiri', 'Pangan dibutuhkan untuk operasional sendiri.'],
  ['Jam operasional berubah', 'Dapur atau toko tutup lebih cepat hari ini.'],
  ['Informasi perlu diperbaiki', 'Akan diterbitkan ulang dengan data yang benar.'],
  ['Alasan lain', 'Jelaskan di catatan.'],
] as const

export function OfferClose() {
  const { id } = useParams()
  const { state, dispatch } = useApp()
  const navigate = useNavigate()
  const offer = state.offers.find((o) => o.id === id)
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')
  const [ack, setAck] = useState(false)
  const [busy, setBusy] = useState(false)
  if (!offer) return <NotAvailable />
  if (offer.status !== 'Tersedia') return <NotAvailable />
  const transfers = state.transfers.filter((t) => t.offerId === offer.id && t.status === 'Terjadwal')
  const ready = !!reason && (reason !== 'Alasan lain' || note.trim()) && (offer.reserved === 0 || ack)

  return (
    <>
      <AppBar title="Tutup penawaran" />
      <main className="mx-auto flex max-w-[560px] flex-col gap-4 px-4 pb-40 pt-4">
        <section className="card flex gap-3 p-3">
          <FoodPhoto src={offer.photo} alt="" className="h-14 w-14 shrink-0 rounded-control" />
          <div className="min-w-0">
            <p className="text-caption font-semibold text-primary">#{offer.id}</p>
            <h1 className="font-semibold">{offer.name}</h1>
            <p className="text-meta text-ink-secondary">{offer.donorName}</p>
          </div>
        </section>

        {offer.reserved > 0 && (
          <div role="note" className="flex gap-3 rounded-card border border-danger/30 bg-danger-container p-4">
            <Warning size={22} weight="fill" aria-hidden="true" className="mt-0.5 shrink-0 text-danger" />
            <div className="text-meta text-ink">
              <p className="font-semibold text-danger">Ada {offer.reserved} {offer.unit} yang sudah direservasi</p>
              <p className="mt-0.5">
                Menutup penawaran tidak membatalkan pengambilan yang sudah disetujui
                {transfers[0] ? ` untuk ${transfers[0].recipientName}` : ''}. Jadwal itu tetap berjalan.
              </p>
            </div>
          </div>
        )}

        <section aria-labelledby="dampak-h" className="flex flex-col gap-2">
          <h2 id="dampak-h" className="text-label">Yang terjadi pada jumlah</h2>
          <div className="card flex items-start gap-3 p-3">
            <MinusCircle size={22} aria-hidden="true" className="mt-0.5 shrink-0 text-ink-secondary" />
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center justify-between gap-2 font-semibold">Sisa tersedia <Badge tone="neutral" icon={false}>{offer.available} {offer.unit}</Badge></p>
              <p className="text-meta text-ink-secondary">Langsung ditarik dari pencarian dan tidak bisa diminta lagi.</p>
            </div>
          </div>
          <div className="card flex items-start gap-3 p-3">
            <LockSimple size={22} aria-hidden="true" className="mt-0.5 shrink-0 text-info" />
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center justify-between gap-2 font-semibold">Direservasi <Badge tone="info" icon={false}>{offer.reserved} {offer.unit}</Badge></p>
              <p className="text-meta text-ink-secondary">Tetap terjadwal sampai serah terima, kecuali dibatalkan bersama penerima.</p>
            </div>
          </div>
        </section>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1.5 text-label">Alasan penutupan</legend>
          {CLOSE_REASONS.map(([t, d]) => (
            <RadioCard key={t} name="alasan-tutup" checked={reason === t} onChange={() => setReason(t)} title={t} description={d} />
          ))}
        </fieldset>
        <Field label="Catatan tambahan" optional={reason !== 'Alasan lain'}>
          {(p) => <textarea {...p} rows={3} className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Contoh: dapur tutup pukul 17.00 hari ini." />}
        </Field>
        {offer.reserved > 0 && (
          <label className="flex items-start gap-3 rounded-card border border-line bg-surface p-4">
            <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-primary" />
            <span className="text-meta">Saya memahami bahwa {offer.reserved} {offer.unit} yang sudah disetujui tetap wajib dikoordinasikan sampai serah terima.</span>
          </label>
        )}
        <p className="text-caption text-ink-secondary">Penutupan dicatat di riwayat penawaran.</p>
      </main>
      <StickyFooter>
        <div className="flex flex-col gap-2">
          <Button
            variant="danger"
            block
            loading={busy}
            disabled={!ready}
            icon={<XCircle size={20} />}
            onClick={() => {
              setBusy(true)
              window.setTimeout(() => {
                dispatch({ type: 'closeOffer', id: offer.id })
                navigate(`/donasi/kelola/${offer.id}`, { replace: true })
              }, 500)
            }}
          >
            Tutup penawaran sekarang
          </Button>
          <Button block variant="ghost" onClick={() => navigate(-1)}>Kembali</Button>
        </div>
      </StickyFooter>
    </>
  )
}

export function NotAvailable() {
  return (
    <>
      <AppBar title="Tidak tersedia" />
      <main className="p-4">
        <StatePanel
          icon={<MapPin size={40} className="text-ink-secondary" />}
          title="Kegiatan tidak tersedia"
          action={<ButtonLink to="/" variant="secondary">Kembali ke Beranda</ButtonLink>}
        >
          Data mungkin sudah ditutup atau Anda tidak memiliki akses.
        </StatePanel>
      </main>
    </>
  )
}

export { Badge }
