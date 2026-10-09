import { useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Bell } from '@phosphor-icons/react'
import { BottomTabBar } from './BottomTabBar'
import { IconButton } from './ui'
import { useApp, useProfile } from '../state/AppState'
import { DemoPanel } from './DemoPanel'
import { asset } from '../lib/format'

/** Bingkai aplikasi: konten satu kolom maksimal 480 px, dipusatkan pada layar lebar. */
export function AppFrame() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return (
    <div className="min-h-screen bg-[#E9EDEA] lg:flex lg:justify-center lg:gap-8">
      <div className="relative mx-auto min-h-screen w-full max-w-app bg-page lg:mx-0 lg:shadow-overlay">
        <Outlet />
      </div>
      <DemoPanel />
    </div>
  )
}

/** Root tab: menampilkan bottom navigation dan memberi ruang di bawah konten. */
export function TabLayout() {
  return (
    <>
      <main className="pb-[calc(96px+env(safe-area-inset-bottom,0px))]">
        <Outlet />
      </main>
      <BottomTabBar />
    </>
  )
}

/** Header root tab: identitas, notifikasi, dan profil (H01). */
export function RootHeader({ title, subtitle }: { title?: string; subtitle?: string }) {
  const { state } = useApp()
  const profile = useProfile()
  const navigate = useNavigate()
  const unread = state.notifications.filter((n) => n.role === state.role && !n.read).length
  return (
    <header className="sticky top-0 z-30 flex min-h-16 flex-wrap items-center gap-x-2 border-b border-line bg-surface px-4 py-2">
      {title ? (
        <div className="min-w-[8rem] flex-1">
          <h1 className="break-words text-[1.25rem] font-bold leading-7">{title}</h1>
          {subtitle && <p className="truncate text-meta text-ink-secondary">{subtitle}</p>}
        </div>
      ) : (
        <div className="flex min-w-[8rem] flex-1 items-center gap-2">
          <img src={asset('img/logo-mark.png')} alt="" className="h-9 w-9 rounded-full bg-primary-container p-1" />
          <span className="min-w-0 break-words text-[1.25rem] font-bold leading-7 text-primary">Lestari Pangan</span>
        </div>
      )}
      <IconButton label="Notifikasi" badge={unread} onClick={() => navigate('/notifikasi')}>
        <Bell size={24} aria-hidden="true" />
      </IconButton>
      <button
        type="button"
        onClick={() => navigate('/akun')}
        aria-label={`Akun ${profile.name}`}
        className="tap flex h-12 w-12 items-center justify-center rounded-full"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-[0.9375rem] font-bold text-white">
          {profile.initials}
        </span>
      </button>
    </header>
  )
}
