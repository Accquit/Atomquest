import { useState, useEffect } from 'react'
import { db as supabase } from '../../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { Button } from '../../components/ui/button'
import { Download } from 'lucide-react'

export default function AchievementReport() {
  const [data, setData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchReportData()
  }, [])

  const fetchReportData = async () => {
    setIsLoading(true)
    
    // In a real scenario, an admin can see all, a manager can see only their team.
    // We will do a simple join to fetch goals, achievements, and profiles.
    // Supabase JS doesn't do deep joins easily without PostgREST views, but we can fetch them separately and merge.
    
    const { data: goalsData } = await supabase
      .from('goals')
      .select('id, title, target_value, weightage, uom_type, employee_id')
      .in('status', ['approved', 'locked'])

    const { data: achievementsData } = await supabase
      .from('goal_achievements')
      .select('*')

    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, full_name, department')

    if (goalsData && achievementsData && profilesData) {
      const merged = goalsData.map(goal => {
        const emp = profilesData.find(p => p.id === goal.employee_id)
        const achs = achievementsData.filter(a => a.goal_id === goal.id)
        
        return {
          employee_name: emp?.full_name || 'Unknown',
          department: emp?.department || 'Unknown',
          goal_title: goal.title,
          target: goal.target_value,
          weightage: goal.weightage,
          uom_type: goal.uom_type,
          q1_score: achs.find(a => a.quarter === 'Q1')?.computed_score || 0,
          q2_score: achs.find(a => a.quarter === 'Q2')?.computed_score || 0,
          q3_score: achs.find(a => a.quarter === 'Q3')?.computed_score || 0,
          q4_score: achs.find(a => a.quarter === 'Q4')?.computed_score || 0,
        }
      })
      setData(merged)
    }
    
    setIsLoading(false)
  }

  const exportCSV = () => {
    const headers = ['Employee Name', 'Department', 'Goal Title', 'Target', 'Weightage', 'Q1 Score', 'Q2 Score', 'Q3 Score', 'Q4 Score']
    const rows = data.map(row => [
      row.employee_name,
      row.department,
      `"${row.goal_title}"`,
      row.target,
      row.weightage,
      row.q1_score,
      row.q2_score,
      row.q3_score,
      row.q4_score
    ])

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'achievement_report.csv'
    link.click()
  }

  if (isLoading) return <div className="p-6">Loading report...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Achievement Report</h2>
          <p className="text-slate-500 mt-1">Exportable matrix of goals and quarterly scores.</p>
        </div>
        <Button onClick={exportCSV} variant="outline" className="gap-2">
          <Download className="w-4 h-4" /> Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Organization Goals Overview</CardTitle>
          <CardDescription>Consolidated view of all approved goals and computed scores.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Goal</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Weight</TableHead>
                <TableHead>Q1 Score</TableHead>
                <TableHead>Q2 Score</TableHead>
                <TableHead>Q3 Score</TableHead>
                <TableHead>Q4 Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium">{row.employee_name}</TableCell>
                  <TableCell>{row.department}</TableCell>
                  <TableCell className="max-w-[200px] truncate" title={row.goal_title}>{row.goal_title}</TableCell>
                  <TableCell>{row.target || '-'}</TableCell>
                  <TableCell>{row.weightage}%</TableCell>
                  <TableCell>{(row.q1_score * 100).toFixed(0)}%</TableCell>
                  <TableCell>{(row.q2_score * 100).toFixed(0)}%</TableCell>
                  <TableCell>{(row.q3_score * 100).toFixed(0)}%</TableCell>
                  <TableCell>{(row.q4_score * 100).toFixed(0)}%</TableCell>
                </TableRow>
              ))}
              {data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-4">No data available.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}


