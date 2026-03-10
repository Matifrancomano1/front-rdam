import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Scale, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react'
import { authApi } from '@/api/services'
import { getErrMsg } from '@/utils'
import { Spinner } from '@/components/ui'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ nombre: '', username: '', email: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  const pwdRules = [
    { ok: form.password.length >= 8,       label: 'Mínimo 8 caracteres' },
    { ok: /[A-Z]/.test(form.password),     label: 'Una mayúscula' },
    { ok: /[0-9]/.test(form.password),     label: 'Un número' },
    { ok: /[!@#$%^&*]/.test(form.password),label: 'Un símbolo (!@#$%^&*)' },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pwdRules.some(r => !r.ok)) { setError('La contraseña no cumple los requisitos'); return }
    setLoading(true); setError(null)
    try {
      await authApi.register(form)
      setDone(true)
    } catch (err: unknown) {
      const code = (err as { response?: { data?: { error?: { code?: string } } } })?.response?.data?.error?.code
      if (code === 'USERNAME_TAKEN') setError('El nombre de usuario ya está en uso')
      else if (code === 'EMAIL_TAKEN') setError('El email ya está registrado')
      else setError(getErrMsg(err))
    } finally { setLoading(false) }
  }

  if (done) {
    return (
      <div className="min-h-dvh bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center animate-fade-up">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-emerald-600"/>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">¡Cuenta creada!</h2>
          <p className="text-sm text-slate-500 mb-6">
            Te enviamos un email de verificación a <strong>{form.email}</strong>.<br/>
            Hacé clic en el link para activar tu cuenta.
          </p>
          <button onClick={() => navigate('/login')} className="btn-primary w-full">
            Ir al login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm animate-fade-up">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-brand-600 flex items-center justify-center mx-auto mb-4">
            <Scale size={26} className="text-white"/>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Crear cuenta</h1>
          <p className="text-sm text-slate-500 mt-1">Panel RDAM · Solo uso interno</p>
        </div>

        <div className="card shadow-card-lg">
          {error && <div className="alert alert-error mb-4 text-sm"><AlertCircle size={14}/>{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="field-label">Nombre completo</label>
              <input className="field-input" placeholder="Juan López" value={form.nombre} onChange={set('nombre')} required/>
            </div>
            <div>
              <label className="field-label">Usuario</label>
              <input className="field-input" placeholder="jlopez" value={form.username} onChange={set('username')} required/>
            </div>
            <div>
              <label className="field-label">Email institucional</label>
              <input className="field-input" type="email" placeholder="jlopez@rdam.gob.ar"
                value={form.email} onChange={set('email')} required/>
            </div>
            <div>
              <label className="field-label">Contraseña</label>
              <div className="relative">
                <input className="field-input pr-10" placeholder="••••••••"
                  type={showPwd ? 'text' : 'password'}
                  value={form.password} onChange={set('password')} required/>
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  {showPwd ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
              {form.password && (
                <div className="mt-2 space-y-1">
                  {pwdRules.map(r => (
                    <div key={r.label} className={`flex items-center gap-1.5 text-xs ${r.ok ? 'text-emerald-600' : 'text-slate-400'}`}>
                      <CheckCircle2 size={11} className={r.ok ? 'text-emerald-500' : 'text-slate-300'}/>
                      {r.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full btn-lg mt-1">
              {loading ? <><Spinner size="sm"/>Creando cuenta…</> : 'Crear cuenta'}
            </button>
          </form>

          <p className="text-xs text-center text-slate-500 mt-4">
            ¿Ya tenés cuenta?{' '}
            <Link to="/login" className="text-brand-600 font-semibold hover:underline">Iniciar sesión</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
