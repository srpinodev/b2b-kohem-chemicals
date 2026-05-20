import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { verify2fa } from '../../services/api/auth'
import { useAuthStore } from '../../store/authStore'

export default function TwoFactorPage() {
  const navigate = useNavigate()
  const { user, setTwoFaVerified } = useAuthStore()

  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!user) {
    navigate('/login')
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await verify2fa(otp)
      setTwoFaVerified(true)

      navigate('/catalog')
    } catch {
      setError('Código OTP inválido. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Verificación 2FA</h1>
        <p className="text-sm text-gray-500 mb-6">
          Ingresa el código de tu aplicación autenticadora.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            className="w-full text-center text-2xl tracking-widest border border-gray-300 rounded-lg px-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="000000"
          />

          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2 rounded-lg transition-colors"
          >
            {loading ? 'Verificando...' : 'Verificar'}
          </button>
        </form>
      </div>
    </div>
  )
}
