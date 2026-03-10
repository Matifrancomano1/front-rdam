import { X, AlertCircle, Inbox, Upload, File, CheckCircle } from 'lucide-react'
import { useRef, useState } from 'react'
import type { EstadoExpediente } from '@/types'
import { ESTADO_CLASS, ESTADO_LABEL, fmt } from '@/utils'
import clsx from 'clsx'

// ── Spinner ───────────────────────────────────
export function Spinner({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const s = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-8 h-8' }[size]
  return (
    <svg className={clsx('animate-spin text-brand-600', s, className)} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"/>
    </svg>
  )
}

export function LoadingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <Spinner size="lg" className="mx-auto mb-3"/>
        <p className="text-sm text-slate-500">Cargando…</p>
      </div>
    </div>
  )
}

// ── Modal ─────────────────────────────────────
interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
  footer?: React.ReactNode
}
export function Modal({ open, onClose, title, size = 'md', children, footer }: ModalProps) {
  if (!open) return null
  const sizeClass = { sm: 'modal-sm', md: 'modal-md', lg: 'modal-lg' }[size]
  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className={clsx('modal-box', sizeClass)}>
        {title && (
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            <button onClick={onClose} className="btn-ghost p-1.5 -mr-1.5 rounded-lg">
              <X size={18}/>
            </button>
          </div>
        )}
        <div className="px-6 py-5">{children}</div>
        {footer && <div className="px-6 pb-5 flex justify-end gap-3">{footer}</div>}
      </div>
    </div>
  )
}

// ── Estado badge ──────────────────────────────
export function EstadoBadge({ estado }: { estado: EstadoExpediente | string }) {
  const cls = ESTADO_CLASS[estado as EstadoExpediente] ?? 'badge-gray'
  const label = ESTADO_LABEL[estado as EstadoExpediente] ?? estado
  return <span className={cls}>{label}</span>
}

// ── Empty state ───────────────────────────────
export function EmptyState({ title, description, action }: {
  title: string; description?: string; action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        <Inbox size={24} className="text-slate-400"/>
      </div>
      <h3 className="text-sm font-semibold text-slate-700 mb-1">{title}</h3>
      {description && <p className="text-xs text-slate-500 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

// ── Pagination ────────────────────────────────
export function Pagination({ page, total, totalPages, onPage }: {
  page: number; total: number; totalPages: number; onPage: (p: number) => void
}) {
  if (totalPages <= 1) return null
  const pages = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1)
  return (
    <div className="flex items-center justify-between text-sm text-slate-600 mt-4">
      <span className="text-xs text-slate-400">{total} resultados</span>
      <div className="flex gap-1">
        <button disabled={page === 1} onClick={() => onPage(page - 1)} className="btn-ghost btn-sm">‹</button>
        {pages.map(p => (
          <button key={p} onClick={() => onPage(p)}
            className={clsx('btn-sm rounded-lg w-8 h-8 p-0 flex items-center justify-center font-medium',
              p === page ? 'bg-brand-600 text-white' : 'btn-ghost')}>
            {p}
          </button>
        ))}
        <button disabled={page === totalPages} onClick={() => onPage(page + 1)} className="btn-ghost btn-sm">›</button>
      </div>
    </div>
  )
}

// ── Skeleton rows ─────────────────────────────
export function SkeletonRows({ cols = 5, rows = 5 }: { cols?: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="border-b border-slate-100">
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c} className="px-4 py-3">
              <div className="h-4 bg-slate-200 rounded animate-pulse" style={{ width: `${60 + Math.random() * 30}%` }}/>
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

// ── File uploader ─────────────────────────────
interface FileUploaderProps {
  accept?: string
  maxMB?: number
  label?: string
  onFile: (f: File) => void
  uploading?: boolean
  progress?: number
  uploaded?: boolean
  error?: string | null
}
export function FileUploader({ accept = 'application/pdf', maxMB = 10, label = 'Seleccioná un PDF', onFile, uploading, progress, uploaded, error }: FileUploaderProps) {
  const ref = useRef<HTMLInputElement>(null)
  const [drag, setDrag] = useState(false)
  const [localErr, setLocalErr] = useState<string | null>(null)

  const validate = (f: File) => {
    if (accept && !f.type.includes('pdf')) { setLocalErr('Solo se aceptan archivos PDF'); return false }
    if (f.size > maxMB * 1024 * 1024) { setLocalErr(`El archivo no puede superar ${maxMB} MB`); return false }
    setLocalErr(null)
    return true
  }

  const handleFile = (f: File | null | undefined) => {
    if (!f) return
    if (validate(f)) onFile(f)
  }

  return (
    <div>
      <div
        className={clsx('drop-zone relative', drag && 'drop-zone-active', uploaded && '!border-emerald-400 !bg-emerald-50')}
        onClick={() => ref.current?.click()}
        onDragOver={e => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]) }}
      >
        <input ref={ref} type="file" accept={accept} className="hidden"
          onChange={e => handleFile(e.target.files?.[0])} />

        {uploaded ? (
          <>
            <CheckCircle size={28} className="mx-auto text-emerald-600 mb-2"/>
            <p className="text-sm font-medium text-emerald-700">Archivo subido correctamente</p>
          </>
        ) : uploading ? (
          <>
            <Spinner className="mx-auto mb-2"/>
            <p className="text-sm text-slate-600">{progress ?? 0}% cargado…</p>
          </>
        ) : (
          <>
            <Upload size={28} className="mx-auto text-slate-400 mb-2"/>
            <p className="text-sm font-medium text-slate-700">{label}</p>
            <p className="text-xs text-slate-400 mt-1">Arrastrá o hacé clic · PDF · máx {maxMB} MB</p>
          </>
        )}
      </div>
      {(localErr || error) && (
        <p className="field-error mt-1"><AlertCircle size={12}/>{localErr || error}</p>
      )}
    </div>
  )
}

// ── Document list item ────────────────────────
export function DocItem({ doc, downloadUrl }: { doc: { id: string; nombreArchivo: string; tamanioBytes: number; fechaSubida: string }; downloadUrl: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-slate-200 bg-white transition-colors">
      <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
        <File size={16} className="text-red-600"/>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{doc.nombreArchivo}</p>
        <p className="text-xs text-slate-400">{fmt.bytes(doc.tamanioBytes)} · {fmt.date(doc.fechaSubida)}</p>
      </div>
      <a href={downloadUrl} target="_blank" rel="noopener noreferrer"
        className="btn-ghost btn-sm text-brand-600 shrink-0" onClick={e => e.stopPropagation()}>
        Ver
      </a>
    </div>
  )
}

// ── Confirm dialog ────────────────────────────
export function ConfirmModal({ open, onClose, onConfirm, title, message, danger = false, loading = false }: {
  open: boolean; onClose: () => void; onConfirm: () => void
  title: string; message: string; danger?: boolean; loading?: boolean
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm"
      footer={<>
        <button onClick={onClose} className="btn-outline" disabled={loading}>Cancelar</button>
        <button onClick={onConfirm} className={danger ? 'btn-danger' : 'btn-primary'} disabled={loading}>
          {loading ? <><Spinner size="sm"/>Procesando…</> : 'Confirmar'}
        </button>
      </>}>
      <p className="text-sm text-slate-600">{message}</p>
    </Modal>
  )
}
