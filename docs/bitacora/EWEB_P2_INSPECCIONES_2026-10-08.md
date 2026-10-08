# EWEB.P2 — Inspecciones bajo el panel único Informe360 HSE

Fecha de inicio: **2026-10-08**. Estado: **implementación aislada en QA, validación en curso**.

## Antes de tocar código

- Se verificó `docs/bitacora/ESTADO.md`, `ETAPAS.md`, `REGISTRO.md`, PR #3 y HEAD de `feat/hse-phases-1-5`.
- EWEB.P1 (Inicio/Informes) está validada técnicamente, pero su **aceptación visual en sesión real sigue pendiente**. El pedido de continuar autoriza desarrollar la siguiente parte sin afirmar aprobación visual previa.
- Inspecciones existía en `src/app/app/hse/inspections/page.tsx` como pantalla de estilos inline separada del panel HSE, pese a disponer de datos reales en `listFormTemplates`, `listFormRuns` y del RPC `seed_hse_inspection_templates`.
- Rama de trabajo: `feat/hse-e1-offline-resilience-2026-10-08`; PR #3 draft, sin merge.
- Render QA web: `informe360-hse-web-qa` `srv-db3pmdbncjis73bbrvig`, gratuito, `autoDeploy=no`.
- Producción: `informe360-hse` (`feat/hse-phases-1-5`) **no modificada**.

## Partes de EWEB.P2

| Parte | Entrega | Estado |
|---|---|---|
| P2.1 | Inspecciones reutiliza HseControl, login, workspace, menú lateral, topbar, carga discreta y navegación coherente | IMPLEMENTADA |
| P2.2 | Plantillas versionadas y últimas inspecciones con datos reales, filtradas por organización y sitio; conservar instalación optativa de estándares | IMPLEMENTADA |
| P2.3 | Estados vacío/error/carga, búsqueda/filtros y acciones operativas sin romper el motor de inspección existente | PENDIENTE |
| P2.4 | Prueba funcional con cuenta real, integridad/RLS y rutas web responsive; ver si hay ejecución web completa o solo móvil | PENDIENTE |
| P2.5 | Gate Render, QA visual escritorio/móvil y cierre documentado | EN CURSO (gate técnico inicial) |

## Código de P2.1–P2.2

- `src/shared/hse/inspection-view.ts`: filtro por categoría `inspection`, coincidencia de plantilla y limitación de registros al sitio activo; etiquetas legibles para estados de ejecución.
- `src/blocks/hse-control/HseControl.tsx`: modo `inspections` en el mismo shell de Inicio/Informes, menú activo, carga autenticada por workspace, plantillas y ejecuciones consultadas en paralelo, vacíos reales y errores visibles.
- `src/app/app/hse/inspections/page.tsx`: ruta reducida al render de `HseControl mode="inspections"`. Se eliminó la carcasa inline independiente.
- `src/services/hse/forms-browser.ts`: instalación **manual** de estándares reales por RPC, manteniendo el comportamiento anterior; no importar nada en segundo plano.
- `src/blocks/hse-control/HseControl.module.css`: biblioteca responsiva, tarjetas y estados coherentes con Informe360 HSE.
- `scripts/hse-inspections.test.mjs`: unit tests de filtrado por sitio, estados y regresiones de navegación y datos. Se incorpora en `npm run qa`.
- Ninguna migración, cliente Supabase, cuenta ni informe de prueba fue agregado.

## QA pendiente de confirmar

- Primer deploy de QA solicitado a Render: `dep-db3s40jncjis73bjlevg`, SHA `9837a84faa3e273e83a73962dd6d0185c5bc54b2`. **No afirmar LIVE hasta revisar API y logs**.
- Es necesario ejecutar pruebas técnicas completas Next.js y después comprobar visualmente `https://informe360-hse-web-qa.onrender.com/app/hse/inspections` con sesión real.
- Las funciones de iniciar/completar formularios en navegador, si faltan, deben tratarse como etapa separada: no inventar una acción que no esté implementada. La captura offline en Android/iOS sigue siendo un gate paralelo de app móvil.

## Cómo reanudar si el usuario dice «seguí»

1. Revisar esta bitácora y `REGISTRO.md`, PR #3 y HEAD de QA.
2. Comprobar deploy `dep-db3s40jncjis73bjlevg` y registrar cualquier error con su solución.
3. Completar P2.3 (filtros y estados útiles) y P2.4 pruebas de flujo real, luego P2.5 aceptación.
4. No alterar ni desplegar producción antes de gates firmes.
