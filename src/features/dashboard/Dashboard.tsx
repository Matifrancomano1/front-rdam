import { useEffect, useState } from 'react'
import { FolderOpen, Clock, CheckCircle, Award, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { dashboardApi } from '@/api/services'
import type { DashboardMetrics, Actividad } from '@/types'
import { fmt } from '@/utils'
import { Spinner } from '@/components/ui'
import { useAuthStore } from '@/stores'

function Trend({ v }: { v: number }) {
  if (v > 0) return <span className="stat-trend text-emerald-600"><TrendingUp size={11}/>+{v}%</span>
  if (v < 0) return <span className="stat-trend text-red-600"><TrendingDown size={11}/>{v}%</span>
  return <span className="stat-trend text-slate-400"><Minus size={11}/>Sin cambio</span>
}

const ACT_ICON: Record<string, string> = {
  CERTIFICADO_EMITIDO:   '📜',
  PAGO_CONFIRMADO:       '💳',
  EXPEDIENTE_APROBADO:   '✅',
  EXPEDIENTE_RECHAZADO:  '❌',
  EXPEDIENTE_CREADO:     '📁',
}

export default function Dashboard() {
  const { user } = useAuthStore()
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [actividad, setActividad] = useState<Actividad[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([dashboardApi.metricas(), dashboardApi.actividadReciente(8)])
      .then(([m, a]) => { setMetrics(m); setActividad(a) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex justify-center py-20"><Spinner size="lg"/></div>
  )

  const stats = metrics ? [
    { label: 'Total expedientes',   value: metrics.totales.expedientes,           icon: FolderOpen,   trend: metrics.tendencias.variacion.nuevos,      color: 'brand' },
    { label: 'Pendientes revisión', value: metrics.totales.pendientesRevision,     icon: Clock,        trend: 0,                                        color: 'amber' },
    { label: 'Pendientes validación',value: metrics.totales.pendientesValidacionPago, icon: CheckCircle,trend: 0,                                       color: 'purple' },
    { label: 'Certificados emitidos',value: metrics.totales.certificadosEmitidos,  icon: Award,        trend: metrics.tendencias.variacion.certificados, color: 'emerald' },
  ] : []

  const colorMap: Record<string, string> = {
    brand: 'bg-brand-50 text-brand-600',
    amber: 'bg-amber-50 text-amber-600',
    purple: 'bg-purple-50 text-purple-600',
    emerald: 'bg-emerald-50 text-emerald-600',
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="page-header">
        <div>
          <h1 className="page-title">Bienvenido, {user?.nombre?.split(' ')[0]} 👋</h1>
          <p className="page-sub">Resumen del sistema RDAM · {fmt.date(new Date().toISOString())}</p>
        </div>
      </div>

      {/* Alerts */}
      {metrics && (metrics.alertas.proximosExpirar > 0 || metrics.alertas.pendientesVencidos > 0) && (
        <div className="flex flex-col sm:flex-row gap-3">
          {metrics.alertas.proximosExpirar > 0 && (
            <div className="alert alert-warn flex-1">
              ⏰ <span className="text-sm"><strong>{metrics.alertas.proximosExpirar}</strong> expedientes próximos a expirar</span>
            </div>
          )}
          {metrics.alertas.pendientesVencidos > 0 && (
            <div className="alert alert-error flex-1">
              🔴 <span className="text-sm"><strong>{metrics.alertas.pendientesVencidos}</strong> expedientes pendientes vencidos</span>
            </div>
          )}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${colorMap[s.color]}`}>
                <s.icon size={17}/>
              </div>
              <Trend v={s.trend}/>
            </div>
            <p className="stat-value">{s.value.toLocaleString('es-AR')}</p>
            <p className="stat-label">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Estado breakdown */}
        {metrics && (
          <div className="card">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Distribución por estado</h3>
            <div className="space-y-3">
              {metrics.porEstado.map(e => (
                <div key={e.estado}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-600 font-medium">{e.estado}</span>
                    <span className="font-mono text-slate-500">{e.cantidad} ({e.porcentaje.toFixed(1)}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full bg-brand-500 transition-all"
                      style={{ width: `${e.porcentaje}%` }}/>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actividad reciente */}
        <div className="card">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Actividad reciente</h3>
          {actividad.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Sin actividad reciente</p>
          ) : (
            <div className="space-y-3">
              {actividad.map(a => (
                <div key={a.id} className="flex items-start gap-3 text-sm">
                  <span className="text-xl leading-none mt-0.5">{ACT_ICON[a.tipo] ?? '📋'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 truncate">{a.expediente.deudor}</p>
                    <p className="text-xs text-slate-400 truncate">{a.expediente.numeroExpediente} · {a.usuario.nombre}</p>
                  </div>
                  <span className="text-xs text-slate-400 whitespace-nowrap shrink-0">{fmt.ago(a.fecha)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tendencias último mes */}
      {metrics && (
        <div className="card">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Último mes</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Nuevos',     val: metrics.tendencias.ultimoMes.nuevos,       delta: metrics.tendencias.variacion.nuevos },
              { label: 'Aprobados',  val: metrics.tendencias.ultimoMes.aprobados,    delta: metrics.tendencias.variacion.aprobados },
              { label: 'Rechazados', val: metrics.tendencias.ultimoMes.rechazados,   delta: metrics.tendencias.variacion.rechazados },
              { label: 'Certificados',val: metrics.tendencias.ultimoMes.certificados,delta: metrics.tendencias.variacion.certificados },
            ].map(t => (
              <div key={t.label} className="p-3 bg-slate-50 rounded-xl">
                <p className="text-xs text-slate-500 mb-1">{t.label}</p>
                <p className="text-2xl font-bold text-slate-900 font-mono">{t.val}</p>
                <Trend v={t.delta}/>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
