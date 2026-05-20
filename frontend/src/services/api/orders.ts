import client from './client'

export interface OrderItem {
  id: number
  product_id: number
  product_sku: string
  product_name: string
  unit_price: string
  quantity: number
  subtotal: string
}

export interface StateLog {
  id: number
  from_status: string | null
  to_status: string
  comment: string | null
  transitioned_at: string
  user?: { id: number; name: string }
}

export interface Order {
  id: number
  order_number: string
  type: string
  status: string
  pricing_strategy: string
  subtotal: string
  tax_amount: string
  total: string
  notes: string | null
  created_at: string
  items: OrderItem[]
  state_logs?: StateLog[]
}

export interface CreateOrderPayload {
  items: { product_id: number; quantity: number }[]
  notes?: string
}

export interface PaginatedOrders {
  data: Order[]
  total: number
  current_page: number
  last_page: number
}

export const getOrders = (params?: Record<string, unknown>) =>
  client.get<PaginatedOrders>('/orders', { params })

export const getOrder = (id: number) =>
  client.get<Order>(`/orders/${id}`)

export const createOrder = (data: CreateOrderPayload) =>
  client.post<Order>('/orders', data)

export const updateOrderStatus = (id: number, status: string, comment?: string) =>
  client.patch<Order>(`/orders/${id}/status`, { status, comment })
