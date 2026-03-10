import { useEffect, useState } from 'react'
import { pagosApi } from '@/api/services'
import type { Pago } from '@/types'
import { fmt } from '@/utils'
import { Spinner, EmptyState } from '@/components/ui'
import clsx from 'clsx'

export default function Pagos() {
  const [pagos, setPagos] = useState<Pago[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    pagosApi.listar()
      .then(setPagos)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-24"><Spinner size="lg"/></div>

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="page-header">
        <div>
          <h1 className="page-title">Pagos</h1>
          <p className="page-sub">{pagos.length} pagos registrados</p>
        </div>
      </div>

      <div className="table-wrap">
        <table className="table-base">
          <thead>
            <tr>
              <th>Referencia</th>
              <th>Monto</th>
              <th>Método</th>
              <th>Tarjeta</th>
              <th>Estado</th>
              <th>Fecha</th>
              <th>Confirmación</th>
            </tr>
          </thead>
          <tbody>
            {pagos.length === 0 ? (
              <tr><td colSpan={7}><EmptyState title="Sin pagos" description="No hay pagos registrados."/></td></tr>
            ) : pagos.map(p => (
              <tr key={p.id} className="cursor-default">
                <td className="font-mono text-xs text-slate-600">{p.referenciaExterna}</td>
                <td className="font-mono font-semibold text-slate-800 whitespace-nowrap">{fmt.money(p.monto)}</td>
                <td className="text-xs text-slate-500">{p.metodoPago ?? '—'}</td>
                <td className="font-mono text-xs">
                  {p.datosPasarela ? `${p.datosPasarela.marca} ···· ${p.datosPasarela.ultimosCuatroDigitos}` : '—'}
                </td>
                <td>
                  <span className={clsx('badge',
                    p.estadoPago === 'confirmado' ? 'badge-green' :
                    p.estadoPago === 'rechazado'  ? 'badge-red'   : 'badge-yellow')}>
                    {p.estadoPago}
                  </span>
                </td>
                <td className="text-xs text-slate-400 whitespace-nowrap">{fmt.dateTime(p.fechaPago)}</td>
                <td className="text-xs text-slate-400 whitespace-nowrap">{fmt.dateTime(p.fechaConfirmacion)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
