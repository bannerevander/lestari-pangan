import { ArrowSquareOut, Copy, Motorcycle } from '@phosphor-icons/react'
import { toast } from '../../components/ui'
import type { Contact, Transfer } from '../../data/types'
import { mapsUrl } from '../../lib/format'

/** Tautan resmi layanan antar instan; aplikasi Gojek/Grab terbuka bila terpasang, selain itu halaman layanannya. */
const APPS = [
  ['Buka Gojek (GoSend)', 'https://www.gojek.com/gosend/'],
  ['Buka Grab (GrabExpress)', 'https://www.grab.com/id/express/'],
] as const

const stop = (label: string, name: string, c?: Contact) =>
  [`${label}: ${name}`, c?.address, c ? `Kontak: ${c.pic} (${c.phone})` : null, c?.lat != null && c.lng != null ? `Peta: ${mapsUrl({ lat: c.lat, lng: c.lng })}` : null].filter(Boolean).join('\n')

const copy = (text: string, done: string) =>
  navigator.clipboard.writeText(text).then(
    () => toast(done, 'success'),
    () => toast('Tidak bisa menyalin otomatis. Tekan lama teks alamat lalu salin.', 'info'),
  )

/**
 * Pengganti kurir relawan: pihak yang menanggung ongkir memesan GoSend/GrabExpress sendiri.
 * Aplikasi menyiapkan alamat jemput, tujuan, dan catatan driver untuk disalin; tidak ada integrasi API ojol.
 */
export function OjolBooking({ t, donor }: { t: Transfer; donor: boolean }) {
  const iBook = (t.feePayer === 'pemberi') === donor
  const pickup = stop('Jemput', t.donorName, t.donorContact)
  const dropoff = stop('Antar ke', t.recipientName, t.recipientContact)
  const note = `Paket pangan ${t.foodName} (${t.agreed} ${t.unit}) dari Lestari Pangan. Mohon dijaga tegak dan tidak tertindih.`

  return (
    <section aria-labelledby="ojol-h" className="card flex flex-col gap-3 p-4">
      <h2 id="ojol-h" className="flex items-center gap-2 text-card-title">
        <Motorcycle size={22} aria-hidden="true" className="text-primary" /> Pesan pengiriman
      </h2>
      <p className="text-meta">
        {iBook
          ? `Anda yang memesan ojek online karena ongkir ditanggung ${donor ? 'Anda' : 'penerima'}. Pesan sekitar 30 menit sebelum jadwal ${t.timeStart} WIB.`
          : `${donor ? t.recipientName : t.donorName} yang memesan ojek online. Siapkan pangan di titik ${donor ? 'jemput' : 'tujuan'} sesuai jadwal.`}
      </p>
      <div className="grid gap-2 text-meta">
        <pre className="whitespace-pre-wrap rounded-control bg-page p-3 font-sans">{pickup}</pre>
        <pre className="whitespace-pre-wrap rounded-control bg-page p-3 font-sans">{dropoff}</pre>
      </div>
      {iBook && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => copy(pickup, 'Alamat jemput disalin')} className="tap inline-flex min-h-12 items-center justify-center gap-2 rounded-control border border-line bg-surface text-[0.875rem] font-semibold text-primary hover:border-line-control">
              <Copy size={18} aria-hidden="true" /> Salin jemput
            </button>
            <button type="button" onClick={() => copy(dropoff, 'Alamat tujuan disalin')} className="tap inline-flex min-h-12 items-center justify-center gap-2 rounded-control border border-line bg-surface text-[0.875rem] font-semibold text-primary hover:border-line-control">
              <Copy size={18} aria-hidden="true" /> Salin tujuan
            </button>
          </div>
          <button type="button" onClick={() => copy(note, 'Catatan untuk driver disalin')} className="tap inline-flex min-h-12 items-center justify-center gap-2 rounded-control border border-line bg-surface text-[0.875rem] font-semibold text-primary hover:border-line-control">
            <Copy size={18} aria-hidden="true" /> Salin catatan untuk driver
          </button>
          <div className="grid grid-cols-2 gap-2">
            {APPS.map(([label, href]) => (
              <a key={href} href={href} target="_blank" rel="noopener noreferrer" className="tap inline-flex min-h-12 items-center justify-center gap-1.5 rounded-control bg-primary px-2 text-center text-[0.875rem] font-semibold text-white hover:bg-primary-hover">
                {label} <ArrowSquareOut size={16} aria-hidden="true" />
              </a>
            ))}
          </div>
        </>
      )}
      <p className="text-caption text-ink-secondary">
        Untuk makanan matang, pilih layanan instan (bukan same day) agar cepat sampai. Setelah driver mengambil pangan, pemberi mencatat penyerahan; bila ada kendala (driver batal, pangan tumpah), gunakan Laporkan masalah.
      </p>
    </section>
  )
}
