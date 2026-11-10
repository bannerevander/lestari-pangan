import { useEffect, useRef } from 'react'
import { Splash } from './Splash'
import { Outlet, useLocation, useNavigate, useNavigationType } from 'react-router-dom'
import { Bell } from '@phosphor-icons/react'
import { BottomTabBar } from './BottomTabBar'
import { IconButton, OfflineBanner, Toaster, useScrolled } from './ui'
import { useApp } from '../state/AppState'
import { useProfile } from '../state/useProfile'
import { asset } from '../lib/format'

/** Bingkai aplikasi: konten satu kolom maksimal 480 px, dipusatkan pada layar lebar. */
const TAB_ROOTS = ['/', '/donasi', '/pangan', '/aktivitas', '/akun']

export function AppFrame() {
  const { pathname } = useLocation()
  const navType = useNavigationType()
  const firstRender = useRef(true)
  const { state } = useApp()
  useEffect(() => {
    document.documentElement.toggleAttribute('data-reduce-motion', !!state.prefs.reduceMotion)
  }, [state.prefs.reduceMotion])
  useEffect(() => {
    window.scrollTo(0, 0)
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    // Pembaca layar diarahkan ke judul halaman baru (focus-on-route-change).
    const h1 = document.querySelector<HTMLElement>('h1')
    if (h1) {
      h1.tabIndex = -1
      h1.focus({ preventScroll: true })
    }
  }, [pathname])
  // Pindah antar-tab tidak memasang ulang bingkai; TabLayout yang memudar.
  const isTab = TAB_ROOTS.includes(pathname)
  const anim = navType === 'POP' ? 'animate-page-back' : 'animate-page-forward'
  return (
    <div className="min-h-screen bg-frame lg:flex lg:justify-center lg:gap-8">
      <div className="relative mx-auto min-h-screen w-full max-w-app bg-page lg:mx-0 lg:shadow-overlay">
        {/* Elemen fixed (tab bar, footer, sheet) dirender lewat portal agar tidak ikut ter-transform. */}
        <div key={isTab ? 'tabs' : pathname} className={anim}>
          <Outlet />
        </div>
      </div>
      <Toaster />
      <OfflineBanner />
      <Splash />
    </div>
  )
}

/** Root tab: menampilkan bottom navigation dan memberi ruang di bawah konten. */
export function TabLayout() {
  const { pathname } = useLocation()
  return (
    <>
      <main key={pathname} className="animate-fade-in pb-[calc(96px+env(safe-area-inset-bottom,0px))]">
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
  const scrolled = useScrolled()
  return (
    <header
      className={`sticky top-0 z-30 flex min-h-16 flex-wrap items-center gap-x-2 border-b bg-surface/95 px-4 py-2 backdrop-blur transition-[box-shadow,border-color] duration-micro ease-standard ${
        scrolled ? 'border-line shadow-card' : 'border-transparent'
      }`}
    >
      {title ? (
        <div className="min-w-[8rem] flex-1">
          <h1 className="break-words text-[1.25rem] font-bold leading-7">{title}</h1>
          {subtitle && <p className="truncate text-meta text-ink-secondary">{subtitle}</p>}
        </div>
      ) : (
        <div className="flex min-w-[8rem] flex-1 items-center gap-2">
          <img src={asset('img/logo-mark.png')} alt="" width={36} height={36} className="h-9 w-9 shrink-0" />
          <span className="min-w-0 break-words text-[1.25rem] font-bold leading-7 tracking-tight text-primary-pressed">Lestari Pangan</span>
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
