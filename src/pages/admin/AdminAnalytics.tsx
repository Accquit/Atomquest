import { useState, useEffect } from 'react'
import { db as supabase } from '../../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']

interface AchievementRow { quarter: string; computed_score: number; goal_id: string }
interface GoalRow { id: string; employee_id: string; thrust_area: string; uom_type: string }
interface ProfileRow { id: string; department: string }

export default function AdminAnalytics() {
  const [trendData, setTrendData] = useState<any[]>([])
  const [deptData, setDeptData] = useState<any[]>([])
  const [pieData, setPieData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    setIsLoading(true)
    
    const { data: achRaw } = await supabase.from('goal_achievements').select('quarter, computed_score, goal_id')
    const { data: goalRaw } = await supabase.from('goals').select('id, employee_id, thrust_area, uom_type')
    const { data: profileRaw } = await supabase.from('profiles').select('id, department')

    const achData = (achRaw || []) as unknown as AchievementRow[]
    const goalData = (goalRaw || []) as unknown as GoalRow[]
    const profileData = (profileRaw || []) as unknown as ProfileRow[]

    // 1. Trend Data (Average score per quarter)
    const quarters = ['Q1', 'Q2', 'Q3', 'Q4']
    const trend = quarters.map(q => {
      const qAchs = achData.filter(a => a.quarter === q)
      const avg = qAchs.length ? qAchs.reduce((sum, a) => sum + (a.computed_score || 0), 0) / qAchs.length : 0
      return { name: q, 'Average Score': Number((avg * 100).toFixed(1)) }
    })
    setTrendData(trend)

    // 2. Department Data (Average score by department)
    const deptScores: Record<string, { total: number, count: number }> = {}
    achData.forEach(ach => {
      const goal = goalData.find(g => g.id === ach.goal_id)
      if (goal) {
        const emp = profileData.find(p => p.id === goal.employee_id)
        const dept = emp?.department || 'Unknown'
        if (!deptScores[dept]) deptScores[dept] = { total: 0, count: 0 }
        deptScores[dept].total += (ach.computed_score || 0)
        deptScores[dept].count += 1
      }
    })
    const dData = Object.entries(deptScores).map(([dept, data]) => ({
      name: dept,
      Score: Number(((data.total / data.count) * 100).toFixed(1))
    }))
    setDeptData(dData)

    // 3. Thrust Area Distribution
    const thrustCounts: Record<string, number> = {}
    goalData.forEach(g => {
      thrustCounts[g.thrust_area] = (thrustCounts[g.thrust_area] || 0) + 1
    })
    const pData = Object.entries(thrustCounts).map(([k, v]) => ({ name: k, value: v }))
    setPieData(pData)

    setIsLoading(false)
  }

  if (isLoading) return <div className="p-6">Loading Analytics...</div>

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Analytics Dashboard</h2>
        <p className="text-slate-500 mt-1">Real-time organizational performance metrics.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>QoQ Performance Trend</CardTitle>
            <CardDescription>Average goal score across all departments per quarter.</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} tickFormatter={(val) => `${val}%`} />
                <RechartsTooltip formatter={(val) => [`${val}%`, 'Avg Score']} />
                <Legend />
                <Line type="monotone" dataKey="Average Score" stroke="#8884d8" strokeWidth={3} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Completion by Department</CardTitle>
            <CardDescription>Average achievement score broken down by department.</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} tickFormatter={(val) => `${val}%`} />
                <RechartsTooltip formatter={(val) => [`${val}%`, 'Score']} />
                <Bar dataKey="Score" fill="#00C49F" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Goal Distribution</CardTitle>
            <CardDescription>Breakdown of goals by Thrust Area.</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


