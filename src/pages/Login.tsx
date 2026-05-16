import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Label } from '../components/ui/label'

const DEMO_ACCOUNTS = [
  { role: 'employee', email: 'employee@demo.com', password: 'password123' },
  { role: 'manager', email: 'manager@demo.com', password: 'password123' },
  { role: 'admin', email: 'admin@demo.com', password: 'password123' },
]

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setIsLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setIsLoading(false)
    } else {
      // Role routing is handled by checking role after login
      // but we need to wait for role to be fetched in AuthProvider
      // A simple reload or letting App route it works.
      navigate('/')
    }
  }

  const fillDemo = (acc: typeof DEMO_ACCOUNTS[0]) => {
    setEmail(acc.email)
    setPassword(acc.password)
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center">
        
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">AtomQuest</h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 mt-2">Goal Setting & Tracking Portal</p>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Sign In</CardTitle>
              <CardDescription>Enter your credentials to access your dashboard.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                  />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">Evaluator / Demo Accounts</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Click a card to auto-fill credentials.</p>
          
          {DEMO_ACCOUNTS.map((acc) => (
            <Card 
              key={acc.role} 
              className="cursor-pointer hover:border-blue-500 transition-colors"
              onClick={() => fillDemo(acc)}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium capitalize">{acc.role} Role</p>
                  <p className="text-sm text-slate-500">{acc.email}</p>
                </div>
                <Button variant="outline" size="sm">Auto-fill</Button>
              </CardContent>
            </Card>
          ))}
        </div>

      </div>
    </div>
  )
}
