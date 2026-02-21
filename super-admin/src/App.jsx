import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import SuperAdminRoutes from './routes/SuperAdminRoutes'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/superadmin/*" element={<SuperAdminRoutes />} />
        <Route path="/" element={<Navigate to="/superadmin/login" replace />} />
        <Route path="*" element={<Navigate to="/superadmin/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
