import { Component, type ReactNode } from 'react'
import { WarningCircle } from '@phosphor-icons/react'

/** Menangkap error render agar pengguna melihat jalan keluar, bukan layar kosong. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error) {
    // shortcut: hanya ke konsol; sambungkan ke layanan pemantauan error saat backend ada.
    console.error(error)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <main role="alert" className="flex min-h-screen flex-col items-center justify-center gap-4 bg-page px-6 text-center">
        <span aria-hidden="true" className="flex h-16 w-16 items-center justify-center rounded-full bg-danger-container text-danger">
          <WarningCircle size={32} weight="fill" />
        </span>
        <h1 className="text-page-title">Terjadi kendala</h1>
        <p className="max-w-[32ch] text-body text-ink-secondary">Halaman ini gagal dimuat. Data Anda tetap tersimpan di perangkat.</p>
        <div className="flex w-full max-w-[320px] flex-col gap-2">
          <button type="button" onClick={() => location.reload()} className="tap min-h-[52px] rounded-control bg-primary px-4 font-semibold text-white">
            Coba lagi
          </button>
          <a href={import.meta.env.BASE_URL} className="tap flex min-h-[52px] items-center justify-center rounded-control font-semibold text-primary">
            Kembali ke Beranda
          </a>
        </div>
      </main>
    )
  }
}
