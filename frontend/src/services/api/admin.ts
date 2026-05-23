import client from './client'
import type { Product, User } from '../../types'

export interface PaginatedProducts {
  data: Product[]
  total: number
  per_page: number
  current_page: number
  last_page: number
}

export interface PaginatedUsers {
  data: User[]
  total: number
  per_page: number
  current_page: number
  last_page: number
}

export interface AdminProductFilters {
  search?: string
  category_id?: number
  page?: number
  per_page?: number
}

export interface AdminUserFilters {
  search?: string
  role?: 'cliente' | 'vendedor' | 'administrador'
  page?: number
  per_page?: number
}

// ---- Products ----

export const listAdminProducts = (filters: AdminProductFilters = {}) =>
  client.get<PaginatedProducts>('/admin/products', { params: filters })

export const createAdminProduct = (data: FormData) =>
  client.post<Product>('/admin/products', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

export const updateAdminProduct = (id: number, data: FormData) =>
  client.post<Product>(`/admin/products/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

export const deleteAdminProduct = (id: number) =>
  client.delete<{ message: string }>(`/admin/products/${id}`)

// ---- Users ----

export interface CreateUserPayload {
  name: string
  email: string
  password: string
  role: 'cliente' | 'vendedor'
  company_id?: number | null
}

export interface ResetPasswordResponse {
  message: string
  temporary_password: string
}

export const listAdminUsers = (filters: AdminUserFilters = {}) =>
  client.get<PaginatedUsers>('/admin/users', { params: filters })

export const createAdminUser = (data: CreateUserPayload) =>
  client.post<User>('/admin/users', data)

export const deactivateAdminUser = (id: number) =>
  client.delete<{ message: string; user: User }>(`/admin/users/${id}`)

export const resetUserPassword = (id: number) =>
  client.post<ResetPasswordResponse>(`/admin/users/${id}/reset-password`)

export const resetUser2fa = (id: number) =>
  client.post<{ message: string; user: User }>(`/admin/users/${id}/reset-2fa`)
