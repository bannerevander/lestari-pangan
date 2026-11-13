import { lazy, Suspense } from 'react'
import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { CircleNotch } from '@phosphor-icons/react'
import { AppFrame, TabLayout } from './components/Layouts'
import { useApp } from './state/AppState'
import { useMyProfile } from './state/MyProfile'
import { useLiveData } from './state/LiveData'
import Home from './pages/Home'
import { DonasiTab, OfferClose, OfferDetail, OfferEdit, OfferForm, OfferManage } from './pages/donation'
import { IncomingRequests, RequestAdjustment, RequestCancel, RequestDetail, RequestForm, ReviewRequest } from './pages/requests'
import { ActivitiesTab, Distribution, Handover, IssueDetail, Notifications, Receive, ReportIssue, TransferDetail } from './pages/Activities'
import Coordination from './pages/activities/Coordination'
import { PanganTab, RecordCorrection, RecordDetail, RecordForm, RecordMove } from './pages/Pangan'
import { AreaPicker, ClaimReview, DeletionRequest, HelpRequest, RewardDetail, SavedTips } from './pages/Extras'
import { DeliveryStatus, MethodPage, PrepPage } from './pages/Delivery'
import { AccountTab } from './pages/Account'
import { Features, Impact, Recipes, TipDetail, Tips } from './pages/Explore'
import {
  AppreciationMaterial,
  AppreciationPreview,
  ChallengeDetail,
  ChallengeList,
  ChallengeProgress,
  CookMode,
  DataExplainer,
  ImpactHistory,
  RecipeDetail,
  RecipeUseLog,
  SavedRecipes,
} from './pages/Learn'
import { NotFound, PartnerProfile } from './pages/Partner'
import { InKindForm, ProgramReport, RecurringReminder, Rewards, SupportHistory, SupportPage, SupportReceipt, Transparency } from './pages/Support'
import {
  About,
  HelpCenter,
  LocationSettings,
  NeedsCapacity,
  NotificationPrefs,
  PrivacySettings,
  ProfileEdit,
  SecuritySettings,
  SettingsHome,
} from './pages/Settings'
import { VerificationStatus } from './pages/account/VerificationStatus'
import { AssistantChat } from './pages/assistant/AssistantChat'
import { Login, Onboarding, ProfileSetup, ProofSubmit, Recover, Register, RolePick, VerifyCode } from './pages/auth'

// Konsol admin terpisah (src/admin) dan tidak ikut bundle aplikasi mobile.
const AdminApp = lazy(() => import('./admin/AdminApp'))

function RequireAuth() {
  const { state } = useApp()
  const { ready } = useMyProfile()
  const { loaded } = useLiveData()
  if (!state.signedIn) return <Navigate to={state.onboarded ? '/masuk' : '/pengenalan'} replace />
  // Layar dan form baru dirender setelah profil + data pertama tiba: tanpa "kosong" palsu dan form tidak terisi nilai kosong.
  if (!ready || !loaded)
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 bg-page text-meta text-ink-secondary" role="status" aria-busy="true">
        <CircleNotch size={20} className="animate-spin text-primary" aria-hidden="true" /> Memuat data…
      </div>
    )
  return <Outlet />
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/admin/*"
        element={
          <Suspense fallback={<div className="min-h-screen bg-page" aria-busy="true" />}>
            <AdminApp />
          </Suspense>
        }
      />
      <Route element={<AppFrame />}>
        <Route path="/pengenalan" element={<Onboarding />} />
        <Route path="/masuk" element={<Login />} />
        <Route path="/peran" element={<RolePick />} />
        <Route path="/daftar" element={<Register />} />
        <Route path="/daftar/konfirmasi" element={<VerifyCode />} />
        <Route path="/daftar/profil" element={<ProfileSetup />} />
        <Route path="/daftar/bukti" element={<ProofSubmit />} />
        <Route path="/pulihkan" element={<Recover />} />

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
          <Route path="penawaran/:id" element={<OfferManage />} />
          <Route path="donasi/kelola/:id/tutup" element={<OfferClose />} />
          <Route path="donasi/kelola/:id/ubah" element={<OfferEdit />} />
          <Route path="donasi/:id" element={<OfferDetail />} />
          <Route path="donasi/:id/minta" element={<RequestForm />} />
          <Route path="permintaan/:id" element={<RequestDetail />} />
          <Route path="permintaan/:id/batal" element={<RequestCancel />} />
          <Route path="permintaan/:id/tinjau" element={<ReviewRequest />} />
          <Route path="aktivitas/permintaan" element={<IncomingRequests />} />
          <Route path="aktivitas/:id" element={<TransferDetail />} />
          <Route path="aktivitas/:id/serahkan" element={<Handover />} />
          <Route path="aktivitas/:id/terima" element={<Receive />} />
          <Route path="aktivitas/:id/distribusi" element={<Distribution />} />
          <Route path="aktivitas/:id/koordinasi" element={<Coordination />} />
          <Route path="aktivitas/:id/masalah" element={<ReportIssue />} />
          <Route path="aktivitas/:id/metode" element={<MethodPage />} />
          <Route path="aktivitas/:id/persiapan" element={<PrepPage />} />
          <Route path="aktivitas/:id/status" element={<DeliveryStatus />} />
          <Route path="pangan/baru" element={<RecordForm />} />
          <Route path="pangan/:id" element={<RecordDetail />} />
          <Route path="pangan/:id/gerak" element={<RecordMove />} />
          <Route path="pangan/:id/koreksi" element={<RecordCorrection />} />
          <Route path="permintaan/:id/penyesuaian" element={<RequestAdjustment />} />
          <Route path="masalah/:id" element={<IssueDetail />} />
          <Route path="notifikasi" element={<Notifications />} />
          <Route path="asisten" element={<AssistantChat />} />
          <Route path="fitur" element={<Features />} />
          <Route path="dampak" element={<Impact />} />
          <Route path="tips" element={<Tips />} />
          <Route path="tips/tersimpan" element={<SavedTips />} />
          <Route path="tips/:id" element={<TipDetail />} />
          <Route path="area" element={<AreaPicker />} />
          <Route path="bantuan/pesan" element={<HelpRequest />} />
          <Route path="pengaturan/hapus-akun" element={<DeletionRequest />} />
          <Route path="reward/:id" element={<RewardDetail />} />
          <Route path="reward/:id/klaim" element={<ClaimReview />} />
          <Route path="resep" element={<Recipes />} />
          <Route path="tantangan" element={<ChallengeList />} />
          <Route path="tantangan/:id" element={<ChallengeDetail />} />
          <Route path="tantangan/:id/progres" element={<ChallengeProgress />} />
          <Route path="resep/tersimpan" element={<SavedRecipes />} />
          <Route path="resep/:id" element={<RecipeDetail />} />
          <Route path="resep/:id/masak" element={<CookMode />} />
          <Route path="resep/:id/catat" element={<RecipeUseLog />} />
          <Route path="apresiasi" element={<AppreciationMaterial />} />
          <Route path="apresiasi/pratinjau" element={<AppreciationPreview />} />
          {/* Tautan notifikasi admin_propose_appreciation di server. */}
          <Route path="reward/apresiasi" element={<AppreciationPreview />} />
          <Route path="dampak/riwayat" element={<ImpactHistory />} />
          <Route path="dampak/penjelasan" element={<DataExplainer />} />

          <Route path="reward" element={<Rewards />} />
          <Route path="dukung" element={<SupportPage />} />
          <Route path="transparansi" element={<Transparency />} />
          <Route path="transparansi/program" element={<ProgramReport />} />
          <Route path="dukung/bukti/:id" element={<SupportReceipt />} />
          <Route path="dukung/riwayat" element={<SupportHistory />} />
          <Route path="dukung/barang" element={<InKindForm />} />
          <Route path="dukung/rutin" element={<RecurringReminder />} />
          <Route path="mitra/:id" element={<PartnerProfile />} />
          <Route path="akun/profil" element={<ProfileEdit />} />
          <Route path="akun/kebutuhan" element={<NeedsCapacity />} />
          <Route path="akun/lokasi" element={<LocationSettings />} />
          <Route path="akun/verifikasi" element={<VerificationStatus />} />
          <Route path="pengaturan" element={<SettingsHome />} />
          <Route path="pengaturan/notifikasi" element={<NotificationPrefs />} />
          <Route path="pengaturan/privasi" element={<PrivacySettings />} />
          <Route path="pengaturan/keamanan" element={<SecuritySettings />} />
          <Route path="bantuan" element={<HelpCenter />} />
          <Route path="tentang" element={<About />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
  )
}
