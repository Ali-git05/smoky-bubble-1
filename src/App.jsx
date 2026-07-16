import { Routes, Route, Navigate } from 'react-router-dom'
import KioskPage from './pages/KioskPage'
import ManagerPage from './pages/ManagerPage'

export default function App() {
  return (
    <Routes>
      <Route path="/customer" element={<KioskPage />} />
      <Route path="/staff" element={<ManagerPage />} />
      <Route path="*" element={<Navigate to="/customer" replace />} />
    </Routes>
  )
}
