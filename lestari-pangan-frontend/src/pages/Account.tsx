import { useNavigate } from 'react-router-dom'
import {
  Gear,
  BookOpen,
  ChartBar,
  ChefHat,
  Gift,
  Handshake,
  HeartStraight,
  IdentificationCard,
  Info,
  Lifebuoy,
  Lightbulb,
  MapPin,
  PencilSimple,
  ShieldCheck,
  SignOut,
  Storefront,
  Trophy,
  Truck,
  UsersThree,
} from '@phosphor-icons/react'
import { RootHeader } from '../components/Layouts'
import { Button, MenuRow, Notice } from '../components/ui'
import { useApp } from '../state/AppState'
import { useProfile } from '../state/useProfile'

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section aria-label={title} className="card overflow-hidden">
      <h2 className="border-b border-line px-4 py-3 text-label uppercase tracking-wide text-ink-secondary">{title}</h2>
      <div className="divide-y divide-line">{children}</div>
    </section>
  )
}

export function AccountTab() {
  const { state, dispatch } = useApp()
  const profile = useProfile()
  const navigate = useNavigate()
  const donor = state.role === 'pemberi'

  return (
    <>
      <RootHeader title="Akun" />
      <div className="stagger flex flex-col gap-4 px-4 pt-4">
        <section className="card p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary text-[1.375rem] font-bold text-white">{profile.initials}</span>
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-2 text-card-title">
                {profile.name}
                <span className="rounded-full bg-page px-2 py-0.5 text-caption text-ink-secondary">{profile.type}</span>
              </p>
              <p className="text-meta text-ink-secondary">{profile.area}</p>
              <p className="text-meta font-semibold text-primary">Peran aktif: {donor ? 'Pemberi' : 'Penerima'}</p>
            </div>
          </div>
          <div className="mt-3">
            {profile.verification === 'Terverifikasi' ? (
              <Notice tone="success" title="Identitas terverifikasi">Verifikasi memeriksa identitas pengelola, bukan jaminan mutu pangan.</Notice>
            ) : (
              <Notice tone="warning" title="Identitas menunggu pemeriksaan">Anda tetap bisa menyiapkan penawaran. Verifikasi memeriksa identitas, bukan jaminan mutu pangan.</Notice>
            )}
          </div>
          <Button block className="mt-3" icon={<PencilSimple size={20} />} onClick={() => navigate('/akun/profil')}>
            Edit profil
          </Button>
        </section>

        <Group title="Profil dan verifikasi">
          <MenuRow to="/akun/profil" icon={donor ? <Storefront size={20} /> : <UsersThree size={20} />} title={donor ? 'Informasi usaha' : 'Informasi organisasi'} subtitle="Nama, penanggung jawab, jam operasional" />
          {!donor && <MenuRow to="/akun/kebutuhan" icon={<Handshake size={20} />} title="Kebutuhan dan kapasitas" subtitle="Jenis pangan, kapasitas, penyimpanan" />}
          <MenuRow to="/akun/verifikasi" icon={<IdentificationCard size={20} />} title="Status verifikasi" subtitle={profile.verification} />
          <MenuRow to="/akun/lokasi" icon={<MapPin size={20} />} title="Lokasi dan koordinasi" subtitle="Alamat privat dibuka setelah kesepakatan" />
        </Group>

        <Group title="Aktivitas dan dampak">
          <MenuRow to="/dampak" icon={<ChartBar size={20} />} title="Dashboard dampak" subtitle="Ringkasan per periode dan sumber data" />
          <MenuRow to="/aktivitas" icon={<BookOpen size={20} />} title="Riwayat penyaluran" />
          <MenuRow to="/tugas" icon={<Truck size={20} />} title="Tugas pengantaran" subtitle="Khusus mitra atau relawan yang ditugaskan" />
        </Group>

        <Group title="Resep, tips, dan tantangan">
          <MenuRow to="/resep" icon={<ChefHat size={20} />} title="Resep dari Sisa" />
          <MenuRow to="/tips" icon={<Lightbulb size={20} />} title="Tips Anti Food Waste" subtitle={state.savedTips.length ? `${state.savedTips.length} tersimpan` : undefined} />
          <MenuRow to="/tantangan" icon={<Trophy size={20} />} title="Eco Challenge" subtitle="Tanpa peringkat jumlah donasi" />
          <MenuRow to="/reward" icon={<Gift size={20} />} title="Reward dan apresiasi" />
        </Group>

        <Group title="Dukungan dan transparansi">
          <MenuRow to="/dukung" icon={<HeartStraight size={20} />} title="Dukung Lestari Pangan" subtitle="Sukarela, tidak memberi prioritas pangan" />
          <MenuRow to="/transparansi" icon={<ShieldCheck size={20} />} title="Transparansi dana" />
        </Group>

        <Group title="Pengaturan dan bantuan">
          <MenuRow to="/pengaturan" icon={<Gear size={20} />} title="Pengaturan" subtitle="Notifikasi, privasi, keamanan, tampilan" />
          <MenuRow to="/bantuan" icon={<Lifebuoy size={20} />} title="Pusat bantuan" />
          <MenuRow to="/tentang" icon={<Info size={20} />} title="Tentang, ketentuan, dan privasi" />
        </Group>

        <Button
          variant="secondary"
          block
          icon={<SignOut size={20} />}
          onClick={() => {
            dispatch({ type: 'signOut' })
            navigate('/masuk', { replace: true })
          }}
        >
          Keluar
        </Button>
      </div>
    </>
  )
}
