import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { toast } from 'sonner'

export default function AdminSharedGoals() {
  const [employees, setEmployees] = useState<{ id: string, full_name: string }[]>([])
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [thrustArea, setThrustArea] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [uomType, setUomType] = useState('numeric_min')
  const [targetValue, setTargetValue] = useState('')
  const [targetDate, setTargetDate] = useState('')

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'employee')

    if (!error && data) {
      setEmployees(data)
    }
    setIsLoading(false)
  }

  const toggleEmployeeSelection = (id: string) => {
    if (selectedEmployees.includes(id)) {
      setSelectedEmployees(selectedEmployees.filter(eId => eId !== id))
    } else {
      setSelectedEmployees([...selectedEmployees, id])
    }
  }

  const pushSharedGoal = async () => {
    if (selectedEmployees.length === 0) {
      toast.error('Select at least one employee')
      return
    }
    if (!title || !thrustArea) {
      toast.error('Title and Thrust Area are required')
      return
    }

    const { data: cycleData } = await supabase.from('goal_cycles').select('id').eq('is_active', true).single()
    const cycleId = cycleData?.id

    const goalsToInsert = selectedEmployees.map(empId => ({
      employee_id: empId,
      cycle_id: cycleId,
      thrust_area: thrustArea,
      title: title,
      description: description,
      uom_type: uomType,
      target_value: targetValue ? parseFloat(targetValue) : null,
      target_date: targetDate || null,
      weightage: 10, // Default weightage
      status: 'draft',
      is_shared: true,
    }))

    const { error } = await supabase.from('goals').insert(goalsToInsert)

    if (error) {
      toast.error('Failed to push shared goals: ' + error.message)
    } else {
      toast.success(`Successfully pushed goal to ${selectedEmployees.length} employees`)
      setTitle('')
      setDescription('')
      setTargetValue('')
      setSelectedEmployees([])
    }
  }

  if (isLoading) return <div className="p-6">Loading...</div>

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Push Shared Goals</h2>
        <p className="text-slate-500 mt-1">Distribute top-down KPIs to multiple employees.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-orange-200 dark:border-orange-900">
          <CardHeader>
            <CardTitle>Goal Details</CardTitle>
            <CardDescription>Define the shared KPI parameters.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Mandatory Compliance Training" />
            </div>
            
            <div className="space-y-2">
              <Label>Thrust Area</Label>
              <Select value={thrustArea} onValueChange={setThrustArea}>
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
              <Select value={uomType} onValueChange={setUomType}>
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

            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={description} onChange={e => setDescription(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>{uomType === 'timeline' ? 'Target Date' : 'Target Value'}</Label>
              <Input 
                type={uomType === 'timeline' ? 'date' : 'number'}
                value={uomType === 'timeline' ? targetDate : targetValue}
                onChange={e => uomType === 'timeline' ? setTargetDate(e.target.value) : setTargetValue(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Select Recipients</CardTitle>
            <CardDescription>Choose employees to receive this goal.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between mb-4">
              <span className="text-sm font-medium">{selectedEmployees.length} selected</span>
              <Button variant="link" className="p-0 h-auto text-sm" onClick={() => setSelectedEmployees(employees.map(e => e.id))}>Select All</Button>
            </div>
            
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              {employees.map(emp => (
                <div 
                  key={emp.id} 
                  className={`flex items-center p-3 rounded-md border cursor-pointer transition-colors ${selectedEmployees.includes(emp.id) ? 'bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800' : 'hover:bg-slate-50 dark:hover:bg-slate-900 border-transparent'}`}
                  onClick={() => toggleEmployeeSelection(emp.id)}
                >
                  <div className={`w-4 h-4 rounded border mr-3 flex items-center justify-center ${selectedEmployees.includes(emp.id) ? 'bg-orange-500 border-orange-500 text-white' : 'border-slate-300'}`}>
                    {selectedEmployees.includes(emp.id) && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-3 h-3"><path d="M20 6L9 17l-5-5"/></svg>}
                  </div>
                  <span className="font-medium text-sm">{emp.full_name}</span>
                </div>
              ))}
            </div>

            <Button className="w-full mt-6 bg-orange-600 hover:bg-orange-700 text-white" onClick={pushSharedGoal}>
              Push Shared Goal
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
