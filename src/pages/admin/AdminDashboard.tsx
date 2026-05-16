import { useState, useEffect } from 'react'
import { db as supabase } from '../../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { Badge } from '../../components/ui/badge'

interface Manager { id: string; full_name: string; department: string }
interface Employee { id: string; manager_id: string | null }
interface Goal { id: string; employee_id: string }
interface AchRec { goal_id: string }
interface CommentRec { manager_id: string }

export default function AdminDashboard() {
  const [data, setData] = useState<{ id: string; name: string; department: string; teamSize: number; status: string }[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => { fetchCompletionData() }, [])

  const fetchCompletionData = async () => {
    setIsLoading(true)
    
    const { data: cycleRaw } = await supabase.from('goal_cycles').select('*').eq('is_active', true).single()
    const cycleData = cycleRaw as unknown as { id: string; q1_open: boolean; q2_open: boolean; q3_open: boolean; q4_open: boolean } | null
    
    const activeQ = cycleData?.q1_open ? 'Q1' : cycleData?.q2_open ? 'Q2' : cycleData?.q3_open ? 'Q3' : cycleData?.q4_open ? 'Q4' : null
    
    const { data: managersRaw } = await supabase.from('profiles').select('id, full_name, department').eq('role', 'manager')
    const { data: employeesRaw } = await supabase.from('profiles').select('id, manager_id').eq('role', 'employee')
    
    const managers = (managersRaw || []) as unknown as Manager[]
    const employees = (employeesRaw || []) as unknown as Employee[]

    if (managers.length > 0 && activeQ) {
      const { data: commentsRaw } = await supabase.from('checkin_comments').select('manager_id').eq('quarter', activeQ)
      const { data: goalsRaw } = await supabase.from('goals').select('id, employee_id').in('status', ['approved', 'locked'])
      const { data: achRaw } = await supabase.from('goal_achievements').select('goal_id').eq('quarter', activeQ)

      const comments = (commentsRaw || []) as unknown as CommentRec[]
      const goals = (goalsRaw || []) as unknown as Goal[]
      const achievements = (achRaw || []) as unknown as AchRec[]

      const result = managers.map(mgr => {
        const team = employees.filter(e => e.manager_id === mgr.id)
        const teamGoals = goals.filter(g => team.some(t => t.id === g.employee_id))
        const submittedCheckins = teamGoals.filter(g => achievements.some(a => a.goal_id === g.id)).length
        const totalGoals = teamGoals.length
        const mgrComments = comments.filter(c => c.manager_id === mgr.id).length

        const isComplete = totalGoals > 0 && mgrComments >= totalGoals
        const needsAttention = totalGoals > 0 && submittedCheckins < totalGoals

        return {
          id: mgr.id,
          name: mgr.full_name,
          department: mgr.department,
          teamSize: team.length,
          status: isComplete ? 'Complete' : needsAttention ? 'At Risk' : 'In Progress'
        }
      })
      setData(result)
    }
    setIsLoading(false)
  }

  if (isLoading) return <div className="p-6">Loading dashboard...</div>

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Completion Dashboard</h2>
        <p className="text-slate-500 mt-1">Real-time view of manager check-in completion status.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        {['Complete', 'In Progress', 'At Risk'].map(s => {
          const count = data.filter(d => d.status === s).length
          const color = s === 'Complete' ? 'text-green-600 bg-green-50' : s === 'At Risk' ? 'text-red-600 bg-red-50' : 'text-amber-600 bg-amber-50'
          return (
            <Card key={s} className="text-center">
              <CardContent className={`p-6 ${color} rounded-lg`}>
                <p className="text-4xl font-bold">{count}</p>
                <p className="text-sm font-medium mt-1">{s}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manager Status Tracking</CardTitle>
          <CardDescription>Colored status badges show check-in completion for the active quarter.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Manager Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Team Size</TableHead>
                <TableHead>Check-in Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map(mgr => (
                <TableRow key={mgr.id}>
                  <TableCell className="font-medium">{mgr.name}</TableCell>
                  <TableCell>{mgr.department}</TableCell>
                  <TableCell>{mgr.teamSize} direct reports</TableCell>
                  <TableCell>
                    <Badge className={
                      mgr.status === 'Complete' ? 'bg-green-500 hover:bg-green-600 text-white' :
                      mgr.status === 'At Risk' ? 'bg-red-500 hover:bg-red-600 text-white' :
                      'bg-amber-500 hover:bg-amber-600 text-white'
                    }>
                      {mgr.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                    No active check-in window, or no managers found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}


