import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Filter, MapPin, X } from 'lucide-react'
import { expedientesApi } from '@/api/services'
import type { Expediente, EstadoExpediente } from '@/types'
import { fmt, ESTADO_LABEL, getErrMsg } from '@/utils'
import { EstadoBadge, Pagination, SkeletonRows, EmptyState, Modal } from '@/components/ui'
import { useSedeStore } from '@/stores'
import ExpedienteForm from './ExpedienteForm'
import { toast } from 'react-toastify'

const ESTADOS: { value: string; label: string }[] = [
  { value: '', label: 'Todos los estados' },
  ...Object.entries(ESTADO_LABEL).map(([k, v]) => ({ value: k, label: v })),
]

export default function Expedientes() {
  const navigate = useNavigate()
  const { sede, setSede } = useSedeStore()
  const [exps, setExps] = useState<Expediente[]>([])
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [estado, setEstado] = useState('')
  const [page, setPage] = useState(1)
  const [showCreate, setShowCreate] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      // ⚠️ Backend NO acepta ?sede= — filtro es client-side
      const params: Record<string, unknown> = { page, limit: 50, sortOrder: 'desc' }
      if (search) params.search = search
      if (estado) params.estado = estado

      const data = await expedientesApi.list(params)

      // Filtro client-side por sede (metadata.sede según expedientes.service.ts)
      const todos = data.expedientes ?? []
      const filtrados = sede === 'Todas'
        ? todos
        : todos.filter(exp => exp.metadata?.sede === sede)

      setExps(filtrados)
      setPagination({
        page: data.pagination.page,
        total: sede === 'Todas' ? data.pagination.total : filtrados.length,
        totalPages: sede === 'Todas' ? data.pagination.totalPages : Math.ceil(filtrados.length / 20) || 1,
      })
    } catch (err) {
      console.error('[Expedientes] load error:', err)
      toast.error(getErrMsg(err))
    } finally { setLoading(false) }
  }, [page, search, estado, sede])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [search, estado, sede])

  const handleCreated = (exp: Expediente) => {
    setShowCreate(false)
    toast.success(`Expediente ${exp.numeroExpediente} creado`)
    load()
  }

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="page-header">
        <div>
          <h1 className="page-title">Expedientes</h1>
          <p className="page-sub">
            {pagination.total} expediente{pagination.total !== 1 ? 's' : ''}
            {sede !== 'Todas' ? ` · Sede ${sede}` : ''}
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus size={16}/>Nuevo expediente
        </button>
      </div>

      {/* Badge sede activa */}
      {sede !== 'Todas' && (
        <div className="flex items-center gap-2">
          <span className="badge badge-blue flex items-center gap-1.5">
            <MapPin size={11}/>Sede: {sede}
          </span>
          <button
            onClick={() => setSede('Todas')}
            className="text-xs text-slate-400 hover:text-red-500 transition-colors flex items-center gap-0.5"
          >
            <X size={11}/>Quitar filtro
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="card-sm flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
          <input className="field-input pl-9" placeholder="Buscar por nombre, DNI, número…"
            value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
        <div className="flex items-center gap-2">
          <Filter size={15} className="text-slate-400 shrink-0"/>
          <select className="field-select" value={estado} onChange={e => setEstado(e.target.value)}>
            {ESTADOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="table-wrap">
        <table className="table-base">
          <thead>
            <tr>
              <th>N° Expediente</th>
              <th>Deudor</th>
              <th>DNI</th>
              <th>Monto</th>
              <th>Estado</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <SkeletonRows cols={6}/> : exps.length === 0 ? (
              <tr><td colSpan={6}><EmptyState title="Sin expedientes" description="Ningún expediente coincide con los filtros."/></td></tr>
            ) : exps.map(exp => (
              <tr key={exp.id} onClick={() => navigate(`/app/expedientes/${exp.id}`)}>
                <td className="font-mono font-semibold text-brand-600 text-xs whitespace-nowrap">{exp.numeroExpediente}</td>
                <td className="font-medium text-slate-800 max-w-[200px] truncate">{exp.deudor.nombreCompleto}</td>
                <td className="font-mono text-xs text-slate-500">{exp.deudor.numeroIdentificacion}</td>
                <td className="font-mono font-semibold text-slate-700 whitespace-nowrap">{fmt.money(exp.deuda.montoAdeudado)}</td>
                <td><EstadoBadge estado={exp.estado.actual as EstadoExpediente}/></td>
                <td className="text-xs text-slate-400 whitespace-nowrap">{fmt.date(exp.metadata?.fechaCreacion ?? exp.estado.fechaActualizacion)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination {...pagination} onPage={setPage}/>

      {/* Create modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nuevo expediente" size="lg">
        <ExpedienteForm onSuccess={handleCreated} onCancel={() => setShowCreate(false)}/>
      </Modal>
    </div>
  )
}
