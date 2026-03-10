import { useEffect, useState, useCallback } from 'react'
import { Plus, Search, Edit2, Trash2, AlertCircle } from 'lucide-react'
import { usuariosApi } from '@/api/services'
import type { Usuario, UserRole } from '@/types'
import { fmt, getErrMsg } from '@/utils'
import { Modal, Spinner, ConfirmModal, SkeletonRows, EmptyState } from '@/components/ui'
import { useAuthStore } from '@/stores'
import { toast } from 'react-toastify'
import clsx from 'clsx'

const ROLES: UserRole[] = ['Operador', 'Administrador']
const DEPTOS = ['Santa Fe', 'Rosario', 'Venado Tuerto', 'Rafaela', 'Reconquista']

function UserForm({ user, onSave, onClose, loading, error }: {
  user?: Usuario | null; onSave: (d: Record<string, unknown>) => void
  onClose: () => void; loading: boolean; error: string | null
}) {
  const isEdit = Boolean(user)
  const [form, setForm] = useState({
    nombre:      user?.nombre      ?? '',
    username:    user?.username    ?? '',
    email:       user?.email       ?? '',
    telefono:    user?.telefono    ?? '',
    rol:         user?.rol         ?? 'Operador',
    departamento:user?.departamento?? '',
    activo:      user?.activo      ?? true,
    password:    '',
  })

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }))

  const handleSave = () => {
    const payload: Record<string, unknown> = {
      nombre: form.nombre, email: form.email, telefono: form.telefono || undefined,
      rol: form.rol, departamento: form.departamento, activo: form.activo,
    }
    if (!isEdit) {
      payload.username = form.username
      payload.password = form.password
    }
    onSave(payload)
  }

  return (
    <div className="space-y-4">
      {error && <div className="alert alert-error text-sm"><AlertCircle size={14}/>{error}</div>}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="field-label">Nombre completo *</label>
          <input className="field-input" value={form.nombre} onChange={set('nombre')} placeholder="Juan López"/>
        </div>
        {!isEdit && (
          <div>
            <label className="field-label">Usuario *</label>
            <input className="field-input" value={form.username} onChange={set('username')} placeholder="jlopez"/>
          </div>
        )}
        <div className={isEdit ? 'sm:col-span-2' : ''}>
          <label className="field-label">Email *</label>
          <input className="field-input" type="email" value={form.email} onChange={set('email')} placeholder="jlopez@rdam.gob.ar"/>
        </div>
        <div>
          <label className="field-label">Teléfono</label>
          <input className="field-input" value={form.telefono} onChange={set('telefono')} placeholder="+54 11 3456-7890"/>
        </div>
        <div>
          <label className="field-label">Rol *</label>
          <select className="field-select" value={form.rol} onChange={set('rol')}>
            {ROLES.map(r => <option key={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label className="field-label">Departamento</label>
          <select className="field-select" value={form.departamento} onChange={set('departamento')}>
            <option value="">Seleccioná…</option>
            {DEPTOS.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>
        {!isEdit && (
          <div>
            <label className="field-label">Contraseña *</label>
            <input className="field-input" type="password" value={form.password} onChange={set('password')} placeholder="Min 8 chars, 1 mayúscula, 1 número"/>
          </div>
        )}
        <div className="flex items-center gap-2">
          <input type="checkbox" id="activo" checked={form.activo}
            onChange={e => setForm(p => ({ ...p, activo: e.target.checked }))}
            className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"/>
          <label htmlFor="activo" className="text-sm text-slate-700">Usuario activo</label>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
        <button onClick={onClose} className="btn-outline" disabled={loading}>Cancelar</button>
        <button onClick={handleSave} disabled={loading} className="btn-primary">
          {loading ? <><Spinner size="sm"/>{isEdit ? 'Guardando…' : 'Creando…'}</> : isEdit ? 'Guardar cambios' : 'Crear usuario'}
        </button>
      </div>
    </div>
  )
}

export default function Usuarios() {
  const { user: me } = useAuthStore()
  const [users, setUsers] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editUser, setEditUser] = useState<Usuario | null | undefined>(undefined)
  const [deleteUser, setDeleteUser] = useState<Usuario | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try { const d = await usuariosApi.list(); setUsers(d.usuarios) }
    catch { toast.error('Error cargando usuarios') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = users.filter(u =>
    !search || u.nombre.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase())
  )

  const handleSave = async (payload: Record<string, unknown>) => {
    setActionLoading(true); setFormError(null)
    try {
      if (editUser) {
        await usuariosApi.update(editUser.id, payload)
        toast.success('Usuario actualizado')
      } else {
        await usuariosApi.create(payload)
        toast.success('Usuario creado')
      }
      setEditUser(undefined)
      load()
    } catch (e: unknown) {
      setFormError(getErrMsg(e))
    } finally { setActionLoading(false) }
  }

  const handleDelete = async () => {
    if (!deleteUser) return
    setActionLoading(true)
    try { await usuariosApi.delete(deleteUser.id); toast.success('Usuario desactivado'); setDeleteUser(null); load() }
    catch (e: unknown) { toast.error(getErrMsg(e)) }
    finally { setActionLoading(false) }
  }

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="page-header">
        <div>
          <h1 className="page-title">Usuarios</h1>
          <p className="page-sub">Gestión de operadores y administradores</p>
        </div>
        <button onClick={() => { setEditUser(null); setFormError(null) }} className="btn-primary">
          <Plus size={16}/>Nuevo usuario
        </button>
      </div>

      <div className="card-sm">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
          <input className="field-input pl-9" placeholder="Buscar por nombre, email o usuario…"
            value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
      </div>

      <div className="table-wrap">
        <table className="table-base">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Departamento</th>
              <th>Estado</th>
              <th>Último acceso</th>
              <th/>
            </tr>
          </thead>
          <tbody>
            {loading ? <SkeletonRows cols={7}/> : filtered.length === 0 ? (
              <tr><td colSpan={7}><EmptyState title="Sin usuarios" description="No hay usuarios que coincidan."/></td></tr>
            ) : filtered.map(u => (
              <tr key={u.id} className="cursor-default">
                <td>
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-brand-700">{u.nombre.slice(0,2).toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-800 text-xs">{u.nombre}</p>
                      <p className="text-[10px] text-slate-400">@{u.username}</p>
                    </div>
                  </div>
                </td>
                <td className="text-xs">{u.email}</td>
                <td>
                  <span className={clsx('badge badge-sm', u.rol === 'Administrador' ? 'badge-purple' : 'badge-blue')}>
                    {u.rol}
                  </span>
                </td>
                <td className="text-xs text-slate-500">{u.departamento ?? '—'}</td>
                <td>
                  <span className={clsx('badge', u.activo ? 'badge-green' : 'badge-gray')}>
                    {u.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="text-xs text-slate-400">{fmt.ago(u.ultimoAcceso)}</td>
                <td>
                  {u.id !== me?.id && (
                    <div className="flex gap-1">
                      <button onClick={() => { setEditUser(u); setFormError(null) }} className="btn-ghost p-1.5 rounded-lg">
                        <Edit2 size={13}/>
                      </button>
                      <button onClick={() => setDeleteUser(u)} className="btn-ghost p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50">
                        <Trash2 size={13}/>
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create/Edit modal */}
      {editUser !== undefined && (
        <Modal open title={editUser ? 'Editar usuario' : 'Nuevo usuario'} size="md"
          onClose={() => setEditUser(undefined)}>
          <UserForm user={editUser} onSave={handleSave} onClose={() => setEditUser(undefined)}
            loading={actionLoading} error={formError}/>
        </Modal>
      )}

      <ConfirmModal open={Boolean(deleteUser)} onClose={() => setDeleteUser(null)} onConfirm={handleDelete}
        title="Desactivar usuario" danger loading={actionLoading}
        message={`¿Desactivar a ${deleteUser?.nombre}? El usuario no podrá acceder al sistema.`}/>
    </div>
  )
}
