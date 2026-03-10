import { useEffect, useState, useRef } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { CheckCircle, XCircle } from 'lucide-react'
import { pagosApi } from '@/api/services'
import type { EstadoPagoPublico } from '@/types'
import { fmt } from '@/utils'
import { Spinner } from '@/components/ui'

type Stage = 'waiting' | 'confirmed' | 'rejected' | 'error'

export default function PortalRetorno() {
  const [params] = useSearchParams()
  const [stage, setStage] = useState<Stage>('waiting')
  const [pago, setPago]  = useState<EstadoPagoPublico | null>(null)
  const [attempts, setAttempts] = useState(0)
  const sseRef = useRef<EventSource | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const estadoParam   = params.get('estado')  // 'aprobado' | 'rechazado' | 'cancelado'
  const referencia    = params.get('referencia') ?? sessionStorage.getItem('rdam_referencia') ?? ''
  const MAX_POLL = 12

  useEffect(() => {
    if (estadoParam === 'rechazado' || estadoParam === 'cancelado') { setStage('rejected'); return }
    if (!referencia) { setStage('error'); return }

    // SSE stream
    sseRef.current = pagosApi.sseEventos(referencia, (data) => {
      if (data.tipo === 'PAGO_CONFIRMADO') {
        sessionStorage.removeItem('rdam_referencia')
        poll(true)
      } else if (data.tipo === 'PAGO_RECHAZADO') {
        setStage('rejected')
      }
      sseRef.current?.close()
    })

    // Fallback polling
    pollLoop(0)

    return () => {
      sseRef.current?.close()
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, []) // eslint-disable-line

  const poll = async (force = false) => {
    try {
      const d = await pagosApi.estadoPorReferencia(referencia)
      if (d.estadoPago === 'confirmado' || force) {
        setPago(d); setStage('confirmed')
        sessionStorage.removeItem('rdam_referencia')
      } else if (d.estadoPago === 'rechazado') { setStage('rejected') }
    } catch { /* noop */ }
  }

  const pollLoop = (n: number) => {
    setAttempts(n)
    if (n >= MAX_POLL) { setStage('error'); return }
    timerRef.current = setTimeout(async () => {
      try {
        const d = await pagosApi.estadoPorReferencia(referencia)
        if (d.estadoPago === 'confirmado') { setPago(d); setStage('confirmed'); sseRef.current?.close(); return }
        if (d.estadoPago === 'rechazado')  { setStage('rejected'); sseRef.current?.close(); return }
      } catch { /* noop */ }
      pollLoop(n + 1)
    }, 5000)
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-fade-up">

        {stage === 'waiting' && (
          <div className="card shadow-card-lg text-center">
            <Spinner size="lg" className="mx-auto mb-4"/>
            <h2 className="text-lg font-bold text-slate-900 mb-1">Verificando pago</h2>
            <p className="text-sm text-slate-500 mb-4">Esperando confirmación del banco…</p>
            <div className="flex justify-center gap-1 mb-3">
              {Array.from({ length: MAX_POLL }).map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all ${i < attempts ? 'bg-brand-500 w-5' : 'bg-slate-200 w-2'}`}/>
              ))}
            </div>
            <p className="text-xs text-slate-400">No cerrés esta pestaña · puede tardar hasta 1 minuto</p>
          </div>
        )}

        {stage === 'confirmed' && pago && (
          <div className="card shadow-card-lg">
            <div className="text-center mb-5">
              <CheckCircle size={48} className="text-emerald-500 mx-auto mb-3"/>
              <h2 className="text-xl font-bold text-slate-900">¡Pago confirmado!</h2>
              <p className="text-sm text-slate-500">Tu pago fue procesado exitosamente.</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-2.5 mb-5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Expediente</span>
                <span className="font-mono font-bold text-brand-600">{pago.numeroExpediente}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Referencia</span>
                <span className="font-mono text-xs text-slate-600">{pago.referenciaExterna}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Monto</span>
                <span className="font-bold text-emerald-700">{fmt.money(pago.monto)}</span>
              </div>
              {pago.datosPasarela && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Tarjeta</span>
                  <span className="font-mono">{pago.datosPasarela.marca} ···· {pago.datosPasarela.ultimosCuatroDigitos}</span>
                </div>
              )}
              {pago.fechaConfirmacion && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Fecha</span>
                  <span>{fmt.dateTime(pago.fechaConfirmacion)}</span>
                </div>
              )}
            </div>
            <div className="alert alert-info text-xs mb-4">
              Tu certificado será emitido en las próximas 24-48 hs hábiles una vez que validemos el pago.
            </div>
            <Link to="/portal" className="btn-primary w-full justify-center">Volver al portal</Link>
          </div>
        )}

        {stage === 'rejected' && (
          <div className="card shadow-card-lg text-center">
            <XCircle size={48} className="text-red-500 mx-auto mb-3"/>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Pago no realizado</h2>
            <p className="text-sm text-slate-500 mb-6">El pago fue rechazado o cancelado. No se realizó ningún cargo.</p>
            <div className="flex flex-col gap-2">
              <Link to="/portal/pago" className="btn-primary w-full justify-center">Intentar nuevamente</Link>
              <Link to="/portal" className="btn-outline w-full justify-center">Volver al portal</Link>
            </div>
          </div>
        )}

        {stage === 'error' && (
          <div className="card shadow-card-lg text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">No pudimos verificar el pago</h2>
            <p className="text-sm text-slate-500 mb-6">El sistema tardó demasiado. Consultá tu estado en el portal para confirmar.</p>
            <Link to="/portal" className="btn-primary w-full justify-center">Consultar estado</Link>
          </div>
        )}

      </div>
    </div>
  )
}
