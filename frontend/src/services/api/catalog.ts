import client from './client'
import type { Category, Product } from '../../types'

export interface CatalogFilters {
  search?: string
  category_id?: number
  per_page?: number
  page?: number
}

export interface PaginatedProducts {
  data: Product[]
  total: number
  per_page: number
  current_page: number
  last_page: number
}

export const getProducts = (filters: CatalogFilters = {}) =>
  client.get<PaginatedProducts>('/catalog', { params: filters })

export const getProductBySku = (sku: string) =>
  client.get<Product>(`/catalog/${sku}`)

export const createProduct = (data: FormData) =>
  client.post<Product>('/admin/products', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

export const updateProduct = (id: number, data: FormData) =>
  client.post<Product>(`/admin/products/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

export const deleteProduct = (id: number) =>
  client.delete<{ message: string }>(`/admin/products/${id}`)

export const getCategories = () =>
  client.get<Category[]>('/categories')
