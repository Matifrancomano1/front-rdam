import { useState } from 'react'
import { Search, CheckCircle, XCircle, AlertCircle, Shield } from 'lucide-react'
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

export default function ValidarCert() {
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
      console.log('[ValidarCert] raw response:', raw)

      // Mapeo defensivo — el backend puede devolver variantes de nombres
      // En este POC el controller devuelve lo que retorna el store
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

  // Mostrar grid solo si al menos un campo clave tiene dato real
  const hasRealData = result &&
    (result.expediente !== '—' || result.deudor !== '—' || result.numeroIdentificacion !== '—')

  return (
    <div className="max-w-xl mx-auto px-4 py-12 sm:py-20 animate-fade-up">
      <div className="text-center mb-10">
        <div className="text-5xl mb-4">📜</div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Validación de certificado</h1>
        <p className="text-slate-500 text-sm">Ingresá el número de certificado para verificar su autenticidad. agregar la palabra CERT antes de poner el certificado</p>
      </div>

      <div className="card shadow-card-lg mb-6">
        <form onSubmit={handleValidar} className="flex gap-2">
          <input
            className="field-input flex-1 font-mono"
            placeholder="CERT-RDAM-2026-XXXXXXXX"
            value={numero}
            onChange={e => { setNumero(e.target.value.toUpperCase()); setResult(null); setNotFound(false); setError(null) }}
            autoFocus
          />
          <button type="submit" disabled={loading || !numero.trim()} className="btn-primary px-4 shrink-0">
            {loading ? <Spinner size="sm"/> : <Search size={17}/>}
            {!loading && <span className="hidden sm:inline ml-1">Validar</span>}
          </button>
        </form>
      </div>

      {/* Not found */}
      {notFound && (
        <div className="alert alert-error">
          <AlertCircle size={16} className="shrink-0"/>
          No se encontró ningún certificado con ese número.
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="alert alert-error">
          <AlertCircle size={16} className="shrink-0"/>
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className={`card border-l-4 ${result.valido ? 'border-l-emerald-500' : 'border-l-red-500'}`}>
          <div className="flex items-center gap-2 mb-5">
            {result.valido
              ? <CheckCircle size={20} className="text-emerald-500 shrink-0"/>
              : <XCircle    size={20} className="text-red-500 shrink-0"/>
            }
            <span className="font-bold text-slate-900">
              {result.valido
                ? `Certificado vigente${result.estado !== 'Vigente' ? ` — ${result.estado}` : ''}`
                : 'Certificado no válido'
              }
            </span>
          </div>

          {/* Siempre mostrar el N° certificado */}
          <div className="mb-4">
            <p className="text-xs text-slate-400 mb-0.5">N° Certificado</p>
            <p className="font-mono font-bold text-brand-600">{result.numeroCertificado}</p>
          </div>

          {/* Grid con datos reales solo si los tenemos */}
          {hasRealData && (
            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm border-t border-slate-100 pt-4">
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Expediente</p>
                <p className="font-medium text-slate-800">{result.expediente}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Deudor</p>
                <p className="font-medium text-slate-800">{result.deudor}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-0.5">DNI</p>
                <p className="font-mono text-slate-800">{result.numeroIdentificacion}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Estado</p>
                <p className="text-slate-800">{result.estado}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Fecha emisión</p>
                <p className="text-slate-700">{result.fechaEmision ? fmt.date(result.fechaEmision) : '—'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Vencimiento</p>
                <p className="text-slate-700">{result.fechaVencimiento ? fmt.date(result.fechaVencimiento) : '—'}</p>
              </div>
            </div>
          )}

          {/* Si hay datos pero no los clave */}
          {!hasRealData && !result.valido && (
            <p className="text-sm text-slate-500 border-t border-slate-100 pt-3">
              El certificado no es válido o fue revocado. Consultá con la sede más cercana.
            </p>
          )}

          {/* Alerta si está revocado */}
          {result.revocado && (
            <div className="alert alert-error mt-4 text-sm">
              <XCircle size={14} className="shrink-0"/>
              Este certificado fue revocado y ya no tiene validez legal.
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-center text-slate-400 mt-8 flex items-center justify-center gap-1.5">
        <Shield size={11} className="text-brand-400"/>
        Sistema RDAM · Gobierno de la Provincia de Santa Fe
      </p>
    </div>
  )
}
