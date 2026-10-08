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


## Implementación EWEB.P3 — Formularios [HECHA, revisión visual pendiente]
- Se reutilizó el constructor real en `src/blocks/hse-control/HseFormsPanel.tsx`, ahora renderizado bajo el mismo `HseControl` que Inicio/Informes/Inspecciones. `/app/hse/forms` ya no crea una pantalla autónoma con su propio login y cabecera.
- Conserva categorías, campos, validación `validateFormSchema`, creación de plantilla, publicación v1 y vista previa; consulta plantillas versionadas existentes. Publicar está limitado por rol `owner/admin` en UI y por RLS administrativo en backend. No se autogeneran registros.
- Se adaptó editor responsive: grillas `formsEditorGrid/formsTwoCol/formsFieldRow`, navegación de escritorio y cabecera web móvil con acceso a Formularios.
- **Estado:** código integrado y compilado en el entorno QA previo; prueba de creación con sesión real no realizada, de forma deliberada para no introducir datos artificiales.

## Implementación EWEB.P4 — Agenda + informes [HECHA, revisión visual pendiente]
- `/app/hse/agenda` usa `HseControl mode="agenda"` y `HseAgendaPanel.tsx`. La navegación no envía a `/app/calendar` (módulo genérico) y el HTML responsive usa la misma URL HSE.
- Agenda muestra vencimientos de hallazgos reales y recordatorios según organización/sitio, permite crear recordatorios `in_app`, marcar pendientes como completados/cancelados con comprobaciones de empresa/sitio/estado; estados vacíos veraces.
- La página documental `/app/hse/reports/[id]` conserva impresión/PDF y enlace a Informes, y requiere sesión/empresa/sitio activo antes de mostrar el documento.
- Se mantuvo `src/blocks/calendar/shared/CalendarPage.tsx` compatible con la firma reforzada de `updateHseReminderStatus` para no romper otras superficies web.
- **Estado:** código integrado; sin recordatorios/hallazgos ficticios y sin prueba de escritura autenticada.

## QA EWEB.P5 — Evidencias objetivas
- `scripts/hse-unified-web.test.mjs`: 4 pruebas de contrato para Formularios, Agenda, informes y rutas/shell web vs app nativa. Integradas en `npm run qa`.
- La web responsive ofrece cinco secciones HSE. `src/blocks/hse-control/HseControl.module.css` incorpora grillas móviles para evitar scroll horizontal en el editor.
- **Fallos encontrados y corregidos durante QA**:
  - `dep-db3smkid0e5s73bdj2p0` BUILD_FAILED por una referencia antigua `/app/calendar` dentro de la navegación responsive, corregida en `15d7e102`.
  - `dep-db3sn6qd0e5s73bdkmng` BUILD_FAILED por una llamada heredada de 2 argumentos a `updateHseReminderStatus` en `CalendarPage.tsx`, corregida en `bae6ac82`.
  - `dep-db3snro473hc73f729tg` **LIVE** (commit `bae6ac82`) con 4/4 pruebas nuevas, TypeScript, lint y Next build correctos.
  - Última compilación para pulido responsive: `dep-db3spebtqb8s73f8j53g`, commit `56db5d02cadc894cda5cbe165be58d0bc4adfe6c`, iniciada; confirmar estado final antes de certificarla.
- SQL de solo lectura (2026-10-08): `form_templates=4`, `form_runs=0`, `form_answers=0`, `reports=0`, `reminders=0`. Son los datos reales; no se deben mostrar informes/recordatorios inventados.
- El pipeline de QA no equivale a prueba de navegador con sesión, fotografía real, impresión física ni APK Android/iOS.
- No se pudo ejecutar Chrome público desde el contenedor de herramientas (DNS externo no disponible). Por eso **QA visual autenticada pendiente**.

## Seguridad y release
- Se generó `database/supabase/proposals/20261008_guard_hse_form_run_answer_integrity.sql` para proteger ejecuciones/respuestas terminales; **propuesta no ejecutada** y fuera de `migrations/` para impedir que se aplique inadvertidamente. Requiere staging de Supabase, pruebas negativas de roles/empresas, revisión de transiciones y rollback.
- `list_branches` no devolvió una rama de desarrollo Supabase disponible. Crear otra requiere una confirmación de costo y no se hizo; no se crearon servicios facturables ni se tocó DB compartida.
- No hay aislamiento RLS por sitio; la interfaz filtra por sitio, pero la política actual sigue siendo membresía organizacional. No presentarlo como aislamiento garantizado en backend.
- `PR #3` continúa draft. **La producción no ha recibido estos cambios.**

## Gate de aceptación que sigue abierto
1. Navegación con sesión real Inicio ↔ Inspecciones ↔ Formularios ↔ Agenda ↔ Informes en escritorio (1366/1440/1920) y web móvil (360–430), sin flashes molestos ni rutas genéricas.
2. Cuenta real autorizada: crear una inspección, guardarla y recuperarla; enviarla, revisar evidencia/fotos privadas y no poder modificarla una vez cerrada.
3. Staging de Supabase con **dos organizaciones y al menos dos roles**; ejecutar propuesta SQL y suite negativa; revisar flujo nativo Expo y rollback.
4. Prueba de publicación de plantilla, recordatorio, impresión de informe real y estados de error/no registros.
5. Con esos resultados, decidir merge/despliegue de producción por PR con respaldo y rollback.

**Siguiente punto exacto si se solicita continuar:** verificar que Render `dep-db3spebtqb8s73f8j53g` está LIVE y confirmar el SHA; luego realizar staging de RLS y aceptación visual autenticada. No reescribir de nuevo las pantallas ni afirmar un E2E inexistente.
