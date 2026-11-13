import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useApp } from './AppState'
import { fetchMyProfile, type MyProfile } from '../services/identity'
import { hasSession, onSignedIn } from '../services/auth'

/** Profil akun yang sedang masuk, dibaca dari Supabase. null sebelum termuat atau sebelum onboarding. */
interface Ctx {
  profile: MyProfile | null
  /** true setelah percobaan muat pertama untuk sesi ini selesai (berhasil atau gagal). */
  ready: boolean
  refresh: () => Promise<void>
}

const MyProfileContext = createContext<Ctx>({ profile: null, ready: false, refresh: async () => {} })

export function MyProfileProvider({ children }: { children: ReactNode }) {
  const { state } = useApp()
  const [profile, setProfile] = useState<MyProfile | null>(null)
  // Sama seperti LiveData: muat mana pun yang selesai untuk status masuk yang sama sudah cukup.
  const [readyFor, setReadyFor] = useState<boolean | null>(null)
  const ready = readyFor === state.signedIn

  const refresh = useCallback(async () => {
    if (!state.signedIn || !(await hasSession())) return setProfile(null)
    try {
      setProfile(await fetchMyProfile())
    } catch {
      /* jaringan putus: pertahankan profil terakhir */
    }
  }, [state.signedIn])

  useEffect(() => {
    const signedIn = state.signedIn
    void refresh().finally(() => setReadyFor(signedIn))
    // Ganti akun tanpa keluar (status masuk aplikasi tetap true) juga memuat profil akun baru.
    return onSignedIn(() => void refresh())
  }, [refresh, state.signedIn])

  const value = useMemo(() => ({ profile, ready, refresh }), [profile, ready, refresh])
  return <MyProfileContext.Provider value={value}>{children}</MyProfileContext.Provider>
}

export const useMyProfile = () => useContext(MyProfileContext)
