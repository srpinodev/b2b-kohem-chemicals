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
