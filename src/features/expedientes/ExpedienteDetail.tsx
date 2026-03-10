import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, CheckCircle, XCircle, Upload,
  Download, FileText, Info
} from 'lucide-react'
import { expedientesApi, pagosApi } from '@/api/services'
import type { Expediente, HistorialItem, Pago, Documento } from '@/types'
import { fmt, getErrMsg, canApprove, canReject, canCert, hasCert } from '@/utils'
import {
  EstadoBadge, Modal, Spinner, FileUploader, DocItem, ConfirmModal
} from '@/components/ui'
import { toast } from 'react-toastify'
import clsx from 'clsx'

type Tab = 'info' | 'historial' | 'pagos' | 'documentos'

export default function ExpedienteDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [exp, setExp] = useState<Expediente | null>(null)
  const [historial, setHistorial] = useState<HistorialItem[]>([])
  // ⚠️ pagosIds: el backend devuelve string[] (IDs), no objetos Pago
  const [pagoIds, setPagoIds] = useState<string[]>([])
  const [pagos, setPagos] = useState<Pago[]>([])
  const [docs, setDocs] = useState<Documento[]>([])
  const [tab, setTab] = useState<Tab>('info')
  const [loading, setLoading] = useState(true)

  // Modals
  const [aprobarModal, setAprobarModal]   = useState(false)
  const [rechazarModal, setRechazarModal] = useState(false)
  const [certModal, setCertModal]         = useState(false)
  const [obs, setObs]                     = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  // File upload state
  const [docUploading, setDocUploading]   = useState(false)
  const [docProgress, setDocProgress]     = useState(0)
  const [docUploaded, setDocUploaded]     = useState(false)
  const [certUploading, setCertUploading] = useState(false)
  const [certProgress, setCertProgress]   = useState(0)
  const [certUploaded, setCertUploaded]   = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      // Cargar expediente, historial y documentos en paralelo
      const [e, h, d, ids] = await Promise.all([
        expedientesApi.get(id),
        expedientesApi.historial(id),
        expedientesApi.listarDocs(id),
        // pagoIds: devuelve string[] según backend
        expedientesApi.pagoIds(id),
      ])
      setExp(e)
      setHistorial(h)
      setDocs(d)
      setPagoIds(ids)

      // Para cada pago ID, buscar el objeto Pago completo
      if (ids.length > 0) {
        const results = await Promise.allSettled(
          ids.map(pid => pagosApi.getPagoById(pid))
        )
        const pagosData = results
          .filter((r): r is PromiseFulfilledResult<Pago> => r.status === 'fulfilled')
          .map(r => r.value)
        setPagos(pagosData)
      } else {
        setPagos([])
      }
    } catch (err) {
      console.error('[ExpedienteDetail] load error:', err)
      toast.error('Error cargando expediente')
      navigate('/app/expedientes')
    } finally { setLoading(false) }
  }, [id, navigate])

  useEffect(() => { load() }, [load])

  if (loading || !exp) {
    return <div className="flex justify-center py-24"><Spinner size="lg"/></div>
  }

  const estado = exp.estado.actual

  // ── Handlers ──────────────────────────────────────────────────

  const handleAprobar = async () => {
    setActionLoading(true)
    try {
      await expedientesApi.aprobar(exp.id, obs)
      toast.success('Expediente aprobado correctamente')
      setAprobarModal(false)
      setObs('')
      await load() // await para que el estado nuevo se muestre antes de quitar el spinner
    } catch (e: unknown) { toast.error(getErrMsg(e)) }
    finally { setActionLoading(false) }
  }

  const handleRechazar = async () => {
    if (!obs.trim()) { toast.error('La observación es obligatoria para rechazar'); return }
    setActionLoading(true)
    try {
      await expedientesApi.rechazar(exp.id, obs)
      toast.success('Expediente rechazado')
      setRechazarModal(false)
      setObs('')
      await load()
    } catch (e: unknown) { toast.error(getErrMsg(e)) }
    finally { setActionLoading(false) }
  }



  const handleSubirDoc = async (file: File) => {
    setDocUploading(true); setDocProgress(0); setDocUploaded(false)
    try {
      const doc = await expedientesApi.subirDoc(exp.id, file, setDocProgress)
      setDocs(prev => [...prev, doc])
      setDocUploaded(true)
      toast.success('Documento subido correctamente')
    } catch (e: unknown) { toast.error(getErrMsg(e)) }
    finally { setDocUploading(false) }
  }

  const handleSubirCert = async (file: File) => {
    // ⚠️ Solo funciona si estado === 'Pago Confirmado - Pendiente Validación'
    // ⚠️ Solo acepta PDF — backend lanza INVALID_FILE_TYPE si no es PDF
    // ⚠️ Transiciona AUTOMÁTICAMENTE a 'Certificado Emitido'
    setCertUploading(true); setCertProgress(0); setCertUploaded(false)
    try {
      await expedientesApi.subirCertificado(exp.id, file, setCertProgress)
      setCertUploaded(true)
      toast.success('Certificado subido · Estado: Certificado Emitido')
      setCertModal(false)
      await load()
    } catch (e: unknown) { toast.error(getErrMsg(e)) }
    finally { setCertUploading(false) }
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: 'info',       label: 'Información' },
    { id: 'historial',  label: `Historial (${historial.length})` },
    { id: 'pagos',      label: `Pagos (${pagoIds.length})` },
    { id: 'documentos', label: `Documentos (${docs.length})` },
  ]

  return (
    <div className="space-y-5 animate-fade-up">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button onClick={() => navigate('/app/expedientes')} className="btn-ghost p-2 mt-0.5">
          <ArrowLeft size={18}/>
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-slate-900 font-mono">{exp.numeroExpediente}</h1>
            <EstadoBadge estado={estado}/>
          </div>
          <p className="text-sm text-slate-500">{exp.deudor.nombreCompleto} · DNI {exp.deudor.numeroIdentificacion}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {canApprove(estado) && (
          <button onClick={() => setAprobarModal(true)} className="btn-success btn-sm">
            <CheckCircle size={14}/>Aprobar
          </button>
        )}
        {canReject(estado) && (
          <button onClick={() => setRechazarModal(true)} className="btn-danger btn-sm">
            <XCircle size={14}/>Rechazar
          </button>
        )}
        {estado === 'Aprobado - Pendiente de Pago' && (
          <div className="w-full alert alert-info text-sm flex items-center gap-2">
            <Info size={15} className="shrink-0 text-brand-500"/>
            <span>
              Expediente aprobado. El ciudadano debe pagar desde el{' '}
              <a href="/portal" target="_blank" rel="noopener noreferrer"
                className="font-semibold underline hover:text-brand-700">
                portal público
              </a>.
              Una vez confirmado el pago podrás subir el certificado.
            </span>
          </div>
        )}
        {canCert(estado) && (
          <button onClick={() => setCertModal(true)} className="btn-secondary btn-sm">
            <Upload size={14}/>Subir certificado PDF
          </button>
        )}
        {hasCert(estado) && (
          // ⚠️ Este endpoint requiere JWT — se descarga como admin/operador
          <a href={`/v1/expedientes/${exp.id}/certificado/descargar`}
            target="_blank" rel="noopener noreferrer"
            className="btn-outline btn-sm">
            <Download size={14}/>Descargar certificado
          </a>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-1 -mb-px">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={clsx('px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
                tab === t.id
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700')}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab: Info */}
      {tab === 'info' && (
        <div className="grid sm:grid-cols-2 gap-5">
          <div className="card">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Datos del deudor</h3>
            <div className="space-y-3 text-sm">
              {([
                ['Nombre', exp.deudor.nombreCompleto, false],
                ['Tipo doc.', exp.deudor.tipoIdentificacion, false],
                ['N° documento', exp.deudor.numeroIdentificacion, true],
                ['Email', exp.deudor.email, false],
                ['Teléfono', exp.deudor.telefono ?? '—', false],
              ] as [string, string, boolean][]).map(([l, v, mono]) => (
                <div key={l} className="flex justify-between gap-3">
                  <span className="text-slate-400 shrink-0">{l}</span>
                  <span className={clsx('font-medium text-slate-800 text-right', mono && 'font-mono')}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Datos de la deuda</h3>
            <div className="space-y-3 text-sm">
              {([
                ['Monto', fmt.money(exp.deuda.montoAdeudado)],
                ['Período', exp.deuda.periodoDeuda],
                ['Beneficiario', exp.deuda.beneficiario.nombre],
                ['Parentesco', exp.deuda.beneficiario.parentesco],
              ] as [string, string][]).map(([l, v]) => (
                <div key={l} className="flex justify-between gap-3">
                  <span className="text-slate-400 shrink-0">{l}</span>
                  <span className="font-medium text-slate-800 text-right">{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card sm:col-span-2">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Metadatos</h3>
            <div className="grid sm:grid-cols-4 gap-3 text-sm">
              {([
                ['Sede', exp.metadata?.sede ?? '—'],
                ['Creado', fmt.date(exp.metadata?.fechaCreacion)],
                ['Actualizado', fmt.date(exp.metadata?.fechaActualizacion)],
                ['Expira', fmt.date(exp.estado.fechaExpiracion ?? undefined)],
              ] as [string, string][]).map(([l, v]) => (
                <div key={l}>
                  <p className="text-xs text-slate-400 mb-0.5">{l}</p>
                  <p className="font-medium text-slate-800">{v}</p>
                </div>
              ))}
            </div>
            {exp.metadata?.observaciones && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-400 mb-1">Observaciones</p>
                <p className="text-sm text-slate-700">{exp.metadata.observaciones}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Historial */}
      {tab === 'historial' && (
        <div className="card">
          {historial.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Sin historial</p>
          ) : (
            <div className="timeline">
              {historial.map(h => (
                <div key={h.id} className="timeline-item">
                  <div className="timeline-dot"/>
                  <div className="ml-2">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-slate-400">{fmt.dateTime(h.fechaCambio)}</span>
                      {h.estadoNuevo && <EstadoBadge estado={h.estadoNuevo}/>}
                    </div>
                    {h.observaciones && <p className="text-sm text-slate-700 mb-0.5">{h.observaciones}</p>}
                    <p className="text-xs text-slate-400">{h.usuario?.nombre ?? '—'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Pagos */}
      {tab === 'pagos' && (
        <div className="space-y-3">
          {pagoIds.length === 0 ? (
            <div className="card"><p className="text-sm text-slate-400 text-center py-8">Sin pagos registrados</p></div>
          ) : pagos.length === 0 ? (
            // IDs existen pero aún cargando detalles
            <div className="card flex justify-center py-8"><Spinner size="md"/></div>
          ) : pagos.map(p => (
            <div key={p.id} className="card">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <span className={clsx('badge', {
                  'badge-green':  p.estadoPago === 'confirmado',
                  'badge-red':    p.estadoPago === 'rechazado',
                  'badge-yellow': p.estadoPago === 'pendiente',
                })}>
                  {p.estadoPago}
                </span>
                <span className="font-bold text-lg font-mono text-slate-900">{fmt.money(p.monto)}</span>
              </div>
              <div className="grid sm:grid-cols-2 gap-2 text-sm text-slate-600">
                <div><span className="text-slate-400">Referencia: </span><span className="font-mono text-xs">{p.referenciaExterna}</span></div>
                {p.datosPasarela && (
                  <div>
                    <span className="text-slate-400">Tarjeta: </span>
                    <span className="font-mono">{p.datosPasarela.marca} ···· {p.datosPasarela.ultimosCuatroDigitos}</span>
                  </div>
                )}
                <div><span className="text-slate-400">Fecha pago: </span>{fmt.dateTime(p.fechaPago)}</div>
                {p.fechaConfirmacion && <div><span className="text-slate-400">Confirmado: </span>{fmt.dateTime(p.fechaConfirmacion)}</div>}
                {p.validacion && (
                  <div className="sm:col-span-2">
                    <span className="text-slate-400">Validado por: </span>{p.validacion.nombreUsuario} · {fmt.date(p.validacion.fechaValidacion)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Documentos */}
      {tab === 'documentos' && (
        <div className="card space-y-4">
          <h3 className="text-sm font-semibold text-slate-800">Documentos del expediente</h3>
          <FileUploader
            label="Subir nuevo documento (PDF, JPG, PNG)"
            onFile={handleSubirDoc}
            uploading={docUploading}
            progress={docProgress}
            uploaded={docUploaded}
          />
          {docs.length > 0 && (
            <div className="space-y-2 pt-2">
              {docs.map(doc => (
                <DocItem key={doc.id} doc={doc}
                  downloadUrl={expedientesApi.downloadDocUrl(exp.id, doc.id)}/>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Modals ── */}
      <Modal open={aprobarModal} onClose={() => { setAprobarModal(false); setObs('') }}
        title="Aprobar expediente" size="sm"
        footer={<>
          <button onClick={() => { setAprobarModal(false); setObs('') }} className="btn-outline" disabled={actionLoading}>Cancelar</button>
          <button onClick={handleAprobar} className="btn-success" disabled={actionLoading}>
            {actionLoading ? <><Spinner size="sm"/>Aprobando…</> : 'Confirmar aprobación'}
          </button>
        </>}>
        <label className="field-label">Observaciones</label>
        <textarea className="field-textarea" rows={3} placeholder="Documentación completa y verificada…"
          value={obs} onChange={e => setObs(e.target.value)}/>
      </Modal>

      <Modal open={rechazarModal} onClose={() => { setRechazarModal(false); setObs('') }}
        title="Rechazar expediente" size="sm"
        footer={<>
          <button onClick={() => { setRechazarModal(false); setObs('') }} className="btn-outline" disabled={actionLoading}>Cancelar</button>
          <button onClick={handleRechazar} className="btn-danger" disabled={actionLoading}>
            {actionLoading ? <><Spinner size="sm"/>Rechazando…</> : 'Confirmar rechazo'}
          </button>
        </>}>
        <label className="field-label">Motivo del rechazo *</label>
        <textarea className="field-textarea" rows={3} placeholder="Documentación incompleta…"
          value={obs} onChange={e => setObs(e.target.value)}/>
        <p className="field-hint">El motivo es obligatorio y quedará en el historial.</p>
      </Modal>

      <Modal open={certModal} onClose={() => setCertModal(false)} title="Subir certificado PDF" size="sm">
        <div className="alert alert-info mb-4 text-xs">
          <Info size={13} className="shrink-0"/>
          Al subir el PDF el expediente pasará a "Certificado Emitido"
          automáticamente. El ciudadano podrá verlo desde el portal.
        </div>
        <FileUploader
          label="Seleccioná el certificado PDF"
          maxMB={10}
          onFile={handleSubirCert}
          uploading={certUploading}
          progress={certProgress}
          uploaded={certUploaded}
        />
        {certUploaded && (
          <button onClick={() => setCertModal(false)} className="btn-primary w-full justify-center mt-3">
            <CheckCircle size={16}/>Listo
          </button>
        )}
      </Modal>
    </div>
  )
}
