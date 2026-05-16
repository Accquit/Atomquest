import { useState, useEffect } from 'react'
import { db as supabase } from '../../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Switch } from '../../components/ui/switch'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'

export default function AdminEscalations() {
  const [rules, setRules] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [triggerType, setTriggerType] = useState('goal_not_submitted')
  const [thresholdDays, setThresholdDays] = useState('7')

  useEffect(() => {
    fetchRules()
  }, [])

  const fetchRules = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('escalation_rules')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      toast.error('Failed to load escalation rules')
    } else {
      setRules(data || [])
    }
    setIsLoading(false)
  }

  const addRule = async () => {
    const days = parseInt(thresholdDays)
    if (isNaN(days) || days <= 0) {
      toast.error('Please enter a valid number of days')
      return
    }

    const { error } = await supabase
      .from('escalation_rules')
      .insert([{ trigger_type: triggerType, threshold_days: days, active: true }])

    if (error) {
      toast.error('Error adding rule: ' + error.message)
    } else {
      toast.success('Escalation rule added')
      fetchRules()
    }
  }

  const toggleRule = async (id: string, active: boolean) => {
    setRules(rules.map(r => r.id === id ? { ...r, active } : r))
    const { error } = await supabase.from('escalation_rules').update({ active }).eq('id', id)
    if (error) {
      toast.error('Error updating rule')
      fetchRules()
    }
  }

  const deleteRule = async (id: string) => {
    const { error } = await supabase.from('escalation_rules').delete().eq('id', id)
    if (error) {
      toast.error('Error deleting rule')
    } else {
      toast.success('Rule deleted')
      fetchRules()
    }
  }

  if (isLoading) return <div className="p-6">Loading...</div>

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Escalation Rules</h2>
        <p className="text-slate-500 mt-1">Configure automated alerts for overdue actions.</p>
      </div>

      <Card className="border-red-200 dark:border-red-900">
        <CardHeader>
          <CardTitle>Create New Rule</CardTitle>
          <CardDescription>Define when the system should escalate an issue to a manager or admin.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="space-y-2 flex-1">
              <Label>Trigger Event</Label>
              <Select value={triggerType} onValueChange={setTriggerType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Trigger" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="goal_not_submitted">Goals not submitted after phase opens</SelectItem>
                  <SelectItem value="manager_not_approved">Manager hasn't approved submitted goals</SelectItem>
                  <SelectItem value="checkin_not_done">Check-in not completed within active window</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2 w-32">
              <Label>Days Threshold</Label>
              <Input 
                type="number" 
                min="1" 
                value={thresholdDays} 
                onChange={e => setThresholdDays(e.target.value)} 
              />
            </div>

            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={addRule}>
              Add Rule
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        <h3 className="text-lg font-medium mt-4">Active Rules</h3>
        {rules.map(rule => (
          <Card key={rule.id} className={!rule.active ? 'opacity-60' : ''}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <Switch checked={rule.active} onCheckedChange={(v) => toggleRule(rule.id, v)} />
                <div>
                  <p className="font-medium">
                    If <span className="text-red-600 dark:text-red-400 font-bold">{rule.trigger_type.replace(/_/g, ' ')}</span> for more than <span className="font-bold">{rule.threshold_days} days</span>
                  </p>
                  <p className="text-sm text-slate-500">Escalate to Manager/Admin via Notification</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => deleteRule(rule.id)} className="text-red-500 hover:bg-red-50">
                <Trash2 className="w-5 h-5" />
              </Button>
            </CardContent>
          </Card>
        ))}

        {rules.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            No escalation rules configured yet.
          </div>
        )}
      </div>
    </div>
  )
}


