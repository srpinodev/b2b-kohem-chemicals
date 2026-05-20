export interface HealthStatus {
  status: 'ok' | 'degraded'
  app: string
  env: string
  database: string
  redis: string
}

export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface ApiError {
  message: string
  errors?: Record<string, string[]>
}

export type RoleName = 'cliente' | 'vendedor' | 'administrador'

export interface Role {
  id: number
  name: RoleName
  guard_name: string
}

export interface Company {
  id: number
  name: string
  nit: string
  address: string | null
  city: string | null
  phone: string | null
  contact_name: string | null
  is_distributor: boolean
  is_active: boolean
}

export interface User {
  id: number
  company_id: number | null
  name: string
  email: string
  two_factor_enabled: boolean
  is_active: boolean
  roles: Role[]
  company: Company | null
}

export interface Category {
  id: number
  name: string
  slug: string
  description: string | null
  is_active: boolean
}

export interface Product {
  id: number
  category_id: number | null
  sku: string
  name: string
  cas_number: string | null
  description: string | null
  unit: string
  price: string
  stock: number
  sds_url: string | null
  requires_special_handling: boolean
  is_active: boolean
  category: Category | null
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  twoFaVerified: boolean
}
