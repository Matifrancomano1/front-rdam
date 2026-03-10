import { format, formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import type { EstadoExpediente } from '@/types'

// ── Formatters ────────────────────────────────
export const fmt = {
  date: (d: string | Date | undefined | null) => {
    if (!d) return '—'
    try { return format(new Date(d), 'dd/MM/yyyy', { locale: es }) } catch { return '—' }
  },
  dateTime: (d: string | Date | undefined | null) => {
    if (!d) return '—'
    try { return format(new Date(d), "dd/MM/yyyy HH:mm", { locale: es }) } catch { return '—' }
  },
  ago: (d: string | Date | undefined | null) => {
    if (!d) return '—'
    try { return formatDistanceToNow(new Date(d), { addSuffix: true, locale: es }) } catch { return '—' }
  },
  money: (n: number | undefined | null) => {
    if (n == null) return '—'
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
  },
  bytes: (b: number) => {
    if (b < 1024) return `${b} B`
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
    return `${(b / (1024 * 1024)).toFixed(1)} MB`
  },
}

// ── Estado helpers ────────────────────────────
export const ESTADO_LABEL: Record<EstadoExpediente, string> = {
  'Pendiente de Revisión':                  'Pendiente',
  'Aprobado - Pendiente de Pago':           'Aprobado',
  'Pago Confirmado - Pendiente Validación': 'Pago Confirmado',
  'Certificado Emitido':                    'Certificado',
  'Rechazado':                              'Rechazado',
  'Expirado':                               'Expirado',
}

export const ESTADO_CLASS: Record<EstadoExpediente, string> = {
  'Pendiente de Revisión':                  'estado-pendiente',
  'Aprobado - Pendiente de Pago':           'estado-aprobado',
  'Pago Confirmado - Pendiente Validación': 'estado-pago-conf',
  'Certificado Emitido':                    'estado-cert',
  'Rechazado':                              'estado-rechazado',
  'Expirado':                               'estado-expirado',
}

// ── Error extractor ───────────────────────────
export function getErrMsg(err: unknown): string {
  if (typeof err === 'object' && err !== null) {
    const e = err as Record<string, unknown>
    const resp = e.response as Record<string, unknown> | undefined
    if (resp?.data) {
      const d = resp.data as Record<string, unknown>
      // NestJS HttpExceptionFilter format: { success, error: { code, message, details } }
      const error = d.error as Record<string, unknown> | undefined
      if (error) {
        // Array de validaciones (422)
        const details = error.details
        if (Array.isArray(details) && details.length > 0) {
          return (details as { message: string }[]).map(x => x.message).join(' · ')
        }
        if (error.message) return String(error.message)
        if (error.code)    return String(error.code)
      }
      // Formato alternativo: { message: string }
      if (d.message) return String(d.message)
    }
    if (e.message) return String(e.message)
  }
  return 'Ocurrió un error inesperado'
}

// ── Permissions ───────────────────────────────
export const canApprove = (estado: EstadoExpediente) => estado === 'Pendiente de Revisión'
// Backend permite rechazar desde Pendiente O desde Aprobado (expedientes.service.ts línea ~180)
export const canReject  = (estado: EstadoExpediente) =>
  estado === 'Pendiente de Revisión' || estado === 'Aprobado - Pendiente de Pago'
export const canPay     = (estado: EstadoExpediente) => estado === 'Aprobado - Pendiente de Pago'
export const canCert    = (estado: EstadoExpediente) => estado === 'Pago Confirmado - Pendiente Validación'
export const hasCert    = (estado: EstadoExpediente) => estado === 'Certificado Emitido'
