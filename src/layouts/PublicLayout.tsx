import { Outlet, Link, useLocation } from 'react-router-dom'
import { Scale } from 'lucide-react'

export default function PublicLayout() {
  const loc = useLocation()
  const isValidar = loc.pathname.includes('validar')

  return (
    <div className="min-h-dvh flex flex-col bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/portal" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
              <Scale size={15} className="text-white"/>
            </div>
            <div>
              <span className="text-sm font-bold text-slate-900">RDAM</span>
              <span className="hidden sm:inline text-xs text-slate-400 ml-2">Provincia de Santa Fe</span>
            </div>
          </Link>
          <nav className="flex items-center gap-1">
            <Link to={isValidar ? '/portal' : '/portal/validar'}
              className="btn-ghost text-xs">
              {isValidar ? '← Consultar expediente' : 'Validar certificado'}
            </Link>
            <Link to="/login" className="btn-outline text-xs px-3 py-1.5">
              Panel interno
            </Link>
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">
        <Outlet/>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <span>© 2026 Gobierno de la Provincia de Santa Fe · Sistema RDAM</span>
          <span>Versión 3.0 · API v2.2</span>
        </div>
      </footer>
    </div>
  )
}
