import { createPortal } from 'react-dom'
import { NavLink } from 'react-router-dom'

/** Geometri ikon diambil dari H01 / Pemberi / Home • LOCKED v1 (Stitch). */
const icons: Record<string, JSX.Element> = {
  beranda: (
    <path d="M218.83,103.77l-80-75.48a16,16,0,0,0-21.66,0l-80,75.48A16,16,0,0,0,32,115.55V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V115.55A16,16,0,0,0,218.83,103.77ZM208,208H48V115.55L128,40l80,75.55V208Z" fill="currentColor" stroke="none" />
  ),
  donasi: (
    <>
      <path d="M168,80a40,40,0,0,0-76.3-17A40,40,0,1,0,34.8,112H16a8,8,0,0,0-8,8v40a8,8,0,0,0,8,8H76.7l54.6,41a16.1,16.1,0,0,0,9.7,3H216a16,16,0,0,0,16-16V136a56,56,0,0,0-56-56H168" />
      <path d="M88,168v24" />
    </>
  ),
  pangan: (
    <>
      <rect height="160" rx="16" width="192" x="32" y="48" />
      <line x1="32" x2="224" y1="96" y2="96" />
      <line x1="104" x2="152" y1="136" y2="136" />
    </>
  ),
  aktivitas: (
    <>
      <path d="M40,56V200a8,8,0,0,0,12.7,6.5L76,190.5l23.3,16a8,8,0,0,0,9.4,0l23.3-16,23.3,16a8,8,0,0,0,9.4,0l23.3-16,23.3,16A8,8,0,0,0,224,200V56a8,8,0,0,0-8-8H48A8,8,0,0,0,40,56Z" />
      <line x1="80" x2="176" y1="96" y2="96" />
      <line x1="80" x2="144" y1="136" y2="136" />
    </>
  ),
  akun: (
    <>
      <circle cx="128" cy="96" r="40" />
      <path d="M48,208a80,80,0,0,1,160,0" />
    </>
  ),
}

const tabs = [
  { to: '/', key: 'beranda', label: 'Beranda', end: true },
  { to: '/donasi', key: 'donasi', label: 'Donasi' },
  { to: '/pangan', key: 'pangan', label: 'Pangan' },
  { to: '/aktivitas', key: 'aktivitas', label: 'Aktivitas' },
  { to: '/akun', key: 'akun', label: 'Akun' },
]

export function BottomTabBar() {
  return createPortal(
    <nav
      aria-label="Navigasi utama"
      className="fixed bottom-0 left-1/2 z-40 flex w-full max-w-app -translate-x-1/2 border-t border-line bg-surface pb-[env(safe-area-inset-bottom,0px)] shadow-nav"
    >
      {tabs.map((t) => (
        <NavLink
          key={t.key}
          to={t.to}
          end={t.end}
          className={({ isActive }) =>
            `tap flex min-h-16 w-1/5 min-w-0 flex-col items-center justify-center gap-1 px-0.5 py-2 text-center text-[clamp(13px,0.875rem,16px)] leading-tight ${
              isActive ? 'font-semibold text-primary' : 'text-ink-secondary hover:text-ink'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span
                className={`flex h-[28px] w-[48px] items-center justify-center rounded-full transition-colors duration-micro ease-standard ${
                  isActive ? 'animate-pop bg-primary-container' : ''
                }`}
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 256 256"
                  className="h-[24px] w-[24px]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={16}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {icons[t.key]}
                </svg>
              </span>
              <span className="block w-full">{t.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>,
    document.body,
  )
}
