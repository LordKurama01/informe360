# EWEB.P3–P5 — Cierre progresivo de la web HSE (inicio 2026-10-08)

**Rama:** `feat/hse-e1-offline-resilience-2026-10-08`; PR #3 draft. **QA WEB:** https://informe360-hse-web-qa.onrender.com/app/hse. **No fusionar ni desplegar producción** durante esta ejecución.

## Decisión
Continuar por instrucción expresa «seguí y termina». Cierre técnico de los módulos pendientes, sin declarar aprobados los gates que requieren sesiones reales, permisos multiempresa, staging y controles nativos.

## Plan de trabajo
- **P3 Formularios:** conservar creación/publicación real en Supabase y el mismo esquema dinámico; sustituir carcasa independiente por el panel HSE autenticado, reutilizar constructor/preview y mostrar datos reales. Test de ruta, versión, guardia de rol y no-demo.
- **P4 Agenda:** reemplazar acceso al calendario genérico por agenda HSE de vencimientos de hallazgos y recordatorios reales; mostrar fecha, prioridad/estado y gestionar recordatorios solo mediante acciones explícitas. Mantener el calendario genérico fuera de HSE.
- **P4 Informes detallados:** conservar documento imprimible A4 como vista documental deliberada, con regreso inequívoco a Informes y verificación de ámbito antes de leer.
- **P5 QA integral:** tests de navegación compartida, roles, filtros, rutas profundas, datos/estados vacíos, TypeScript/ESLint/Next build en Render. Documentar limitaciones no verificadas y pruebas faltantes.
- **Seguridad EWEB.P2.5:** preparar recomendaciones/migración de inmutabilidad de runs/respuestas para revisión. No aplicar a Supabase compartido sin staging y pruebas de múltiples empresas/cuentas. Ver [auditoría RLS](EWEB_P2_4_AUDITORIA_RLS_2026-10-08.md).

## Estado inicial verificado
- Render WEB QA último `dep-db3sg22jnfac738k47sg` **LIVE**; PR #3 open/draft. `feat/hse-phases-1-5` rama productiva protegida, `HEAD 422f8bcb...`.
- Formularios `src/app/app/hse/forms/page.tsx` existe con estilos inline y autenticación propia; debe integrarse al HseControl.
- Agenda HSE actual enlaza `/app/calendar`, módulo genérico de otro producto. `getHseReminders`/`createHseReminder`/`getHseFindings` ya existen y se deben reutilizar.
- Reporte detalle `/app/hse/reports/[id]` existe como documento imprimible; conservar su modalidad de impresión con navegación clara.
