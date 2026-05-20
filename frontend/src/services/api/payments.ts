import type { Invoice, Transaction } from '../../types'
import client from './client'

export interface PaginatedInvoices {
  data: Invoice[]
  total: number
  current_page: number
  last_page: number
}

export interface CheckoutResponse {
  transaction: Transaction
  checkout_url: string
}

export const getInvoices = (params?: Record<string, unknown>) =>
  client.get<PaginatedInvoices>('/invoices', { params })

export const getInvoice = (id: number) =>
  client.get<Invoice>(`/invoices/${id}`)

export const downloadInvoicePdf = async (id: number, invoiceNumber: string) => {
  const response = await client.get(`/invoices/${id}/pdf`, { responseType: 'blob' })
  const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `${invoiceNumber}.pdf`
  a.click()
  URL.revokeObjectURL(url)
}

export const initiateCheckout = (orderId: number, successUrl: string, cancelUrl: string) =>
  client.post<CheckoutResponse>(`/orders/${orderId}/checkout`, {
    success_url: successUrl,
    cancel_url: cancelUrl,
  })
