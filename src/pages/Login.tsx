import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { db as supabase } from '../lib/supabase'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent } from '../components/ui/card'
import { Label } from '../components/ui/label'
import { useAuth } from '../hooks/useAuth'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { BookOpen, Target, Users, Shield, ChevronRight, CheckCircle } from 'lucide-react'

const DEMO_ACCOUNTS = [
  {
    role: 'Employee',
    email: 'employee@demo.com',
    password: 'password123',
    description: 'Create goals, log check-ins, view scores',
    icon: Target,
    color: 'blue',
  },
  {
    role: 'Manager',
    email: 'manager@demo.com',
    password: 'password123',
    description: 'Review team goals, approve, add comments',
    icon: Users,
    color: 'purple',
  },
  {
    role: 'Admin / HR',
    email: 'admin@demo.com',
    password: 'password123',
    description: 'Manage cycles, analytics, audit trail',
    icon: Shield,
    color: 'orange',
  },
]

const DEMO_JOURNEYS = [
  { role: 'Employee', steps: ['Login as employee@demo.com', 'Go to "My Goals" → Add up to 8 goals', 'Set weightage (must total 100%) → Submit', 'After manager approves → log Q1 check-in', 'View computed score per goal'] },
  { role: 'Manager', steps: ['Login as manager@demo.com', 'Go to "Team Dashboard" → see submitted goals', 'Inline-edit target or weightage', 'Click Approve (locks goals) or Return for Rework', 'Open "Check-in Module" → add quarterly comments'] },
  { role: 'Admin', steps: ['Login as admin@demo.com', 'Go to "Goal Cycle Management" → toggle phases open', 'Use "Shared Goals" to push a KPI to multiple employees', 'Check "Analytics" dashboard for org-wide charts', 'View "Audit Trail" for all status changes'] },
]

export default function Login() {
  const { user, role } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)

  if (user && role) {
    const dest = role === 'employee' ? '/employee/goals' : role === 'manager' ? '/manager/team' : '/admin/dashboard'
    return <Navigate to={dest} replace />
  }

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setIsLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error(error.message)
      setIsLoading(false)
    }
    // Auth state change handled by AuthProvider
  }

  const fillDemo = (acc: typeof DEMO_ACCOUNTS[0]) => {
    setEmail(acc.email)
    setPassword(acc.password)
    toast.info(`${acc.role} credentials loaded — click Sign In`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-5xl relative z-10">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-extrabold text-white tracking-tight">
            Atom<span className="text-blue-400">Quest</span>
          </h1>
          <p className="text-slate-400 mt-3 text-lg">Goal Setting & Tracking Portal · OKR / KPI Management</p>
        </div>

        <div className="grid md:grid-cols-5 gap-6 items-start">
          {/* Login form */}
          <Card className="md:col-span-2 bg-white/10 backdrop-blur-md border-white/20 shadow-2xl">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-white mb-1">Sign In</h2>
              <p className="text-slate-400 text-sm mb-6">Enter credentials or click a demo card →</p>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-slate-300 text-sm">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-500"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-slate-300 text-sm">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-500"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold h-11"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Signing in...</span>
                  ) : 'Sign In'}
                </Button>
              </form>

              <button
                className="mt-4 w-full flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-blue-400 transition-colors"
                onClick={() => setGuideOpen(true)}
              >
                <BookOpen className="w-4 h-4" />
                Demo Guide — Learn the user journeys
              </button>
            </CardContent>
          </Card>

          {/* Demo cards */}
          <div className="md:col-span-3 space-y-3">
            <p className="text-slate-400 text-sm mb-1">Click to auto-fill credentials:</p>
            {DEMO_ACCOUNTS.map(acc => {
              const Icon = acc.icon
              const colorMap: Record<string, string> = {
                blue: 'border-blue-500/40 hover:border-blue-400 hover:bg-blue-900/30',
                purple: 'border-purple-500/40 hover:border-purple-400 hover:bg-purple-900/30',
                orange: 'border-orange-500/40 hover:border-orange-400 hover:bg-orange-900/30',
              }
              const iconColorMap: Record<string, string> = {
                blue: 'bg-blue-600/20 text-blue-400',
                purple: 'bg-purple-600/20 text-purple-400',
                orange: 'bg-orange-600/20 text-orange-400',
              }
              return (
                <Card
                  key={acc.role}
                  className={`cursor-pointer border bg-white/5 backdrop-blur-sm transition-all duration-200 hover:shadow-lg ${colorMap[acc.color]}`}
                  onClick={() => fillDemo(acc)}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconColorMap[acc.color]}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white">{acc.role}</p>
                      <p className="text-xs text-slate-400 truncate">{acc.email}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{acc.description}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                  </CardContent>
                </Card>
              )
            })}
            <p className="text-xs text-slate-600 mt-2 text-center">All demo accounts use password: <span className="text-slate-400 font-mono">password123</span></p>
          </div>
        </div>
      </div>

      {/* Demo Guide Modal */}
      <Dialog open={guideOpen} onOpenChange={setGuideOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <BookOpen className="w-5 h-5 text-blue-600" />
              Demo Guide — User Journeys
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 mt-2">
            {DEMO_JOURNEYS.map(journey => (
              <div key={journey.role} className="space-y-2">
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">{journey.role} Journey</h3>
                <div className="space-y-2">
                  {journey.steps.map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-950 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <p className="text-sm text-green-800 dark:text-green-300">All three demo accounts are pre-configured in Supabase. Run <span className="font-mono font-bold">supabase/seed.sql</span> to populate realistic data.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}


