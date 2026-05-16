import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Switch } from '../../components/ui/switch'
import { Input } from '../../components/ui/input'
import { toast } from 'sonner'
import { Label } from '../../components/ui/label'
import { Trash2 } from 'lucide-react'

interface GoalCycle {
  id: string
  name: string
  phase1_open: boolean
  q1_open: boolean
  q2_open: boolean
  q3_open: boolean
  q4_open: boolean
  is_active: boolean
}

export default function AdminGoalCycles() {
  const [cycles, setCycles] = useState<GoalCycle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newCycleName, setNewCycleName] = useState('')

  useEffect(() => {
    fetchCycles()
  }, [])

  const fetchCycles = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('goal_cycles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      toast.error('Failed to load goal cycles')
    } else {
      setCycles(data || [])
    }
    setIsLoading(false)
  }

  const createCycle = async () => {
    if (!newCycleName) {
      toast.error('Please enter a cycle name')
      return
    }

    const { error } = await supabase
      .from('goal_cycles')
      .insert([{ name: newCycleName, is_active: true }])

    if (error) {
      toast.error('Error creating cycle: ' + error.message)
    } else {
      toast.success('Cycle created successfully')
      setNewCycleName('')
      fetchCycles()
    }
  }

  const updateCycleToggle = async (id: string, field: keyof GoalCycle, value: boolean) => {
    // Optimistic update
    setCycles(cycles.map(c => c.id === id ? { ...c, [field]: value } : c))

    const { error } = await supabase
      .from('goal_cycles')
      .update({ [field]: value })
      .eq('id', id)

    if (error) {
      toast.error('Error updating cycle: ' + error.message)
      fetchCycles() // Revert
    } else {
      toast.success('Updated ' + field)
    }
  }

  const deleteCycle = async (id: string) => {
    const { error } = await supabase
      .from('goal_cycles')
      .delete()
      .eq('id', id)
      
    if (error) {
      toast.error('Failed to delete: ' + error.message)
    } else {
      toast.success('Deleted successfully')
      fetchCycles()
    }
  }

  if (isLoading) return <div className="p-6">Loading...</div>

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Goal Cycle Management</h2>
        <p className="text-slate-500 mt-1">Manage cycles and open/close phases for goal creation and check-ins.</p>
      </div>

      <Card className="border-orange-200 dark:border-orange-900">
        <CardHeader>
          <CardTitle>Create New Cycle</CardTitle>
          <CardDescription>Start a new OKR/KPI cycle for the organization.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="cycleName">Cycle Name (e.g. FY 2025-26)</Label>
              <Input 
                id="cycleName" 
                value={newCycleName}
                onChange={e => setNewCycleName(e.target.value)}
                placeholder="FY 2025-26" 
              />
            </div>
            <Button onClick={createCycle} className="mt-7 bg-orange-600 hover:bg-orange-700 text-white">
              Create Cycle
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6">
        {cycles.map(cycle => (
          <Card key={cycle.id} className={cycle.is_active ? 'border-orange-500 shadow-md' : 'opacity-70'}>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle>{cycle.name}</CardTitle>
                <div className="flex items-center gap-2 mt-2">
                  <Switch 
                    checked={cycle.is_active} 
                    onCheckedChange={(v) => updateCycleToggle(cycle.id, 'is_active', v)} 
                  />
                  <Label className="text-sm font-medium">Active Cycle</Label>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => deleteCycle(cycle.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                <Trash2 className="w-5 h-5" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 bg-slate-50 dark:bg-slate-900 p-4 rounded-md">
                <div className="flex flex-col items-center gap-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Phase 1 (Creation)</Label>
                  <Switch 
                    checked={cycle.phase1_open} 
                    onCheckedChange={(v) => updateCycleToggle(cycle.id, 'phase1_open', v)} 
                  />
                </div>
                <div className="flex flex-col items-center gap-2 border-l border-slate-200 dark:border-slate-800">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Q1 Check-in</Label>
                  <Switch 
                    checked={cycle.q1_open} 
                    onCheckedChange={(v) => updateCycleToggle(cycle.id, 'q1_open', v)} 
                  />
                </div>
                <div className="flex flex-col items-center gap-2 border-l border-slate-200 dark:border-slate-800">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Q2 Check-in</Label>
                  <Switch 
                    checked={cycle.q2_open} 
                    onCheckedChange={(v) => updateCycleToggle(cycle.id, 'q2_open', v)} 
                  />
                </div>
                <div className="flex flex-col items-center gap-2 border-l border-slate-200 dark:border-slate-800">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Q3 Check-in</Label>
                  <Switch 
                    checked={cycle.q3_open} 
                    onCheckedChange={(v) => updateCycleToggle(cycle.id, 'q3_open', v)} 
                  />
                </div>
                <div className="flex flex-col items-center gap-2 border-l border-slate-200 dark:border-slate-800">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Q4 Check-in</Label>
                  <Switch 
                    checked={cycle.q4_open} 
                    onCheckedChange={(v) => updateCycleToggle(cycle.id, 'q4_open', v)} 
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {cycles.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium">No cycles created</h3>
            <p className="text-slate-500">Create the first goal cycle to get started.</p>
          </div>
        )}
      </div>
    </div>
  )
}
