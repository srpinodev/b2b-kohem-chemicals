import client from './client'

export interface AppNotification {
  id: string
  type: string
  data: {
    message: string
    order_id?: number
    order_number?: string
    invoice_id?: number
    invoice_number?: string
    from_status?: string
    to_status?: string
  }
  read_at: string | null
  created_at: string
}

export interface PaginatedNotifications {
  data: AppNotification[]
  total: number
  current_page: number
  last_page: number
}

export const getNotifications = () =>
  client.get<PaginatedNotifications>('/notifications')

export const markRead = (id: string) =>
  client.patch(`/notifications/${id}/read`)

export const markAllRead = () =>
  client.post('/notifications/read-all')

export const sendChatMessage = (message: string, sessionId?: string) =>
  client.post<{ reply: string; session_id: string }>('/chatbot/message', {
    message,
    session_id: sessionId,
  })
