import { useMyProfile } from './MyProfile'

export type VerificationStatus = 'Belum diajukan' | 'Menunggu pemeriksaan' | 'Terverifikasi' | 'Ditolak'

/** Bentuk profil yang dibaca layar. */
export interface UiProfile {
  name: string
  initials: string
  type: string
  area: string
  verification: VerificationStatus
  pic: string
  phone: string
  address: string
  /** Titik peta titik temu (privat); null bila belum dipilih. */
  point: { lat: number; lng: number } | null
  hours: string
  capacity: string
  storage: string
}

const initialsOf = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join('') || '?'

/** Profil akun yang sedang masuk; kosong selama profil belum termuat dari Supabase. */
export function useProfile(): UiProfile {
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
      point: profile.contact?.lat != null && profile.contact?.lng != null ? { lat: profile.contact.lat, lng: profile.contact.lng } : null,
      hours: profile.hours ?? '',
      capacity: profile.capacity ?? '',
      storage: profile.storage ?? '',
    }
  }
  return { name: '', initials: '', type: '', area: '', verification: 'Belum diajukan', pic: '', phone: '', address: '', point: null, hours: '', capacity: '', storage: '' }
}
