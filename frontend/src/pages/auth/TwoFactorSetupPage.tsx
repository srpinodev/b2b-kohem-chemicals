import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { enable2fa, getMe, logout as logoutApi, setup2fa } from '../../services/api/auth'
import { useAuthStore } from '../../store/authStore'

export default function TwoFactorSetupPage() {
  const navigate = useNavigate()
  const { user, updateUser, setTwoFaVerified, logout: clearAuth } = useAuthStore()

  async function handleCancel() {
    try { await logoutApi() } catch { /* ignore */ }
    clearAuth()
    navigate('/login')
  }

  const [secret, setSecret] = useState('')
  const [qrUrl, setQrUrl] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(true)
  const [enabling, setEnabling] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    setup2fa()
      .then(({ data }) => {
        setSecret(data.secret)
        setQrUrl(data.qr_code_url)
      })
      .catch((err: unknown) => {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        setError(msg ?? 'No se pudo iniciar la configuración de 2FA.')
      })
      .finally(() => setLoading(false))
  }, [user, navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setEnabling(true)
    try {
      await enable2fa(otp)
      // Refrescamos al usuario para reflejar two_factor_enabled=true.
      const me = await getMe()
      updateUser(me.data)
      setTwoFaVerified(true)
      navigate('/catalog')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg ?? 'Código inválido. Verifica el OTP en tu app autenticadora.')
    } finally {
      setEnabling(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg border border-dust-200 p-8">
        <div className="flex items-center gap-2 mb-6">
          <span className="w-10 h-10 rounded-md bg-gold-400 text-gunmetal-800 font-bold flex items-center justify-center">K</span>
          <span className="font-semibold text-gunmetal-800">Kohem Chemicals</span>
        </div>

        <h1 className="text-xl font-bold text-gunmetal-800 mb-1">Activa la autenticación en dos pasos</h1>
        <p className="text-sm text-gunmetal-500 mb-6">
          Por política de seguridad debes configurar 2FA antes de continuar.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-40 bg-dust-100 rounded-lg" />
            <div className="h-10 bg-dust-100 rounded-lg" />
          </div>
        ) : (
          <>
            <ol className="space-y-4 mb-6">
              <li className="text-sm text-gunmetal-700">
                <span className="font-semibold">1.</span> Abre tu app autenticadora (Google Authenticator, Authy, 1Password).
              </li>
              <li className="text-sm text-gunmetal-700">
                <span className="font-semibold">2.</span> Escanea este código QR o ingresa la clave manualmente.
              </li>
            </ol>

            {qrUrl && (
              <div className="flex justify-center mb-4">
                <div className="p-3 border border-dust-200 rounded-lg bg-white">
                  <QRCodeSVG
                    value={qrUrl}
                    size={176}
                    level="M"
                    aria-label="Código QR para 2FA"
                  />
                </div>
              </div>
            )}

            <div className="mb-6">
              <p className="text-xs uppercase tracking-wider text-pine-500 font-semibold mb-1">Clave manual</p>
              <code className="block bg-dust-100 border border-dust-300 rounded-lg px-3 py-2 text-sm font-mono text-gunmetal-800 break-all">
                {secret}
              </code>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <label className="block text-sm font-medium text-gunmetal-700">
                3. Ingresa el código de 6 dígitos que muestra tu app
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                autoFocus
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full text-center text-2xl tracking-[0.5em] font-mono bg-dust-50 border border-dust-300 rounded-lg px-3 py-3 text-gunmetal-800 focus:border-pine-400 focus:ring-2 focus:ring-pine-400/30 transition"
                data-testid="setup-otp-input"
              />
              <button
                type="submit"
                disabled={enabling || otp.length !== 6}
                className="w-full bg-gunmetal-600 hover:bg-gunmetal-700 disabled:opacity-50 text-dust-50 font-semibold py-2.5 rounded-lg transition-colors"
                data-testid="setup-otp-submit"
              >
                {enabling ? 'Activando…' : 'Activar 2FA'}
              </button>
            </form>

            <button
              type="button"
              onClick={handleCancel}
              className="w-full mt-3 text-sm text-gunmetal-500 hover:text-pine-700 transition"
            >
              Cancelar y entrar con otra cuenta
            </button>
          </>
        )}
      </div>
    </div>
  )
}
