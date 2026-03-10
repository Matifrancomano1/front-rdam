import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom' // Link kept for portal link below
import { Scale, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useAuthStore } from '@/stores'
import { authApi } from '@/api/services'
import { getErrMsg } from '@/utils'
import { Spinner } from '@/components/ui'

export default function Login() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [form, setForm] = useState({ username: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [unverified, setUnverified] = useState(false)
  const [resent, setResent] = useState(false)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.username || !form.password) { setError('Completá todos los campos'); return }
    setLoading(true); setError(null); setUnverified(false)
    try {
      const { user, tokens } = await authApi.login(form.username, form.password)
      setAuth(user, tokens.accessToken, tokens.refreshToken)
      navigate('/app/dashboard', { replace: true })
    } catch (err: unknown) {
      const code = (err as { response?: { data?: { error?: { code?: string } } } })?.response?.data?.error?.code
      if (code === 'EMAIL_NOT_VERIFIED') { setUnverified(true) }
      else setError(getErrMsg(err))
    } finally { setLoading(false) }
  }

  const handleResend = async () => {
    setLoading(true)
    try { await authApi.resendVerification(form.username); setResent(true) }
    catch { setError('No se pudo reenviar el email') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-dvh bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm animate-fade-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-brand-600 flex items-center justify-center mx-auto mb-4 shadow-card-lg">
            <Scale size={26} className="text-white"/>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Panel RDAM</h1>
          <p className="text-sm text-slate-500 mt-1">Acceso para operadores y administradores</p>
        </div>

        <div className="card shadow-card-lg">
          {unverified && !resent && (
            <div className="alert alert-warn mb-4">
              <AlertCircle size={16} className="shrink-0 mt-0.5"/>
              <div>
                <p className="font-medium text-sm">Verificá tu cuenta</p>
                <p className="text-xs mt-0.5">Revisá tu bandeja de entrada y hacé clic en el link de verificación.</p>
                <button onClick={handleResend} disabled={loading} className="text-xs font-semibold underline mt-1">
                  Reenviar email de verificación
                </button>
              </div>
            </div>
          )}
          {resent && (
            <div className="alert alert-success mb-4 text-sm">
              ✅ Email reenviado. Revisá tu bandeja de entrada.
            </div>
          )}
          {error && (
            <div className="alert alert-error mb-4 text-sm">
              <AlertCircle size={14}/>{error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="field-label">Usuario</label>
              <input className="field-input" placeholder="mfrancomano"
                value={form.username} onChange={set('username')} autoComplete="username"/>
            </div>
            <div>
              <label className="field-label">Contraseña</label>
              <div className="relative">
                <input className="field-input pr-10" placeholder="••••••••"
                  type={showPwd ? 'text' : 'password'}
                  value={form.password} onChange={set('password')} autoComplete="current-password"/>
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPwd ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full btn-lg mt-2">
              {loading ? <><Spinner size="sm"/>Ingresando…</> : 'Ingresar'}
            </button>
          </form>

          <p className="text-xs text-center text-slate-400 mt-4">
            ¿Sin acceso? Contactá al administrador del sistema.
          </p>
        </div>

        <p className="text-center mt-6 text-xs text-slate-400">
          ¿Sos ciudadano?{' '}
          <Link to="/portal" className="text-brand-600 font-medium hover:underline">Consultá tu expediente aquí</Link>
        </p>
      </div>
    </div>
  )
}
