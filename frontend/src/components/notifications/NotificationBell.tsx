import { useEffect, useRef, useState } from 'react'
import {
  type AppNotification,
  getNotifications,
  markAllRead,
  markRead,
} from '../../services/api/notifications'

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const unread = notifications.filter((n) => !n.read_at).length

  const load = () => {
    setLoading(true)
    getNotifications()
      .then((r) => setNotifications(r.data.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 30_000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleMarkRead = async (id: string) => {
    await markRead(id)
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)),
    )
  }

  const handleMarkAll = async () => {
    await markAllRead()
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })),
    )
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-full hover:bg-gunmetal-700 transition"
        aria-label="Notificaciones"
      >
        <svg className="w-5 h-5 text-dust-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-gold-400 text-gunmetal-800 text-[10px] rounded-full flex items-center justify-center font-bold">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-dust-200 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-dust-200 bg-dust-50">
            <span className="font-semibold text-gunmetal-800 text-sm">Notificaciones</span>
            {unread > 0 && (
              <button
                onClick={handleMarkAll}
                className="text-xs text-pine-500 hover:text-pine-700 hover:underline font-medium"
              >
                Marcar todas leídas
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-gunmetal-400">Cargando...</div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-gunmetal-400">Sin notificaciones</div>
            ) : (
              notifications.map((n) => (
                <button
                  type="button"
                  key={n.id}
                  className={[
                    'w-full text-left px-4 py-3 border-b border-dust-200 last:border-0 hover:bg-dust-50 transition',
                    !n.read_at ? 'bg-gold-50/60' : '',
                  ].join(' ')}
                  onClick={() => !n.read_at && handleMarkRead(n.id)}
                >
                  <div className="flex gap-2.5">
                    {!n.read_at && (
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gold-400 flex-shrink-0" />
                    )}
                    <div className={!n.read_at ? '' : 'pl-4'}>
                      <p className="text-sm text-gunmetal-800 leading-snug">{n.data.message}</p>
                      <p className="text-[11px] text-gunmetal-400 mt-1">
                        {new Date(n.created_at).toLocaleString('es-CO')}
                      </p>
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
