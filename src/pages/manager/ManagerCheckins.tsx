import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { db as supabase } from '../../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Label } from '../../components/ui/label'
import { toast } from 'sonner'
import { Badge } from '../../components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { MessageSquare } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../components/ui/dialog'

export default function ManagerCheckins() {
  const { user } = useAuth()
  const [employees, setEmployees] = useState<any[]>([])
  const [activeQuarter, setActiveQuarter] = useState<string | null>(null)
  
  const [goals, setGoals] = useState<Record<string, any[]>>({})
  const [achievements, setAchievements] = useState<Record<string, any>>({})
  const [comments, setComments] = useState<Record<string, any>>({})
  
  const [isLoading, setIsLoading] = useState(true)

  const [commentModalGoal, setCommentModalGoal] = useState<any | null>(null)
  const [commentText, setCommentText] = useState('')

  useEffect(() => {
    if (user) fetchData()
  }, [user])

  const fetchData = async () => {
    setIsLoading(true)
    
    const { data: cycleData } = await supabase.from('goal_cycles').select('*').eq('is_active', true).single()

    let currentQ = null
    if (cycleData?.q1_open) currentQ = 'Q1'
    else if (cycleData?.q2_open) currentQ = 'Q2'
    else if (cycleData?.q3_open) currentQ = 'Q3'
    else if (cycleData?.q4_open) currentQ = 'Q4'
    setActiveQuarter(currentQ)

    const { data: teamData } = await supabase.from('profiles').select('id, full_name').eq('manager_id', user?.id)
    
    if (teamData && cycleData) {
      setEmployees(teamData)
      const empIds = teamData.map(e => e.id)

      const { data: goalsData } = await supabase
        .from('goals')
        .select('*')
        .in('employee_id', empIds)
        .eq('cycle_id', cycleData.id)
        .in('status', ['approved', 'locked'])

      const goalsMap: Record<string, any[]> = {}
      empIds.forEach(id => { goalsMap[id] = [] })
      goalsData?.forEach(g => { goalsMap[g.employee_id].push(g) })
      setGoals(goalsMap)

      if (currentQ && goalsData) {
        const goalIds = goalsData.map(g => g.id)
        
        const { data: achData } = await supabase
          .from('goal_achievements')
          .select('*')
          .in('goal_id', goalIds)
          .eq('quarter', currentQ)

        const achMap: Record<string, any> = {}
        achData?.forEach(a => { achMap[a.goal_id] = a })
        setAchievements(achMap)

        const { data: commentData } = await supabase
          .from('checkin_comments')
          .select('*')
          .in('goal_id', goalIds)
          .eq('quarter', currentQ)

        const commMap: Record<string, any> = {}
        commentData?.forEach(c => { commMap[c.goal_id] = c })
        setComments(commMap)
      }
    }
    
    setIsLoading(false)
  }

  const openCommentModal = (goal: any) => {
    setCommentModalGoal(goal)
    setCommentText(comments[goal.id]?.comment || '')
  }

  const saveComment = async () => {
    if (!commentModalGoal || !activeQuarter) return

    const existingComment = comments[commentModalGoal.id]

    const payload = {
      goal_id: commentModalGoal.id,
      manager_id: user?.id,
      quarter: activeQuarter,
      comment: commentText
    }

    let error
    if (existingComment) {
      const res = await supabase.from('checkin_comments').update({ comment: commentText }).eq('id', existingComment.id)
      error = res.error
    } else {
      const res = await supabase.from('checkin_comments').insert([payload])
      error = res.error
    }

    if (error) {
      toast.error('Failed to save comment: ' + error.message)
    } else {
      toast.success('Comment saved')
      setCommentModalGoal(null)
      fetchData()
    }
  }

  if (isLoading) return <div className="p-6">Loading...</div>

  if (!activeQuarter) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <h2 className="text-2xl font-bold">No Active Check-in Window</h2>
        <p className="text-slate-500">Wait for the admin to open a quarterly check-in window.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Check-in Review</h2>
          <p className="text-slate-500 mt-1">Review team progress and provide feedback.</p>
        </div>
        <Badge variant="outline" className="text-lg py-1 px-4 border-purple-500 text-purple-600 bg-purple-50">
          Active Window: {activeQuarter}
        </Badge>
      </div>

      <div className="space-y-8">
        {employees.map(emp => {
          const empGoals = goals[emp.id] || []
          
          return (
            <Card key={emp.id} className="border-t-4 border-t-purple-500">
              <CardHeader className="bg-slate-50 dark:bg-slate-900/50">
                <CardTitle>{emp.full_name}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Goal</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Actual Achieved</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead className="w-[100px]">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {empGoals.map(goal => {
                      const ach = achievements[goal.id]
                      const comm = comments[goal.id]
                      
                      return (
                        <TableRow key={goal.id}>
                          <TableCell className="font-medium">
                            {goal.title}
                            {comm && <Badge variant="secondary" className="ml-2 text-xs">Commented</Badge>}
                          </TableCell>
                          <TableCell>{goal.uom_type === 'timeline' ? goal.target_date : goal.target_value}</TableCell>
                          <TableCell>
                            {ach ? (
                              <span className="font-medium">
                                {goal.uom_type === 'timeline' ? ach.actual_date : ach.actual_value}
                                <span className="text-slate-500 text-xs ml-2 capitalize">({ach.progress_status.replace('_', ' ')})</span>
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">Not logged</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {ach?.computed_score !== undefined && ach?.computed_score !== null ? (
                              <span className={`font-bold ${ach.computed_score >= 1.0 ? 'text-green-600' : 'text-blue-600'}`}>
                                {(ach.computed_score * 100).toFixed(0)}%
                              </span>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" onClick={() => openCommentModal(goal)}>
                              <MessageSquare className="w-4 h-4 mr-2" /> {comm ? 'Edit' : 'Comment'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                    {empGoals.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-slate-500 py-4">No approved goals found.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Dialog open={!!commentModalGoal} onOpenChange={(open) => !open && setCommentModalGoal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Feedback - {activeQuarter}</DialogTitle>
            <DialogDescription>{commentModalGoal?.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Manager Comment</Label>
              <textarea 
                className="w-full min-h-[100px] p-3 rounded-md border border-slate-200 dark:border-slate-800 bg-transparent text-sm"
                placeholder="Provide structured feedback on this check-in..."
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCommentModalGoal(null)}>Cancel</Button>
            <Button onClick={saveComment} className="bg-purple-600 hover:bg-purple-700">Save Comment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


