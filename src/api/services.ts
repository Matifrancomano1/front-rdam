import { api, publicApi } from './client'
import type {
  AuthUser, Tokens, Expediente, ExpedientePagination,
  BusquedaPublicaResp, OrdenPagoResp, EstadoPagoPublico,
  Usuario, DashboardMetrics, Actividad,
  CertValidacion, AuditoriaLog,
  Pago, HistorialItem, Documento
} from '@/types'

// ─── AUTH ────────────────────────────────────
export const authApi = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }).then(r => r.data.data as { user: AuthUser; tokens: Tokens }),
  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }).then(r => r.data.data as { accessToken: string }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me').then(r => r.data.data as AuthUser),
  register: (payload: { username: string; email: string; password: string; nombre: string }) =>
    api.post('/auth/register', payload).then(r => r.data),
  verifyEmail: (token: string) =>
    publicApi.get(`/auth/verify?token=${token}`).then(r => r.data),
  resendVerification: (email: string) =>
    api.post('/auth/resend-verification', { email }).then(r => r.data),
}

// ─── EXPEDIENTES ─────────────────────────────
export const expedientesApi = {
  list: (params: Record<string, unknown>) =>
    api.get('/expedientes', { params }).then(r => {
      console.log('[list] raw:', r.data)
      return r.data.data as ExpedientePagination
    }),
  get: (id: string) =>
    api.get(`/expedientes/${id}`).then(r => r.data.data as Expediente),
  create: (payload: unknown) =>
    api.post('/expedientes', payload).then(r => r.data.data as Expediente),
  update: (id: string, payload: unknown) =>
    api.put(`/expedientes/${id}`, payload).then(r => r.data.data as Expediente),
  delete: (id: string) =>
    api.delete(`/expedientes/${id}`).then(r => r.data),
  aprobar: (id: string, observaciones: string) =>
    api.post(`/expedientes/${id}/aprobar`, { observaciones }).then(r => r.data.data),
  rechazar: (id: string, observaciones: string) =>
    api.post(`/expedientes/${id}/rechazar`, { observaciones }).then(r => r.data.data),
  // → { expedienteId, numeroExpediente, historial: HistorialItem[] }
  historial: (id: string) =>
    api.get(`/expedientes/${id}/historial`).then(r => {
      const d = r.data.data as { historial: HistorialItem[] }
      return d?.historial ?? [] as HistorialItem[]
    }),
  validarPago: (id: string, pagoId: string, observaciones: string) =>
    api.post(`/expedientes/${id}/validar-pago`, { pagoId, observaciones }).then(r => r.data.data),
  // ⚠️ Devuelve { expedienteId, pagos: string[] } — IDs, NO objetos Pago
  pagoIds: (id: string) =>
    api.get(`/expedientes/${id}/pagos`).then(r => {
      const d = r.data.data as { pagos: string[] }
      return d?.pagos ?? [] as string[]
    }),
  listarDocs: (id: string) =>
    api.get(`/expedientes/${id}/documentos`).then(r => {
      const d = r.data.data as { documentos: Documento[] }
      return d?.documentos ?? [] as Documento[]
    }),
  subirDoc: (id: string, file: File, onProgress?: (pct: number) => void) => {
    const fd = new FormData()
    fd.append('archivo', file)
    return api.post(`/expedientes/${id}/documentos`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => { if (onProgress && e.total) onProgress(Math.round(e.loaded * 100 / e.total)) },
    }).then(r => r.data.data as Documento)
  },
  downloadDocUrl: (expId: string, docId: string) =>
    `/v1/expedientes/${expId}/documentos/${docId}/descargar`,
  // ⚠️ Solo acepta PDF, solo funciona en estado 'Pago Confirmado - Pendiente Validación'
  // ⚠️ Transiciona AUTOMÁTICAMENTE a 'Certificado Emitido'
  subirCertificado: (id: string, file: File, onProgress?: (pct: number) => void) => {
    const fd = new FormData()
    fd.append('archivo', file)
    return api.post(`/expedientes/${id}/certificado`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => { if (onProgress && e.total) onProgress(Math.round(e.loaded * 100 / e.total)) },
    }).then(r => r.data.data)
  },
  // ⚠️ REQUIERE JWT — solo operadores/admin o ciudadano con email coincidente
  descargarCertificadoUrl: (expId: string) => `/v1/expedientes/${expId}/certificado/descargar`,
  descargarCertificadoPublicoUrl: (expId: string, dni: string, email: string) => {
    const base = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    return `${base}/v1/expedientes/${expId}/certificado/descargar-publico?dni=${encodeURIComponent(dni)}&email=${encodeURIComponent(email)}`
  },
  solicitarCodigo: (dni: string, email: string) =>
    publicApi.post('/expedientes/publico/solicitar-codigo', { dni, email }).then(r => r.data),
  // ⚠️ TODOS los parámetros obligatorios — backend lanza 400 si falta alguno
  buscarPublico: (dni: string, email: string, codigo: string) =>
    publicApi.get('/expedientes/publico/buscar', { params: { dni, email, codigo } }).then(r => {
      console.log('[buscarPublico] raw:', r.data)
      return r.data.data as BusquedaPublicaResp
    }),
}

// ─── PAGOS ───────────────────────────────────
export const pagosApi = {
  crearOrden: (expedienteId: string, monto: number, email: string) =>
    api.post('/pagos/crear-orden', { expedienteId, monto, email }).then(r => r.data.data as OrdenPagoResp),
  crearOrdenPublica: (expedienteId: string, monto: number, email: string) =>
    publicApi.post('/pagos/crear-orden-publica', { expedienteId, monto, email }).then(r => {
      console.log('[crearOrdenPublica] raw:', r.data)
      return r.data.data as OrdenPagoResp
    }),
  estadoPorReferencia: (referencia: string) =>
    publicApi.get(`/pagos/estado-por-referencia/${referencia}`).then(r => r.data.data as EstadoPagoPublico),
  listar: () =>
    api.get('/pagos').then(r => {
      const d = r.data.data
      return (Array.isArray(d) ? d : []) as Pago[]
    }),
  getPagoById: (id: string) =>
    api.get(`/pagos/${id}`).then(r => r.data.data as Pago),
  submitFormPlusPagos: (checkoutUrl: string, formData: Record<string, string>) => {
    const form = document.createElement('form')
    form.method = 'POST'
    form.action = checkoutUrl
    Object.entries(formData).forEach(([key, val]) => {
      const input = document.createElement('input')
      input.type = 'hidden'; input.name = key; input.value = val
      form.appendChild(input)
    })
    document.body.appendChild(form)
    form.submit()
  },
  sseEventos: (referencia: string, onEvent: (data: { tipo: string; [k: string]: unknown }) => void) => {
    const source = new EventSource(`/v1/pagos/eventos/${referencia}`)
    source.onmessage = (e) => { try { onEvent(JSON.parse(e.data)) } catch { /* noop */ } }
    source.onerror = () => source.close()
    return source
  },
}

// ─── CERTIFICADOS ────────────────────────────
export const certificadosApi = {
  validar: (numero: string) =>
    publicApi.get(`/certificados/validar/${numero}`).then(r => {
      console.log('[certificados.validar] raw:', r.data)
      return r.data.data
    }),
}

// ─── USUARIOS ────────────────────────────────
export const usuariosApi = {
  list: (params?: Record<string, unknown>) =>
    api.get('/usuarios', { params }).then(r => {
      const d = r.data.data as { usuarios: Usuario[]; pagination: unknown }
      return { usuarios: d?.usuarios ?? [], pagination: d?.pagination ?? {} }
    }),
  get: (id: string) => api.get(`/usuarios/${id}`).then(r => r.data.data as Usuario),
  create: (payload: unknown) => api.post('/usuarios', payload).then(r => r.data.data as Usuario),
  update: (id: string, payload: unknown) => api.put(`/usuarios/${id}`, payload).then(r => r.data.data as Usuario),
  delete: (id: string) => api.delete(`/usuarios/${id}`).then(r => r.data),
  changePassword: (id: string, payload: { currentPassword: string; newPassword: string; confirmPassword: string }) =>
    api.put(`/usuarios/${id}/password`, payload).then(r => r.data),
}

// ─── DASHBOARD ───────────────────────────────
export const dashboardApi = {
  metricas: () => api.get('/dashboard/metricas').then(r => r.data.data as DashboardMetrics),
  actividadReciente: (limit = 10) =>
    api.get('/dashboard/actividad-reciente', { params: { limit } }).then(r => {
      const d = r.data.data as { actividades: Actividad[] }
      return d?.actividades ?? [] as Actividad[]
    }),
}

// ─── AUDITORÍA ───────────────────────────────
export const auditoriaApi = {
  list: (params?: Record<string, unknown>) =>
    api.get('/auditoria', { params }).then(r => {
      const d = r.data.data as { logs: AuditoriaLog[]; pagination: unknown }
      return { logs: d?.logs ?? [], pagination: d?.pagination ?? {} }
    }),
}
