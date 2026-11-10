import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useApp } from './AppState'
import { isLive } from '../lib/supabase/client'
import { fetchMyProfile, type MyProfile } from '../services/identity'
import { hasSession } from '../services/auth'

/** Profil akun yang sedang masuk, dibaca dari Supabase (mode live). null di mode demo. */
interface Ctx {
  profile: MyProfile | null
  refresh: () => Promise<void>
}

const MyProfileContext = createContext<Ctx>({ profile: null, refresh: async () => {} })

export function MyProfileProvider({ children }: { children: ReactNode }) {
  const { state } = useApp()
  const [profile, setProfile] = useState<MyProfile | null>(null)

  const refresh = useCallback(async () => {
    if (!isLive || !state.signedIn || !(await hasSession())) return setProfile(null)
    try {
      setProfile(await fetchMyProfile())
    } catch {
      /* jaringan putus: pertahankan profil terakhir */
    }
  }, [state.signedIn])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const value = useMemo(() => ({ profile, refresh }), [profile, refresh])
  return <MyProfileContext.Provider value={value}>{children}</MyProfileContext.Provider>
}

export const useMyProfile = () => useContext(MyProfileContext)
