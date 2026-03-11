import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, CreditCard, Clock,
  FileText, RefreshCw, ChevronRight, Download
} from 'lucide-react'
import type { BusquedaPublicaResp } from '@/types'
import { fmt } from '@/utils'
import { EstadoBadge, Spinner } from '@/components/ui'
import { expedientesApi } from '@/api/services'
import { toast } from 'react-toastify'
import clsx from 'clsx'

const GUIA: {
  estado: BusquedaPublicaResp['estado']['actual']
  icon: string; titulo: string; desc: string; next: string
}[] = [
  { estado: 'Pendiente de Revisión',                  icon: '🕐', titulo: 'En revisión',         desc: 'Nuestro equipo está revisando la documentación de tu expediente.',               next: 'Te notificaremos cuando sea revisado.' },
  { estado: 'Aprobado - Pendiente de Pago',           icon: '✅', titulo: 'Aprobado',            desc: 'Tu expediente fue aprobado. Podés realizar el pago ahora.',                      next: 'Hacé clic en "Pagar" para continuar.' },
  { estado: 'Pago Confirmado - Pendiente Validación', icon: '🔍', titulo: 'Pago recibido',       desc: 'Tu pago fue recibido. Estamos validando y preparando el certificado.',            next: 'Recibirás el certificado en breve.' },
  { estado: 'Certificado Emitido',                    icon: '📜', titulo: 'Certificado listo',   desc: 'Tu certificado está disponible. Acercate a la sede para retirarlo.',              next: '' },
  { estado: 'Rechazado',                              icon: '❌', titulo: 'Expediente rechazado',desc: 'Tu expediente fue rechazado por documentación incompleta o incorrecta.',          next: 'Contactate con la sede para más información.' },
  { estado: 'Expirado',                               icon: '⏰', titulo: 'Expediente expirado', desc: 'Tu expediente venció. Deberás iniciar una nueva gestión.',                        next: 'Contactate con la sede para renovarlo.' },
]

const BORDER_COLOR: Record<string, string> = {
  'Aprobado - Pendiente de Pago':           'border-l-brand-500',
  'Certificado Emitido':                    'border-l-emerald-500',
  'Rechazado':                              'border-l-red-500',
  'Expirado':                               'border-l-red-500',
  'Pago Confirmado - Pendiente Validación': 'border-l-purple-500',
  'Pendiente de Revisión':                  'border-l-amber-400',
}

export default function PortalResultado() {
  const navigate = useNavigate()
  const [exp, setExp] = useState<BusquedaPublicaResp | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    const raw = sessionStorage.getItem('portal_exp')

    // Guard: sessionStorage vacío o inválido
    if (!raw || raw === 'undefined' || raw === 'null') {
      navigate('/portal')
      return
    }

    try {
      const parsed = JSON.parse(raw)
      // Validar estructura mínima
      if (!parsed?.id || !parsed?.estado?.actual) {
        console.error('[PortalResultado] estructura inválida:', parsed)
        navigate('/portal')
        return
      }
      setExp(parsed)
    } catch (e) {
      console.error('[PortalResultado] parse error:', e)
      navigate('/portal')
    }
  }, [navigate])

  if (!exp) return null

  const estadoActual = exp.estado?.actual ?? ''
  const guia = GUIA.find(g => g.estado === estadoActual) ?? GUIA[0]
  const borderCls = BORDER_COLOR[estadoActual] ?? 'border-l-slate-300'

  // Comparación exacta con el estado del backend
  const canPay = estadoActual === 'Aprobado - Pendiente de Pago'
  // ⚠️ Certificado se descarga yendo a la sede — el endpoint requiere JWT
  const hasCert = estadoActual === 'Certificado Emitido' && exp.tieneCertificado

  const handlePagar = () => {
    // Setear datos que PortalPago necesita
    sessionStorage.setItem('portal_pago_expId', exp.id)
    sessionStorage.setItem('portal_pago_monto', String(exp.deuda?.montoAdeudado ?? 0))
    sessionStorage.setItem('portal_pago_email', sessionStorage.getItem('portal_email') ?? exp.deudor?.email ?? '')
    navigate('/portal/pago')
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      const email = sessionStorage.getItem('portal_email') ?? exp.deudor?.email ?? ''
      const codigo = sessionStorage.getItem('portal_codigo') ?? ''
      const fresh = await expedientesApi.buscarPublico(exp.deudor.numeroIdentificacion, email, codigo)
      if (!fresh?.id) { toast.error('No se pudo actualizar.'); return }
      sessionStorage.setItem('portal_exp', JSON.stringify(fresh))
      setExp(fresh)
      toast.success('Estado actualizado')
    } catch {
      toast.error('No se pudo actualizar. Intentá de nuevo.')
    } finally { setRefreshing(false) }
  }

  const handleDownloadCert = () => {
    const dni = exp.deudor?.numeroIdentificacion ?? ''
    const email = sessionStorage.getItem('portal_email') ?? exp.deudor?.email ?? ''
    if (!dni || !email) {
      toast.error('Datos insuficientes para descargar el certificado.')
      return
    }
    window.open(expedientesApi.descargarCertificadoPublicoUrl(exp.id, dni, email), '_blank')
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-fade-up space-y-5">
      {/* Back */}
      <button onClick={() => navigate('/portal')} className="btn-ghost gap-2 -ml-1 text-sm">
        <ArrowLeft size={16}/>Consultar otro expediente
      </button>

      {/* Estado card */}
      <div className={clsx('card border-l-4', borderCls)}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <span className="text-3xl mt-0.5">{guia.icon}</span>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <EstadoBadge estado={estadoActual}/>
              </div>
              <h2 className="text-base font-bold text-slate-900">{guia.titulo}</h2>
              <p className="text-sm text-slate-500 mt-0.5">{guia.desc}</p>
              {guia.next && (
                <p className="text-xs text-brand-600 font-medium mt-1.5 flex items-center gap-1">
                  <ChevronRight size={11}/>{guia.next}
                </p>
              )}
              {exp.estado?.fechaExpiracion && (
                <p className="text-xs text-red-600 flex items-center gap-1 mt-1.5">
                  <Clock size={11}/>Expira {fmt.date(exp.estado.fechaExpiracion)}
                </p>
              )}
            </div>
          </div>
          <button onClick={handleRefresh} disabled={refreshing} title="Actualizar estado"
            className="btn-ghost p-2 shrink-0 text-slate-400">
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''}/>
          </button>
        </div>

        {/* Acciones */}
        {canPay && (
          <div className="mt-5 pt-4 border-t border-slate-100">
            <button onClick={handlePagar} className="btn-primary btn-lg w-full justify-center">
              <CreditCard size={18}/>Pagar {fmt.money(exp.deuda?.montoAdeudado)}
            </button>
          </div>
        )}

        {hasCert && (
          <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
            <div className="alert alert-success text-sm">
              📜 Tu certificado está listo. Acercate a la sede para retirarlo o presentá el número de expediente.
            </div>
            <button onClick={handleDownloadCert} className="btn-primary btn-lg w-full justify-center">
              <Download size={18}/>Descargar certificado PDF
            </button>
          </div>
        )}
      </div>

      {/* Expediente info */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-800">Datos del expediente</h3>
          <span className="font-mono text-xs font-bold text-brand-600 bg-brand-50 px-2 py-1 rounded-lg">
            {exp.numeroExpediente}
          </span>
        </div>
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div>
            <p className="text-xs text-slate-400 mb-0.5">Titular</p>
            <p className="font-medium text-slate-800">{exp.deudor?.nombreCompleto ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-0.5">DNI</p>
            <p className="font-mono font-medium text-slate-800">{exp.deudor?.numeroIdentificacion ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-0.5">Monto adeudado</p>
            <p className="font-bold text-red-600 text-lg">{fmt.money(exp.deuda?.montoAdeudado)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-0.5">Período</p>
            <p className="text-slate-700">{exp.deuda?.periodoDeuda ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-0.5">Beneficiario</p>
            <p className="text-slate-700">
              {exp.deuda?.beneficiario?.nombre ?? '—'}
              {exp.deuda?.beneficiario?.parentesco ? ` (${exp.deuda.beneficiario.parentesco})` : ''}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-0.5">Última actualización</p>
            <p className="text-slate-700">{fmt.date(exp.estado?.fechaActualizacion)}</p>
          </div>
        </div>
      </div>

      {/* Documentos adjuntos */}
      {(exp.documentos?.length ?? 0) > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Documentos del expediente</h3>
          <div className="space-y-2">
            {exp.documentos.map(doc => (
              <div key={doc.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                  <FileText size={14} className="text-red-600"/>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{doc.nombreArchivo}</p>
                  <p className="text-xs text-slate-400">{fmt.date(doc.fechaSubida)}</p>
                </div>
                {/* URL pública de descarga de documentos */}
                <a
                  href={doc.url.startsWith('/v1') ? doc.url : `/v1${doc.url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ghost btn-sm text-brand-600 shrink-0"
                  onClick={e => e.stopPropagation()}
                >
                  Ver
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-center text-xs text-slate-400 pb-4">
        ¿Tenés dudas?{' '}
        <Link to="/portal/validar" className="text-brand-600 hover:underline">Validar certificado</Link>
      </p>
    </div>
  )
}
