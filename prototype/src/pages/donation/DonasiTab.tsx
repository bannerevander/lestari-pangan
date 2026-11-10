import { useApp } from '../../state/AppState'
import { MyOffers } from './MyOffers'
import { SearchFood } from './SearchFood'

export function DonasiTab() {
  const { state } = useApp()
  return state.role === 'pemberi' ? <MyOffers /> : <SearchFood />
}

/* ---------- D08 Detail pangan (penerima) ---------- */
