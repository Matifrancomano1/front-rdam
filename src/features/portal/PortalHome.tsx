import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, FileSearch, CreditCard, Award, AlertCircle, ChevronRight } from 'lucide-react'
import { expedientesApi } from '@/api/services'
import { getErrMsg } from '@/utils'
import { Spinner } from '@/components/ui'

const STEPS = [
  { icon: FileSearch, title: 'Consultá tu situación',   desc: 'Ingresá tu DNI y email para ver el estado de tu expediente.' },
  { icon: CreditCard, title: 'Realizá el pago',         desc: 'Si tu expediente está aprobado, podés pagar de forma segura.' },
  { icon: Award,      title: 'Descargá tu certificado', desc: 'Una vez procesado el pago y validado, tu certificado estará disponible.' },
]

export default function PortalHome() {
  const navigate = useNavigate()
  const [step, setStep] = useState<1 | 2>(1)
  const [dni,   setDni]   = useState('')
  const [email, setEmail] = useState('')
  const [codigo, setCodigo] = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const handleSolicitarCodigo = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const cleanDni = dni.replace(/\D/g, '')

    // Validaciones cliente
    if (cleanDni.length < 7 || cleanDni.length > 12) {
      setError('Ingresá un DNI válido (7 a 12 dígitos)')
      return
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Ingresá un email válido')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await expedientesApi.solicitarCodigo(cleanDni, email.trim())
      setStep(2)
      setCodigo('')
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 404 || status === 400) {
        setError('No encontramos un expediente activo con ese DNI y email. Verificá que sean los datos registrados en tu causa.')
      } else {
        setError(getErrMsg(err))
      }
    } finally {
      setLoading(false)
    }
  }

  const handleBuscar = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanDni = dni.replace(/\D/g, '')

    if (!codigo.trim() || codigo.trim().length !== 6) {
      setError('Ingresá el código de 6 dígitos que enviamos a tu email')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // ⚠️ El backend REQUIERE dni + email + codigo obligatoriamente
      const exp = await expedientesApi.buscarPublico(cleanDni, email.trim(), codigo.trim())

      if (!exp?.id) {
        setError('Respuesta inesperada del servidor. Intentá de nuevo.')
        return
      }

      sessionStorage.setItem('portal_exp',   JSON.stringify(exp))
      sessionStorage.setItem('portal_email', email.trim())
      navigate('/portal/resultado')
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 403) {
        setError('El código ingresado es incorrecto o ha expirado. Solicitá uno nuevo.')
      } else if (status === 404 || status === 400) {
        setError('No encontramos un expediente activo con ese DNI y email.')
      } else {
        setError(getErrMsg(err))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 sm:py-20 animate-fade-up">
      {/* Heading */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-brand-50 border border-brand-100 text-brand-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
          Portal Ciudadano · Santa Fe
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 text-balance mb-3">
          Consultá tu expediente alimentario
        </h1>
        <p className="text-slate-500 text-base max-w-md mx-auto">
          Ingresá tu DNI y email para ver el estado de tu causa, realizar el pago o descargar tu certificado.
        </p>
      </div>

      {/* Search box */}
      <div className="card shadow-card-lg mb-8">
        {step === 1 ? (
          <form onSubmit={handleSolicitarCodigo} className="space-y-4">
            {/* DNI */}
            <div>
              <label className="field-label text-base font-semibold text-slate-800">
                Número de DNI
              </label>
              <input
                className="field-input text-base py-3 font-mono"
                placeholder="Ej: 28345678"
                value={dni}
                onChange={e => { setDni(e.target.value.replace(/\D/g, '')); setError(null) }}
                maxLength={12}
                inputMode="numeric"
                autoFocus
              />
            </div>

            {/* Email */}
            <div>
              <label className="field-label text-base font-semibold text-slate-800">
                Email registrado en el expediente
              </label>
              <input
                className="field-input text-base py-3"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(null) }}
                autoComplete="email"
              />
              <p className="field-hint mt-1">
                💡 Es el email que fue cargado cuando se inició tu causa.
              </p>
            </div>

            {error && (
              <div className="alert alert-error text-sm">
                <AlertCircle size={14} className="shrink-0"/>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base justify-center"
            >
              {loading
                ? <><Spinner size="sm"/>Enviando código…</>
                : <>Solicitar Código</>
              }
            </button>

            <p className="text-xs text-slate-400 flex items-center gap-1.5 justify-center mt-2">
              🔒 Tus datos son usados únicamente para identificar tu expediente.
            </p>
          </form>
        ) : (
          <form onSubmit={handleBuscar} className="space-y-4">
            <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 mb-4 text-center">
              <p className="text-sm text-brand-700 font-medium">
                Hemos enviado un código de 6 dígitos a su correo electrónico. Por favor, ingréselo a continuación. El código es de un solo uso y expirará en 15 minutos.
              </p>
            </div>
            
            {/* DNI e Email readonly para contexto */}
            <div className="flex gap-3 mb-2 opacity-70">
              <div className="flex-1">
                <label className="text-xs font-semibold text-slate-500">DNI</label>
                <input className="field-input py-2 text-sm bg-slate-50 cursor-not-allowed" value={dni} readOnly />
              </div>
              <div className="flex-1">
                <label className="text-xs font-semibold text-slate-500">Email</label>
                <input className="field-input py-2 text-sm bg-slate-50 cursor-not-allowed" value={email} readOnly />
              </div>
            </div>

            <div>
              <label className="field-label text-base font-semibold text-slate-800">
                Código de 6 dígitos
              </label>
              <input
                className="field-input text-lg py-3 font-mono text-center tracking-[0.2em]"
                placeholder="------"
                value={codigo}
                onChange={e => { setCodigo(e.target.value.replace(/\D/g, '')); setError(null) }}
                maxLength={6}
                inputMode="numeric"
                autoFocus
              />
            </div>

            {error && (
              <div className="alert alert-error text-sm">
                <AlertCircle size={14} className="shrink-0"/>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base justify-center mt-4"
            >
              {loading
                ? <><Spinner size="sm"/>Buscando…</>
                : <><Search size={18}/>Buscar Expediente</>
              }
            </button>
            
            <div className="text-center mt-4">
              <button 
                type="button" 
                onClick={(e) => {
                  e.preventDefault();
                  handleSolicitarCodigo();
                }}
                disabled={loading}
                className="text-sm text-brand-600 hover:text-brand-800 font-medium hover:underline disabled:opacity-50"
              >
                ¿No recibiste el código? Volver a enviar
              </button>
            </div>
            
            <div className="text-center mt-2">
              <button 
                type="button" 
                onClick={() => {
                  setStep(1);
                  setCodigo('');
                  setError(null);
                }}
                disabled={loading}
                className="text-xs text-slate-500 hover:text-slate-700 underline disabled:opacity-50"
              >
                Cambiar DNI o Email
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Steps guide */}
      <div className="space-y-3">
        {STEPS.map(({ icon: Icon, title, desc }, i) => (
          <div key={title} className="flex items-start gap-4 p-4 bg-white rounded-xl border border-slate-200">
            <div className="w-9 h-9 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0">
              <Icon size={17} className="text-brand-600"/>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">PASO {i + 1}</span>
              </div>
              <p className="text-sm font-semibold text-slate-800">{title}</p>
              <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
            </div>
            <ChevronRight size={14} className="text-slate-300 mt-1 shrink-0"/>
          </div>
        ))}
      </div>

      {/* Validar cert link */}
      <div className="mt-8 text-center">
        <p className="text-xs text-slate-400">
          ¿Tenés un certificado para verificar?{' '}
          <a href="/portal/validar" className="text-brand-600 font-semibold hover:underline">
            Validar certificado →
          </a>
        </p>
      </div>
    </div>
  )
}
