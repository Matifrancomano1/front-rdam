# RDAM Frontend v3.0

Sistema de gestión del Registro de Deudores Alimentarios Morosos · Provincia de Santa Fe

## Stack

| Capa        | Tecnología                              |
|-------------|-----------------------------------------|
| Framework   | React 18 + TypeScript 5                 |
| Build       | Vite 5 + proxy `/v1` → `localhost:3000` |
| Estilos     | Tailwind CSS 3 (Plus Jakarta Sans)      |
| Estado      | Zustand 4 (auth + sede, persistido)     |
| Forms       | useState nativo (sin librerías)         |
| HTTP        | Axios 1.7 + interceptor JWT refresh     |
| Notifs      | react-toastify                          |
| Iconos      | lucide-react                            |
| Fechas      | date-fns (es-AR)                        |

## Setup

```bash
cp .env.example .env   # editar si el backend no corre en :3000
npm install
npm run dev            # → http://localhost:5173
```

Backend en `http://localhost:3000`, PlusPagos mock en `http://localhost:10000`.

---

## Arquitectura

```
src/
├── api/
│   ├── client.ts          # Axios instance + interceptor JWT refresh
│   └── services.ts        # Todos los servicios (auth, exp, pagos, cert…)
├── stores/
│   └── index.ts           # Zustand: useAuthStore, useSedeStore
├── types/index.ts         # Todos los tipos TypeScript (API Contract v2.2)
├── utils/index.ts         # fmt, ESTADO_*, getErrMsg, canApprove…
├── layouts/
│   ├── PublicLayout.tsx   # Portal ciudadano (sin auth)
│   └── AppLayout.tsx      # Panel interno (sidebar + header + sede)
├── components/
│   └── ui.tsx             # Spinner, Modal, EstadoBadge, FileUploader, etc.
├── features/
│   ├── auth/              # Login, Register
│   ├── portal/            # PortalHome, Resultado, Pago, Retorno, ValidarCert
│   ├── dashboard/         # Dashboard con KPIs y actividad
│   ├── expedientes/       # Lista + Detalle (tabs) + Form
│   ├── pagos/             # Lista de pagos
│   ├── certificados/      # Validador
│   ├── usuarios/          # CRUD completo (Admin only)
│   └── auditoria/         # Logs con filtros (Admin only)
└── router.tsx             # BrowserRouter + guards RequireAuth, RequireAdmin
```

---

## Flujos clave

### Portal ciudadano (público, sin login)

```
/portal → ingresar DNI
→ GET /expedientes/publico/buscar?dni=X
→ /portal/resultado → ver estado + docs
  ├── Si "Aprobado" → /portal/pago → POST /pagos/crear-orden-publica
  │   → auto-submit form a PlusPagos (puerto 10000)
  │   → redirect a /portal/retorno?estado=aprobado&referencia=TXN-XXX
  │   → SSE /pagos/eventos/TXN-XXX + polling cada 5s
  │   → mostrar confirmación/rechazo
  └── Si "Cert. Emitido" → descargar certificado
```

### Flujo de pago interno (Operador)

```
ExpedienteDetail → "Iniciar pago" → POST /pagos/crear-orden
→ auto-submit form a PlusPagos
→ webhook POST /webhooks/pago-confirmado (backend)
→ Operador → "Validar pago" → POST /expedientes/:id/validar-pago
→ "Subir certificado" → POST /expedientes/:id/certificado (multipart/form-data)
```

---

## Roles

| Módulo        | Operador | Admin |
|---------------|:--------:|:-----:|
| Dashboard     | ✓        | ✓     |
| Expedientes   | ✓        | ✓     |
| Pagos         | ✓        | ✓     |
| Certificados  | ✓        | ✓     |
| Usuarios      | ✗        | ✓     |
| Auditoría     | ✗        | ✓     |

---

## Problemas anteriores solucionados

1. ✅ Ciudadano busca **solo por DNI** (endpoint `/expedientes/publico/buscar?dni=X`)
2. ✅ Sin panel de login para ciudadanos — acceso directo al portal
3. ✅ Botón "Expedientes" en sidebar navega correctamente a `/app/expedientes`
4. ✅ Auditoría explicada y accesible solo para Admin (logs de acciones del sistema)
5. ✅ Usuarios: CRUD completo con validaciones, crear/editar/desactivar
6. ✅ Portal guía al ciudadano paso a paso (3 pasos visuales)
7. ✅ Panel de subida de certificados PDF post-validación de pago
8. ✅ Todas las llamadas conectadas al API Contract v2.2 real
