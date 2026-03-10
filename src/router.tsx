import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores'

// Layouts
import PublicLayout from '@/layouts/PublicLayout'
import AppLayout   from '@/layouts/AppLayout'

// Auth
import Login from '@/features/auth/Login'
// Register eliminado — solo Admin crea usuarios desde /app/usuarios

// Portal
import PortalHome      from '@/features/portal/PortalHome'
import PortalResultado from '@/features/portal/PortalResultado'
import PortalPago      from '@/features/portal/PortalPago'
import PortalRetorno   from '@/features/portal/PortalRetorno'
import ValidarCert     from '@/features/portal/ValidarCert'

// App
import Dashboard        from '@/features/dashboard/Dashboard'
import Expedientes      from '@/features/expedientes/Expedientes'
import ExpedienteDetail from '@/features/expedientes/ExpedienteDetail'
import Pagos            from '@/features/pagos/Pagos'
import Certificados     from '@/features/certificados/Certificados'
import Usuarios         from '@/features/usuarios/Usuarios'
import Auditoria        from '@/features/auditoria/Auditoria'

// Guards
function RequireAuth() {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <Outlet/> : <Navigate to="/login" replace/>
}

function RequireAdmin() {
  const { user } = useAuthStore()
  return user?.rol === 'Administrador' ? <Outlet/> : <Navigate to="/app/dashboard" replace/>
}

function RedirectIfAuth() {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <Navigate to="/app/dashboard" replace/> : <Outlet/>
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Root */}
        <Route index element={<Navigate to="/portal" replace/>}/>

        {/* Auth pages (redirect if already logged in) */}
        <Route element={<RedirectIfAuth/>}>
          <Route path="/login" element={<Login/>}/>
        </Route>
        {/* /register redirige a /login — no existe registro público */}
        <Route path="/register" element={<Navigate to="/login" replace/>}/>

        {/* Portal ciudadano - public */}
        <Route path="/portal" element={<PublicLayout/>}>
          <Route index              element={<PortalHome/>}/>
          <Route path="resultado"   element={<PortalResultado/>}/>
          <Route path="pago"        element={<PortalPago/>}/>
          <Route path="retorno"     element={<PortalRetorno/>}/>
          <Route path="validar"     element={<ValidarCert/>}/>
        </Route>

        {/* Panel interno - protected */}
        <Route element={<RequireAuth/>}>
          <Route path="/app" element={<AppLayout/>}>
            <Route index                element={<Navigate to="dashboard" replace/>}/>
            <Route path="dashboard"     element={<Dashboard/>}/>
            <Route path="expedientes"   element={<Expedientes/>}/>
            <Route path="expedientes/:id" element={<ExpedienteDetail/>}/>
            <Route path="pagos"         element={<Pagos/>}/>
            <Route path="certificados"  element={<Certificados/>}/>

            {/* Admin only */}
            <Route element={<RequireAdmin/>}>
              <Route path="usuarios"  element={<Usuarios/>}/>
              <Route path="auditoria" element={<Auditoria/>}/>
            </Route>
          </Route>
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/portal" replace/>}/>
      </Routes>
    </BrowserRouter>
  )
}
