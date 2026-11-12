import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  ChatCircleText,
  DeviceMobile,
  EnvelopeSimple,
  Eye,
  EyeSlash,
  FileText,
  Lifebuoy,
  LockKey,
  MapPin,
  Microphone,
  Person,
  ShieldCheck,
  SignOut,
  Sparkle,
  Trash,
  WarningCircle,
} from '@phosphor-icons/react'
import {
  AppBar,
  Badge,
  Button,
  ButtonLink,
  Chip,
  Disclosure,
  Field,
  inputCls,
  MenuRow,
  Notice,
  PolicyNote,
  RadioCard,
  Reveal,
  StickyFooter,
  Toggle,
  toast,
} from '../components/ui'
import { useApp, type ProfileFields } from '../state/AppState'
import { useProfile } from '../state/useProfile'
import { useMyProfile } from '../state/MyProfile'
import { useCommand } from '../state/useCommand'
import { AreaField } from '../components/AreaField'
import { saveProfile } from '../services/identity'
import { currentEmail, isDemoEmail, setPassword } from '../services/auth'
import { messageOf } from '../lib/supabase/errors'
import { asset } from '../lib/format'

/* ---------- Pola bersama ---------- */

function Card({ title, badge, children, className = '' }: { title?: string; badge?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`card p-4 ${className}`}>
      {title && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-card-title">{title}</h2>
          {badge}
        </div>
      )}
      {children}
    </section>
  )
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-label={title} className="card overflow-hidden">
      <h2 className="border-b border-line px-4 py-3 text-label uppercase tracking-wide text-ink-secondary">{title}</h2>
      <div className="divide-y divide-line">{children}</div>
    </section>
  )
}

/** Simpan profil (Supabase di mode live), lalu toast dan kembali ke halaman sebelumnya. */
export function useSave(message: string) {
  const navigate = useNavigate()
  const { refresh } = useMyProfile()
  const [busy, setBusy] = useState(false)
  const save = async (fields: Partial<ProfileFields>) => {
    setBusy(true)
    try {
      await saveProfile(fields)
      await refresh()
      toast(message)
      navigate(-1)
    } catch (err) {
      toast(messageOf(err), 'info')
      setBusy(false)
    }
  }
  return { busy, save }
}

type Errors = Partial<Record<string, string>>
const phoneOk = (v: string) => v.replace(/\D/g, '').length >= 9

/* ---------- A02 Edit profil ---------- */

export function ProfileEdit() {
  const { state } = useApp()
  const profile = useProfile()
  const donor = state.role === 'pemberi'
  const [f, setF] = useState({ pic: profile.pic, phone: profile.phone })
  const [errors, setErrors] = useState<Errors>({})
  const { busy, save } = useSave('Profil disimpan')
  const dirty = f.pic !== profile.pic || f.phone !== profile.phone

  const check = (k: keyof typeof f, v: string) =>
    k === 'pic' ? (v.trim() ? '' : 'Isi nama penanggung jawab.') : phoneOk(v) ? '' : 'Isi nomor telepon minimal 9 angka.'
  const submit = () => {
    const e = { pic: check('pic', f.pic), phone: check('phone', f.phone) }
    setErrors(e)
    if (e.pic || e.phone) return void requestAnimationFrame(() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus())
    save({ pic: f.pic.trim(), phone: f.phone.trim() })
  }

  return (
    <>
      <AppBar title="Edit profil" dirty={dirty && !busy} />
      <main className="stagger mx-auto flex max-w-[560px] flex-col gap-4 px-4 pb-36 pt-4">
        <section className="flex items-center gap-4 rounded-greet bg-primary-container p-4">
          <span className="flex h-16 w-16 shrink-0 animate-pop items-center justify-center rounded-full bg-primary text-[1.375rem] font-bold text-white">{profile.initials}</span>
          <div className="min-w-0">
            <p className="text-caption font-semibold uppercase tracking-wide text-primary">Peran aktif</p>
            <p className="text-card-title">{donor ? 'Pemberi pangan' : 'Penerima pangan'}</p>
            <p className="text-meta text-ink-secondary">{profile.type} · satu peran aktif per akun</p>
          </div>
        </section>

        <Card title="Informasi publik" badge={<Badge tone="success" icon={false}>Tampil di katalog</Badge>}>
          <dl className="flex flex-col gap-3">
            <div>
              <dt className="text-label">{donor ? 'Nama usaha atau dapur' : 'Nama organisasi'}</dt>
              <dd className="mt-1 flex min-h-[52px] items-center gap-2 rounded-control border border-line bg-page px-4 text-body text-ink">
                <LockKey size={18} aria-hidden="true" className="shrink-0 text-ink-secondary" />
                {profile.name}
              </dd>
              <dd className="mt-1 text-meta text-ink-secondary">Mengubah nama memerlukan verifikasi ulang. Hubungi Pusat bantuan.</dd>
            </div>
            <div>
              <dt className="text-label">Wilayah kecamatan</dt>
              <dd className="mt-1 flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-body"><MapPin size={18} aria-hidden="true" className="text-primary" />{profile.area}</span>
                <ButtonLink to="/akun/lokasi" variant="ghost" className="min-h-12 text-[0.875rem]">Ubah area</ButtonLink>
              </dd>
            </div>
          </dl>
        </Card>

        <Card title="Kontak koordinasi" badge={<Badge tone="neutral" icon={false}>Privat</Badge>}>
          <div className="flex flex-col gap-4">
            <Field label="Nama penanggung jawab" error={errors.pic}>
              {(p) => (
                <input
                  {...p}
                  autoComplete="name"
                  className={inputCls}
                  value={f.pic}
                  onChange={(e) => setF({ ...f, pic: e.target.value })}
                  onBlur={(e) => setErrors({ ...errors, pic: check('pic', e.target.value) })}
                />
              )}
            </Field>
            <Field label="Nomor telepon koordinasi" hint="Hanya dibuka kepada pihak yang permintaannya sudah disetujui." error={errors.phone}>
              {(p) => (
                <input
                  {...p}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  className={inputCls}
                  value={f.phone}
                  onChange={(e) => setF({ ...f, phone: e.target.value })}
                  onBlur={(e) => setErrors({ ...errors, phone: check('phone', e.target.value) })}
                />
              )}
            </Field>
          </div>
        </Card>

        <div className="card divide-y divide-line overflow-hidden">
          <MenuRow to="/akun/lokasi" icon={<MapPin size={20} />} title="Alamat dan jam koordinasi" subtitle={profile.hours} />
          {!donor && <MenuRow to="/akun/kebutuhan" icon={<Person size={20} />} title="Kebutuhan dan kapasitas" subtitle={profile.capacity} />}
        </div>
      </main>
      <StickyFooter>
        <Button block onClick={submit} loading={busy} loadingLabel="Menyimpan…" disabled={!dirty}>
          Simpan profil
        </Button>
      </StickyFooter>
    </>
  )
}

/* ---------- A03 Kebutuhan dan kapasitas (penerima) ---------- */

const STORAGE_OPTS = [
  ['Suhu ruang dan pendingin', 'Pangan siap santap bisa disimpan sampai malam hari.'],
  ['Hanya suhu ruang', 'Pangan langsung dibagikan dalam 2 jam.'],
  ['Freezer untuk bahan mentah', 'Dapat menerima daging atau sayur beku.'],
] as const

export function NeedsCapacity() {
  const profile = useProfile()
  const [cap, setCap] = useState(() => profile.capacity.match(/\d+/)?.[0] ?? '30')
  const [storage, setStorage] = useState<string>(() => STORAGE_OPTS.find(([t]) => profile.storage.startsWith(t))?.[0] ?? STORAGE_OPTS[0][0])
  const [pickup, setPickup] = useState('Ambil sendiri')
  const [error, setError] = useState('')
  const { busy, save } = useSave('Kebutuhan dan kapasitas disimpan')

  const submit = () => {
    const n = Number(cap)
    if (!Number.isInteger(n) || n < 1) return setError('Isi kapasitas berupa angka minimal 1.')
    save({ capacity: `${n} porsi per hari`, storage })
  }

  return (
    <>
      <AppBar title="Kebutuhan dan kapasitas" />
      <main className="stagger mx-auto flex max-w-[560px] flex-col gap-4 px-4 pb-36 pt-4">
        <Notice tone="info" title="Kenapa ini penting">
          Pemberi menyesuaikan jumlah agar pangan tidak rusak atau terbuang sebelum dibagikan.
        </Notice>
        <Card title="Kapasitas per pengambilan">
          <Field label="Jumlah maksimal" hint="Dalam porsi siap santap. Batas ini menjaga pemerataan antarkomunitas." error={error}>
            {(p) => (
              <div className="flex items-center gap-2">
                <input {...p} inputMode="numeric" className={`${inputCls} max-w-[8rem] text-center text-[1.25rem] font-bold`} value={cap} onChange={(e) => (setCap(e.target.value.replace(/\D/g, '')), setError(''))} />
                <span className="text-body text-ink-secondary">porsi per hari</span>
              </div>
            )}
          </Field>
        </Card>
        <fieldset className="card flex flex-col gap-2 p-4">
          <legend className="float-left mb-3 text-card-title">Fasilitas penyimpanan</legend>
          {STORAGE_OPTS.map(([t, d]) => (
            <RadioCard key={t} name="storage" checked={storage === t} onChange={() => setStorage(t)} title={t} description={d} />
          ))}
        </fieldset>
        <fieldset className="card flex flex-col gap-2 p-4">
          <legend className="float-left mb-3 text-card-title">Cara pengambilan utama</legend>
          <RadioCard name="pickup" checked={pickup === 'Ambil sendiri'} onChange={() => setPickup('Ambil sendiri')} title="Ambil sendiri oleh relawan" description="Relawan datang ke titik temu pemberi." />
          <RadioCard name="pickup" checked={pickup === 'Perlu antar'} onChange={() => setPickup('Perlu antar')} title="Perlu bantuan pengantaran" description="Bergantung ketersediaan mitra pengiriman; biaya disepakati terpisah." />
        </fieldset>
      </main>
      <StickyFooter>
        <Button block onClick={submit} loading={busy} loadingLabel="Menyimpan…">
          Simpan kebutuhan
        </Button>
      </StickyFooter>
    </>
  )
}

/* ---------- A04 Lokasi dan koordinasi ---------- */

const DAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

export function LocationSettings() {
  const profile = useProfile()
  const t = profile.hours.match(/(\d{2})\.(\d{2})–(\d{2})\.(\d{2})/)
  const [f, setF] = useState({
    area: profile.area,
    address: profile.address,
    start: t ? `${t[1]}:${t[2]}` : '14:00',
    end: t ? `${t[3]}:${t[4]}` : '19:00',
  })
  const [days, setDays] = useState<string[]>(profile.hours.startsWith('Setiap hari') ? DAYS : DAYS.slice(0, 6))
  const [errors, setErrors] = useState<Errors>({})
  const { busy, save } = useSave('Lokasi dan jam koordinasi disimpan')

  const submit = () => {
    const e: Errors = {
      area: f.area ? '' : 'Pilih kabupaten/kota dari daftar.',
      address: f.address.trim().length >= 10 ? '' : 'Isi alamat lengkap dengan patokan.',
      end: f.end > f.start ? '' : 'Jam selesai harus setelah jam mulai.',
      days: days.length ? '' : 'Pilih minimal satu hari.',
    }
    setErrors(e)
    if (Object.values(e).some(Boolean)) return
    const dayLabel = days.length === 7 ? 'Setiap hari' : days.length > 2 && DAYS.indexOf(days[days.length - 1]) - DAYS.indexOf(days[0]) === days.length - 1 ? `${days[0]}–${days[days.length - 1]}` : days.join(', ')
    save({ area: f.area.trim(), address: f.address.trim(), hours: `${dayLabel}, ${f.start.replace(':', '.')}–${f.end.replace(':', '.')}` })
  }

  return (
    <>
      <AppBar title="Lokasi dan koordinasi" />
      <main className="stagger mx-auto flex max-w-[560px] flex-col gap-4 px-4 pb-36 pt-4">
        <PolicyNote title="Alamat Anda terlindungi">
          Pencarian hanya menampilkan kecamatan dan kota. Alamat lengkap dan nomor telepon dibuka setelah permintaan disetujui bersama.
        </PolicyNote>
        <Card title="Wilayah publik" badge={<Badge tone="success" icon={false}><Eye size={14} aria-hidden="true" className="mr-1 inline" />Terlihat publik</Badge>}>
          <AreaField value={f.area} onChange={(area) => setF({ ...f, area })} error={errors.area} />
        </Card>
        <Card title="Titik temu" badge={<Badge tone="neutral" icon={false}><EyeSlash size={14} aria-hidden="true" className="mr-1 inline" />Privat</Badge>}>
          <Field label="Alamat lengkap" hint="Sertakan patokan, nomor rumah, atau akses pintu samping." error={errors.address}>
            {(p) => <textarea {...p} rows={3} autoComplete="street-address" className={inputCls} value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} />}
          </Field>
        </Card>
        <Card title="Jam koordinasi rutin">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Mulai">{(p) => <input {...p} type="time" className={inputCls} value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })} />}</Field>
            <Field label="Selesai" error={errors.end}>{(p) => <input {...p} type="time" className={inputCls} value={f.end} onChange={(e) => setF({ ...f, end: e.target.value })} />}</Field>
          </div>
          <fieldset className="mt-4">
            <legend className="text-label">Hari aktif</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {DAYS.map((d) => (
                <Chip key={d} selected={days.includes(d)} onClick={() => setDays((s) => (s.includes(d) ? s.filter((x) => x !== d) : DAYS.filter((x) => s.includes(x) || x === d)))}>
                  {d}
                </Chip>
              ))}
            </div>
            {errors.days && <p className="mt-2 flex items-center gap-1 text-meta font-medium text-danger"><WarningCircle size={18} weight="fill" aria-hidden="true" />{errors.days}</p>}
          </fieldset>
        </Card>
        <p className="text-meta text-ink-secondary">Perubahan berlaku untuk penawaran baru. Kesepakatan yang sedang berjalan tidak berubah.</p>
      </main>
      <StickyFooter>
        <Button block onClick={submit} loading={busy} loadingLabel="Menyimpan…">
          Simpan lokasi dan jam
        </Button>
      </StickyFooter>
    </>
  )
}

/* ---------- A05 Pengaturan ---------- */

export function SettingsHome() {
  const run = useCommand()
  const { state } = useApp()
  const calm = !!state.prefs.reduceMotion
  return (
    <>
      <AppBar title="Pengaturan" />
      <main className="stagger mx-auto flex max-w-[560px] flex-col gap-4 px-4 pb-8 pt-4">
        <Group title="Komunikasi">
          <MenuRow to="/pengaturan/notifikasi" icon={<Bell size={20} />} title="Notifikasi" subtitle="Status permintaan, jadwal serah terima" />
        </Group>
        <Group title="Keamanan dan data">
          <MenuRow to="/pengaturan/privasi" icon={<ShieldCheck size={20} />} title="Data dan privasi" subtitle="Visibilitas profil, izin mikrofon dan lokasi" />
          <MenuRow to="/pengaturan/keamanan" icon={<LockKey size={20} />} title="Keamanan akses" subtitle="Metode masuk, sesi aktif" />
        </Group>
        <Group title="Aksesibilitas">
          <Toggle
            checked={calm}
            onChange={(v) => {
              run({ type: 'setPref', key: 'reduceMotion', value: v })
                .then(() => toast(v ? 'Animasi dikurangi' : 'Animasi kembali normal', 'info'))
                .catch((err) => toast(messageOf(err), 'info'))
            }}
            label="Kurangi gerakan"
            description="Matikan animasi transisi. Pengaturan sistem perangkat tetap diikuti."
          />
        </Group>
        <Group title="Bantuan">
          <MenuRow to="/bantuan" icon={<Lifebuoy size={20} />} title="Pusat bantuan" subtitle="Panduan operasional dan pelaporan" />
          <MenuRow to="/tentang" icon={<FileText size={20} />} title="Tentang, ketentuan, dan privasi" />
        </Group>
      </main>
    </>
  )
}

/* ---------- A06 Preferensi notifikasi ---------- */

const NOTIF_PREFS = [
  {
    group: 'Koordinasi penyaluran',
    items: [
      ['notif.requests', 'Permintaan dan persetujuan', 'Saat ada permintaan baru atau jadwal disetujui'],
      ['notif.reminder', 'Pengingat serah terima', '60 menit sebelum rentang waktu berakhir'],
      ['notif.coordination', 'Pesan koordinasi', 'Saat relawan atau penerima menuju lokasi'],
    ],
  },
  {
    group: 'Program dan dampak',
    items: [
      ['notif.impact', 'Ringkasan dampak bulanan', 'Rekap porsi terverifikasi di akhir bulan'],
      ['notif.challenge', 'Eco Challenge', 'Info program apresiasi periode baru'],
    ],
  },
] as const

export function NotificationPrefs() {
  const { state } = useApp()
  const run = useCommand()
  return (
    <>
      <AppBar title="Preferensi notifikasi" />
      <main className="stagger mx-auto flex max-w-[560px] flex-col gap-4 px-4 pb-8 pt-4">
        <Notice tone="info" title="Notifikasi perangkat">
          Jika notifikasi dimatikan di setelan ponsel, semua pembaruan tetap ada di kotak masuk aplikasi.
        </Notice>
        {NOTIF_PREFS.map((g) => (
          <section key={g.group} aria-label={g.group} className="card overflow-hidden">
            <h2 className="border-b border-line px-4 py-3 text-label uppercase tracking-wide text-ink-secondary">{g.group}</h2>
            <div className="divide-y divide-line">
              {g.items.map(([key, label, desc]) => (
                <Toggle key={key} checked={state.prefs[key] ?? true} onChange={(v) => run({ type: 'setPref', key, value: v }).catch((err) => toast(messageOf(err), 'info'))} label={label} description={desc} />
              ))}
            </div>
          </section>
        ))}
        <p className="text-meta text-ink-secondary">Perubahan tersimpan otomatis. Alamat privat tidak pernah ditampilkan di banner notifikasi.</p>
      </main>
    </>
  )
}

/* ---------- A07 Data dan privasi ---------- */

export function PrivacySettings() {
  return (
    <>
      <AppBar title="Data dan privasi" />
      <main className="stagger mx-auto flex max-w-[560px] flex-col gap-4 px-4 pb-8 pt-4">
        <Card title="Siapa yang melihat data Anda">
          <ul className="flex flex-col gap-3">
            <li className="flex gap-3 rounded-control bg-primary-container/60 p-3">
              <Eye size={22} aria-hidden="true" className="mt-0.5 shrink-0 text-primary" />
              <div>
                <p className="font-semibold">Publik</p>
                <p className="text-meta text-ink-secondary">Nama usaha, wilayah kecamatan, dan penawaran aktif.</p>
              </div>
            </li>
            <li className="flex gap-3 rounded-control bg-page p-3">
              <EyeSlash size={22} aria-hidden="true" className="mt-0.5 shrink-0 text-ink-secondary" />
              <div>
                <p className="font-semibold">Privat, terbatas kegiatan</p>
                <p className="text-meta text-ink-secondary">Alamat lengkap dan telepon. Dibuka hanya setelah kesepakatan disetujui bersama.</p>
              </div>
            </li>
          </ul>
        </Card>
        <Group title="Izin perangkat">
          <div className="flex min-h-16 items-start gap-3 px-4 py-3">
            <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-container text-primary"><Microphone size={20} /></span>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2 font-medium">Mikrofon <Badge tone="neutral" icon={false}>Saat dipakai</Badge></span>
              <span className="block text-meta text-ink-secondary">Hanya aktif saat tombol mikrofon ditekan di Resep dari Sisa. Tidak merekam di latar belakang.</span>
            </span>
          </div>
          <div className="flex min-h-16 items-start gap-3 px-4 py-3">
            <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-container text-primary"><MapPin size={20} /></span>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2 font-medium">Lokasi <Badge tone="neutral" icon={false}>Manual</Badge></span>
              <span className="block text-meta text-ink-secondary">Kecamatan dipilih manual. GPS hanya bantuan opsional.</span>
            </span>
          </div>
        </Group>
        <Reveal>
          <section className="card p-4">
            <h2 className="text-card-title">Penghapusan data</h2>
            <p className="mt-1 text-meta text-ink-secondary">
              Riwayat penyaluran yang sudah disahkan tetap disimpan untuk akuntabilitas, tanpa identitas pribadi Anda.
            </p>
            <ButtonLink to="/pengaturan/hapus-akun" variant="danger" block className="mt-4" icon={<Trash size={20} />}>
              Ajukan penghapusan data
            </ButtonLink>
          </section>
        </Reveal>
        <ButtonLink to="/tentang" variant="ghost" block>Baca ringkasan kebijakan privasi</ButtonLink>
      </main>
    </>
  )
}

/* ---------- A08 Keamanan akses ---------- */

export function SecuritySettings() {
  const { dispatch } = useApp()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  useEffect(() => {
    currentEmail().then(setEmail).catch(() => {})
  }, [])
  return (
    <>
      <AppBar title="Keamanan akses" />
      <main className="stagger mx-auto flex max-w-[560px] flex-col gap-4 px-4 pb-8 pt-4">
        <Group title="Metode masuk">
          <div className="flex min-h-16 items-center gap-3 px-4 py-3">
            <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-container text-primary"><EnvelopeSimple size={20} /></span>
            <span className="min-w-0 flex-1">
              <span className="block font-medium">Email</span>
              <span className="block break-all text-meta text-ink-secondary">{email || '—'}</span>
            </span>
            <Badge tone="success">Aktif</Badge>
          </div>
          <PasswordRow email={email} />
        </Group>
        <Group title="Sesi aktif">
          <div className="flex min-h-16 items-center gap-3 px-4 py-3">
            <span aria-hidden="true" className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-container text-primary">
              <DeviceMobile size={20} />
              <span className="absolute right-0 top-0 h-3 w-3 rounded-full bg-primary ring-2 ring-white">
                <span className="absolute inset-0 animate-ping rounded-full bg-primary/60" />
              </span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-medium">Perangkat ini</span>
              <span className="block text-meta text-ink-secondary">Browser ini · sedang aktif</span>
            </span>
          </div>
        </Group>
        <Notice tone="info">Masuk bisa dengan kode verifikasi email atau kata sandi. Autentikasi dua faktor menyusul.</Notice>
        <div className="mt-4 border-t border-line pt-4">
          <Button
            variant="danger"
            block
            icon={<SignOut size={20} />}
            onClick={() => {
              dispatch({ type: 'signOut' })
              navigate('/masuk', { replace: true })
            }}
          >
            Keluar dari akun
          </Button>
          <p className="mt-2 text-center text-meta text-ink-secondary">Data koordinasi privat di perangkat ini akan dihapus.</p>
        </div>
      </main>
    </>
  )
}

/** Metode masuk kedua: kata sandi (opsional) untuk akun yang mendaftar lewat kode verifikasi. */
function PasswordRow({ email }: { email: string }) {
  const [open, setOpen] = useState(false)
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  // Akun uji dipakai bersama banyak juri: kata sandinya tidak boleh diganti dari aplikasi.
  const demo = isDemoEmail(email)
  const save = async () => {
    if (pw.length < 8 || !/[a-z]/i.test(pw) || !/\d/.test(pw)) return setErr('Minimal 8 karakter, berisi huruf dan angka.')
    if (pw !== pw2) return setErr('Ulangi kata sandi yang sama.')
    setBusy(true)
    try {
      await setPassword(pw)
      toast('Kata sandi disimpan. Sekarang Anda bisa masuk dengan kode verifikasi atau kata sandi.')
      setOpen(false)
      setPw('')
      setPw2('')
      setErr('')
    } catch (e) {
      setErr(messageOf(e))
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="flex flex-col gap-3 px-4 py-3">
      <div className="flex min-h-10 items-center gap-3">
        <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-container text-primary"><LockKey size={20} /></span>
        <span className="min-w-0 flex-1">
          <span className="block font-medium">Kata sandi</span>
          <span className="block text-meta text-ink-secondary">{demo ? 'Akun uji: kata sandi tidak bisa diubah.' : 'Opsional. Masuk tanpa menunggu kode email.'}</span>
        </span>
        {!open && !demo && (
          <Button variant="tonal" className="min-h-12 px-4" onClick={() => setOpen(true)}>
            Atur
          </Button>
        )}
      </div>
      {open && (
        <div className="flex flex-col gap-3">
          <Field label="Kata sandi baru" hint="Minimal 8 karakter, berisi huruf dan angka.">
            {(f) => <input {...f} type="password" autoComplete="new-password" className={inputCls} value={pw} onChange={(e) => (setPw(e.target.value), setErr(''))} />}
          </Field>
          <Field label="Ulangi kata sandi" error={err}>
            {(f) => <input {...f} type="password" autoComplete="new-password" className={inputCls} value={pw2} onChange={(e) => (setPw2(e.target.value), setErr(''))} />}
          </Field>
          <div className="flex gap-2">
            <Button className="flex-1" loading={busy} loadingLabel="Menyimpan…" onClick={save}>Simpan kata sandi</Button>
            <Button variant="secondary" disabled={busy} onClick={() => (setOpen(false), setErr(''))}>Batal</Button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ---------- A09 Pusat bantuan ---------- */

const FAQ = [
  ['Bagaimana jika jumlah saat serah terima berbeda?', 'Penerima mencatat jumlah yang benar-benar diterima di Konfirmasi penerimaan. Selisih dicatat terbuka tanpa sanksi.'],
  ['Apakah ada biaya untuk donasi pangan?', 'Pangan selalu gratis. Biaya pengiriman, bila memakai mitra, dicatat terpisah dan disepakati sebelum serah terima.'],
  ['Kapan alamat lengkap pemberi dibuka?', 'Setelah permintaan disetujui, alamat dan telepon tampil di detail penyaluran kedua pihak.'],
  ['Apa arti lencana terverifikasi?', 'Identitas dan kontak pengelola sudah diperiksa. Lencana bukan sertifikasi mutu atau keamanan pangan.'],
  ['Bisakah saya menjadi pemberi dan penerima sekaligus?', 'Satu akun memiliki satu peran aktif. Untuk peran lain, daftarkan akun terpisah.'],
]

export function HelpCenter() {
  const { state } = useApp()
  const [q, setQ] = useState('')
  const shown = FAQ.filter(([a, b]) => (a + b).toLowerCase().includes(q.trim().toLowerCase()))
  return (
    <>
      <AppBar title="Pusat bantuan" />
      <main className="mx-auto flex max-w-[560px] flex-col gap-5 px-4 pb-8 pt-4">
        <section className="relative animate-rise-in overflow-hidden rounded-greet bg-primary p-5 text-white">
          <h2 className="text-section-title">Ada kendala serah terima?</h2>
          <p className="mt-1 text-[0.9375rem] leading-6 text-white/90">Jumlah selisih, kemasan rusak, atau terlambat. Laporkan dari detail penyaluran.</p>
          <ButtonLink to="/aktivitas" variant="secondary" className="mt-4 border-white">
            Buka aktivitas
          </ButtonLink>
          <Sparkle size={96} weight="fill" aria-hidden="true" className="absolute -right-4 -top-4 rotate-12 text-white/10" />
        </section>

        <section aria-labelledby="faq-h" className="flex flex-col gap-3">
          <h2 id="faq-h" className="text-section-title">Pertanyaan umum</h2>
          <label className="sr-only" htmlFor="faq-q">Cari pertanyaan</label>
          <input id="faq-q" type="search" className={inputCls} placeholder="Cari, mis. biaya atau alamat" value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="card divide-y divide-line overflow-hidden" aria-live="polite">
            {shown.map(([t, a]) => (
              <Disclosure key={t} title={t}>{a}</Disclosure>
            ))}
            {shown.length === 0 && <p className="p-4 text-body text-ink-secondary">Tidak ada yang cocok. Kirim pesan ke tim di bawah.</p>}
          </div>
        </section>

        {state.tickets.length > 0 && (
          <section aria-labelledby="tiket-h" className="flex flex-col gap-2">
            <h2 id="tiket-h" className="text-section-title">Tiket Anda</h2>
            {state.tickets.map((t) => (
              <article key={t.id} className="card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Badge tone={t.status === 'Selesai' ? 'success' : t.status === 'Ditangani' ? 'info' : 'warning'}>{t.status}</Badge>
                  <span className="text-caption text-ink-secondary">{t.id} · {t.at}</span>
                </div>
                <p className="mt-2 font-semibold">{t.kind === 'Hapus data' ? 'Penghapusan data: ' : ''}{t.topic}</p>
                {t.message && <p className="text-meta text-ink-secondary">{t.message}</p>}
                {t.reply && <p className="mt-2 rounded-control bg-primary-container p-3 text-meta"><span className="font-semibold">Balasan tim:</span> {t.reply}</p>}
              </article>
            ))}
          </section>
        )}
        <Reveal>
          <section className="card flex flex-col items-start gap-3 p-4">
            <span aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-container text-primary"><ChatCircleText size={22} /></span>
            <h2 className="text-card-title">Butuh bantuan langsung?</h2>
            <p className="text-meta text-ink-secondary">Tim operasional membantu verifikasi dan koordinasi lapangan. Balasan masuk ke notifikasi dan halaman ini.</p>
            <ButtonLink to="/bantuan/pesan" variant="tonal" block>Kirim pesan bantuan</ButtonLink>
          </section>
        </Reveal>
      </main>
    </>
  )
}

/* ---------- A11 Tentang, ketentuan, privasi ---------- */

const POLICIES = [
  ['Pangan tanpa biaya pembelian', 'Semua pangan disalurkan gratis. Dilarang memperjualbelikan porsi donasi atau memungut komisi.'],
  ['Biaya pengiriman terpisah', 'Biaya logistik disepakati sebelum serah terima dan tidak disamarkan sebagai harga pangan.'],
  ['Verifikasi bukan sertifikasi', 'Lencana menandakan identitas pengelola sesuai, bukan jaminan mutu. Periksa kondisi pangan saat serah terima.'],
  ['Alamat dan kontak terlindungi', 'Hanya kecamatan yang tampil publik. Alamat dan telepon dibuka setelah permintaan disetujui.'],
]

export function About() {
  return (
    <>
      <AppBar title="Tentang Lestari Pangan" />
      <main className="mx-auto flex max-w-[560px] flex-col gap-5 px-4 pb-8 pt-4">
        <section className="flex animate-rise-in flex-col items-center gap-3 rounded-greet bg-primary-container px-6 py-8 text-center">
          <img src={asset('img/logo-mark.png')} alt="" width={64} height={64} className="h-16 w-16 animate-pop" />
          <div>
            <p className="text-page-title text-primary-pressed">Lestari Pangan</p>
            <p className="text-body text-ink-secondary">Pangan bernilai, berbagi berarti</p>
          </div>
          <p className="max-w-[40ch] text-meta text-ink">
            Koordinasi pangan nonkomersial yang menghubungkan pemberi surplus dengan komunitas penerima secara transparan.
          </p>
          <p className="text-caption text-ink-secondary">Versi 0.1 · diperbarui 13 Oktober 2026</p>
        </section>
        <Notice tone="warning" title="Draf dokumen operasional">Ketentuan berikut rancangan awal. Klausul hukum final disiapkan lembaga pengelola.</Notice>
        <section aria-labelledby="pol-h" className="flex flex-col gap-3">
          <h2 id="pol-h" className="text-section-title">Pokok kebijakan</h2>
          <ol className="stagger flex flex-col gap-3">
            {POLICIES.map(([t, d], i) => (
                <li key={t} className="card flex gap-3 p-4">
                  <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-[0.875rem] font-bold text-white">{i + 1}</span>
                  <div className="min-w-0">
                    <p className="font-semibold leading-6">{t}</p>
                    <p className="text-meta text-ink-secondary">{d}</p>
                  </div>
                </li>
            ))}
          </ol>
        </section>
        <Reveal>
          <section className="card divide-y divide-line overflow-hidden">
            <div className="flex min-h-16 items-center gap-3 px-4 py-3">
              <EnvelopeSimple size={20} aria-hidden="true" className="shrink-0 text-primary" />
              <span className="min-w-0 flex-1"><span className="block text-meta text-ink-secondary">Surel dukungan</span><span className="block break-all font-medium">dukungan@example.invalid</span></span>
            </div>
            <MenuRow to="/bantuan" icon={<Lifebuoy size={20} />} title="Pusat bantuan" />
            <MenuRow to="/pengaturan/privasi" icon={<ShieldCheck size={20} />} title="Data dan privasi" />
          </section>
        </Reveal>
      </main>
    </>
  )
}
