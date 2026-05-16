import { useState, useEffect } from 'react'
import { db as supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { Input } from '../../components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog'
import { toast } from 'sonner'
import { CheckCircle2, RotateCcw, Edit2 } from 'lucide-react'

interface Employee {
  id: string
  full_name: string
  department: string
}

interface Goal {
  id: string
  title: string
  target_value: number
  weightage: number
  status: string
  employee_id: string
}

export default function TeamDashboard() {
  const { user } = useAuth()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [goals, setGoals] = useState<Record<string, Goal[]>>({})
  const [isLoading, setIsLoading] = useState(true)
  
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [editTarget, setEditTarget] = useState('')
  const [editWeightage, setEditWeightage] = useState('')

  useEffect(() => {
    if (user) {
      fetchTeamData()
    }
  }, [user])

  const fetchTeamData = async () => {
    setIsLoading(true)
    
    // Fetch direct reports
    const { data: teamData, error: teamError } = await supabase
      .from('profiles')
      .select('id, full_name, department')
      .eq('manager_id', user?.id)

    if (teamError) {
      toast.error('Failed to load team members')
      setIsLoading(false)
      return
    }

    if (teamData && teamData.length > 0) {
      setEmployees(teamData)
      const employeeIds = teamData.map(e => e.id)

      // Fetch goals for these employees
      const { data: goalsData, error: goalsError } = await supabase
        .from('goals')
        .select('*')
        .in('employee_id', employeeIds)
        .in('status', ['submitted', 'approved', 'rework', 'locked'])

      if (goalsError) {
        toast.error('Failed to load team goals')
      } else {
        const goalsMap: Record<string, Goal[]> = {}
        employeeIds.forEach(id => { goalsMap[id] = [] })
        goalsData?.forEach(g => {
          goalsMap[g.employee_id].push(g)
        })
        setGoals(goalsMap)
      }
    }
    setIsLoading(false)
  }

  const handleApprove = async (employeeId: string) => {
    const { error } = await supabase
      .from('goals')
      .update({ status: 'approved' })
      .eq('employee_id', employeeId)
      .eq('status', 'submitted')

    if (error) {
      toast.error('Error approving goals: ' + error.message)
    } else {
      toast.success('Goals approved successfully')
      fetchTeamData()
    }
  }

  const handleReturnRework = async (employeeId: string) => {
    const { error } = await supabase
      .from('goals')
      .update({ status: 'rework' })
      .eq('employee_id', employeeId)
      .eq('status', 'submitted')

    if (error) {
      toast.error('Error returning goals for rework: ' + error.message)
    } else {
      toast.success('Goals returned for rework')
      fetchTeamData()
    }
  }

  const openEditModal = (goal: Goal) => {
    setEditingGoal(goal)
    setEditTarget(goal.target_value?.toString() || '')
    setEditWeightage(goal.weightage?.toString() || '')
  }

  const saveGoalEdit = async () => {
    if (!editingGoal) return

    const newTarget = parseFloat(editTarget)
    const newWeightage = parseFloat(editWeightage)

    const { error } = await supabase
      .from('goals')
      .update({ target_value: newTarget, weightage: newWeightage })
      .eq('id', editingGoal.id)

    if (error) {
      toast.error('Error updating goal: ' + error.message)
    } else {
      toast.success('Goal updated successfully')
      setEditingGoal(null)
      fetchTeamData()
    }
  }

  if (isLoading) return <div className="p-6">Loading team data...</div>

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Team Dashboard</h2>
        <p className="text-slate-500 mt-1">Review and approve your direct reports' goals.</p>
      </div>

      <div className="space-y-8">
        {employees.map(employee => {
          const employeeGoals = goals[employee.id] || []
          const status = employeeGoals.length > 0 ? employeeGoals[0].status : 'No goals'
          const totalWeightage = employeeGoals.reduce((sum, g) => sum + Number(g.weightage), 0)

          return (
            <Card key={employee.id} className="overflow-hidden border-t-4 border-t-purple-500">
              <CardHeader className="bg-slate-50 dark:bg-slate-900/50 pb-4 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl">{employee.full_name}</CardTitle>
                  <p className="text-sm text-slate-500">{employee.department}</p>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant={status === 'approved' ? 'default' : status === 'submitted' ? 'secondary' : 'outline'} className="capitalize">
                    Status: {status}
                  </Badge>
                  <span className={`text-sm font-semibold ${totalWeightage === 100 ? 'text-green-600' : 'text-amber-600'}`}>
                    Total Weightage: {totalWeightage}%
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Goal Title</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Weightage</TableHead>
                      {status === 'submitted' && <TableHead className="w-[100px]">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employeeGoals.map(goal => (
                      <TableRow key={goal.id}>
                        <TableCell className="font-medium">{goal.title}</TableCell>
                        <TableCell>{goal.target_value}</TableCell>
                        <TableCell>{goal.weightage}%</TableCell>
                        {status === 'submitted' && (
                          <TableCell>
                            <Button variant="ghost" size="icon" onClick={() => openEditModal(goal)}>
                              <Edit2 className="w-4 h-4 text-slate-500" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                    {employeeGoals.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-slate-500 py-4">
                          Employee has not submitted goals yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>

                {status === 'submitted' && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/30 flex justify-end gap-3 border-t">
                    <Button variant="outline" className="text-amber-600 border-amber-200 hover:bg-amber-50" onClick={() => handleReturnRework(employee.id)}>
                      <RotateCcw className="w-4 h-4 mr-2" /> Return for Rework
                    </Button>
                    <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleApprove(employee.id)}>
                      <CheckCircle2 className="w-4 h-4 mr-2" /> Approve Goals
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}

        {employees.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium">No direct reports found</h3>
            <p className="text-slate-500">You don't have any employees assigned to you yet.</p>
          </div>
        )}
      </div>

      <Dialog open={!!editingGoal} onOpenChange={(open) => !open && setEditingGoal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Goal: {editingGoal?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Target Value</label>
              <Input type="number" value={editTarget} onChange={e => setEditTarget(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Weightage (%)</label>
              <Input type="number" value={editWeightage} onChange={e => setEditWeightage(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingGoal(null)}>Cancel</Button>
            <Button onClick={saveGoalEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


