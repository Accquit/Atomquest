import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { db as supabase } from '../../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { toast } from 'sonner'
import { Badge } from '../../components/ui/badge'
import { computeScore } from '../../lib/scoreLogic'
import { CheckCircle2, Lock } from 'lucide-react'

export default function EmployeeCheckins() {
  const { user } = useAuth()
  const [goals, setGoals] = useState<any[]>([])
  const [activeCycle, setActiveCycle] = useState<any>(null)
  const [activeQuarter, setActiveQuarter] = useState<string | null>(null)
  const [achievements, setAchievements] = useState<Record<string, any>>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  const fetchData = async () => {
    setIsLoading(true)
    
    // 1. Fetch active cycle to determine if any quarter is open
    const { data: cycleData, error: cycleError } = await supabase
      .from('goal_cycles')
      .select('*')
      .eq('is_active', true)
      .single()

    if (cycleError) {
      toast.error('Failed to load active cycle')
      setIsLoading(false)
      return
    }
    setActiveCycle(cycleData)

    // Determine active quarter based on cycle dates
    let currentQ = null
    if (cycleData.q1_open) currentQ = 'Q1'
    else if (cycleData.q2_open) currentQ = 'Q2'
    else if (cycleData.q3_open) currentQ = 'Q3'
    else if (cycleData.q4_open) currentQ = 'Q4'
    setActiveQuarter(currentQ)

    // 2. Fetch approved goals for this employee in the active cycle
    const { data: goalsData } = await supabase
      .from('goals')
      .select('*')
      .eq('employee_id', user?.id)
      .eq('cycle_id', cycleData.id)
      .in('status', ['approved', 'locked'])

    if (goalsData) {
      setGoals(goalsData)

      if (currentQ) {
        // 3. Fetch existing achievements for the active quarter
        const goalIds = goalsData.map(g => g.id)
        const { data: achData } = await supabase
          .from('goal_achievements')
          .select('*')
          .in('goal_id', goalIds)
          .eq('quarter', currentQ)

        const achMap: Record<string, any> = {}
        achData?.forEach(a => {
          achMap[a.goal_id] = a
        })
        setAchievements(achMap)
      }
    }
    
    setIsLoading(false)
  }

  const handleUpdateAchievement = (goalId: string, field: string, value: any) => {
    setAchievements(prev => ({
      ...prev,
      [goalId]: {
        ...prev[goalId],
        [field]: value
      }
    }))
  }

  const saveCheckin = async (goal: any) => {
    if (!activeQuarter) return
    const ach = achievements[goal.id] || {}
    
    // Compute score dynamically before saving
    const isCompleted = ach.progress_status === 'completed'
    const actualVal = ach.actual_value ? parseFloat(ach.actual_value) : null
    const computedScore = computeScore(goal.uom_type, goal.target_value, actualVal, isCompleted)

    const payload = {
      goal_id: goal.id,
      quarter: activeQuarter,
      actual_value: actualVal,
      actual_date: ach.actual_date || null,
      progress_status: ach.progress_status || 'not_started',
      computed_score: computedScore
    }

    // Check if exists (since we only fetch the active quarter, we can upsert by matching goal_id & quarter)
    const { data: existing } = await supabase
      .from('goal_achievements')
      .select('id')
      .eq('goal_id', goal.id)
      .eq('quarter', activeQuarter)
      .single()

    let error
    if (existing) {
      const res = await supabase.from('goal_achievements').update(payload).eq('id', existing.id)
      error = res.error
    } else {
      const res = await supabase.from('goal_achievements').insert([payload])
      error = res.error
    }

    if (error) {
      toast.error('Failed to save check-in: ' + error.message)
    } else {
      toast.success('Check-in saved successfully')
      fetchData() // Refresh to get the computed score from DB (or just update state)
    }
  }

  if (isLoading) return <div className="p-6">Loading...</div>

  if (!activeQuarter) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-300">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold">Check-in Window Closed</h2>
        <p className="text-slate-500 max-w-md">
          There are currently no active quarterly check-in windows open for cycle <strong>{activeCycle?.name}</strong>. Please check back later or contact your admin.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Quarterly Check-ins</h2>
          <p className="text-slate-500 mt-1">Log your progress and achievements for the current quarter.</p>
        </div>
        <Badge variant="outline" className="text-lg py-1 px-4 border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950">
          Active Window: {activeQuarter}
        </Badge>
      </div>

      <div className="space-y-6">
        {goals.map(goal => {
          const ach = achievements[goal.id] || {}
          
          return (
            <Card key={goal.id} className="overflow-hidden border-l-4 border-l-blue-500">
              <CardHeader className="bg-slate-50 dark:bg-slate-900/50 pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{goal.title}</CardTitle>
                    <CardDescription className="mt-1">{goal.description || 'No description provided.'}</CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-500 font-medium">Target</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                      {goal.uom_type === 'timeline' ? goal.target_date : goal.target_value}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid md:grid-cols-4 gap-6 items-end">
                  
                  {goal.uom_type === 'timeline' ? (
                    <div className="space-y-2">
                      <Label>Actual Completion Date</Label>
                      <Input 
                        type="date"
                        value={ach.actual_date || ''}
                        onChange={e => handleUpdateAchievement(goal.id, 'actual_date', e.target.value)}
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label>Actual Value Achieved</Label>
                      <Input 
                        type="number"
                        placeholder="0.0"
                        value={ach.actual_value || ''}
                        onChange={e => handleUpdateAchievement(goal.id, 'actual_value', e.target.value)}
                      />
                    </div>
                  )}

                  <div className="space-y-2 md:col-span-2">
                    <Label>Progress Status</Label>
                    <Select 
                      value={ach.progress_status || 'not_started'} 
                      onValueChange={v => handleUpdateAchievement(goal.id, 'progress_status', v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="not_started">Not Started</SelectItem>
                        <SelectItem value="on_track">On Track</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-4">
                    <Button onClick={() => saveCheckin(goal)} className="w-full bg-blue-600 hover:bg-blue-700">
                      <CheckCircle2 className="w-4 h-4 mr-2" /> Save Log
                    </Button>
                    
                    {ach.computed_score !== undefined && ach.computed_score !== null && (
                      <div className="text-center w-24 shrink-0">
                        <Label className="text-xs text-slate-500">Score</Label>
                        <div className={`text-xl font-bold ${ach.computed_score >= 1.0 ? 'text-green-600' : 'text-blue-600'}`}>
                          {(ach.computed_score * 100).toFixed(0)}%
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              </CardContent>
            </Card>
          )
        })}

        {goals.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">No approved goals found</h3>
            <p className="text-slate-500 mt-1">You must have approved goals to participate in check-ins.</p>
          </div>
        )}
      </div>
    </div>
  )
}


