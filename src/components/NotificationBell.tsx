'use client'
import { useState, useRef, useEffect, useTransition } from 'react'
import { markAllRead, markOneRead } from '@/lib/actions/notifications'

interface Notification {
  id: string
  title: string
  body: string | null
  link: string | null
  read: boolean
  created_at: string
}

interface Props {
  notifications: Notification[]
  unreadCount: number
}

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'agora'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}d`
}

export function NotificationBell({ notifications: initial, unreadCount: initialCount }: Props) {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState(initial)
  const [unread, setUnread] = useState(initialCount)
  const [, startTransition] = useTransition()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setNotifications(initial)
    setUnread(initialCount)
  }, [initial, initialCount])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  function handleMarkAll() {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnread(0)
    startTransition(() => markAllRead())
  }

  function handleOpen(n: Notification) {
    if (!n.read) {
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))
      setUnread(prev => Math.max(0, prev - 1))
      startTransition(() => markOneRead(n.id))
    }
    if (n.link) window.location.href = n.link
    setOpen(false)
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
        title="Notificações"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 text-white text-[10px] font-bold rounded-full flex items-center justify-center" style={{ backgroundColor: '#b48840' }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-80 bg-white dark:bg-[#0d1020] rounded-2xl shadow-xl border border-gray-100 dark:border-[#1e2030] z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-[#1e2030]">
            <span className="font-semibold text-sm text-gray-900 dark:text-white">Notificações</span>
            {unread > 0 && (
              <button onClick={handleMarkAll} className="text-xs font-medium transition" style={{ color: '#b48840' }}>
                Marcar todas como lidas
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-700">
            {notifications.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Nenhuma notificação.</p>
            ) : (
              notifications.map(n => (
                <button
                  key={n.id}
                  onClick={() => handleOpen(n)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition ${!n.read ? 'bg-yellow-50/50 dark:bg-yellow-900/10' : ''}`}
                >
                  <div className="flex items-start gap-2">
                    {!n.read && (
                      <span className="mt-1.5 w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: '#b48840' }} />
                    )}
                    <div className={!n.read ? '' : 'pl-4'}>
                      <p className={`text-sm font-medium ${n.read ? 'text-gray-600 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>{n.title}</p>
                      {n.body && <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{n.body}</p>}
                      <p className="text-xs text-gray-300 dark:text-gray-500 mt-1">{timeAgo(n.created_at)}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
