import { Routes, Route, Navigate } from 'react-router-dom'
import KioskPage from './pages/KioskPage'
import ManagerPage from './pages/ManagerPage'
import PrivacyPage from './pages/PrivacyPage'
import TermsPage from './pages/TermsPage'

export default function App() {
  return (
    <Routes>
      <Route path="/customer" element={<KioskPage />} />
      <Route path="/staff" element={<ManagerPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="*" element={<Navigate to="/customer" replace />} />
    </Routes>
  )
}
