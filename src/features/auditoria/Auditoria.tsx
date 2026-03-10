import { useEffect, useState, useCallback } from 'react'
import { Filter } from 'lucide-react'
import { auditoriaApi } from '@/api/services'
import type { AuditoriaLog } from '@/types'
import { fmt } from '@/utils'
import { Spinner, EmptyState, Pagination } from '@/components/ui'
import clsx from 'clsx'

const ACCIONES = ['','LOGIN','LOGOUT','EXPEDIENTE_CREADO','EXPEDIENTE_APROBADO','EXPEDIENTE_RECHAZADO','PAGO_CONFIRMADO','CERTIFICADO_EMITIDO','USUARIO_CREADO','USUARIO_ACTUALIZADO']

const ACCION_COLOR: Record<string, string> = {
  LOGIN:                  'badge-green',
  LOGOUT:                 'badge-gray',
  EXPEDIENTE_CREADO:      'badge-blue',
  EXPEDIENTE_APROBADO:    'badge-green',
  EXPEDIENTE_RECHAZADO:   'badge-red',
  PAGO_CONFIRMADO:        'badge-purple',
  CERTIFICADO_EMITIDO:    'badge-green',
  USUARIO_CREADO:         'badge-blue',
  USUARIO_ACTUALIZADO:    'badge-yellow',
}

export default function Auditoria() {
  const [logs, setLogs] = useState<AuditoriaLog[]>([])
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [accion, setAccion] = useState('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [page, setPage] = useState(1)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, unknown> = { page, limit: 50 }
      if (accion) params.accion = accion
      if (desde)  params.fechaDesde = desde
      if (hasta)  params.fechaHasta = hasta
      const data = await auditoriaApi.list(params)
      setLogs((data.logs ?? []))
      const p = data.pagination as { page: number; total: number; totalPages: number } | undefined
      if (p) setPagination({ page: p.page, total: p.total, totalPages: p.totalPages })
    } catch { /* noop */ }
    finally { setLoading(false) }
  }, [page, accion, desde, hasta])

  useEffect(() => { load() }, [load])

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="page-header">
        <div>
          <h1 className="page-title">Auditoría</h1>
          <p className="page-sub">Registro de acciones del sistema</p>
        </div>
      </div>

      <div className="card-sm flex flex-wrap gap-3 items-end">
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-400"/>
          <select className="field-select" value={accion} onChange={e => { setAccion(e.target.value); setPage(1) }}>
            <option value="">Todas las acciones</option>
            {ACCIONES.filter(Boolean).map(a => <option key={a}>{a}</option>)}
          </select>
        </div>
        <div>
          <label className="field-label text-xs">Desde</label>
          <input type="date" className="field-input" value={desde} onChange={e => { setDesde(e.target.value); setPage(1) }}/>
        </div>
        <div>
          <label className="field-label text-xs">Hasta</label>
          <input type="date" className="field-input" value={hasta} onChange={e => { setHasta(e.target.value); setPage(1) }}/>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg"/></div>
      ) : (
        <>
          <div className="table-wrap">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Usuario</th>
                  <th>Acción</th>
                  <th>Entidad</th>
                  <th>ID entidad</th>
                  <th>IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr><td colSpan={6}><EmptyState title="Sin registros" description="No hay logs con los filtros aplicados."/></td></tr>
                ) : logs.map(l => (
                  <tr key={l.id} className="cursor-default">
                    <td className="font-mono text-xs text-slate-400 whitespace-nowrap">{fmt.dateTime(l.fecha)}</td>
                    <td>
                      <p className="text-xs font-medium text-slate-800">{l.usuario.nombre}</p>
                      <p className="text-[10px] text-slate-400">{l.usuario.email}</p>
                    </td>
                    <td>
                      <span className={clsx('badge', ACCION_COLOR[l.accion] ?? 'badge-gray')}>{l.accion}</span>
                    </td>
                    <td className="text-xs text-slate-500">{l.entidad}</td>
                    <td className="font-mono text-xs text-slate-400">{l.entidadId?.slice(0, 8)}…</td>
                    <td className="font-mono text-xs text-slate-400">{l.ipAddress}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination {...pagination} onPage={setPage}/>
        </>
      )}
    </div>
  )
}
