import client from './client'
import type { User } from '../../types'

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
  password_confirmation: string
  company_id?: number
}

export interface AuthResponse {
  user: User
  token: string
  requires_2fa: boolean
}

export interface RegisterResponse {
  message: string
  user: User
  token: string
}

export const login = (data: LoginPayload) =>
  client.post<AuthResponse>('/auth/login', data)

export const register = (data: RegisterPayload) =>
  client.post<RegisterResponse>('/auth/register', data)

export const verify2fa = (otp: string) =>
  client.post<{ message: string; verified: boolean }>('/auth/2fa/verify', { otp })

export const setup2fa = () =>
  client.post<{ secret: string; qr_code_url: string }>('/auth/2fa/setup')

export const enable2fa = (otp: string) =>
  client.post<{ message: string }>('/auth/2fa/enable', { otp })

export const logout = () =>
  client.post<{ message: string }>('/auth/logout')

export const getMe = () =>
  client.get<User>('/me')
