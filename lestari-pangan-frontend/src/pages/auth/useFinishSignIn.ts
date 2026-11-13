import { useNavigate } from 'react-router-dom'
import { useApp } from '../../state/AppState'
import { fetchMyProfile } from '../../services/identity'
import { signOut } from '../../services/auth'
import { AppError } from '../../lib/supabase/errors'
import { writeDraft, type Draft } from './draft'

/** Setelah kode OTP benar: profil ada → masuk; belum ada → lanjut pilih peran dan lengkapi profil. */
export function useFinishSignIn() {
  const navigate = useNavigate()
  const { dispatch } = useApp()

  return async (draft: Draft) => {
    const profile = await fetchMyProfile()
    if (profile?.role === 'admin') {
      await signOut()
      throw new AppError('TIDAK_BERHAK', 'Akun staf masuk lewat konsol admin.')
    }
    if (profile?.role === 'pemberi' || profile?.role === 'penerima') {
      writeDraft(null)
      dispatch({ type: 'signIn', role: profile.role })
      navigate('/', { replace: true })
      return
    }
    if (profile?.role === 'kurir') {
      // Peran kurir dihentikan: pengantaran kini lewat ojek online yang dipesan pemberi/penerima sendiri.
      await signOut()
      throw new AppError('TIDAK_BERHAK', 'Peran kurir tidak lagi digunakan. Pengantaran kini memakai ojek online.')
    }
    writeDraft({ ...draft, verified: true })
    navigate('/peran?daftar=1')
  }
}
