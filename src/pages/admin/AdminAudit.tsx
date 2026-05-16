import { useState, useEffect } from 'react'
import { db as supabase } from '../../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { Badge } from '../../components/ui/badge'
import { format } from 'date-fns'

export default function AdminAudit() {
  const [logs, setLogs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchAuditLogs()
  }, [])

  const fetchAuditLogs = async () => {
    setIsLoading(true)
    
    // In a real app, the audit_log table would be populated via Postgres triggers.
    // We will query it here. We'll also join with profiles to get the user name.
    const { data: logsData } = await supabase
      .from('audit_log')
      .select('*, profiles(full_name), goals(title)')
      .order('changed_at', { ascending: false })
      .limit(100)

    if (logsData) {
      setLogs(logsData)
    }
    
    setIsLoading(false)
  }

  if (isLoading) return <div className="p-6">Loading audit logs...</div>

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Audit Trail</h2>
        <p className="text-slate-500 mt-1">System-wide log of critical goal changes and status updates.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Showing the last 100 system events.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target Goal</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap">
                    {format(new Date(log.changed_at), 'MMM dd, yyyy HH:mm')}
                  </TableCell>
                  <TableCell className="font-medium">
                    {log.profiles?.full_name || 'System / Unknown'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {log.change_type.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate" title={log.goals?.title}>
                    {log.goals?.title || 'N/A'}
                  </TableCell>
                  <TableCell className="text-sm text-slate-500 max-w-[300px] truncate">
                    {log.new_value ? JSON.stringify(log.new_value) : 'No details'}
                  </TableCell>
                </TableRow>
              ))}
              {logs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                    No audit logs found. Setup Postgres triggers on the goals table to populate this.
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


