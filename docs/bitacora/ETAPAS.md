# Plan ejecutable por etapas y partes — Informe360 HSE

**Principio:** mantener `mobile/` Expo/React Native, la web Next.js y **Supabase como única fuente de verdad**. No importar otra aplicación ni tocar producción sin gate. Este plan describe **trabajo futuro**: los archivos ya presentes se auditan antes de tratarlos como tareas pendientes.

## Estados y cierre
- **PENDIENTE:** sin trabajo de esta parte.
- **EN CURSO:** trabajo registrado, gate no cerrado.
- **IMPLEMENTADA SIN QA:** código presente pero aceptación no demostrada.
- **BLOQUEADA:** falta verificación externa, permiso, entorno o test; explicar causa.
- **VALIDADA:** evidencia de QA y aceptación documentada.
- **DESCARTADA:** decisión con motivo y alternativa.

Cada parte tiene: entrada (HEAD, entorno, alcance), ejecución acotada, aceptación técnica y evidencia en `REGISTRO.md`. No avanzar de etapa si su gate obligatorio falla. Dividir en más commits si es necesario, nunca saltar el registro.

## E0 — Custodia del proyecto y continuidad GitHub (PRIMERA)
**Objetivo:** evitar reinicios, suposiciones, despliegues accidentales o pérdida de decisiones.
- **E0.P1 — Auditoría de contexto [VALIDADA documental]:** comprobar repo/branch, HEAD, árbol, servicios Render, CI, arquitectura, mobile y documentación histórica. Evidencia: snapshot `ESTADO.md`.
- **E0.P2 — Registrar protocolo y roadmap [VALIDADA solo documental]:** crear `AGENTS.md` y `docs/bitacora/{README,ESTADO,ETAPAS,REGISTRO}.md`. No modificar código/productivo.
- **E0.P3 — Verificación y trazabilidad [VALIDADA solo documental; CI fallando]:** releer los archivos remotos, confirmar que el PR documental existe y apunta a `feat/hse-phases-1-5`, registrar SHAs/estado CI, verificar que la rama auto-deploy permanece sin cambios. Gate: enlaces funcionales a archivos, PR y punto de continuidad.

**Resultado E0:** cinco archivos remotos comprobados; [PR #1 draft](https://github.com/LordKurama01/informe360/pull/1) e [issue índice #2](https://github.com/LordKurama01/informe360/issues/2). HEAD de rama HSE sin cambios al cierre de auditoría. CI documental [falló](https://github.com/LordKurama01/informe360/actions/runs/37715224223) y la rama base también [fallaba](https://github.com/LordKurama01/informe360/actions/runs/37714821289); el origen exacto no se pudo verificar (logs no disponibles en conector). **No se interpreta como QA runtime aprobada.** La primera tarea de E1.P1 debe aislar el fallo de CI, antes de implementaciones funcionales.

## E1 — Mobile nativo robusto y offline-first
**Objetivo:** inspecciones fiables Android/iOS en campo, sin perder datos por cortes de red. **No empezar otra app**.
- **E1.P1 — Diagnóstico y contratos existentes [VALIDADA auditoría]:** auditar `offline-queue.ts`, `form-offline.ts`, `sync.ts`, `media.ts`, `capture-pipeline.ts`, `forms.ts`, RLS y tests; mapear fallos reproducibles (interrupción, reinicio, conflictos, imágenes, concurrencia). Entregar matriz de brechas + tests RED antes de modificar.
- **E1.P2 — Guardado local y archivos [EN CURSO]:** reutilizar selectivamente patrones MIT de FolderIT (atomicidad, cola serial, autosave honesto, manejo de fotos). Respetar la estructura de archivos y el cifrado/privacidad. No reemplazar el backend.
- **E1.P3 — Sincronización idempotente [EN CURSO]:** resolver causa raíz de duplicados/pérdidas; reintentos, conflicto de versiones, fallo parcial de subida y recuperación sin borrar el original prematuramente. Mantener claves de idempotencia server-side.
- **E1.P4 — QA móvil real [BLOQUEADA: runner GitHub y QA físico]:** typecheck, tests automatizados, build Android e iOS según herramientas disponibles, prueba offline→reabrir→sync→reintentar sin duplicar, logout/cambio de empresa, fotos y permisos. No afirmar iOS físico probado si no se ejecutó.
- **Gate E1:** recorrido de campo reanudable + evidencia persistida + reconciliación sin pérdidas/duplicación demostrada; regresiones de capturas y hallazgos aprobadas. Si no hay dispositivos/entorno, bloquear QA físico explícitamente.

[Checkpoint E1](E1_AVANCE_2026-10-07.md): pruebas unitarias acotadas, sin QA productiva. Revisar PR #3 antes de continuar.

## E2 — Inspecciones HSE, hallazgos y PDF integrado
- **E2.P1 — Reutilizar motor existente [PENDIENTE]:** verificar formularios versionados, checklists/seed, móvil y web, RLS por organización, offline, cierre y estado histórico. **No crear segunda implementación**.
- **E2.P2 — Plantillas prioritarias [PENDIENTE]:** configurar/validar checklist para altura, sistema anticaídas, equipos contra incendio y perforación; terminología revisable por responsable HSE; versiones inmutables.
- **E2.P3 — No conformidad→hallazgo→CAPA básica [PENDIENTE]:** vinculación de campo original, foto, localización, responsable, vencimiento, evidencia, cierre/reapertura y auditoría; sin duplicar entidades.
- **E2.P4 — Informe y cierre [PENDIENTE]:** exportación PDF profesional sobre registros reales, identidad visual existente, conservación de fuentes y evidencia, QA mobile/web y aprobación de técnico humano.
- **Gate E2:** crear inspección en móvil, sincronizar, generar hallazgo y PDF desde la misma fuente, recuperar historial sin alterar datos.

## E3 — IPCR/ATS/JSA + Permisos de Trabajo (PTW)
- **E3.P1 — Modelo de riesgo [PENDIENTE]:** revisar esquema/roles reales, matriz de riesgo configurable, pasos/peligros/controles/riesgo residual, revisiones inmutables.
- **E3.P2 — Flujo IPCR en móvil y escritorio [PENDIENTE]:** participante, revisión, evidencias y firmas/aceptaciones cuando proceda; IA solo propone controles.
- **E3.P3 — Workflow PTW [PENDIENTE]:** borrador→solicitud→autorización humana→ejecución→suspensión/cierre; permisos de caliente, altura, espacio confinado y energías, sujeto a procedimientos del cliente.
- **E3.P4 — Seguridad/QA [PENDIENTE]:** RBAC, separación de solicitante/autorizante, bloqueos backend, registro de aprobaciones, pruebas negativas, ciclo de autorización en red y sin red.
- **Gate E3:** no es posible autorizar mediante IA, autoconcesión prohibida por reglas del cliente o cambios solo UI; controles verificados server-side.

## E4 — Incidentes, investigación y CAPA
- **E4.P1 — Investigación [PENDIENTE]:** incidentes, near misses, causalidad (5 Why), evidencia, responsables y niveles de acceso.
- **E4.P2 — Acciones y seguimiento [PENDIENTE]:** reutilizar `findings`/`smart_actions`/recordatorios existentes; no duplicar CAPA; vencimientos, evidencia y auditoría.
- **E4.P3 — Reportes y alertas [PENDIENTE]:** historial, indicadores basados en hechos y notificaciones idempotentes, con privacidad y datos sensibles protegidos.
- **E4.P4 — QA y revisión técnica [PENDIENTE]:** permisos, modificación histórica, cierre/reapertura y consistencia entre mobile/web.
- **Gate E4:** incidente→investigación→medida→verificación humana→cierre, sin pérdida del historial probatorio.

## E5 — Activos/QR + piloto comercial + liberación controlada
- **E5.P1 — Activos críticos [PENDIENTE]:** registro por empresa/sitio, QR, inspección histórica, certificaciones/vencimientos; evaluar solo piezas útiles de Trier OS tras revisar licencia.
- **E5.P2 — Piloto mínimo vendible [PENDIENTE]:** seleccionar una contratista HSE y flujo concreto, acordar propuesta/pago o piloto con criterios, sin prometer funciones incompletas.
- **E5.P3 — Release gate [PENDIENTE]:** ejecutar QA consolidado, seguridad RLS, regresión, Android/iOS, pruebas con datos ficticios, métricas y rollback; cotejar Render/CI/DB antes de promover.
- **E5.P4 — Resultado y decisión [PENDIENTE]:** registrar valor comprobado, uso real, conversión a pago, coste de operación, bugs y decidir escalar/ajustar/detener.
- **Gate E5:** no llamar RELEASE a un build sin smoke end-to-end, ni VALIDADO COMERCIAL a una intención sin pago o uso medido.

## Fuera de la ruta crítica (evaluar luego)
RAG documental con citas, EPP/visión computacional, capacitación masiva, marketplace, marca blanca y multi vertical. No bloquean vender un piloto de inspecciones.

## Orden de ejecución
`E0.P1 → E0.P2 → E0.P3 → E1.P1 … E5.P4`. Una parte puede constar de varios commits; cada uno debe dejar resultado en REGISTRO. Reordenar **solo** registrando nueva evidencia, impacto y decisión en GitHub.

**Primera tarea al recibir «seguí» tras cerrar E0:** E1.P1 — auditoría de brechas offline frente a `FolderITDev/mobile-field-inspections`, con tests de regresión propuestos, sin reescritura de la app.

**Actualización E1.P2 — 2026-10-07:** fotos de formularios a Storage privado y visualización firmada implementadas en PR #3; wizard de formularios por pasos añadido. [Bitácora E1.P2](E1_P2_FOTOS_UX_NATIVE_2026-10-07.md). Requiere build QA, pruebas nativas, seguridad y flujo offline integral antes de validarlo o habilitar E2.

**Gate de calidad nativa:** cada pantalla debe sentirse como aplicación React Native real (navegación por pasos, accesibilidad, botones táctiles, validación y estado de guardado explícitos), no una webview. Validar Android e iOS en hardware antes de release.

**Gate de seguridad adicional:** corregir/validar integridad de políticas RLS de formularios mediante pruebas negativas con dos organizaciones; no desbloquear release solo porque la UI compila.

## Checkpoint de QA E1 — Render

- [QA_RENDER_2026-10-07.md](QA_RENDER_2026-10-07.md) prueba que `npm run qa` + TS Expo + export web pasaron en el entorno de Render QA.
- E1.P1 VALIDADA auditoría; E1.P2/P3 EN CURSO; E1.P4: **QA web/JS VALIDADA parcialmente**, **QA nativa física, seguridad y offline integral PENDIENTES**. Se conservan los gates E1 originales.
- No confundir export web con compilación nativa ni deploy LIVE con prueba end-to-end.
- La siguiente parte material es **E1.P2: fotos privadas de formularios y lectura remota**, seguida de creación offline y prueba idempotente en E1.P3.


## Etapa transversal de experiencia móvil

- **E1.UX.P1 — Login [IMPLEMENTADA CON QA DE BUILD, revisión visual física PENDIENTE]:** usar el sistema visual industrial nativo, sin bloque textual “360”. Ver [bitácora de acceso](E1_UX_LOGIN_2026-10-07.md) y Render LIVE `dep-db3gbu3tqb8s73dsunf0`.
- **E1.UX.P2 — Onboarding [PENDIENTE]:** sustituir el centrado excesivo y mantener consistencia con login; preservar creación real de workspace.
- **E1.UX.P3 — Branding APK/iOS [BLOQUEADA]:** reemplazar y verificar PNG inválidos antes de build nativo.
- **E1.UX.P4 — QA Android/iOS [PENDIENTE]:** dispositivo físico, teclado, safe areas, estados error/loading y navegación; nunca equiparar Expo Web a UX nativa validada.
- El diseño HSE debe priorizar campo, alto contraste, tipografía legible, una acción primaria, objetivos táctiles >=44pt, persistencia offline y ausencia de textos de demo prominentes.


## EWEB — Unificación operativa del panel WEB Informe360 HSE (2026-10-08)

**Objetivo:** un producto web consistente en Next.js. Toda opción de navegación del menú lateral mantiene carcasa, identidad, empresa/sitio activos y datos reales de Supabase. El preview React Native Expo no sustituye la web.

- **EWEB.P1 — Inicio + Informes [IMPLEMENTADA; QA Render VALIDADA; aceptación visual PENDIENTE]:** eliminar CTA «Demo», impedir la generación accidental de datos ficticios desde HSE; sustituir los informes de ejemplo y la pantalla ajena al sistema por historial real `/app/hse/reports` dentro de `HseControl`, protegido por organización/sitio y RLS. Redirigir `/app/reports` **solo en instancia HSE QA** sin afectar otras superficies Informe360. Criterio: mismo menú/identidad; estado vacío honesto; actualización real; tests + Render.
- **EWEB.P2 — Inspecciones [P2.1/P2.2 IMPLEMENTADAS; QA de publicación EN CURSO; P2.3–P2.5 PENDIENTES]:** mantener datos reales y funciones existentes, pero integrar navegación, cabecera, menús, espaciados, responsive, estados vacíos/errores del panel HSE; no reconstruir el motor de checklists.
- **EWEB.P3 — Formularios [PENDIENTE]:** reutilizar motor versionado ya existente, hacer coherentes menú, encabezado, controles y roles, sin segunda base ni datos de ejemplo.
- **EWEB.P4 — Agenda + informes detallados [PENDIENTE]:** distinguir agenda del producto HSE de rutas legadas de otras apps y aplicar carcasa web común a seguimiento; la **vista de impresión** de informe puede ser deliberadamente documental, con vuelta clara al panel.
- **EWEB.P5 — QA visual / funcional [PENDIENTE]:** accesibilidad, logo, escritorio 1366/1440/1920, móvil web 360–430, rutas profundas y refresh, sesión, RLS por empresa, informes de muestra **no**, pruebas Next en Render, regresión sin alterar producción.

**Invariante:** no hay botones públicos de siembra de registros «Demo» en HSE. Los ambientes QA pueden tener una empresa de evaluación explícitamente identificada, pero solo registros guardados en DB real; nunca métricas fabricadas. No fusionar a `feat/hse-phases-1-5` auto-deploy hasta gates.


### Desglose operativo de EWEB.P1 — Inicio + Informes (5 partes)

- **EWEB.P1.1 — Auditoría de navegación y datos [VALIDADA]:** comparar captura del usuario, `/app/hse` y `/app/reports`; localizar CSS ajeno y los informes hardcodeados. Evidencia: `REGISTRO.md` 2026-10-08.
- **EWEB.P1.2 — Eliminar accesos de demostración [VALIDADA EN QA]:** sacar el botón «Demo», el llamado a `seed_hse_demo` desde la UI y los accesos que crean datos ficticios en el HSE real. Contrato `test:hse:reports`.
- **EWEB.P1.3 — Informes dentro del mismo producto [VALIDADA EN QA]:** navegación y visual HSE común, consulta real de `reports` por organización/sitio, ruta `/app/hse/reports`, redirección legada solo en web QA. Render `dep-db3qf0ad0e5s73b6jh4g` LIVE.
- **EWEB.P1.4 — Calidad de indicadores y estados [VALIDADA EN QA RENDER]:** evitar métricas engañosas sin muestra; distinguir datos actualizados de una conexión no verificada; mejorar mensajes de error y estados vacíos sin inventar registros; añadir pruebas automáticas.
- **EWEB.P1.5 — Gate de cierre [MEJORA DE LOADER/SLIDER VALIDADA EN QA; ACEPTACIÓN VISUAL PENDIENTE]:** verificar test y compilación Next en Render QA, rutas y logos web, contenido sin registros falsos; comprobar visual en resolución de escritorio y móvil con sesión real. Cerrar únicamente con prueba del usuario o navegación autenticada. **Sin merge a producción.**

**Regla:** ejecutar una parte a la vez y registrar commit, deploy, pruebas, errores y siguiente parte en `REGISTRO.md` y `ESTADO.md` antes de continuar a EWEB.P2.


**Checkpoint EWEB.P1.4:** Render QA deploy `dep-db3qsml9fdbs73eslmf0` **LIVE**, SHA `6377f727ea144c2cc4865aae313f88e66132e83a`. `npm run qa` (incluye cuatro pruebas de dashboard), TypeScript, ESLint y Next.js build aprobados. EWEB.P1.5 sigue pendiente de validación visual y recorrido autenticado.

**Checkpoint UX EWEB.P1.5:** la pantalla de carga rápida se suprimió (<320 ms) y el buscador dejó de recargar sesión/KPI en cada letra. Indicador de navegación lateral y transiciones mejorados. Render `dep-db3r3f8473hc73f1m5vg` **LIVE**, SHA `837bd8791006fa3c23f596939211253f034c5314`, 3 tests nuevos y Next QA completos. Ver [bitácora UX](EWEB_P1_5_LOADING_SLIDER_2026-10-08.md). No cerrar etapa antes de prueba visual autenticada ni fusionar a producción.


### EWEB.P2 — Desglose operativo de Inspecciones

- **P2.1 — Unificación visual [IMPLEMENTADA]:** ruta `/app/hse/inspections` usa `HseControl mode="inspections"`, con la misma sesión, cabecera, menú activo, UX y colores que Inicio/Informes.
- **P2.2 — Operativa existente [IMPLEMENTADA]:** plantillas versionadas y ejecuciones reales de Supabase, selección por organización y sitio, instalación optativa de biblioteca estándar; no carga automática de ejemplos.
- **P2.3 — Interacción y estados [PENDIENTE]:** filtros de ejecución, búsqueda, estados de carga/error y capacidades de apertura/continuación de checklists con los endpoints disponibles.
- **P2.4 — Integridad y uso real [PENDIENTE]:** RLS/sitio, flujos de operaciones reales, acceso con cuenta autenticada, responsive y errores reproducibles.
- **P2.5 — Validación y cierre [EN CURSO]:** tests HSE, Next y deploy QA de esta primera entrega, más revisión visual antes de aprobación.

[Bitácora granular EWEB.P2](EWEB_P2_INSPECCIONES_2026-10-08.md). La aceptación visual de EWEB.P1 sigue abierta; avance autorizado por el pedido de continuar, no se convierte retrospectivamente en aprobado. Producción sin despliegues.
