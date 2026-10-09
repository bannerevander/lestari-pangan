import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  BookmarkSimple,
  Clock,
  Funnel,
  HandHeart,
  House,
  MagnifyingGlass,
  MapPin,
  Plus,
  SealCheck,
  Truck,
  WarningCircle,
  X,
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
  IconButton,
  KeyValue,
  Notice,
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
  const { state, dispatch } = useApp()
  const offer = state.offers.find((o) => o.id === id)
  const [confirmClose, setConfirmClose] = useState(false)
  const [reason, setReason] = useState('')
  if (!offer) return <NotAvailable />
  const reqs = state.requests.filter((r) => r.offerId === offer.id)
  const pending = reqs.filter((r) => r.status === 'Diajukan')

  return (
    <>
      <AppBar title="Kelola penawaran" />
      <main className="flex flex-col gap-4 px-4 pb-32 pt-4">
        <div className="flex gap-3">
          <FoodPhoto src={offer.photo} alt={offer.name} className="h-20 w-20 shrink-0 rounded-control" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={offer.status} />
              <span className="text-caption text-ink-secondary">#{offer.id}</span>
            </div>
            <h1 className="mt-1 text-card-title">{offer.name}</h1>
            <p className="text-meta text-ink-secondary">{pickupLabel(offer)}</p>
          </div>
        </div>

        <section aria-labelledby="jumlah-h" className="card p-4">
          <h2 id="jumlah-h" className="mb-3 text-card-title">Rincian jumlah</h2>
          <dl className="grid grid-cols-2 gap-3">
            {[
              ['Tersedia', offer.available, 'text-primary'],
              ['Direservasi', offer.reserved, 'text-info'],
              ['Diserahkan', offer.handedOver, 'text-ink'],
              ['Jumlah awal', offer.initial, 'text-ink-secondary'],
            ].map(([label, value, cls]) => (
              <div key={label as string} className="rounded-control bg-page p-3">
                <dt className="text-meta text-ink-secondary">{label}</dt>
                <dd className={`text-[1.25rem] font-bold leading-7 ${cls}`}>
                  {value} {offer.unit}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-caption text-ink-secondary">Direservasi belum berarti diterima. Jumlah diterima dicatat oleh penerima saat serah terima.</p>
        </section>

        <section aria-labelledby="req-h" className="flex flex-col gap-3">
          <h2 id="req-h" className="text-section-title">Permintaan ({reqs.length})</h2>
          {reqs.length === 0 && <p className="text-body text-ink-secondary">Belum ada permintaan.</p>}
          {reqs.map((r) => (
            <Link key={r.id} to={r.status === 'Diajukan' ? `/permintaan/${r.id}/tinjau` : `/permintaan/${r.id}`} className="tap card flex items-center gap-3 p-3 hover:bg-page">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{r.recipientName}</p>
                <p className="text-meta text-ink-secondary">
                  {r.quantity} {r.unit} · {r.pickupTime}
                </p>
              </div>
              <StatusBadge status={r.status} />
            </Link>
          ))}
        </section>

        {offer.status === 'Tersedia' && (
          <Button variant="danger" block onClick={() => setConfirmClose(true)}>
            Tutup penawaran
          </Button>
        )}
      </main>
      {pending.length > 0 && (
        <StickyFooter>
          <ButtonLink to={`/permintaan/${pending[0].id}/tinjau`} block>
            Tinjau {pending.length} permintaan
          </ButtonLink>
        </StickyFooter>
      )}
      <BottomSheet
        open={confirmClose}
        onClose={() => setConfirmClose(false)}
        title="Tutup penawaran?"
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setConfirmClose(false)}>
              Batal
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              disabled={!reason}
              onClick={() => {
                dispatch({ type: 'closeOffer', id: offer.id })
                setConfirmClose(false)
              }}
            >
              Tutup penawaran
            </Button>
          </div>
        }
      >
        <p className="text-body">Penawaran tidak lagi menerima permintaan baru.</p>
        {offer.reserved > 0 && (
          <div className="mt-3">
            <Notice tone="warning">
              Ada {offer.reserved} {offer.unit} yang sudah direservasi. Kesepakatan yang sudah ada tetap berjalan sesuai kebijakan.
            </Notice>
          </div>
        )}
        <fieldset className="mt-4">
          <legend className="mb-2 text-label">Alasan</legend>
          {['Pangan sudah habis', 'Pangan dipakai sendiri', 'Informasi perlu diperbaiki', 'Lainnya'].map((r) => (
            <label key={r} className="flex min-h-12 items-center gap-3">
              <input type="radio" name="close-reason" value={r} checked={reason === r} onChange={() => setReason(r)} className="h-5 w-5 accent-primary" />
              {r}
            </label>
          ))}
        </fieldset>
      </BottomSheet>
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
