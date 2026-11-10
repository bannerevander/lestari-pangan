import { Copy } from '@phosphor-icons/react'
import { toast } from './ui'

/**
 * Rekening penerimaan dukungan. Data publik (bukan rahasia): ditampilkan ke pendukung.
 * shortcut: QRIS dan penyedia pembayaran otomatis belum ada (AO-05); dana divalidasi manual oleh admin keuangan.
 */
export const BANK = { name: 'SeaBank', account: '901335870147', holder: 'BANNER EVANDER SALIM' } as const

const rp = (n: number) => `Rp${n.toLocaleString('id-ID')}`

function copy(text: string, label: string) {
  navigator.clipboard
    ?.writeText(text)
    .then(() => toast(`${label} disalin.`, 'info'))
    .catch(() => toast(`Salin manual: ${text}`, 'info'))
}

/** Instruksi transfer: nominal, rekening, dan kode referensi untuk berita transfer. */
export function BankTransfer({ amount, reference }: { amount: number; reference?: string }) {
  // [label, tampilan, nilai yang disalin]
  const rows: [string, string, string?][] = [
    ['Bank', BANK.name],
    ['Nomor rekening', BANK.account, BANK.account],
    ['Atas nama', BANK.holder],
    ['Nominal', rp(amount), String(amount)],
    ...(reference ? ([['Berita transfer', reference, reference]] as [string, string, string][]) : []),
  ]
  return (
    <section className="w-full rounded-card border border-line bg-surface p-4 text-left" aria-label="Instruksi transfer">
      <p className="font-semibold">Transfer ke rekening berikut</p>
      <dl className="mt-3 flex flex-col divide-y divide-line">
        {rows.map(([k, v, value]) => (
          <div key={k} className="flex items-center justify-between gap-3 py-2">
            <dt className="text-meta text-ink-secondary">{k}</dt>
            <dd className="flex items-center gap-1 font-semibold tabular">
              {v}
              {value && (
                <button type="button" aria-label={`Salin ${k.toLowerCase()}`} onClick={() => copy(value, k)} className="tap flex h-10 w-10 items-center justify-center rounded-full text-primary hover:bg-primary-container">
                  <Copy size={18} aria-hidden="true" />
                </button>
              )}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-caption text-ink-secondary">
        {reference ? 'Tulis kode referensi di berita transfer agar mudah dicocokkan. ' : ''}Status berubah menjadi Tervalidasi setelah tim keuangan mencocokkan mutasi rekening (biasanya 1×24 jam). QRIS menyusul.
      </p>
    </section>
  )
}
