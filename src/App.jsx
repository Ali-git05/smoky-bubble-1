import { Routes, Route, Navigate } from 'react-router-dom'
import StaffPage from './pages/StaffPage'
import CustomerPage from './pages/CustomerPage'

export default function App() {
  return (
    <Routes>
      <Route path="/staff" element={<StaffPage />} />
      <Route path="/customer" element={<CustomerPage />} />
      <Route path="*" element={<Navigate to="/staff" replace />} />
    </Routes>
  )
}
