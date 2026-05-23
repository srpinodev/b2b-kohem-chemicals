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
    <div className="min-h-screen flex items-center justify-center bg-surface p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg border border-dust-200 p-8">
        <div className="flex items-center gap-2 mb-6">
          <span className="w-10 h-10 rounded-md bg-gold-400 text-gunmetal-800 font-bold flex items-center justify-center">K</span>
          <span className="font-semibold text-gunmetal-800">Kohem Chemicals</span>
        </div>

        <h1 className="text-xl font-bold text-gunmetal-800 mb-1">Verificación 2FA</h1>
        <p className="text-sm text-gunmetal-400 mb-6">
          Ingresa el código de 6 dígitos de tu aplicación autenticadora.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            autoFocus
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            className="w-full text-center text-2xl tracking-[0.5em] font-mono bg-dust-50 border border-dust-300 rounded-lg px-3 py-3 text-gunmetal-800 focus:border-pine-400 focus:ring-2 focus:ring-pine-400/30 transition"
            placeholder="000000"
          />

          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="w-full bg-gunmetal-600 hover:bg-gunmetal-700 disabled:opacity-50 disabled:cursor-not-allowed text-dust-50 font-semibold py-2.5 rounded-lg transition-colors"
          >
            {loading ? 'Verificando...' : 'Verificar'}
          </button>
        </form>
      </div>
    </div>
  )
}
