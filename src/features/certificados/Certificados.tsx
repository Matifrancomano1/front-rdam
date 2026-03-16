import { useState } from 'react'
import { Search, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { certificadosApi } from '@/api/services'
import { fmt, getErrMsg } from '@/utils'
import { Spinner } from '@/components/ui'

interface CertNormalizado {
  valido: boolean
  revocado: boolean
  numeroCertificado: string
  expediente: string
  deudor: string
  numeroIdentificacion: string
  fechaEmision: string | null
  fechaVencimiento: string | null
  estado: string
}

export default function Certificados() {
  const [numero, setNumero]     = useState('')
  const [loading, setLoading]   = useState(false)
  const [result, setResult]     = useState<CertNormalizado | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const handleValidar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!numero.trim()) return
    setLoading(true); setResult(null); setNotFound(false); setError(null)

    try {
      const raw = await certificadosApi.validar(numero.trim())
      console.log('[Certificados] raw response:', raw)

      const d = raw?.data ?? raw ?? {}

      const normalizado: CertNormalizado = {
        valido:              d?.valido              ?? false,
        revocado:            d?.revocado            ?? false,
        numeroCertificado:   d?.numeroCertificado   ?? d?.numero      ?? numero,
        expediente:          d?.expediente          ?? d?.numeroExpediente ?? d?.expedienteNumero ?? '—',
        deudor:              d?.deudor              ?? d?.nombreDeudor    ?? d?.nombre             ?? '—',
        numeroIdentificacion:d?.numeroIdentificacion?? d?.dni             ?? d?.documento          ?? '—',
        fechaEmision:        d?.fechaEmision        ?? d?.emitido         ?? null,
        fechaVencimiento:    d?.fechaVencimiento    ?? d?.vencimiento     ?? d?.expira             ?? null,
        estado:              d?.estado              ?? (d?.valido ? 'Vigente' : 'No válido'),
      }

      setResult(normalizado)
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 404) setNotFound(true)
      else setError(getErrMsg(err))
    } finally { setLoading(false) }
  }

  const hasRealData = result &&
    (result.expediente !== '—' || result.deudor !== '—' || result.numeroIdentificacion !== '—')

  return (
    <div className="space-y-5 animate-fade-up max-w-xl">
      <div className="page-header">
        <div>
          <h1 className="page-title">Certificados</h1>
          <p className="page-sub">Ingresá el número de certificado para verificar su autenticidad. agregar la palabra CERT antes de poner el certificado</p>
        </div>
      </div>

      <div className="card">
        <form onSubmit={handleValidar} className="flex gap-2">
          <input
            className="field-input flex-1 font-mono"
            placeholder="CERT-RDAM-2026-XXXXXXXX"
            value={numero}
            onChange={e => { setNumero(e.target.value.toUpperCase()); setResult(null); setNotFound(false); setError(null) }}
            autoFocus
          />
          <button type="submit" disabled={loading || !numero.trim()} className="btn-primary px-5 shrink-0">
            {loading ? <Spinner size="sm"/> : <Search size={16}/>}
            <span className="ml-1">Validar</span>
          </button>
        </form>
      </div>

      {notFound && (
        <div className="alert alert-error"><AlertCircle size={16} className="shrink-0"/>Certificado no encontrado.</div>
      )}
      {error && (
        <div className="alert alert-error"><AlertCircle size={16} className="shrink-0"/>{error}</div>
      )}

      {result && (
        <div className={`card border-l-4 ${result.valido ? 'border-l-emerald-500' : 'border-l-red-500'}`}>
          <div className="flex items-center gap-2 mb-4">
            {result.valido
              ? <CheckCircle size={20} className="text-emerald-500"/>
              : <XCircle    size={20} className="text-red-500"/>
            }
            <span className="font-bold text-slate-900">
              {result.valido ? `Certificado vigente — ${result.estado}` : 'Certificado no válido'}
            </span>
          </div>

          <div className="mb-4">
            <p className="text-xs text-slate-400 mb-0.5">N° Certificado</p>
            <p className="font-mono font-bold text-brand-600">{result.numeroCertificado}</p>
          </div>

          {hasRealData && (
            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm border-t border-slate-100 pt-4">
              <div><p className="text-xs text-slate-400 mb-0.5">Expediente</p><p className="font-medium">{result.expediente}</p></div>
              <div><p className="text-xs text-slate-400 mb-0.5">Deudor</p><p className="font-medium">{result.deudor}</p></div>
              <div><p className="text-xs text-slate-400 mb-0.5">DNI</p><p className="font-mono">{result.numeroIdentificacion}</p></div>
              <div><p className="text-xs text-slate-400 mb-0.5">Estado</p><p>{result.estado}</p></div>
              <div><p className="text-xs text-slate-400 mb-0.5">Emisión</p><p>{result.fechaEmision ? fmt.date(result.fechaEmision) : '—'}</p></div>
              <div><p className="text-xs text-slate-400 mb-0.5">Vencimiento</p><p>{result.fechaVencimiento ? fmt.date(result.fechaVencimiento) : '—'}</p></div>
            </div>
          )}

          {result.revocado && (
            <div className="alert alert-error mt-4 text-sm">
              <XCircle size={14} className="shrink-0"/>
              Este certificado fue revocado y ya no tiene validez legal.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
