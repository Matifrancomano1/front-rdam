/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        brand: {
          50:  '#eef3ff',
          100: '#dce7fe',
          200: '#b9cffd',
          300: '#86acfc',
          400: '#4d7ff9',
          500: '#2563eb',
          600: '#1d4ed8',
          700: '#1e40af',
          800: '#1e3a8a',
          900: '#1e3366',
        },
        slate: {
          50:  '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.07), 0 1px 2px -1px rgb(0 0 0 / 0.07)',
        'card-hover': '0 4px 12px 0 rgb(0 0 0 / 0.10)',
        'card-lg': '0 8px 24px -4px rgb(0 0 0 / 0.12)',
      },
    },
  },
  plugins: [],
  safelist: [
    // EstadoBadge — clases generadas dinámicamente desde ESTADO_CLASS en utils
    'estado-pendiente', 'estado-aprobado', 'estado-pago-conf',
    'estado-cert', 'estado-rechazado', 'estado-expirado',
    // Badges por tipo
    'badge-blue', 'badge-green', 'badge-yellow',
    'badge-red', 'badge-purple', 'badge-gray',
    // Bordes de cards resultado portal
    'border-l-emerald-500', 'border-l-brand-500',
    'border-l-red-500', 'border-l-purple-500', 'border-l-amber-400',
  ],
}
