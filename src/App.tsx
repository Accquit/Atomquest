import { Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import Login from './pages/Login'
import MyGoals from './pages/employee/MyGoals'
import EmployeeCheckins from './pages/employee/EmployeeCheckins'
import TeamDashboard from './pages/manager/TeamDashboard'
import ManagerCheckins from './pages/manager/ManagerCheckins'
import AdminGoalCycles from './pages/admin/AdminGoalCycles'
import AdminSharedGoals from './pages/admin/AdminSharedGoals'
import AdminAnalytics from './pages/admin/AdminAnalytics'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminAudit from './pages/admin/AdminAudit'
import AdminEscalations from './pages/admin/AdminEscalations'
import AchievementReport from './pages/shared/AchievementReport'
import { useAuth } from './hooks/useAuth'
import { Toaster } from './components/ui/sonner'

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
            <ProtectedRoute allowedRoles={['employee']}><EmployeeCheckins /></ProtectedRoute>
          } />

          {/* Manager Routes */}
          <Route path="manager/team" element={
            <ProtectedRoute allowedRoles={['manager']}><TeamDashboard /></ProtectedRoute>
          } />
          <Route path="manager/checkins" element={
            <ProtectedRoute allowedRoles={['manager']}><ManagerCheckins /></ProtectedRoute>
          } />
          <Route path="manager/reports" element={
            <ProtectedRoute allowedRoles={['manager', 'admin']}><AchievementReport /></ProtectedRoute>
          } />

          {/* Admin Routes */}
          <Route path="admin/cycles" element={
            <ProtectedRoute allowedRoles={['admin']}><AdminGoalCycles /></ProtectedRoute>
          } />
          <Route path="admin/shared-goals" element={
            <ProtectedRoute allowedRoles={['admin']}><AdminSharedGoals /></ProtectedRoute>
          } />
          <Route path="admin/reports" element={
            <ProtectedRoute allowedRoles={['admin']}><AchievementReport /></ProtectedRoute>
          } />
          <Route path="admin/dashboard" element={
            <ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>
          } />
          <Route path="admin/audit" element={
            <ProtectedRoute allowedRoles={['admin']}><AdminAudit /></ProtectedRoute>
          } />
          <Route path="admin/escalations" element={
            <ProtectedRoute allowedRoles={['admin']}><AdminEscalations /></ProtectedRoute>
          } />
          <Route path="admin/analytics" element={
            <ProtectedRoute allowedRoles={['admin']}><AdminAnalytics /></ProtectedRoute>
          } />
        </Route>
      </Routes>
      <Toaster />
    </>
  )
}


