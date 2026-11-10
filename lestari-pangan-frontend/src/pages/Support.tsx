import { PromoBanner } from '../components/PromoBanner'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { BellRinging, CaretRight, ClockCounterClockwise, Cube, Gift, HandHeart, Package, Receipt, Snowflake, Truck } from '@phosphor-icons/react'
import {
  AppBar,
  Badge,
  BottomSheet,
  Button,
  ButtonLink,
  CountUp,
  Field,
  inputCls,
  Notice,
  PolicyNote,
  RadioCard,
  Reveal,
  StageList,
  StatePanel,
  StickyFooter,
  SuccessMark,
  toast,
} from '../components/ui'
import type { Support } from '../state/AppState'
import { NotAvailable } from '../components/NotAvailable'
import { useApp } from '../state/AppState'
import { useCommand } from '../state/useCommand'
import { useLiveData } from '../state/LiveData'
import { useProfile } from '../state/useProfile'
import { BANK, BankTransfer } from '../components/BankTransfer'
import { messageOf } from '../lib/supabase/errors'
import type { Fund } from '../services/funding'

const rp = (n: number) => `Rp${n.toLocaleString('id-ID')}`

/* ---------- E04 Katalog apresiasi ---------- */

/** Ikon dan label per paket mengikuti urutan katalog; paket baru dari admin memakai gaya bergantian. */
export const packStyle = (i: number) => (i % 2 === 0 ? { icon: Package, tag: 'Dukungan logistik' } : { icon: Cube, tag: 'Dukungan dapur' })

export function Rewards() {
  const { state } = useApp()
  const claimed = state.rewardPacks.find((r) => r.id === state.rewardClaim)
  const claimStage = { 'Siap disalurkan': 2, Diserahkan: 3 }[state.claimStatus ?? ''] ?? 1

  return (
    <>
      <AppBar title="Reward dan apresiasi" />
      <main className="mx-auto flex max-w-[560px] flex-col gap-5 px-4 pb-8 pt-4">
        <PromoBanner placement="reward" />
        <section className="relative animate-rise-in overflow-hidden rounded-greet bg-primary p-5 text-white">
          <Gift size={120} weight="fill" aria-hidden="true" className="absolute -right-6 -top-6 -rotate-12 text-white/10" />
          <p className="text-caption font-semibold uppercase tracking-wide text-white/80">Apresiasi gotong royong</p>
          <h2 className="mt-1 text-section-title tabular">{state.points} poin</h2>
          <p className="mt-1 text-[0.9375rem] leading-6 text-white/90">
            Selesaikan Eco Challenge dan ajukan pemeriksaan. Poin masuk setelah lolos, lalu tukar dengan paket di bawah.
          </p>
        </section>

        {claimed && (
          <section className="card animate-rise-in p-4">
            <h2 className="mb-3 text-card-title">Status klaim terakhir</h2>
            <StageList
              label="Status klaim"
              current={claimStage}
              stages={[
                { title: 'Klaim diajukan', detail: claimed.title },
                { title: 'Konfirmasi program', detail: `Menunggu ${claimed.sponsor}` },
                { title: 'Diserahkan', detail: 'Lewat relawan atau ambil di posko' },
              ]}
            />
          </section>
        )}
        <section aria-labelledby="rw-h" className="flex flex-col gap-3">
            <h2 id="rw-h" className="text-section-title">Tukar poin</h2>
            <div className="stagger flex flex-col gap-3">
              {state.rewardPacks.map((r, i) => ({ ...r, ...packStyle(i) })).map((r) => (
                <article key={r.id} className="card flex flex-col gap-3 p-4">
                  <div className="flex items-start gap-3">
                    <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-control bg-accent-soft text-accent-ink">
                      <r.icon size={26} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-caption font-semibold text-primary">{r.tag}</p>
                      <h3 className="text-card-title">{r.title}</h3>
                    </div>
                  </div>
                  <p className="text-meta text-ink-secondary">{r.desc}</p>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-caption text-ink-secondary">Disediakan {r.sponsor}</span>
                    <Badge tone={state.points >= r.cost ? 'success' : 'neutral'} icon={false}>{r.cost} poin</Badge>
                  </div>
                  <ButtonLink to={`/reward/${r.id}`} variant="tonal" block>
                    Lihat paket
                  </ButtonLink>
                </article>
              ))}
            </div>
        </section>

        <Reveal>
          <PolicyNote title="Prinsip keadilan apresiasi">
            Poin tidak bisa dibeli dan tidak memberi prioritas memperoleh pangan. Klaim yang ditolak mengembalikan poin. Biaya pengiriman fisik dipisahkan dan bergantung ketersediaan relawan atau sponsor.
          </PolicyNote>
        </Reveal>
        {state.role === 'pemberi' && (
          <ButtonLink to="/apresiasi" variant="secondary" block>
            Materi apresiasi mitra
          </ButtonLink>
        )}
        <ButtonLink to="/tantangan" variant="ghost" block>
          Lihat Eco Challenge
        </ButtonLink>
      </main>

    </>
  )
}

/* ---------- F01 Dukung Lestari Pangan ---------- */

const ALLOCATIONS = [
  { id: 'ongkir', fund: 'pengiriman' as Fund, icon: Truck, title: 'Subsidi ongkir dan relawan', desc: 'Bahan bakar relawan penjemput antarkecamatan agar pangan cepat sampai.', tag: 'Paling mendesak' },
  { id: 'wadah', fund: 'operasional' as Fund, icon: Package, title: 'Wadah higienis dan operasional', desc: 'Kotak ramah lingkungan, pendingin darurat, dan pemeriksaan pos pangan.', tag: 'Kebutuhan dapur' },
]
const AMOUNTS = [25000, 50000, 100000, 250000]

export function SupportPage() {
  const { state } = useApp()
  const run = useCommand()
  const [clientId, setClientId] = useState(() => crypto.randomUUID())
  const navigate = useNavigate()
  const [alloc, setAlloc] = useState(ALLOCATIONS[0].id)
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<'amount' | 'done'>('amount')
  const [amount, setAmount] = useState(50000)
  const [custom, setCustom] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const chosen = ALLOCATIONS.find((a) => a.id === alloc)!
  const value = custom ? Number(custom) : amount

  const close = () => {
    setOpen(false)
    setStep('amount')
  }
  const confirm = () => {
    if (!(value >= 10000)) return setErr('Minimal dukungan Rp10.000.')
    setBusy(true)
    run({ type: 'addSupport', amount: value, allocation: chosen.title, fund: chosen.fund as 'operasional' | 'pengiriman', clientId })
      .then(() => {
        setClientId(crypto.randomUUID()) // dukungan berikutnya adalah transaksi baru
        setStep('done')
      })
      .catch((e) => setErr(messageOf(e)))
      .finally(() => setBusy(false))
  }

  return (
    <>
      <AppBar title="Dukung Lestari Pangan" />
      <main className="mx-auto flex max-w-[560px] flex-col gap-5 px-4 pb-36 pt-4">
        <PromoBanner placement="dukung" />
        <section className="relative animate-rise-in overflow-hidden rounded-greet bg-primary-container p-5">
          <HandHeart size={112} weight="duotone" aria-hidden="true" className="absolute -bottom-4 -right-4 text-primary/15" />
          <Badge tone="success">Pangan tetap 100% gratis</Badge>
          <h2 className="mt-3 max-w-[22ch] text-section-title">Dukungan Anda menggerakkan penyaluran</h2>
          <p className="mt-1 max-w-[36ch] text-body text-ink-secondary">Sukarela untuk logistik dan operasional. Tidak membeli prioritas pangan atau memengaruhi antrean.</p>
        </section>

        <fieldset className="flex flex-col gap-3">
          <legend className="float-left mb-3 text-section-title">Tujuan dukungan</legend>
          <div className="stagger flex flex-col gap-3">
            {ALLOCATIONS.map((a) => {
              const on = a.id === alloc
              return (
                <label
                  key={a.id}
                  className={`tap tap-soft flex cursor-pointer gap-3 rounded-card border-2 bg-surface p-4 transition-[border-color,box-shadow] ${on ? 'border-primary shadow-card' : 'border-line hover:border-line-control'}`}
                >
                  <input type="radio" name="alloc" className="sr-only" checked={on} onChange={() => setAlloc(a.id)} />
                  <span aria-hidden="true" className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-control transition-colors duration-micro ${on ? 'bg-primary text-white' : 'bg-primary-container text-primary'}`}>
                    <a.icon size={24} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold leading-6">{a.title}</span>
                    <span className="block text-meta text-ink-secondary">{a.desc}</span>
                    <span className="mt-2 inline-block rounded-full bg-accent-soft px-2 py-0.5 text-caption text-ink">{a.tag}</span>
                  </span>
                  <span aria-hidden="true" className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${on ? 'border-primary' : 'border-line-control'}`}>
                    {on && <span className="h-3 w-3 animate-pop rounded-full bg-primary" />}
                  </span>
                </label>
              )
            })}
          </div>
        </fieldset>

        <Reveal>
          <div className="card divide-y divide-line overflow-hidden">
            <Link to="/transparansi" className="tap flex min-h-16 items-center gap-3 px-4 py-3 hover:bg-page">
              <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-container text-primary"><Receipt size={20} /></span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium">Laporan transparansi dana</span>
                <span className="block text-meta text-ink-secondary">Pemasukan dan realisasi pengeluaran</span>
              </span>
              <CaretRight size={20} aria-hidden="true" className="text-ink-secondary" />
            </Link>
            <Link to="/dukung/barang" className="tap flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left hover:bg-page">
              <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-container text-primary"><Package size={20} /></span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium">Dukungan barang atau jasa</span>
                <span className="block text-meta text-ink-secondary">Kotak makan, freezer, atau armada</span>
              </span>
              <CaretRight size={20} aria-hidden="true" className="text-ink-secondary" />
            </Link>
            <Link to="/dukung/rutin" className="tap flex min-h-16 items-center gap-3 px-4 py-3 hover:bg-page">
              <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-container text-primary"><BellRinging size={20} /></span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium">Pengingat dukungan rutin</span>
                <span className="block text-meta text-ink-secondary">{state.recurring ? `${rp(state.recurring.amount)} setiap tanggal ${state.recurring.day}` : 'Tanpa penarikan otomatis'}</span>
              </span>
              <CaretRight size={20} aria-hidden="true" className="text-ink-secondary" />
            </Link>
            <Link to="/dukung/riwayat" className="tap flex min-h-16 items-center gap-3 px-4 py-3 hover:bg-page">
              <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-container text-primary"><ClockCounterClockwise size={20} /></span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium">Riwayat dukungan</span>
                <span className="block text-meta text-ink-secondary">{state.supports.length} catatan</span>
              </span>
              <CaretRight size={20} aria-hidden="true" className="text-ink-secondary" />
            </Link>
          </div>
        </Reveal>

      </main>
      <StickyFooter>
        <Button block onClick={() => setOpen(true)}>
          Lanjut pilih jumlah
        </Button>
      </StickyFooter>

      <BottomSheet
        open={open}
        onClose={close}
        title={step === 'done' ? 'Terima kasih' : 'Jumlah dukungan'}
        footer={
          step === 'done' ? (
            <div className="flex flex-col gap-2">
              <Button block onClick={() => (close(), navigate(`/dukung/bukti/${state.supports[0]?.id}`))}>Lihat bukti transaksi</Button>
              <Button block variant="ghost" onClick={close}>Selesai</Button>
            </div>
          ) : (
            <Button block loading={busy} loadingLabel="Memproses…" onClick={confirm}>
              Konfirmasi {rp(value || 0)}
            </Button>
          )
        }
      >
        {step === 'done' ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <SuccessMark />
            <p className="text-card-title">Dukungan {rp(value)} tercatat</p>
            <p className="text-meta text-ink-secondary">Untuk {chosen.title.toLowerCase()}. Selesaikan dengan transfer di bawah ini.</p>
            <BankTransfer amount={value} reference={state.supports[0]?.id} />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-meta text-ink-secondary">Untuk <span className="font-semibold text-ink">{chosen.title}</span></p>
            <div role="radiogroup" aria-label="Pilihan jumlah" className="grid grid-cols-2 gap-2">
              {AMOUNTS.map((n) => {
                const on = !custom && amount === n
                return (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => (setAmount(n), setCustom(''), setErr(''))}
                    className={`tap min-h-14 rounded-control border-2 text-[1.0625rem] font-bold tabular ${on ? 'border-primary bg-primary-container text-primary' : 'border-line bg-surface text-ink hover:border-line-control'}`}
                  >
                    {rp(n)}
                  </button>
                )
              })}
            </div>
            <Field label="Jumlah lain" optional error={err}>
              {(p) => (
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-ink-secondary">Rp</span>
                  <input {...p} inputMode="numeric" className={`${inputCls} pl-11 tabular`} value={custom ? Number(custom).toLocaleString('id-ID') : ''} onChange={(e) => (setCustom(e.target.value.replace(/\D/g, '')), setErr(''))} placeholder="Minimal 10.000" />
                </div>
              )}
            </Field>
            <Notice tone="info">Pembayaran lewat transfer bank ke {BANK.name} a.n. {BANK.holder}. Instruksi muncul setelah Anda konfirmasi.</Notice>
          </div>
        )}
      </BottomSheet>
    </>
  )
}

/* ---------- F06 Transparansi dana ---------- */

const FUND_LABEL: Record<Fund, string> = {
  operasional: 'Operasional dan wadah higienis',
  pengiriman: 'Ongkir dan bahan bakar relawan',
  bantuan_langsung: 'Bantuan langsung',
  program: 'Program',
}
const FUND_COLORS = ['bg-primary', 'bg-accent', 'bg-leaf', 'bg-info']

export function Transparency() {
  const { state } = useApp()
  const summary = state.fundSummary
  // Angka dari buku kas (funding_summary).
  const income = summary.reduce((n, f) => n + f.masuk, 0)
  const spend = summary
      .filter((f) => f.keluar > 0)
      .map((f, i) => ({ label: f.programTitle ?? FUND_LABEL[f.fund], detail: `Sisa dana ${rp(f.saldo)}`, value: f.keluar, cls: FUND_COLORS[i % FUND_COLORS.length] }))
  const out = spend.reduce((s, x) => s + x.value, 0)
  return (
    <>
      <AppBar title="Transparansi dana" />
      <main className="mx-auto flex max-w-[560px] flex-col gap-5 px-4 pb-8 pt-4">
        <section className="card animate-rise-in p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-card-title">Ringkasan kas</h2>
            <Badge tone="info" icon={false}>Sejak awal program</Badge>
          </div>
          <p className="mt-4 text-meta text-ink-secondary">Sisa kas</p>
          <p className="text-display text-primary-pressed"><CountUp value={income - out} format={rp} /></p>
          <dl className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-control bg-primary-container p-3">
              <dt className="text-caption text-ink-secondary">Pemasukan</dt>
              <dd className="text-[1.125rem] font-bold"><CountUp value={income} format={rp} /></dd>
            </div>
            <div className="rounded-control bg-page p-3">
              <dt className="text-caption text-ink-secondary">Pengeluaran</dt>
              <dd className="text-[1.125rem] font-bold"><CountUp value={out} format={rp} /></dd>
            </div>
          </dl>
          <p className="mt-3 text-caption text-ink-secondary">Dari buku kas yang dicatat dan divalidasi admin keuangan. Dana dukungan tidak dicampur dengan taksiran nilai pangan yang diselamatkan.</p>
        </section>

        <section aria-labelledby="alo-h" className="card p-4">
          <h2 id="alo-h" className="text-card-title">Alokasi pengeluaran</h2>
          {out === 0 && <p className="mt-2 text-meta text-ink-secondary">Belum ada pengeluaran tercatat.</p>}
          <div className="mt-3 flex h-3 origin-left animate-grow-x overflow-hidden rounded-full bg-line" aria-hidden="true">
            {spend.map((s) => (
              <span key={s.label} className={s.cls} style={{ width: `${(s.value / out) * 100}%` }} />
            ))}
          </div>
          <ul className="mt-4 flex flex-col gap-3">
            {spend.map((s) => (
              <li key={s.label} className="flex items-start gap-3">
                <span aria-hidden="true" className={`mt-1.5 h-3 w-3 shrink-0 rounded-full ${s.cls}`} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold leading-6">{s.label}</p>
                  <p className="text-meta text-ink-secondary">{s.detail}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-bold tabular">{rp(s.value)}</p>
                  <p className="text-caption text-ink-secondary">{Math.round((s.value / out) * 100)}%</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <Reveal>
          <section className="card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-card-title">Bantuan nontunai</h2>
              <Badge tone="neutral" icon={false}>Dicatat fisik</Badge>
            </div>
            <p className="mt-2 text-meta text-ink-secondary">
              Bantuan barang dan jasa (wadah, armada, pendingin) dicatat dalam jumlah fisik dan tidak dikonversi menjadi nilai rupiah.
            </p>
          </section>
        </Reveal>
        <Reveal>
          <PolicyNote title="Ketertelusuran terbuka">
            Laporan diperiksa berkala terhadap data serah terima nyata, tanpa metrik estimasi karbon spekulatif.
          </PolicyNote>
        </Reveal>
        <ButtonLink to="/transparansi/program" variant="secondary" block>Detail laporan program</ButtonLink>
        <ButtonLink to="/dukung" variant="ghost" block>Dukung Lestari Pangan</ButtonLink>
      </main>
    </>
  )
}

/* ---------- F04 Bukti transaksi ---------- */

const supportTone = (st: Support['status'] | undefined) => (st === 'Tervalidasi' ? 'success' : st === 'Dibatalkan' ? 'neutral' : 'warning')

export function SupportReceipt() {
  const { id } = useParams()
  const { state } = useApp()
  const { refresh } = useLiveData()
  const [checking, setChecking] = useState(false)
  const s = state.supports.find((x) => x.id === id)
  if (!s) return <NotAvailable />
  const status = s.status ?? 'Menunggu verifikasi'
  return (
    <>
      <AppBar title="Bukti transaksi" />
      <main className="stagger mx-auto flex max-w-[560px] flex-col gap-4 px-4 pb-10 pt-4">
        <section className="relative overflow-hidden rounded-card border border-line bg-surface p-6 text-center shadow-card">
          <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-primary via-leaf to-accent" />
          <Badge tone={supportTone(status)}>{status}</Badge>
          <p className="mt-3 text-display text-primary-pressed"><CountUp value={s.amount} format={rp} /></p>
          <p className="text-meta text-ink-secondary">Ref {s.id}</p>
          <div className="my-5 border-t border-dashed border-line" />
          <dl className="flex flex-col gap-3 text-left">
            {[
              ['Waktu', s.at],
              ['Tujuan', s.allocation],
              ['Metode', `Transfer ${BANK.name}, divalidasi tim keuangan`],
              ...(s.note ? [['Catatan', s.note]] : []),
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 text-meta">
                <dt className="text-ink-secondary">{k}</dt>
                <dd className="text-right font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </section>
        {status === 'Menunggu verifikasi' && <BankTransfer amount={s.amount} reference={s.id} />}
        <Button
          variant="secondary"
          block
          loading={checking}
          loadingLabel="Memeriksa…"
          onClick={() => {
            setChecking(true)
            refresh()
              .catch(() => {})
              .finally(() => setChecking(false))
          }}
        >
          Periksa status ulang
        </Button>
        <ButtonLink to="/transparansi" variant="ghost" block>Lihat alokasi di Transparansi dana</ButtonLink>
      </main>
    </>
  )
}

/* ---------- F05 Riwayat dukungan ---------- */

export function SupportHistory() {
  const { state } = useApp()
  const [f, setF] = useState<'Semua' | 'Menunggu verifikasi' | 'Tervalidasi' | 'Dibatalkan'>('Semua')
  const list = state.supports.filter((s) => f === 'Semua' || (s.status ?? 'Menunggu verifikasi') === f)
  return (
    <>
      <AppBar title="Riwayat dukungan" actions={<ButtonLink to="/dukung" variant="ghost" className="min-h-12 text-[0.875rem]">+ Baru</ButtonLink>} />
      <main className="flex flex-col gap-4 px-4 pb-10 pt-4">
        <div role="group" aria-label="Filter status" className="chip-row -mx-4 flex gap-2 overflow-x-auto px-4">
          {(['Semua', 'Menunggu verifikasi', 'Tervalidasi', 'Dibatalkan'] as const).map((x) => (
            <button key={x} type="button" aria-pressed={f === x} onClick={() => setF(x)} className={`tap min-h-11 shrink-0 rounded-full border px-4 text-[0.875rem] font-semibold ${f === x ? 'border-primary bg-primary text-white' : 'border-line bg-surface'}`}>{x}</button>
          ))}
        </div>
        {list.length === 0 ? (
          <StatePanel title="Tidak ada catatan">Pilih filter lain.</StatePanel>
        ) : (
          <ul key={f} className="stagger flex flex-col gap-3">
            {list.map((s) => (
              <li key={s.id}>
                <Link to={`/dukung/bukti/${s.id}`} className="tap card flex items-center gap-3 p-4 hover:bg-page">
                  <div className="min-w-0 flex-1">
                    <Badge tone={supportTone(s.status)}>{s.status ?? 'Menunggu verifikasi'}</Badge>
                    <p className="mt-1.5 text-card-title tabular">{rp(s.amount)}</p>
                    <p className="text-meta text-ink-secondary">{s.allocation} · {s.at}</p>
                    {s.note && <p className="text-meta">{s.note}</p>}
                  </div>
                  <CaretRight size={20} aria-hidden="true" className="shrink-0 text-ink-secondary" />
                </Link>
              </li>
            ))}
          </ul>
        )}
        {state.inKind.length > 0 && (
          <section className="flex flex-col gap-2">
            <h2 className="text-section-title">Dukungan barang</h2>
            {state.inKind.map((k) => (
              <div key={k.id} className="card flex items-center justify-between gap-3 p-4">
                <div><p className="font-semibold">{k.kind}</p><p className="text-meta text-ink-secondary">{k.amount} · {k.at}</p></div>
                <Badge tone="warning">{k.status}</Badge>
              </div>
            ))}
          </section>
        )}
      </main>
    </>
  )
}

/* ---------- F07 Detail laporan program ---------- */

export function ProgramReport() {
  const { state } = useApp()
  const program = state.fundSummary?.find((f) => f.fund === 'program')
  if (!program) {
    return (
      <>
        <AppBar title="Laporan program" />
        <main className="p-4">
          <StatePanel title="Belum ada laporan program" action={<ButtonLink to="/transparansi" variant="secondary">Kembali ke transparansi</ButtonLink>}>
            Laporan muncul setelah program bersponsor menerima dan memakai dana.
          </StatePanel>
        </main>
      </>
    )
  }
  const real = [['Masuk', program.masuk], ['Terpakai', program.keluar], ['Sisa', program.saldo]]
  const usedPct = program.masuk > 0 ? Math.round((program.keluar / program.masuk) * 100) : 0
  return (
    <>
      <AppBar title="Laporan program" />
      <main className="stagger mx-auto flex max-w-[560px] flex-col gap-4 px-4 pb-10 pt-4">
        <section className="rounded-greet bg-primary p-5 text-white">
          <p className="text-caption font-semibold uppercase tracking-wide text-white/80">Program subsidi logistik</p>
          <h1 className="mt-1 text-section-title">{program.programTitle}</h1>
          <div className="mt-3 flex flex-wrap gap-2 text-caption">
            <span className="rounded-full bg-white/15 px-2.5 py-1">Dari buku kas tervalidasi</span>
          </div>
        </section>
        <section className="card p-4">
          <h2 className="text-card-title">Realisasi dana</h2>
          <dl className="mt-3 grid grid-cols-3 gap-2">
            {real.map(([k, v]) => (
              <div key={k as string} className="rounded-control bg-page p-3"><dt className="text-caption text-ink-secondary">{k}</dt><dd className="text-meta font-bold tabular"><CountUp value={v as number} format={rp} /></dd></div>
            ))}
          </dl>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-line" aria-hidden="true"><span className="block h-full origin-left animate-grow-x rounded-full bg-primary" style={{ width: `${usedPct}%` }} /></div>
          <p className="mt-2 text-caption text-ink-secondary">Dana program hanya dipakai untuk tujuan program. Pangan tetap gratis.</p>
        </section>
        <PolicyNote title="Metode dan privasi">Angka dihimpun dari konfirmasi dua pihak. Laporan bersifat agregat; identitas dan kontak penerima dirahasiakan.</PolicyNote>
      </main>
    </>
  )
}

/* ---------- F08 Dukungan barang/jasa ---------- */

const INKIND = [
  ['Wadah atau kemasan ramah lingkungan', 'Food grade, besek, kotak kertas', Package],
  ['Armada antar jemput', 'Transportasi relawan lokal', Truck],
  ['Alat penyimpanan dingin', 'Cooler box atau pinjaman lemari pendingin', Snowflake],
] as const

export function InKindForm() {
  const run = useCommand()
  const profile = useProfile()
  const [area, setArea] = useState(profile.area)
  const [clientId] = useState(() => crypto.randomUUID())
  const navigate = useNavigate()
  const [kind, setKind] = useState('')
  const [amount, setAmount] = useState('')
  const [contact, setContact] = useState('')
  const [err, setErr] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const submit = () => {
    const e = { kind: kind ? '' : 'Pilih jenis dukungan.', amount: amount.trim() ? '' : 'Isi jumlah atau kapasitas, mis. 50 wadah.', contact: contact.replace(/\D/g, '').length >= 9 ? '' : 'Isi nomor telepon minimal 9 angka.' }
    setErr(e)
    if (Object.values(e).some(Boolean)) return
    setBusy(true)
    run({ type: 'addInKind', kind, amount: `${amount.trim()} (wilayah: ${area.trim() || '-'}; kontak: ${contact.trim()})`, clientId })
      .then(() => {
        toast('Pengajuan diterima. Tim meninjau dalam 1–2 hari kerja.')
        navigate('/dukung/riwayat', { replace: true })
      })
      .catch((e) => {
        toast(messageOf(e), 'info')
        setBusy(false)
      })
  }
  return (
    <>
      <AppBar title="Dukungan barang dan jasa" dirty={!!(kind || amount || contact) && !busy} />
      <main className="stagger mx-auto flex max-w-[560px] flex-col gap-4 px-4 pb-36 pt-4">
        <p className="text-body text-ink-secondary">Bantu fasilitas dan logistik penyaluran. Dukungan barang dicatat dalam jumlah fisik, bukan rupiah.</p>
        <fieldset className="flex flex-col gap-2">
          <legend className="float-left mb-2 text-label">Jenis dukungan</legend>
          {INKIND.map(([t, d]) => <RadioCard key={t} name="kind" checked={kind === t} onChange={() => setKind(t)} title={t} description={d} />)}
          {err.kind && <p className="text-meta font-medium text-danger">{err.kind}</p>}
        </fieldset>
        <Field label="Jumlah atau kapasitas" hint="Sebutkan satuannya, mis. 50 wadah atau 1 motor 2 hari/pekan." error={err.amount}>
          {(p) => <input {...p} className={inputCls} value={amount} onChange={(e) => setAmount(e.target.value)} />}
        </Field>
        <Field label="Wilayah jangkauan" hint="Diprioritaskan di sekitar komunitas aktif.">
          {(p) => <input {...p} className={inputCls} value={area} onChange={(e) => setArea(e.target.value)} />}
        </Field>
        <Field label="Nomor telepon koordinasi" hint="Hanya dilihat tim peninjau." error={err.contact}>
          {(p) => <input {...p} type="tel" inputMode="tel" autoComplete="tel" className={inputCls} value={contact} onChange={(e) => setContact(e.target.value)} />}
        </Field>
      </main>
      <StickyFooter>
        <Button block loading={busy} loadingLabel="Mengirim…" onClick={submit}>Ajukan dukungan</Button>
      </StickyFooter>
    </>
  )
}

/* ---------- F09 Pengingat dukungan rutin ---------- */

export function RecurringReminder() {
  const { state } = useApp()
  const run = useCommand()
  const [busy, setBusy] = useState(false)
  const save = (value: { amount: number; day: number } | null, msg: string) => {
    setBusy(true)
    run({ type: 'setRecurring', value })
      .then(() => toast(msg, value ? 'success' : 'info'))
      .catch((e) => toast(messageOf(e), 'info'))
      .finally(() => setBusy(false))
  }
  const [amount, setAmount] = useState(state.recurring?.amount ?? 50000)
  const [day, setDay] = useState(state.recurring?.day ?? 1)
  const active = !!state.recurring
  return (
    <>
      <AppBar title="Pengingat dukungan rutin" />
      <main className="stagger mx-auto flex max-w-[560px] flex-col gap-4 px-4 pb-36 pt-4">
        <PolicyNote title="Hanya pengingat">Lestari Pangan tidak menyimpan data kartu dan tidak menarik dana otomatis. Anda menerima notifikasi pada tanggal pilihan.</PolicyNote>
        {active && (
          <section className="animate-rise-in rounded-card border border-primary bg-primary-container p-4">
            <Badge tone="success">Aktif</Badge>
            <p className="mt-2 text-card-title">{rp(state.recurring!.amount)} / bulan</p>
            <p className="text-meta text-ink-secondary">Pengingat setiap tanggal {state.recurring!.day} lewat notifikasi aplikasi · subsidi ongkir dan relawan</p>
          </section>
        )}
        <fieldset>
          <legend className="text-label">Nominal pengingat</legend>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {[25000, 50000, 100000].map((n) => (
              <button key={n} type="button" aria-pressed={amount === n} onClick={() => setAmount(n)} className={`tap min-h-12 rounded-control border-2 font-bold tabular ${amount === n ? 'border-primary bg-primary-container text-primary' : 'border-line bg-surface'}`}>{rp(n)}</button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="text-label">Tanggal pengingat</legend>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {[1, 10, 15, 25].map((d) => (
              <button key={d} type="button" aria-pressed={day === d} onClick={() => setDay(d)} className={`tap min-h-12 rounded-control border-2 font-semibold ${day === d ? 'border-primary bg-primary-container text-primary' : 'border-line bg-surface'}`}>Tgl {d}</button>
            ))}
          </div>
        </fieldset>
      </main>
      <StickyFooter>
        <Button block loading={busy} onClick={() => save({ amount, day }, active ? 'Pengingat diperbarui.' : 'Pengingat diaktifkan.')}>
          {active ? 'Simpan perubahan' : 'Aktifkan pengingat'}
        </Button>
        {active && (
          <Button block variant="ghost-danger" disabled={busy} onClick={() => save(null, 'Pengingat dihentikan. Tidak ada biaya apa pun.')}>
            Hentikan pengingat
          </Button>
        )}
      </StickyFooter>
    </>
  )
}
