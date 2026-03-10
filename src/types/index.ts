// ──────────────────────────────────────────────
// AUTH
// ──────────────────────────────────────────────
export type UserRole = 'Administrador' | 'Operador'

export interface AuthUser {
  id: string
  username: string
  nombre: string
  email: string
  telefono?: string
  rol: UserRole
  departamento: string
  activo: boolean
  isVerified: boolean
  fechaCreacion: string
  ultimoAcceso: string
}

export interface Tokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
  tokenType: 'Bearer'
}

// ──────────────────────────────────────────────
// EXPEDIENTES
// ──────────────────────────────────────────────
export type EstadoExpediente =
  | 'Pendiente de Revisión'
  | 'Aprobado - Pendiente de Pago'
  | 'Pago Confirmado - Pendiente Validación'
  | 'Certificado Emitido'
  | 'Rechazado'
  | 'Expirado'

export type SedeType = 'Santa Fe' | 'Rosario' | 'Venado Tuerto' | 'Rafaela' | 'Reconquista'

export interface Deudor {
  nombreCompleto: string
  tipoIdentificacion: 'DNI' | 'CEDULA' | 'PASAPORTE'
  numeroIdentificacion: string
  email: string
  telefono?: string
}

export interface Beneficiario {
  nombre: string
  parentesco: string
}

export interface Deuda {
  montoAdeudado: number
  periodoDeuda: string
  beneficiario: Beneficiario
}

export interface Documento {
  id: string
  nombreArchivo: string
  tipoMime: string
  tamanioBytes: number
  url: string
  subidoPor?: string
  fechaSubida: string
}

export interface Pago {
  id: string
  monto: number
  moneda: string
  metodoPago?: string
  referenciaExterna: string
  estadoPago: 'pendiente' | 'confirmado' | 'rechazado'
  fechaPago: string
  fechaConfirmacion?: string
  validacion?: {
    validadoPor: string
    nombreUsuario: string
    fechaValidacion: string
    observaciones: string
  }
  datosPasarela?: {
    ultimosCuatroDigitos: string
    marca: string
    cuotas?: number
  }
}

export interface HistorialItem {
  id: string
  estadoAnterior: EstadoExpediente | null
  estadoNuevo: EstadoExpediente
  usuario: { id: string; nombre: string }
  fechaCambio: string
  observaciones: string
  ipAddress?: string
}

export interface Expediente {
  id: string
  numeroExpediente: string
  deudor: Deudor
  deuda: Deuda
  estado: {
    actual: EstadoExpediente
    fechaActualizacion: string
    fechaExpiracion?: string | null
  }
  pagos?: Pago[]
  documentos?: Documento[]
  metadata?: {
    fechaCreacion: string
    fechaActualizacion: string
    usuarioCreacion: string
    usuarioAsignado?: string
    observaciones?: string
    sede?: SedeType
    activo: boolean
  }
}

export interface ExpedientePagination {
  expedientes: Expediente[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// ──────────────────────────────────────────────
// PORTAL CIUDADANO
// ──────────────────────────────────────────────
export interface BusquedaPublicaResp {
  id: string
  numeroExpediente: string
  deudor: Deudor
  deuda: Deuda
  estado: {
    actual: EstadoExpediente
    fechaActualizacion: string
    fechaExpiracion?: string | null
  }
  documentos: Documento[]
  tieneCertificado: boolean
}

// ──────────────────────────────────────────────
// PAGOS
// ──────────────────────────────────────────────
export interface OrdenPagoResp {
  pagoId: string
  expedienteId: string
  monto: number
  moneda: string
  referenciaExterna: string
  checkoutUrl: string
  plusPagosFormData: Record<string, string>
  estadoPago: string
  fechaCreacion: string
  fechaExpiracion: string
}

export interface EstadoPagoPublico {
  pagoId: string
  expedienteId: string
  numeroExpediente: string
  monto: number
  moneda: string
  estadoPago: 'pendiente' | 'confirmado' | 'rechazado'
  referenciaExterna: string
  fechaPago: string
  fechaConfirmacion?: string
  datosPasarela?: { ultimosCuatroDigitos: string; marca: string }
  estadoExpediente: EstadoExpediente
}

// ──────────────────────────────────────────────
// USUARIOS
// ──────────────────────────────────────────────
export interface Usuario {
  id: string
  username: string
  nombre: string
  email: string
  telefono?: string
  rol: UserRole
  departamento: string
  activo: boolean
  fechaCreacion?: string
  ultimoAcceso?: string
}

// ──────────────────────────────────────────────
// DASHBOARD
// ──────────────────────────────────────────────
export interface DashboardMetrics {
  totales: {
    expedientes: number
    pendientesRevision: number
    pendientesValidacionPago: number
    certificadosEmitidos: number
  }
  porEstado: { estado: EstadoExpediente; cantidad: number; porcentaje: number }[]
  tendencias: {
    ultimoMes: { nuevos: number; aprobados: number; rechazados: number; certificados: number }
    variacion:  { nuevos: number; aprobados: number; rechazados: number; certificados: number }
  }
  alertas: { proximosExpirar: number; pendientesVencidos: number }
}

export interface Actividad {
  id: string
  tipo: string
  expediente: { id: string; numeroExpediente: string; deudor: string }
  usuario: { id: string; nombre: string }
  fecha: string
}

// ──────────────────────────────────────────────
// CERTIFICADOS
// ──────────────────────────────────────────────
export interface CertValidacion {
  valido: boolean
  numeroCertificado: string
  expediente: string
  deudor: string
  numeroIdentificacion: string
  fechaEmision: string
  fechaVencimiento: string
  estado: string
  revocado: boolean
}

export interface Certificado {
  id: string
  numeroCertificado: string
  expedienteId: string
  fechaEmision: string
  fechaVencimiento: string
  archivoUrl: string
  codigoQR: string
  hash: string
  revocado: boolean
}

// ──────────────────────────────────────────────
// AUDITORIA
// ──────────────────────────────────────────────
export interface AuditoriaLog {
  id: string
  usuario: { id: string; nombre: string; email: string }
  accion: string
  entidad: string
  entidadId: string
  ipAddress: string
  userAgent?: string
  detalles?: Record<string, unknown>
  fecha: string
}
