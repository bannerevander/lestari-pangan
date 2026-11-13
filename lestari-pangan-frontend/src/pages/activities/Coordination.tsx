import { useParams } from 'react-router-dom'
import { mapsUrl, methodLabel } from '../../lib/format'
import { CalendarBlank, LockSimple, MapPin, MapTrifold, Phone, User, WhatsappLogo } from '@phosphor-icons/react'
import { AppBar, ButtonLink, Notice } from '../../components/ui'
import { NotAvailable } from '../../components/NotAvailable'
import { useApp } from '../../state/AppState'
import { useProfile } from '../../state/useProfile'

/** Nomor lokal Indonesia (08…, +62…, 62…) jadi format internasional tanpa "+", untuk wa.me. */
const waNumber =(phone: string) => {
  const d = phone.replace(/\D/g, '')
  return d.startsWith('0') ? `62${d.slice(1)}` : d
}

/** L08 Koordinasi: kontak terbatas (OD-09). Kontak lawan hanya terbaca oleh pihak penyaluran dan kurirnya (RLS profile_contacts). */
export default function Coordination() {
  const { id } = useParams()
  const { state } = useApp()
  const me = useProfile()
  const t = state.transfers.find((x) => x.id === id)
  if (!t) return <NotAvailable />
  const donor = state.role === 'pemberi'
  const name = donor ? t.recipientName : t.donorName
  const c = donor ? t.recipientContact : t.donorContact
  // Setelah penerimaan dicatat, kontak tetap terlihat (riwayat) tetapi tombol hubungi disembunyikan.
  const done = t.status === 'Diterima penuh' || t.status === 'Diterima sebagian' || t.status === 'Ditolak'
  const message = `Halo ${c?.pic ?? name}, saya ${me.name} dari Lestari Pangan, terkait penyaluran ${t.foodName} (${t.id}) pada ${t.date}, ${t.timeStart}–${t.timeEnd} WIB.`

  return (
    <>
      <AppBar title="Koordinasi" />
      <main className="mx-auto flex max-w-[560px] flex-col gap-4 px-4 pb-10 pt-4">
        <section className="card p-4">
          <p className="text-caption font-semibold uppercase tracking-wide text-ink-secondary">Kegiatan</p>
          <p className="mt-1 font-semibold">{t.foodName} · {t.agreed} {t.unit}</p>
          <p className="flex items-center gap-1.5 text-meta text-ink-secondary">
            <CalendarBlank size={16} aria-hidden="true" /> {t.date}, {t.timeStart}–{t.timeEnd} WIB · {methodLabel(t.method)}
          </p>
        </section>

        {c?.phone ? (
          <section aria-labelledby="kontak" className="card flex flex-col gap-3 p-4">
            <h2 id="kontak" className="text-card-title">{donor ? 'Penerima' : 'Pemberi'}: {name}</h2>
            <p className="flex items-center gap-2"><User size={20} aria-hidden="true" className="text-primary" /> {c.pic}</p>
            <p className="flex items-center gap-2"><Phone size={20} aria-hidden="true" className="text-primary" /> {c.phone}</p>
            <p className="flex items-start gap-2"><MapPin size={20} aria-hidden="true" className="mt-0.5 shrink-0 text-primary" /> {c.address}</p>
            {c.lat != null && c.lng != null && (
              <a href={mapsUrl({ lat: c.lat, lng: c.lng })} target="_blank" rel="noopener noreferrer" className="tap inline-flex min-h-12 items-center justify-center gap-2 rounded-control border border-line bg-surface font-semibold text-primary hover:border-line-control">
                <MapTrifold size={20} aria-hidden="true" /> Buka di Google Maps
              </a>
            )}
            {!done && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <a href={`tel:${c.phone.replace(/[^\d+]/g, '')}`} className="tap inline-flex min-h-12 items-center justify-center gap-2 rounded-control border border-line bg-surface font-semibold text-primary hover:border-line-control">
                  <Phone size={20} aria-hidden="true" /> Telepon
                </a>
                <a
                  href={`https://wa.me/${waNumber(c.phone)}?text=${encodeURIComponent(message)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tap inline-flex min-h-12 items-center justify-center gap-2 rounded-control bg-primary font-semibold text-white hover:bg-primary-hover"
                >
                  <WhatsappLogo size={20} aria-hidden="true" /> WhatsApp
                </a>
              </div>
            )}
          </section>
        ) : (
          <Notice tone="info" title="Kontak belum tersedia">Kontak {name} belum terisi. Gunakan Laporkan masalah bila penyaluran terhambat.</Notice>
        )}

        <Notice tone="info" title="Jaga privasi">
          <span className="flex items-start gap-2">
            <LockSimple size={18} aria-hidden="true" className="mt-0.5 shrink-0" />
            Kontak ini hanya terlihat oleh pihak penyaluran ini. Gunakan untuk koordinasi jadwal dan lokasi saja, dan jangan dibagikan ke pihak lain.
          </span>
        </Notice>
        <ButtonLink to={`/aktivitas/${t.id}`} variant="secondary">Kembali ke penyaluran</ButtonLink>
      </main>
    </>
  )
}
