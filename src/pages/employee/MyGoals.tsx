import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { toast } from 'sonner'
import { Plus, Trash2, Lock } from 'lucide-react'
import { Badge } from '../../components/ui/badge'

interface GoalForm {
  id?: string
  thrust_area: string
  title: string
  description: string
  uom_type: 'numeric_min' | 'numeric_max' | 'timeline' | 'zero'
  target_value: string
  target_date: string
  weightage: string
}

export default function MyGoals() {
  const { user } = useAuth()
  const [goals, setGoals] = useState<GoalForm[]>([])
  const [isLocked, setIsLocked] = useState(false)
  const [status, setStatus] = useState<string>('draft')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchGoals()
    }
  }, [user])

  const fetchGoals = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('employee_id', user?.id)
      .order('created_at', { ascending: true })

    if (error) {
      toast.error('Failed to load goals')
      setIsLoading(false)
      return
    }

    if (data && data.length > 0) {
      // Assuming all goals from the current cycle share the same status
      const currentStatus = data[0].status
      setStatus(currentStatus)
      if (['submitted', 'approved', 'locked'].includes(currentStatus)) {
        setIsLocked(true)
      }

      setGoals(data.map(g => ({
        id: g.id,
        thrust_area: g.thrust_area,
        title: g.title,
        description: g.description || '',
        uom_type: g.uom_type,
        target_value: g.target_value?.toString() || '',
        target_date: g.target_date || '',
        weightage: g.weightage.toString(),
      })))
    }
    setIsLoading(false)
  }

  const addGoal = () => {
    if (goals.length >= 8) {
      toast.error('Maximum 8 goals allowed')
      return
    }
    setGoals([...goals, {
      thrust_area: '',
      title: '',
      description: '',
      uom_type: 'timeline',
      target_value: '',
      target_date: '',
      weightage: '10'
    }])
  }

  const removeGoal = (index: number) => {
    setGoals(goals.filter((_, i) => i !== index))
  }

  const updateGoal = (index: number, field: keyof GoalForm, value: string) => {
    const newGoals = [...goals]
    newGoals[index] = { ...newGoals[index], [field]: value }
    setGoals(newGoals)
  }

  const totalWeightage = goals.reduce((sum, g) => sum + (parseFloat(g.weightage) || 0), 0)

  const handleSave = async (submit: boolean = false) => {
    if (!user) return

    if (submit && totalWeightage !== 100) {
      toast.error('Total weightage must be exactly 100% to submit')
      return
    }

    // Validate min weightage
    if (goals.some(g => parseFloat(g.weightage) < 10)) {
      toast.error('Minimum weightage per goal is 10%')
      return
    }

    // Find active cycle (mocked or should be fetched)
    // For now, we will insert without cycle_id if we don't have one, or fetch it.
    // In a real app, we'd fetch the active cycle first. Let's assume we fetch it or it's nullable.
    const { data: cycleData } = await supabase.from('goal_cycles').select('id').eq('is_active', true).single()
    const cycleId = cycleData?.id

    const goalsToUpsert = goals.map(g => ({
      ...(g.id ? { id: g.id } : {}),
      employee_id: user.id,
      cycle_id: cycleId, // Might be undefined if no cycle active
      thrust_area: g.thrust_area,
      title: g.title,
      description: g.description,
      uom_type: g.uom_type,
      target_value: g.target_value ? parseFloat(g.target_value) : null,
      target_date: g.target_date || null,
      weightage: parseFloat(g.weightage),
      status: submit ? 'submitted' : 'draft',
    }))

    // In a real app, we should use upsert or delete-then-insert.
    // For simplicity, we can do an upsert if we have IDs, or insert.
    // Since we don't have primary keys generated for new ones yet on the client side, 
    // it's easier to upsert with uuid or just delete all drafts and insert new ones.
    
    // Delete existing draft goals first to keep it simple, then insert new.
    await supabase.from('goals').delete().eq('employee_id', user.id).in('status', ['draft', 'rework'])
    
    const { error } = await supabase.from('goals').insert(goalsToUpsert)

    if (error) {
      toast.error('Error saving goals: ' + error.message)
    } else {
      toast.success(submit ? 'Goals submitted to manager' : 'Draft saved successfully')
      if (submit) {
        setIsLocked(true)
        setStatus('submitted')
      }
      fetchGoals()
    }
  }

  if (isLoading) return <div className="p-6">Loading...</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">My Goals</h2>
          <p className="text-slate-500 mt-1">Define your KPIs and OKRs for the current cycle.</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant={status === 'approved' ? 'default' : status === 'rework' ? 'destructive' : 'secondary'} className="capitalize text-sm px-3 py-1">
            Status: {status}
          </Badge>
          <div className={`text-lg font-bold ${totalWeightage === 100 ? 'text-green-600' : 'text-amber-600'}`}>
            Total Weightage: {totalWeightage}%
          </div>
        </div>
      </div>

      {isLocked && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-center gap-3 text-blue-700 dark:text-blue-300">
          <Lock className="w-5 h-5" />
          <p>Your goals are currently <strong>{status}</strong> and cannot be edited. Please wait for manager action or contact your admin.</p>
        </div>
      )}

      <div className="space-y-4">
        {goals.map((goal, index) => (
          <Card key={index} className="relative">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Goal #{index + 1}</CardTitle>
                {!isLocked && (
                  <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => removeGoal(index)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2 lg:col-span-2">
                  <Label>Title</Label>
                  <Input 
                    placeholder="e.g. Increase Q3 Revenue" 
                    value={goal.title} 
                    onChange={e => updateGoal(index, 'title', e.target.value)}
                    disabled={isLocked}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Thrust Area</Label>
                  <Select disabled={isLocked} value={goal.thrust_area} onValueChange={v => updateGoal(index, 'thrust_area', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Area" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Financial">Financial</SelectItem>
                      <SelectItem value="Customer">Customer</SelectItem>
                      <SelectItem value="Internal Process">Internal Process</SelectItem>
                      <SelectItem value="Learning & Growth">Learning & Growth</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>UoM Type</Label>
                  <Select disabled={isLocked} value={goal.uom_type} onValueChange={v => updateGoal(index, 'uom_type', v as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="numeric_min">Numeric (Min to achieve)</SelectItem>
                      <SelectItem value="numeric_max">Numeric (Max to keep below)</SelectItem>
                      <SelectItem value="timeline">Timeline (Date)</SelectItem>
                      <SelectItem value="zero">Zero Tolerance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2 lg:col-span-2">
                  <Label>Description</Label>
                  <Input 
                    placeholder="Brief details about the goal..." 
                    value={goal.description}
                    onChange={e => updateGoal(index, 'description', e.target.value)}
                    disabled={isLocked}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{goal.uom_type === 'timeline' ? 'Target Date' : 'Target Value'}</Label>
                  <Input 
                    type={goal.uom_type === 'timeline' ? 'date' : 'number'}
                    value={goal.uom_type === 'timeline' ? goal.target_date : goal.target_value}
                    onChange={e => updateGoal(index, goal.uom_type === 'timeline' ? 'target_date' : 'target_value', e.target.value)}
                    disabled={isLocked}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Weightage (%)</Label>
                  <Input 
                    type="number"
                    min="10"
                    max="100"
                    value={goal.weightage}
                    onChange={e => updateGoal(index, 'weightage', e.target.value)}
                    disabled={isLocked}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {goals.length === 0 && !isLocked && (
          <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">No goals yet</h3>
            <p className="text-slate-500 mt-1">Start by adding your first goal.</p>
            <Button className="mt-4" onClick={addGoal}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Goal
            </Button>
          </div>
        )}
      </div>

      {!isLocked && goals.length > 0 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
          {goals.length < 8 ? (
            <Button variant="outline" onClick={addGoal}>
              <Plus className="w-4 h-4 mr-2" />
              Add Goal
            </Button>
          ) : <div />}
          
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => handleSave(false)}>
              Save Draft
            </Button>
            <Button onClick={() => handleSave(true)} disabled={totalWeightage !== 100}>
              Submit for Approval
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
