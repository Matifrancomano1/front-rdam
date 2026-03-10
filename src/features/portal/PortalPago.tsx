import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, CreditCard, Shield, AlertCircle } from 'lucide-react'
import { pagosApi } from '@/api/services'
import { fmt, getErrMsg } from '@/utils'
import { Spinner } from '@/components/ui'

export default function PortalPago() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const expId = sessionStorage.getItem('portal_pago_expId') ?? ''
  const monto = Number(sessionStorage.getItem('portal_pago_monto') ?? 0)
  const email = sessionStorage.getItem('portal_pago_email') ?? ''
  const expData = (() => {
    try { return JSON.parse(sessionStorage.getItem('portal_exp') ?? '{}') } catch { return {} }
  })()

  useEffect(() => {
    if (!expId || !monto) navigate('/portal')
  }, [expId, monto, navigate])

  const handlePagar = async () => {
    if (!expId || !monto || !email) {
      setError('Datos de pago incompletos. Volvé al inicio.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // ✅ CORRECTO — endpoint público, sin JWT
      const orden = await pagosApi.crearOrdenPublica(expId, monto, email)

      if (!orden?.checkoutUrl || !orden?.plusPagosFormData) {
        throw new Error('Respuesta de orden inválida')
      }

      sessionStorage.setItem('rdam_referencia', orden.referenciaExterna)
      pagosApi.submitFormPlusPagos(orden.checkoutUrl, orden.plusPagosFormData)

    } catch (err: unknown) {
      const msg = (err as {response?:{data?:{message?:string}}})
                    ?.response?.data?.message ?? ''

      if (msg.includes('INVALID_STATE'))
        setError('Este expediente ya no está disponible para pago.')
      else if (msg.includes('INVALID_AMOUNT'))
        setError('El monto no coincide. Volvé al portal e intentá de nuevo.')
      else
        setError(getErrMsg(err))

      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12 animate-fade-up">
      <button onClick={() => navigate('/portal/resultado')} className="btn-ghost gap-2 -ml-1 mb-6 text-sm">
        <ArrowLeft size={16}/>Volver al estado
      </button>

      <div className="card shadow-card-lg">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-3">
            <CreditCard size={26} className="text-brand-600"/>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Realizar pago</h1>
          <p className="text-sm text-slate-500 mt-1">Serás redirigido a PlusPagos de forma segura</p>
        </div>

        {/* Resumen */}
        <div className="bg-slate-50 rounded-xl p-4 space-y-2.5 mb-5 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Expediente</span>
            <span className="font-mono font-semibold text-brand-600">{expData.numeroExpediente ?? '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Titular</span>
            <span className="font-medium text-slate-800">{expData.deudor?.nombreCompleto ?? '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Email confirmación</span>
            <span className="text-slate-700 text-xs">{email}</span>
          </div>
          <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
            <span className="font-semibold text-slate-800">Total</span>
            <span className="text-2xl font-bold text-red-600">{fmt.money(monto)}</span>
          </div>
        </div>

        {error && (
          <div className="alert alert-error mb-4 text-sm">
            <AlertCircle size={14} className="shrink-0"/>
            {error}
          </div>
        )}

        <button onClick={handlePagar} disabled={loading} className="btn-success w-full btn-lg">
          {loading
            ? <><Spinner size="sm"/>Preparando pago…</>
            : <><CreditCard size={18}/>Pagar {fmt.money(monto)}</>
          }
        </button>

        <p className="text-xs text-center text-slate-400 mt-3 flex items-center justify-center gap-1.5">
          <Shield size={11} className="text-emerald-500"/>
          Pago procesado por PlusPagos · No almacenamos datos de tarjeta
        </p>
      </div>
    </div>
  )
}
