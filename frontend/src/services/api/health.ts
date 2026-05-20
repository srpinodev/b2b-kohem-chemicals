import client from './client'
import type { HealthStatus } from '../../types'

export const getHealth = () => client.get<HealthStatus>('/health')
