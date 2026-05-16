import { useState, useEffect, useCallback } from 'react'
import { db as supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export interface Notification {
  id: string
  message: string
  link: string | null
  is_read: boolean
  created_at: string
}

export function useNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchNotifications = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('notifications')
      .select('id, message, link, is_read, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    if (data) {
      const typed = data as unknown as Notification[]
      setNotifications(typed)
      setUnreadCount(typed.filter(n => !n.is_read).length)
    }
  }, [user])

  const markAllRead = async () => {
    if (!user) return
    await supabase
      .from('notifications')
      .update({ is_read: true } as never)
      .eq('user_id', user.id)
      .eq('is_read', false)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

  useEffect(() => {
    fetchNotifications()

    if (!user) return
    const channel = supabase
      .channel('notifications-realtime')
      .on('postgres_changes' as never, {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, () => {
        fetchNotifications()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user, fetchNotifications])

  return { notifications, unreadCount, markAllRead, refetch: fetchNotifications }
}


