import { useState } from 'react'
import { methodLabel } from '../../lib/format'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { BookmarkSimple, Clock, HandHeart, House, SealCheck, Truck } from '@phosphor-icons/react'
import { AppBar, Button, ButtonLink, IconButton, KeyValue, Notice, StatusBadge, StickyFooter } from '../../components/ui'
import { pickupLabel } from '../../components/FoodCard'
import { FoodPhoto } from '../../components/FoodPhoto'
import { useApp } from '../../state/AppState'
import { useProfile } from '../../state/useProfile'
import { NotAvailable } from '../../components/NotAvailable'

export function OfferDetail() {
  const { id } = useParams()
  const { state } = useApp()
  const profile = useProfile()
  const navigate = useNavigate()
  const offer = state.offers.find((o) => o.id === id)
  const [saved, setSaved] = useState(false)

  if (!offer) return <NotAvailable />
  const myActive = state.requests.find((r) => r.offerId === offer.id && r.recipientName === profile.name && r.status === 'Diajukan')
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
        <div className="stagger flex flex-col gap-4 px-4 pt-4">
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
            <ul className="stagger flex flex-col gap-3">
              {offer.methods.map((m) => (
                <li key={m} className="flex gap-3">
                  <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-container text-primary">
                    {m === 'Ambil sendiri' ? <House size={20} /> : <Truck size={20} />}
                  </span>
                  <div>
                    <p className="font-semibold">{methodLabel(m)}</p>
                    <p className="text-meta text-ink-secondary">
                      {m === 'Ambil sendiri'
                        ? 'Tanpa biaya pengiriman dari platform. Transportasi Anda sendiri.'
                        : m === 'Antar pemberi'
                          ? 'Pemberi mengantar sesuai kesepakatan.'
                          : 'Pesan GoSend/GrabExpress sendiri; ongkir dibayar penerima, atau pemberi bila disepakati.'}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
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
