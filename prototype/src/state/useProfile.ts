import * as mock from '../data/mock'
import { useApp } from './AppState'
import { useMyProfile } from './MyProfile'

export type VerificationStatus = 'Belum diajukan' | 'Menunggu pemeriksaan' | 'Terverifikasi' | 'Ditolak'

/** Bentuk profil yang dibaca layar; sama untuk mode live dan demo. */
export interface UiProfile {
  name: string
  initials: string
  type: string
  area: string
  verification: VerificationStatus
  pic: string
  phone: string
  address: string
  hours: string
  capacity: string
  storage: string
}

const initialsOf = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join('') || '?'

/** Profil akun yang sedang masuk: data Supabase bila tersedia, selain itu data demo. */
export function useProfile(): UiProfile {
  const { state } = useApp()
  const { profile } = useMyProfile()
  if (profile) {
    return {
      name: profile.org_name,
      initials: initialsOf(profile.org_name),
      type: profile.org_type,
      area: profile.area,
      verification: profile.verification_status as VerificationStatus,
      pic: profile.contact?.pic ?? '',
      phone: profile.contact?.phone ?? '',
      address: profile.contact?.address ?? '',
      hours: profile.hours ?? '',
      capacity: profile.capacity ?? '',
      storage: profile.storage ?? '',
    }
  }
  const base = state.role === 'pemberi' ? mock.DONOR : mock.RECIPIENT
  return { capacity: '', storage: '', ...base, ...state.profileEdits[state.role] }
}
