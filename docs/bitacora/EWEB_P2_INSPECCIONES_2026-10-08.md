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
| P2.3 | Estados vacío/error/carga y filtros Todas/Pendientes/Presentadas, búsqueda de plantillas y ejecuciones sin consultar servidor en cada tecla | VALIDADA EN QA RENDER; revisión visual pendiente |
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


## EWEB.P2.3 — Búsqueda y filtros
- `src/shared/hse/inspection-view.ts`: filtro puro que segmenta borrador/en curso, presentadas/completadas y todas; acepta búsqueda de nombres de plantillas y no modifica los registros originales. También preserva estados no reconocidos, sin inventar equivalencias.
- `HseControl.tsx`: entrada única para buscar plantillas e inspecciones, filtros accesibles con `aria-pressed`, contadores derivados de los resultados, y mensaje diferenciado si hay cero datos o ningún resultado de la búsqueda.
- `scripts/hse-inspections.test.mjs`: nuevas pruebas de búsqueda por texto, filtros por estado, inmutabilidad, accesibilidad y navegación. Corren dentro del QA habitual.
- **Primer deploy P2.1/P2.2:** `dep-db3s40jncjis73bjlevg` **LIVE** con `9837a84faa3e273e83a73962dd6d0185c5bc54b2`, build Next aprobado.
- **Segundo deploy P2.3:** `dep-db3s5qij9qps738rkao0`, commit `1504afea91e5e594bf07a7c24c3318ad57ea8f66`. Estado pendiente hasta confirmación de la API de Render.
- P2.4/P2.5 no están cerradas, y EWEB.P1 sigue esperando la aceptación visual presencial. No se hicieron cambios productivos.


## Resultado confirmado del segundo deploy
- `dep-db3s5qij9qps738rkao0` **LIVE**, commit `1504afea91e5e594bf07a7c24c3318ad57ea8f66`, finalizado el 2026-10-08T16:22:41Z. `npm run qa`, TypeScript, ESLint y Next build pasaron, incluidas las pruebas de filtros.
- Abrir https://informe360-hse-web-qa.onrender.com/app/hse/inspections para revisar la interfaz. No se ejecutaron pruebas de interacción con credenciales ni se ha aprobado visualmente.
- La rama Render de producción sigue sin merge y sin despliegues nuevos.


## EWEB.P2.4 — Inicio, reanudación y envío web de inspecciones (2026-10-08)

### Auditoría previa (sin alterar datos)
- Se verificaron por SQL de solo lectura la función `create_form_run`, columnas, constraints y todas las políticas RLS relacionadas con `form_runs`, `form_answers`, plantillas/versiones. Supabase contiene cuatro plantillas publicadas; no se crearon ejecuciones ni respuestas de prueba.
- `create_form_run` es invoker y valida plantilla publicada, pertenencia a organización, pertenencia del sitio y `client_run_id` idempotente.
- Se detectaron carencias de inmutabilidad para `form_runs_update` y `form_answers_update/delete`. Ver [auditoría detallada y bloqueos de producción](EWEB_P2_4_AUDITORIA_RLS_2026-10-08.md). RLS protege la organización, **no otorga aislamiento por sitio en backend**.

### Funcionalidad implementada
- `src/services/hse/forms-browser.ts`: `startHseInspection` con RPC de la app móvil, UUID idempotente y plantilla activa; `getHseInspection` consulta registro/version/schema/respuestas por empresa y sitio; `saveHseInspectionDraft` guarda respuestas autorizadas del esquema; `submitHseInspection` valida obligatorios y estado editable; fotografía privada `hse-evidence` con URL firmada y ruta asociada a la ejecución.
- `src/blocks/hse-control/HseControl.tsx`: botón «Iniciar inspección» por plantilla activa; historial abre detalle; sección Inspecciones permanece seleccionada en el menú.
- `src/app/app/hse/inspections/[runId]/page.tsx`: ruta versionada que carga la misma web HSE.
- `src/blocks/hse-control/HseInspectionRunPanel.tsx`: campos reales de cumplimiento, sí/no, texto, número, fecha, opciones, matriz y fotografía; guardado explícito, presentación con validación y modo de solo lectura cuando status está cerrado. Los `repeater` quedan visibles pero el envío web se bloquea hasta que su editor esté desarrollado; la app nativa conserva su compatibilidad.
- `HseControl.module.css`: editor responsive que preserva el diseño HSE.
- `scripts/hse-inspection-run.test.mjs`: tests de creación, restricciones, guardado, validación y fotos privadas, incluido `npm run qa`.
- No se insertaron datos falsos ni se modificó la base. Las operaciones de guardado se ejecutarán solo cuando el usuario las solicite desde la interfaz.

### QA y correcciones
- Primer deploy `dep-db3sfh0473hc73f675ag` **BUILD_FAILED**: test anterior esperaba un estado activo de navegación únicamente para el listado, no la nueva ruta de detalle. Se corrigió el test en `954ff4a155f42108b624e3c07459c95947ce9dfa`.
- Segundo deploy `dep-db3sg22jnfac738k47sg`, SHA `954ff4a155f42108b624e3c07459c95947ce9dfa`: comprobación Render en curso al redactar, no confirmar LIVE todavía.
- **No se realizó una prueba autenticada de envío con usuario real**. La QA estructural/TypeScript no sustituye esa prueba ni la migración de inmutabilidad.

### Próximo bloque
1. Confirmar Render LIVE y registrar resultado final.
2. Comprobar en sesión real «Iniciar» → «Guardar borrador» → salir y reingresar → «Presentar», campos foto, estado de solo lectura; revisar errores de Storage.
3. Preparar y probar endurecimiento RLS/triggers en staging aislado con dos organizaciones y roles distintos. No tocar Supabase compartido sin este gate.
4. Cerrar EWEB.P2.5 solo con aceptación visual/funcional y después abordar EWEB.P3 Formularios.
