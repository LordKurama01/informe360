# EWEB.P1.5 — Ajuste de loader y slider de navegación

Fecha: 2026-10-08 (Argentina). Rama aislada `feat/hse-e1-offline-resilience-2026-10-08`; PR #3 draft. QA: `https://informe360-hse-web-qa.onrender.com/app/hse`. **Producción no tocada.**

## Síntoma reportado
El usuario observó un *loading* muy rápido y molesto al cambiar entre Inicio e Informes y pidió mejorar el slider lateral. No se pidió modificar la app Android/iOS.

## Causa verificada en código antes de modificar
1. `HseControl` inicializaba `booting=true` cada vez que montaba la ruta Next.js y mostraba inmediatamente un layout de **pantalla de acceso a dos columnas** con el texto «Preparando tu espacio operativo». Al recibir los datos, reemplazaba toda la página por el dashboard. Un viaje de red rápido provocaba un destello.
2. `loadWorkspace` dependía de `query`: cada carácter del buscador disparaba nuevamente `auth.getUser`, lectura de empresa, `hse_dashboard_summary` y hallazgos. Además, el distintivo «Actualizando datos…» parpadeaba.
3. El menú izquierdo tenía un estado activo estático, sin un indicador claro ni transición suave.

## Implementado (parte EWEB.P1.5 de la etapa 1/5)
- `HseControl.tsx`: **sin splash en cargas breves**. El primer estado mantiene el fondo del dashboard; el skeleton lateral/del área de contenido solo aparece si el acceso tarda más de 320 ms. Se elimina la pantalla de login reutilizada como loader.
- Buscar hallazgos utiliza efecto independiente con debounce de **280 ms**; conserva los resultados previos mientras termina la búsqueda y cancela el resultado de peticiones antiguas. No vuelve a leer sesión/empresa/KPI por cada tecla. Al limpiar búsqueda, restaura los hallazgos originales.
- `HseControl.module.css`: skeleton que replica proporciones del panel HSE; transición discreta de contenido y slider de sección activa en el menú lateral. Respeta `prefers-reduced-motion`, foco de teclado y vista web móvil.
- `scripts/hse-loading-ux.test.mjs`: tres pruebas de regresión estructural para loader diferido, desacople de búsqueda y accesibilidad del slider; incorporadas a `npm run qa`.

## Validación y seguridad
- Trigger Render QA: `dep-db3r272j9qps738o1mr0` sobre SHA funcional `c6b88cda8a522dd44c3c634d7dba73da6bd9ec22`. **Consultar resultado final antes de afirmar LIVE/QA exitosa.**
- No se publicaron datos de sesión, no se alteraron permisos, RLS, DB ni la app nativa.
- No se garantiza un tiempo real de carga: depende de Supabase/conexión. Se evita el destello de un loader fugaz, no se ocultan errores.
- La revisión visual presencial sigue pendiente. Verificar especialmente navegación Inicio ↔ Informes y escritura en búsqueda desde 1366–1920 px y móvil web, con sesión autenticada.

## Próxima acción al decir «seguí»
1. Comprobar deploy `dep-db3r272j9qps738o1mr0` y logs, corregir errores de typecheck, tests o build si aparecen.
2. Revisar visualmente el slider/sidebar y la desaparición del loading corto en navegador real, registrar aceptación.
3. Cerrar EWEB.P1.5 y pasar a EWEB.P2 Inspecciones. **No integrar ni desplegar producción sin gate.**
