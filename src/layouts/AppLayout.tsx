import { useState } from 'react'
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom'
import {
  LayoutDashboard, FolderOpen, CreditCard, Award, Users, ClipboardList,
  Menu, X, Scale, LogOut, ChevronDown, MapPin
} from 'lucide-react'
import { useAuthStore, useSedeStore } from '@/stores'
import { authApi } from '@/api/services'
import clsx from 'clsx'

const SEDES = ['Todas', 'Santa Fe', 'Rosario', 'Venado Tuerto', 'Rafaela', 'Reconquista'] as const

const NAV = [
  { to: '/app/dashboard',    icon: LayoutDashboard, label: 'Dashboard',    roles: ['Administrador', 'Operador'] },
  { to: '/app/expedientes',  icon: FolderOpen,       label: 'Expedientes',  roles: ['Administrador', 'Operador'] },
  { to: '/app/pagos',        icon: CreditCard,       label: 'Pagos',        roles: ['Administrador', 'Operador'] },
  { to: '/app/certificados', icon: Award,            label: 'Certificados', roles: ['Administrador', 'Operador'] },
  { to: '/app/usuarios',     icon: Users,            label: 'Usuarios',     roles: ['Administrador'] },
  { to: '/app/auditoria',    icon: ClipboardList,    label: 'Auditoría',    roles: ['Administrador'] },
]

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, clearAuth } = useAuthStore()
  const { sede, setSede } = useSedeStore()
  const [sedeOpen, setSedeOpen] = useState(false)
  const navigate = useNavigate()

  const navItems = NAV.filter(n => user?.rol && n.roles.includes(user.rol))

  const handleLogout = async () => {
    try { await authApi.logout() } catch { /* noop */ }
    clearAuth()
    navigate('/login')
  }

  const NavItem = ({ item }: { item: typeof NAV[0] }) => (
    <NavLink to={item.to}
      // end={false} → /app/expedientes/:id también marca "Expedientes" como activo
      end={false}
      className={({ isActive }) => clsx(
        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
        isActive
          ? 'bg-brand-600 text-white shadow-sm'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      )}
      onClick={() => setSidebarOpen(false)}>
      <item.icon size={18}/>
      <span>{item.label}</span>
    </NavLink>
  )

  return (
    <div className="min-h-dvh flex bg-slate-50">
      {/* ── Sidebar overlay (mobile) ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)}/>
      )}

      {/* ── Sidebar ── */}
      <aside className={clsx(
        'fixed top-0 left-0 h-full w-64 bg-white border-r border-slate-200 z-50 flex flex-col',
        'transition-transform duration-200',
        'lg:translate-x-0 lg:static lg:z-auto',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100">
          <Link to="/app/dashboard" className="flex items-center gap-2.5" onClick={() => setSidebarOpen(false)}>
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
              <Scale size={15} className="text-white"/>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 leading-tight">RDAM</p>
              <p className="text-[10px] text-slate-400 leading-tight">Gestión Interna</p>
            </div>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="btn-ghost p-1.5 lg:hidden">
            <X size={16}/>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-thin">
          {navItems.map(item => <NavItem key={item.to} item={item}/>)}
        </nav>

        {/* User card */}
        <div className="p-3 border-t border-slate-100">
          <div className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-50 group">
            <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-brand-700">
                {user?.nombre?.slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate">{user?.nombre}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.rol}</p>
            </div>
            <button onClick={handleLogout} title="Cerrar sesión"
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
              <LogOut size={14}/>
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 flex items-center px-4 gap-3">
          <button onClick={() => setSidebarOpen(true)} className="btn-ghost p-2 lg:hidden">
            <Menu size={20}/>
          </button>

          <div className="flex-1"/>

          {/* Sede selector */}
          <div className="relative">
            <button
              onClick={() => setSedeOpen(!sedeOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-medium text-slate-700 transition-colors">
              <MapPin size={14} className="text-brand-500"/>
              <span className="hidden sm:inline">{sede}</span>
              <ChevronDown size={14} className={clsx('text-slate-400 transition-transform', sedeOpen && 'rotate-180')}/>
            </button>
            {sedeOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setSedeOpen(false)}/>
                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-card-lg z-20 py-1">
                  {SEDES.map(s => (
                    <button key={s} onClick={() => { setSede(s); setSedeOpen(false) }}
                      className={clsx('w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition-colors',
                        s === sede ? 'text-brand-600 font-semibold' : 'text-slate-700')}>
                      {s === 'Todas' ? '📍 Todas las sedes' : `📌 ${s}`}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full">
          <Outlet/>
        </main>
      </div>

      {/* ── Bottom nav (mobile) ── */}
      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 z-30 lg:hidden">
        <div className="flex">
          {navItems.slice(0, 5).map(item => (
            <NavLink key={item.to} to={item.to}
              className={({ isActive }) => clsx(
                'flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-[10px] font-medium transition-colors',
                isActive ? 'text-brand-600' : 'text-slate-400'
              )}>
              <item.icon size={20}/>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
