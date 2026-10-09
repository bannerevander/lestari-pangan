/** Token mengikuti design.md §4–5 dan GAYA-HOME-TERKUNCI.md. */
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#2E7D32', pressed: '#256528', container: '#EAF5EC' },
        accent: { DEFAULT: '#FFB74D', soft: '#FFF6E5' },
        ink: { DEFAULT: '#12212B', secondary: '#52605A' },
        page: '#F7F8FA',
        surface: '#FFFFFF',
        line: { DEFAULT: '#DCE3DE', control: '#7A8780' },
        disabled: { bg: '#E2E8E4', fg: '#52605A' },
        warning: { DEFAULT: '#92400E', container: '#FFF4DB' },
        danger: { DEFAULT: '#B42318', container: '#FEF3F2' },
        info: { DEFAULT: '#1D4ED8', container: '#EFF6FF' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      fontSize: {
        display: ['1.75rem', { lineHeight: '2.25rem', fontWeight: '700' }],
        'page-title': ['1.5rem', { lineHeight: '2rem', fontWeight: '700' }],
        'section-title': ['1.25rem', { lineHeight: '1.75rem', fontWeight: '600' }],
        'card-title': ['1.125rem', { lineHeight: '1.625rem', fontWeight: '600' }],
        body: ['1rem', { lineHeight: '1.5rem' }],
        label: ['0.875rem', { lineHeight: '1.25rem', fontWeight: '600' }],
        meta: ['0.875rem', { lineHeight: '1.25rem' }],
        caption: ['0.75rem', { lineHeight: '1.125rem', fontWeight: '500' }],
      },
      maxWidth: { app: '480px', read: '640px' },
      borderRadius: { control: '12px', card: '16px', greet: '20px', sheet: '24px' },
      boxShadow: {
        card: '0 2px 8px rgba(18,33,43,0.06)',
        overlay: '0 8px 24px rgba(18,33,43,0.12)',
        nav: '0 -4px 16px rgba(0,0,0,0.04)',
      },
      transitionTimingFunction: {
        standard: 'cubic-bezier(0.2, 0, 0, 1)',
        enter: 'cubic-bezier(0.16, 1, 0.3, 1)',
        exit: 'cubic-bezier(0.4, 0, 1, 1)',
      },
      transitionDuration: { feedback: '120ms', micro: '180ms', enter: '260ms', exit: '200ms', page: '300ms' },
      keyframes: {
        'sheet-in': { from: { transform: 'translateY(100%)' }, to: { transform: 'translateY(0)' } },
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'rise-in': { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
      animation: {
        'sheet-in': 'sheet-in 260ms cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in': 'fade-in 160ms cubic-bezier(0.2, 0, 0, 1)',
        'rise-in': 'rise-in 260ms cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}
