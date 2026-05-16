import { Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import Login from './pages/Login'
import MyGoals from './pages/employee/MyGoals'
import TeamDashboard from './pages/manager/TeamDashboard'
import { useAuth } from './hooks/useAuth'
import { Toaster } from './components/ui/sonner'

// Placeholder components
const Placeholder = ({ title }: { title: string }) => (
  <div className="p-6">
    <h2 className="text-2xl font-bold">{title}</h2>
    <p className="text-slate-500 mt-2">Work in progress...</p>
  </div>
)

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: string[] }) => {
  const { role, isLoading } = useAuth()
  if (isLoading) return null
  if (!role || !allowedRoles.includes(role)) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  const { role, isLoading } = useAuth()

  if (isLoading) return null

  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<AppLayout />}>
          {/* Default redirect based on role */}
          <Route index element={
            role === 'employee' ? <Navigate to="/employee/goals" replace /> :
            role === 'manager' ? <Navigate to="/manager/team" replace /> :
            role === 'admin' ? <Navigate to="/admin/dashboard" replace /> :
            <Navigate to="/login" replace />
          } />

          {/* Employee Routes */}
          <Route path="employee/goals" element={
            <ProtectedRoute allowedRoles={['employee']}><MyGoals /></ProtectedRoute>
          } />
          <Route path="employee/checkins" element={
            <ProtectedRoute allowedRoles={['employee']}><Placeholder title="Quarterly Check-ins" /></ProtectedRoute>
          } />

          {/* Manager Routes */}
          <Route path="manager/team" element={
            <ProtectedRoute allowedRoles={['manager']}><TeamDashboard /></ProtectedRoute>
          } />
          <Route path="manager/checkins" element={
            <ProtectedRoute allowedRoles={['manager']}><Placeholder title="Check-in Module" /></ProtectedRoute>
          } />
          <Route path="manager/reports" element={
            <ProtectedRoute allowedRoles={['manager', 'admin']}><Placeholder title="Achievement Report" /></ProtectedRoute>
          } />

          {/* Admin Routes */}
          <Route path="admin/cycles" element={
            <ProtectedRoute allowedRoles={['admin']}><Placeholder title="Goal Cycle Management" /></ProtectedRoute>
          } />
          <Route path="admin/shared-goals" element={
            <ProtectedRoute allowedRoles={['admin']}><Placeholder title="Shared Goals" /></ProtectedRoute>
          } />
          <Route path="admin/reports" element={
            <ProtectedRoute allowedRoles={['admin']}><Placeholder title="Achievement Report" /></ProtectedRoute>
          } />
          <Route path="admin/dashboard" element={
            <ProtectedRoute allowedRoles={['admin']}><Placeholder title="Completion Dashboard" /></ProtectedRoute>
          } />
          <Route path="admin/audit" element={
            <ProtectedRoute allowedRoles={['admin']}><Placeholder title="Audit Trail" /></ProtectedRoute>
          } />
          <Route path="admin/escalations" element={
            <ProtectedRoute allowedRoles={['admin']}><Placeholder title="Escalation Rules" /></ProtectedRoute>
          } />
          <Route path="admin/analytics" element={
            <ProtectedRoute allowedRoles={['admin']}><Placeholder title="Analytics" /></ProtectedRoute>
          } />
        </Route>
      </Routes>
      <Toaster />
    </>
  )
}
