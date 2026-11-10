import { useNavigate } from 'react-router-dom'
import { useApp } from '../state/AppState'
import type { Role } from '../data/types'

/**
 * Pemilih skenario prototipe (design.md §7.1): memperlihatkan dua peran tanpa menjadi
 * menu produk. Tampil di samping bingkai pada layar lebar, dan di halaman Akun pada ponsel.
 */
export function DemoControls({ compact }: { compact?: boolean }) {
  const { state, dispatch } = useApp()
  const navigate = useNavigate()
  const setRole = (role: Role) => {
    dispatch({ type: 'setRole', role })
    navigate('/')
  }
  return (
    <div className={compact ? '' : 'rounded-card border border-dashed border-line-control bg-surface p-4'}>
      <p className="text-label">Skenario demo</p>
      <p className="mb-3 text-meta text-ink-secondary">Khusus prototipe, bukan menu aplikasi.</p>
      <div className="flex gap-2" role="group" aria-label="Peran demo">
        {(['pemberi', 'penerima'] as Role[]).map((r) => (
          <button
            key={r}
            type="button"
            aria-pressed={state.role === r}
            onClick={() => setRole(r)}
            className={`tap min-h-12 flex-1 rounded-control border px-3 text-[0.875rem] font-semibold ${
              state.role === r ? 'border-primary bg-primary-container text-primary' : 'border-line bg-surface text-ink'
            }`}
          >
            {r === 'pemberi' ? 'Pemberi' : 'Penerima'}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => dispatch({ type: 'reset' })}
        className="tap mt-2 min-h-12 w-full rounded-control text-[0.875rem] font-semibold text-ink-secondary hover:bg-page"
      >
        Atur ulang data demo
      </button>
    </div>
  )
}

export function DemoPanel() {
  const { state } = useApp()
  if (!state.signedIn) return null
  return (
    <aside className="hidden w-72 shrink-0 pt-8 lg:block" aria-label="Kontrol demo">
      <div className="sticky top-8">
        <DemoControls />
      </div>
    </aside>
  )
}
