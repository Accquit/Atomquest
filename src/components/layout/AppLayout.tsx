import { Outlet, Navigate, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Bell, LogOut, LayoutDashboard, Target, Users, Calendar, BarChart3, Settings, ShieldAlert, History } from 'lucide-react'
import { Button } from '../ui/button'

export default function AppLayout() {
  const { user, role, isLoading, signOut } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!user || !role) {
    return <Navigate to="/login" replace />
  }

  const getNavItems = () => {
    switch (role) {
      case 'employee':
        return [
          { name: 'My Goals', path: '/employee/goals', icon: Target },
          { name: 'Quarterly Check-ins', path: '/employee/checkins', icon: Calendar },
        ]
      case 'manager':
        return [
          { name: 'Team Dashboard', path: '/manager/team', icon: Users },
          { name: 'Check-in Module', path: '/manager/checkins', icon: Calendar },
          { name: 'Achievement Report', path: '/manager/reports', icon: BarChart3 },
        ]
      case 'admin':
        return [
          { name: 'Goal Cycle Management', path: '/admin/cycles', icon: Settings },
          { name: 'Shared Goals', path: '/admin/shared-goals', icon: Target },
          { name: 'Achievement Report', path: '/admin/reports', icon: BarChart3 },
          { name: 'Completion Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
          { name: 'Audit Trail', path: '/admin/audit', icon: History },
          { name: 'Escalation Rules', path: '/admin/escalations', icon: ShieldAlert },
          { name: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
        ]
      default:
        return []
    }
  }

  const navItems = getNavItems()

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">AtomQuest</h1>
          <p className="text-xs text-slate-500 mt-1 capitalize">{role} Portal</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname.startsWith(item.path)
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                  isActive 
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.name}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950" onClick={signOut}>
            <LogOut className="w-5 h-5 mr-2" />
            Sign out
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6">
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full flex items-center justify-center font-bold text-sm">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
