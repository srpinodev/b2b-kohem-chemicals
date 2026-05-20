import { useEffect, useState } from 'react'
import { getHealth } from './services/api/health'
import type { HealthStatus } from './types'

function StatusBadge({ label, value }: { label: string; value: string }) {
  const ok = value === 'ok'
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
      <span
        className={`w-3 h-3 rounded-full flex-shrink-0 ${ok ? 'bg-green-500' : 'bg-red-500'}`}
      />
      <span className="text-sm font-medium text-gray-700 w-20">{label}</span>
      <span className={`text-sm ${ok ? 'text-green-700' : 'text-red-700'}`}>{value}</span>
    </div>
  )
}

export default function App() {
  const [status, setStatus] = useState<HealthStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getHealth()
      .then((res) => setStatus(res.data))
      .catch(() => setError('No se pudo conectar con la API. ¿Está corriendo php artisan serve?'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Kohem Chemicals</h1>
          <p className="text-gray-500 text-sm mt-1">Sistema B2B — Sprint 0</p>
        </div>

        {loading && (
          <div className="text-center text-gray-400 py-6">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-sm">Verificando servicios…</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {status && (
          <div className="space-y-2">
            <StatusBadge label="App" value={status.status} />
            <StatusBadge label="Base de datos" value={status.database} />
            <StatusBadge label="Redis" value={status.redis} />
            <p className="text-xs text-gray-400 text-center mt-4">
              {status.app} · entorno {status.env}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
