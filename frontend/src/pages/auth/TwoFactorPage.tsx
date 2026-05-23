import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { logout as logoutApi, verify2fa } from '../../services/api/auth'
import { useAuthStore } from '../../store/authStore'

const LEN = 6

export default function TwoFactorPage() {
  const navigate = useNavigate()
  const { user, setTwoFaVerified, logout: clearAuth } = useAuthStore()

  async function handleCancel() {
    try { await logoutApi() } catch { /* ignore */ }
    clearAuth()
    navigate('/login')
  }

  const [digits, setDigits] = useState<string[]>(() => Array(LEN).fill(''))
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const inputsRef = useRef<Array<HTMLInputElement | null>>([])

  useEffect(() => {
    if (!user) navigate('/login')
  }, [user, navigate])

  if (!user) return null

  const otp = digits.join('')

  function setDigit(idx: number, value: string) {
    const clean = value.replace(/\D/g, '').slice(0, 1)
    setDigits((prev) => {
      const next = [...prev]
      next[idx] = clean
      return next
    })
    if (clean && idx < LEN - 1) {
      inputsRef.current[idx + 1]?.focus()
    }
  }

  function onPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, LEN)
    if (!pasted) return
    e.preventDefault()
    const next = Array(LEN).fill('') as string[]
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i]
    setDigits(next)
    inputsRef.current[Math.min(pasted.length, LEN - 1)]?.focus()
  }

  function onKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus()
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (otp.length !== LEN) return
    setError('')
    setLoading(true)
    try {
      await verify2fa(otp)
      setTwoFaVerified(true)
      navigate('/catalog')
    } catch {
      setError('Código OTP inválido. Intenta de nuevo.')
      setDigits(Array(LEN).fill(''))
      inputsRef.current[0]?.focus()
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
          Ingresa el código de 6 dígitos de tu app autenticadora.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex justify-between gap-2" onPaste={onPaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => { inputsRef.current[i] = el }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]"
                maxLength={1}
                required
                value={d}
                onChange={(e) => setDigit(i, e.target.value)}
                onKeyDown={(e) => onKeyDown(i, e)}
                autoFocus={i === 0}
                className="w-11 h-12 text-center text-xl font-mono bg-dust-50 border border-dust-300 rounded-lg text-gunmetal-800 focus:border-pine-400 focus:ring-2 focus:ring-pine-400/30 transition"
                data-testid={`otp-digit-${i}`}
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading || otp.length !== LEN}
            className="w-full bg-gunmetal-600 hover:bg-gunmetal-700 disabled:opacity-50 disabled:cursor-not-allowed text-dust-50 font-semibold py-2.5 rounded-lg transition-colors"
          >
            {loading ? 'Verificando…' : 'Verificar'}
          </button>
        </form>

        <button
          type="button"
          onClick={handleCancel}
          className="w-full mt-3 text-sm text-gunmetal-500 hover:text-pine-700 transition"
        >
          Cancelar y entrar con otra cuenta
        </button>

        <p className="text-xs text-gunmetal-400 mt-4 text-center">
          ¿Perdiste tu dispositivo? Contacta a un administrador para resetear tu 2FA.
        </p>
      </div>
    </div>
  )
}
