import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AppFrame, TabLayout } from './components/Layouts'
import { useApp } from './state/AppState'
import Home from './pages/Home'
import { DonasiTab, OfferDetail, OfferManage } from './pages/Donasi'
import OfferForm from './pages/OfferForm'
import { IncomingRequests, RequestDetail, RequestForm, ReviewRequest } from './pages/Requests'
import { ActivitiesTab, Coordination, Distribution, Handover, Notifications, Receive, ReportIssue, TransferDetail } from './pages/Activities'
import { PanganTab, RecordForm } from './pages/Pangan'
import { AccountTab } from './pages/Account'
import { Challenges, ComingSoon, Features, Impact, Recipes, TipDetail, Tips } from './pages/Explore'
import { Login, Onboarding, RolePick } from './pages/Auth'

function RequireAuth() {
  const { state } = useApp()
  if (!state.signedIn) return <Navigate to={state.onboarded ? '/masuk' : '/pengenalan'} replace />
  return <Outlet />
}

export default function App() {
  return (
    <Routes>
      <Route element={<AppFrame />}>
        <Route path="/pengenalan" element={<Onboarding />} />
        <Route path="/masuk" element={<Login />} />
        <Route path="/peran" element={<RolePick />} />

        <Route element={<RequireAuth />}>
          <Route element={<TabLayout />}>
            <Route index element={<Home />} />
            <Route path="donasi" element={<DonasiTab />} />
            <Route path="pangan" element={<PanganTab />} />
            <Route path="aktivitas" element={<ActivitiesTab />} />
            <Route path="akun" element={<AccountTab />} />
          </Route>

          <Route path="donasi/baru" element={<OfferForm />} />
          <Route path="donasi/kelola/:id" element={<OfferManage />} />
          <Route path="donasi/:id" element={<OfferDetail />} />
          <Route path="donasi/:id/minta" element={<RequestForm />} />
          <Route path="permintaan/:id" element={<RequestDetail />} />
          <Route path="permintaan/:id/tinjau" element={<ReviewRequest />} />
          <Route path="aktivitas/permintaan" element={<IncomingRequests />} />
          <Route path="aktivitas/:id" element={<TransferDetail />} />
          <Route path="aktivitas/:id/serahkan" element={<Handover />} />
          <Route path="aktivitas/:id/terima" element={<Receive />} />
          <Route path="aktivitas/:id/distribusi" element={<Distribution />} />
          <Route path="aktivitas/:id/koordinasi" element={<Coordination />} />
          <Route path="aktivitas/:id/masalah" element={<ReportIssue />} />
          <Route path="pangan/baru" element={<RecordForm />} />
          <Route path="notifikasi" element={<Notifications />} />
          <Route path="fitur" element={<Features />} />
          <Route path="dampak" element={<Impact />} />
          <Route path="tips" element={<Tips />} />
          <Route path="tips/:id" element={<TipDetail />} />
          <Route path="resep" element={<Recipes />} />
          <Route path="tantangan" element={<Challenges />} />

          <Route path="reward" element={<ComingSoon title="Reward dan apresiasi" />} />
          <Route path="dukung" element={<ComingSoon title="Dukung Lestari Pangan" />} />
          <Route path="transparansi" element={<ComingSoon title="Transparansi dana" />} />
          <Route path="mitra/:id" element={<ComingSoon title="Profil mitra" />} />
          <Route path="akun/*" element={<ComingSoon title="Pengaturan akun" />} />
          <Route path="pengaturan/*" element={<ComingSoon title="Pengaturan" />} />
          <Route path="bantuan" element={<ComingSoon title="Pusat bantuan" />} />
          <Route path="tentang" element={<ComingSoon title="Tentang Lestari Pangan" />} />
          <Route path="*" element={<ComingSoon title="Halaman tidak ditemukan" />} />
        </Route>
      </Route>
    </Routes>
  )
}
