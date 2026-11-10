import { Route, Routes } from 'react-router-dom'
import { AdminStateProvider } from './store'
import { AdminLayout } from './AdminLayout'
import { AdminLogin, Dashboard, Deliveries, Distribution, IssueDetail, Issues, OperationDetail, UserReview, Users } from './pages/Operations'
import { AchievementReview, Appreciation, ChallengeEditor, ChallengeList, ClaimDetail, ContentEditor, ContentList, Rewards } from './pages/Programs'
import { AuditLog, FundDetail, Funds, Programs, Reports } from './pages/Finance'
import { Promotions } from './pages/Promotions'
import { TicketDetail, Tickets } from './pages/Tickets'

/** Konsol admin (AD01–AD22): dimuat terpisah dari aplikasi mobile lewat lazy import di App.tsx. */
export default function AdminApp() {
  return (
    <AdminStateProvider>
      <Routes>
        <Route path="masuk" element={<AdminLogin />} />
        <Route element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="pengguna" element={<Users />} />
          <Route path="pengguna/:id" element={<UserReview />} />
          <Route path="penyaluran" element={<Distribution />} />
          <Route path="penyaluran/:id" element={<OperationDetail />} />
          <Route path="kendala" element={<Issues />} />
          <Route path="kendala/:id" element={<IssueDetail />} />
          <Route path="pengiriman" element={<Deliveries />} />
          <Route path="konten" element={<ContentList />} />
          <Route path="konten/:id" element={<ContentEditor />} />
          <Route path="challenge" element={<ChallengeList />} />
          <Route path="challenge/:id" element={<ChallengeEditor />} />
          <Route path="capaian/:id" element={<AchievementReview />} />
          <Route path="reward" element={<Rewards />} />
          <Route path="klaim/:id" element={<ClaimDetail />} />
          <Route path="reward/:id" element={<ClaimDetail />} />
          <Route path="apresiasi" element={<Appreciation />} />
          <Route path="promosi" element={<Promotions />} />
          <Route path="tiket" element={<Tickets />} />
          <Route path="tiket/:id" element={<TicketDetail />} />
          <Route path="dana" element={<Funds />} />
          <Route path="dana/:id" element={<FundDetail />} />
          <Route path="program" element={<Programs />} />
          <Route path="laporan" element={<Reports />} />
          <Route path="audit" element={<AuditLog />} />
          <Route path="*" element={<Dashboard />} />
        </Route>
      </Routes>
    </AdminStateProvider>
  )
}
