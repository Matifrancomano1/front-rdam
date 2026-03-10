import { useState } from 'react'
import { expedientesApi } from '@/api/services'
import type { Expediente } from '@/types'
import { Spinner } from '@/components/ui'
import { getErrMsg } from '@/utils'
import { toast } from 'react-toastify'

const SEDES   = ['Santa Fe', 'Rosario', 'Venado Tuerto', 'Rafaela', 'Reconquista']
const TIPOS   = ['DNI', 'CEDULA', 'PASAPORTE']
const PARENT  = ['Hijo/a', 'Cónyuge', 'Concubino/a', 'Hermano/a', 'Otro']

interface Props { onSuccess: (e: Expediente) => void; onCancel: () => void }

export default function ExpedienteForm({ onSuccess, onCancel }: Props) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [form, setForm] = useState({
    deudor: { nombreCompleto: '', tipoIdentificacion: 'DNI', numeroIdentificacion: '', email: '', telefono: '' },
    deuda:  { montoAdeudado: '', periodoDeuda: '', beneficiario: { nombre: '', parentesco: '' } },
    sede:   '',
    observaciones: '',
  })

  const set = (path: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const keys = path.split('.')
    setForm(prev => {
      const copy = JSON.parse(JSON.stringify(prev))
      let obj: Record<string, unknown> = copy
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]] as Record<string, unknown>
      obj[keys[keys.length - 1]] = e.target.value
      return copy
    })
    setErrors(p => { const n = { ...p }; delete n[path]; return n })
  }

  const validate1 = () => {
    const e: Record<string, string> = {}
    const d = form.deudor
    if (!d.nombreCompleto.trim()) e['deudor.nombreCompleto'] = 'Requerido'
    else if (!/^[a-zA-ZÀ-ÿ\s\-]{5,150}$/.test(d.nombreCompleto)) e['deudor.nombreCompleto'] = 'Solo letras y espacios, 5-150 chars'
    if (!d.numeroIdentificacion.trim()) e['deudor.numeroIdentificacion'] = 'Requerido'
    else if (!/^\d{7,12}$/.test(d.numeroIdentificacion)) e['deudor.numeroIdentificacion'] = 'Solo dígitos, 7-12 chars'
    if (!d.email.trim()) e['deudor.email'] = 'Requerido'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) e['deudor.email'] = 'Email inválido'
    if (d.telefono && !/^(\+[\d\s\-]{7,20})?$/.test(d.telefono)) e['deudor.telefono'] = 'Formato: +54 11 1234-5678'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const validate2 = () => {
    const e: Record<string, string> = {}
    const monto = Number(form.deuda.montoAdeudado)
    if (!form.deuda.montoAdeudado) e['deuda.montoAdeudado'] = 'Requerido'
    else if (isNaN(monto) || monto <= 0) e['deuda.montoAdeudado'] = 'Debe ser mayor a 0'
    if (!form.deuda.periodoDeuda.trim()) e['deuda.periodoDeuda'] = 'Requerido'
    if (!form.deuda.beneficiario.nombre.trim()) e['deuda.beneficiario.nombre'] = 'Requerido'
    if (!form.deuda.beneficiario.parentesco) e['deuda.beneficiario.parentesco'] = 'Requerido'
    if (!form.sede) e['sede'] = 'Seleccioná una sede'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate2()) return
    setLoading(true)
    try {
      const payload = {
        ...form,
        deuda: { ...form.deuda, montoAdeudado: Number(form.deuda.montoAdeudado) },
      }
      const exp = await expedientesApi.create(payload)
      onSuccess(exp)
    } catch (err: unknown) {
      toast.error(getErrMsg(err))
    } finally { setLoading(false) }
  }

  const Err = ({ k }: { k: string }) => errors[k] ? (
    <p className="field-error">{errors[k]}</p>
  ) : null

  return (
    <div>
      {/* Steps indicator */}
      <div className="flex items-center gap-2 mb-6">
        {['Datos del deudor', 'Deuda y sede'].map((label, i) => (
          <div key={label} className="flex items-center gap-2 flex-1">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
              i + 1 <= step ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
              {i + 1}
            </div>
            <span className={`text-xs font-medium ${i + 1 <= step ? 'text-slate-800' : 'text-slate-400'}`}>{label}</span>
            {i < 1 && <div className={`flex-1 h-0.5 ${step > 1 ? 'bg-brand-500' : 'bg-slate-200'}`}/>}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="field-label">Nombre completo *</label>
              <input className="field-input" placeholder="Juan Carlos Pérez González"
                value={form.deudor.nombreCompleto} onChange={set('deudor.nombreCompleto')}/>
              <Err k="deudor.nombreCompleto"/>
            </div>
            <div>
              <label className="field-label">Tipo de documento</label>
              <select className="field-select" value={form.deudor.tipoIdentificacion} onChange={set('deudor.tipoIdentificacion')}>
                {TIPOS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">Número de documento *</label>
              <input className="field-input font-mono" placeholder="12345678"
                value={form.deudor.numeroIdentificacion} onChange={set('deudor.numeroIdentificacion')}/>
              <Err k="deudor.numeroIdentificacion"/>
            </div>
            <div>
              <label className="field-label">Email *</label>
              <input className="field-input" type="email" placeholder="juan@email.com"
                value={form.deudor.email} onChange={set('deudor.email')}/>
              <Err k="deudor.email"/>
            </div>
            <div>
              <label className="field-label">Teléfono (opcional)</label>
              <input className="field-input" placeholder="+54 11 1234-5678"
                value={form.deudor.telefono} onChange={set('deudor.telefono')}/>
              <Err k="deudor.telefono"/>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button onClick={onCancel} className="btn-outline">Cancelar</button>
            <button onClick={() => { if (validate1()) setStep(2) }} className="btn-primary">Siguiente →</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="field-label">Monto adeudado (ARS) *</label>
              <input className="field-input font-mono" type="number" min="0" step="0.01" placeholder="150000"
                value={form.deuda.montoAdeudado} onChange={set('deuda.montoAdeudado')}/>
              <Err k="deuda.montoAdeudado"/>
            </div>
            <div>
              <label className="field-label">Período de deuda *</label>
              <input className="field-input" placeholder="Enero 2023 - Diciembre 2024"
                value={form.deuda.periodoDeuda} onChange={set('deuda.periodoDeuda')}/>
              <Err k="deuda.periodoDeuda"/>
            </div>
            <div>
              <label className="field-label">Nombre del beneficiario *</label>
              <input className="field-input" placeholder="María Pérez"
                value={form.deuda.beneficiario.nombre} onChange={set('deuda.beneficiario.nombre')}/>
              <Err k="deuda.beneficiario.nombre"/>
            </div>
            <div>
              <label className="field-label">Parentesco *</label>
              <select className="field-select" value={form.deuda.beneficiario.parentesco} onChange={set('deuda.beneficiario.parentesco')}>
                <option value="">Seleccioná…</option>
                {PARENT.map(p => <option key={p}>{p}</option>)}
              </select>
              <Err k="deuda.beneficiario.parentesco"/>
            </div>
            <div>
              <label className="field-label">Sede *</label>
              <select className="field-select" value={form.sede} onChange={set('sede')}>
                <option value="">Seleccioná una sede…</option>
                {SEDES.map(s => <option key={s}>{s}</option>)}
              </select>
              <Err k="sede"/>
            </div>
            <div className="sm:col-span-2">
              <label className="field-label">Observaciones (opcional)</label>
              <textarea className="field-textarea" rows={3} placeholder="Deuda alimentaria acumulada…"
                value={form.observaciones} onChange={set('observaciones')}/>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button onClick={() => setStep(1)} className="btn-outline">← Anterior</button>
            <button onClick={handleSubmit} disabled={loading} className="btn-primary">
              {loading ? <><Spinner size="sm"/>Creando…</> : 'Crear expediente'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
