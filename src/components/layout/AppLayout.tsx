import { Outlet, Navigate, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useNotifications } from '../../hooks/useNotifications'
import {
  Bell, LogOut, LayoutDashboard, Target, Users, Calendar,
  BarChart3, Settings, ShieldAlert, History, BookCheck, CheckSquare
} from 'lucide-react'
import { useState } from 'react'
import { format } from 'date-fns'

export default function AppLayout() {
  const { user, role, isLoading, signOut } = useAuth()
  const { notifications, unreadCount, markAllRead } = useNotifications()
  const location = useLocation()
  const navigate = useNavigate()
  const [notifOpen, setNotifOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500">Loading portal...</p>
        </div>
      </div>
    )
  }

  if (!user || !role) return <Navigate to="/login" replace />

  const getRoleTheme = () => {
    switch (role) {
      case 'employee': return { accent: 'blue', gradient: 'from-blue-600 to-indigo-600' }
      case 'manager': return { accent: 'purple', gradient: 'from-purple-600 to-violet-600' }
      case 'admin': return { accent: 'orange', gradient: 'from-orange-500 to-amber-500' }
      default: return { accent: 'blue', gradient: 'from-blue-600 to-indigo-600' }
    }
  }
  const theme = getRoleTheme()

  const getNavItems = () => {
    switch (role) {
      case 'employee': return [
        { name: 'My Goals', path: '/employee/goals', icon: Target },
        { name: 'Quarterly Check-ins', path: '/employee/checkins', icon: Calendar },
      ]
      case 'manager': return [
        { name: 'Team Dashboard', path: '/manager/team', icon: Users },
        { name: 'Check-in Module', path: '/manager/checkins', icon: CheckSquare },
        { name: 'Achievement Report', path: '/manager/reports', icon: BarChart3 },
      ]
      case 'admin': return [
        { name: 'Completion Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'Goal Cycle Management', path: '/admin/cycles', icon: Settings },
        { name: 'Shared Goals', path: '/admin/shared-goals', icon: BookCheck },
        { name: 'Achievement Report', path: '/admin/reports', icon: BarChart3 },
        { name: 'Audit Trail', path: '/admin/audit', icon: History },
        { name: 'Escalation Rules', path: '/admin/escalations', icon: ShieldAlert },
        { name: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
      ]
      default: return []
    }
  }

  const navItems = getNavItems()

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex flex-col shadow-sm">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <h1 className={`text-2xl font-extrabold bg-gradient-to-r ${theme.gradient} bg-clip-text text-transparent tracking-tight`}>
            AtomQuest
          </h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest">{role} Portal</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname.startsWith(item.path)
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${
                  isActive
                    ? `bg-${theme.accent}-50 text-${theme.accent}-700 dark:bg-${theme.accent}-900/40 dark:text-${theme.accent}-400 shadow-sm`
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? `text-${theme.accent}-600 dark:text-${theme.accent}-400` : ''}`} />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="p-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 px-2 py-2 mb-2">
            <div className={`w-8 h-8 bg-${theme.accent}-100 dark:bg-${theme.accent}-900 text-${theme.accent}-700 dark:text-${theme.accent}-300 rounded-full flex items-center justify-center font-bold text-sm shrink-0`}>
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{user?.email}</p>
              <p className="text-xs text-slate-400 capitalize">{role}</p>
            </div>
          </div>
          <button
            className="w-full flex items-center justify-start gap-2 px-3 py-2 text-sm text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-md transition-colors"
            onClick={signOut}
          >
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="h-14 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-end px-6 gap-3 shadow-sm">
          {/* Notification Bell */}
          <div className="relative">
            <button
              className="relative p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              onClick={() => { setNotifOpen(!notifOpen); if (!notifOpen && unreadCount > 0) markAllRead() }}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-12 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="font-semibold text-sm">Notifications</h3>
                  <button className="text-xs text-blue-600 hover:text-blue-700" onClick={markAllRead}>Mark all read</button>
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {notifications.length === 0 ? (
                    <p className="text-center py-8 text-slate-500 text-sm">No notifications</p>
                  ) : notifications.map(n => (
                    <div
                      key={n.id}
                      className={`p-3 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors ${!n.is_read ? 'border-l-2 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/30' : ''}`}
                      onClick={() => { n.link && navigate(n.link); setNotifOpen(false) }}
                    >
                      <p className={`text-sm ${!n.is_read ? 'font-semibold text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400'}`}>{n.message}</p>
                      <p className="text-xs text-slate-400 mt-1">{format(new Date(n.created_at), 'MMM d, h:mm a')}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-900">
          {notifOpen && <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />}
          <Outlet />
        </main>
      </div>
    </div>
  )
}


