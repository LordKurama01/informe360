# Informe360 HSE — estado operativo y punto de reanudación

**Snapshot inicial:** 2026-10-07 (America/Argentina/Buenos_Aires)  
**Tipo de verificación:** lecturas de GitHub (árbol, archivos, ramas, comparación) + configuración de servicio Render. **Sin tests ejecutados ni consultas directas a datos de producción.**

## 1. Repositorio real verificado

- Repo: `LordKurama01/informe360` (público).
- Rama por defecto: `main`; HEAD observado: `a155ef741a082e80ffb1472b2de4b24e12a272d8`.
- Rama de aplicación HSE: `feat/hse-phases-1-5`; HEAD observado **antes** de crear esta documentación: `422f8bcbce65b3e68f892d51d37b1ed0999690c5`.
- Divergencia contra main al snapshot: 217 commits adelantado / 6 atrasado. **No es seguro fusionar toda la rama HSE con main por inercia.**
- Rama segura para la bitácora: `docs/bitacora-hse-2026-10-07`; nació desde el HEAD HSE indicado. El SHA de esta rama cambia con cada registro: releerlo antes de actuar.
- Arquitectura: Next.js 16 + React 19 + TypeScript (web), Expo SDK 57 + React Native 0.86.3 + TypeScript (móvil), Supabase para Auth/DB/Storage; ruta del código nativo: `mobile/`.
- IDs nativos observados en `mobile/app.json`: Android `com.informe360.hsecopilot`, iOS `com.informe360.hsecopilot`.
- CI definido: `.github/workflows/ci.yml`; `npm run qa` web y chequeo TypeScript/export Android nativo. **No se ejecutó CI dentro de esta auditoría.**

## 2. Reutilizar lo que ya existe

Archivos inspeccionados directamente:
- `mobile/src/services/offline-queue.ts`: cola de capturas con SQLite KV store, intentos, errores y límite de 100 entradas.
- `mobile/src/services/sync.ts`: sincronización de capturas con detección de red, reintento, borrado después de procesar.
- `mobile/src/services/form-offline.ts`: borradores de formularios offline, id cliente y sincronización.
- `mobile/src/services/forms.ts`: plantillas/versiones, creación de ejecuciones y persistencia de respuestas.
- `mobile/src/services/inspections.ts`: plantillas y ejecuciones de inspección, vinculación explícita de no conformidades a hallazgos.
- `mobile/app/index.tsx`: redirecciones según sesión y workspace.
- Rutas existentes de móvil: `(tabs)/capture`, `(tabs)/inspections`, `forms`, `form-run`, `finding`, `pending-reviews`.

**HECHO:** el código y las rutas existen.  
**NO CONFIRMADO:** integridad offline frente a cortes/kill, cero duplicados en pruebas reales, funcionamiento físico Android/iOS, sincronización de fotos en todos los casos, implementación completa de PTW/IPCR/incidentes, aprobación de seguridad en runtime.

## 3. Entorno y riesgo de despliegue

- Render workspace consultado: The Prestige Group.
- Servicio `informe360-hse`: `srv-dajaqq7qj5pc73cssr90`, URL `https://informe360-hse.onrender.com`; repositorio conectado `LordKurama01/informe360`; rama `feat/hse-phases-1-5`; **autoDeploy=yes**, trigger commit.
- Preview móvil Render independiente: `informe360-hse-mobile-preview`, `srv-dajd193m8hqs73fqjs00`; rama `feat/hse-whatsapp-field-copilot`; autoDeploy=yes.
- `mobile/eas.json` contiene URL pública de Supabase y API para entornos de Expo. La existencia de esos valores no prueba conectividad actual.
- Supabase ID referenciado por archivos existentes: `wvjmsltqrztlvgmayicr`. **No se verificó estado vivo, RLS ni migraciones aplicadas en esta sesión.**
- **Prohibido:** push directo a rama de Render por tareas documentales; mutar Supabase o desplegar sin inspección previa, QA y plan de reversión.

## 4. Repo externo elegido para evaluar, NO integrado

`FolderITDev/mobile-field-inspections`:
- MIT (verificado en `LICENSE.md`), Expo 57/React Native/SQLite, capturas con fotos, borradores reanudables, autosave, cola de escrituras serializada y revisiones optimistas.
- El propio README declara que NO tiene backend, cuentas, sincronización cloud, generador de formularios ni distribución en stores.
- Se usa como **donante de patrones de resiliencia local**, no como reemplazo de la app ni base de datos. Su `package.json` exige Node >=24: verificar compatibilidad con nuestra CI Node 22 antes de copiar dependencias.
- No copiar pantallas/plantillas fijas sin necesidad; revisar compatibilidad, licencias y tests por archivo.

Otros candidatos históricos: `SafetyMP/Autonomous-EHS-Management` (patrones EHS), `coreaxiskkdutt/ehsbase` (PTW/IPCR, referencia funcional), `DougTrier/trier-os` (activos/QR). Revalidar licencia/código y necesidad antes de adoptar.

## 5. Decisión registrada

NO reiniciar Informe360. NO importar otra app completa. Mantener una fuente de verdad Supabase, ampliar la app `mobile/` y proteger su funcionamiento actual. Desarrollo gradual según [ETAPAS.md](ETAPAS.md).

## 6. Punto exacto de reanudación

- **Índice permanente:** [issue #2](https://github.com/LordKurama01/informe360/issues/2).
- **PR documental:** [#1](https://github.com/LordKurama01/informe360/pull/1), abierto en modalidad **draft** contra `feat/hse-phases-1-5`; NO fusionado ni desplegado.
- **Gate E0:** VALIDADO como documentación remota (cinco archivos existentes y PR/issue verificables). No implica aprobación funcional de la app.
- **CI:** [run documental #224](https://github.com/LordKurama01/informe360/actions/runs/37715224223) = FAILURE; [run base HSE](https://github.com/LordKurama01/informe360/actions/runs/37714821289) = FAILURE antes de estos cambios. No fue posible obtener el error exacto desde logs (404 en conector). **Pendiente diagnosticar CI antes de declarar QA aprobada.**
- **Integridad de la rama auto-deploy:** mismo HEAD `422f8bcbce65b3e68f892d51d37b1ed0999690c5` antes/después de crear docs y PR.


- **Trabajo de este ciclo:** E0 — protocolo, bitácora y PR documental creados y verificados (sin merge).
- **Bloque funcional siguiente (actualizado):** E1.P2 / E1.P3 restantes: referencia remota segura a fotos, recuperación legacy e idempotencia end-to-end. E1.P4 QA pendiente. **Primero comprobar HEAD, PR #3 y logs CI; no desplegar.**
- **Estado de cierre:** leer la última entrada de [REGISTRO.md](REGISTRO.md). Si el PR de bitácora sigue abierto, tomar los archivos de la rama documental; mantenerlo separado de Render.
- **Orden futura «seguí»:** verificar GitHub y estado real; completar el primer paso pendiente de ETAPAS, registrar resultado y siguiente paso. No pedir al usuario repetir este contexto.


## 7. Avance posterior a snapshot — 2026-10-07

La E1 se ejecuta aisladamente en `feat/hse-e1-offline-resilience-2026-10-08` con [PR #3](https://github.com/LordKurama01/informe360/pull/3) borrador, destino rama documental. **No integra ni despliega**. Revisar [E1_AVANCE_2026-10-07.md](E1_AVANCE_2026-10-07.md) y última entrada de REGISTRO.

- E1.P1: auditoría concluida.
- E1.P2 y E1.P3: implementaciones parciales con tests puros acotados; **NO listas para producción**.
- E1.P4: pendiente. CI [falló en rama funcional](https://github.com/LordKurama01/informe360/actions/runs/37716323412) antes de ejecutar pasos. Causa no confirmada.
- Regla: evitar duplicar fotos o interpretarlas como evidencia cloud si siguen como URI local. Proteger datos previos y producción.

## 8. QA Render (actualización 2026-10-07)

- **QA aislado en Render confirmado LIVE:** [informe360-hse-e1-qa](https://informe360-hse-e1-qa.onrender.com), servicio `srv-db3fsnnavr4c739kgeag`, despliegue `dep-db3fucl9fdbs73dke9dg` sobre código `10ea3b1fe21c29b2306dbbdd8b983739b69a2075`.
- `npm run qa` web + TypeScript mobile + Expo web export **PASARON** en Render. Ver [QA_RENDER_2026-10-07.md](QA_RENDER_2026-10-07.md).
- Producción Render `informe360-hse` permanece LIVE en `422f8bcbce65b3e68f892d51d37b1ed0999690c5`, sin cambios de código/servicio.
- **Faltan:** fotos de formularios en Storage privado y firma/visualización remota; arranque de nuevas inspecciones sin red; QA Android/iOS físico; revisión real de RLS y 28 avisos npm (10 moderate, 18 high).
- **Reanudación:** E1.P2 y E1.P3 restantes, no habilitar E2 ni release. AutoDeploy desactivado en QA para evitar gasto innecesario de minutos.

## 9. Estado E1.P2 — fotografías y UX móvil (actualización)

- Fotos de formularios y repetidores se preparan para Storage privado y se referencian con `hse-evidence:`, no rutas locales persistidas en respuestas cloud; firmado temporal y visualización en app. Implementado en [PR #3](https://github.com/LordKurama01/informe360/pull/3), **NO desplegado a producción ni probado con imagen real en móvil**.
- Formularios divididos en pasos nativos con validación, barra de progreso y auto-scroll al paso siguiente. QA funcional táctil pendiente.
- Render QA `dep-db3g4ufavr4c739leo6g`: LIVE para motor de fotos; builds posteriores detectaron tipado incorrecto del ancho del progreso, corregido en `941247fa...` y pendiente de verificación del deploy `dep-db3g6l7avr4c739lltog`.
- **Seguridad release gate:** revisar integridad referencial y permisos de modificación RLS para `form_answers`, sin cambiar producción antes de una migración auditada y QA negativa multi-organización. Bucket `hse-evidence` confirmado privado.
- **Próximo:** terminar E1.P3 (inicio offline desde plantillas persistidas y pruebas de sincronización), y E1.P4 en dispositivos Android/iOS y revisión de dependencias.


## 10. Confirmación QA UX y fotos

- Último deploy funcional certificado en Render QA: `dep-db3g6l7avr4c739lltog`, estado **LIVE**, SHA `941247fa11bc249ec90f0247473db414a2dbb500`. Cubre media privada y wizard por pasos; tests y compilación RN/Web correctos.
- Fuente: [QA_RENDER_2026-10-07.md](QA_RENDER_2026-10-07.md). Es una prueba técnica, **no una APK/iOS ni un test funcional con credenciales**.
- **Foco de continuidad E1.P3:** creación y reanudación de inspecciones 100% offline con plantillas cacheadas, aislamiento por cuenta y sincronización; RLS form_answers antes del release. E1.P4 dispositivos pendientes.


## 11. Cambio visual del login y QA

- Cambio solicitado al observar captura del acceso QA: muy espaciado y con un logo genérico; corregido con hero industrial compacto, casco dibujado en RN, CTA único y validaciones inline. Ver [E1_UX_LOGIN_2026-10-07.md](E1_UX_LOGIN_2026-10-07.md).
- **QA Render LIVE:** `dep-db3gbu3tqb8s73dsunf0`, SHA funcional `ede4b812da2713282fe85c773b6fde7553d38776`. `npm run qa`, mobile TypeScript y Expo Web export validados; navegador puede abrir [preview](https://informe360-hse-e1-qa.onrender.com).
- **P0 para APK/iOS:** íconos PNG de la marca en `mobile/assets/brand` no cumplen el decodificador Metro (error `Invalid png image asset`). El login dejó de depender de ellos, pero el empaquetado nativo requiere activos de marca válidos. No declarar APK compilada.
- **Pendiente UI:** validación perceptual en teléfono, homogeneizar onboarding, probar login con usuario real, revisar estética de pantallas siguientes.
- **Continúa:** E1.P3 inicio offline de inspecciones y E1.P4 QA nativa. Sin cambios en Render producción.


## 12. Release hardening y coherencia visual — 2026-10-08

- **HEAD de entrada verificado:** `5a78a82005b5813c37b808f5da1a43e18a2192a3` en `feat/hse-e1-offline-resilience-2026-10-08`; PR #3 abierto en draft. Producción permanece en `feat/hse-phases-1-5` y no se autoriza merge/promoción durante este bloque.
- **Objetivo aprobado:** revisar y mejorar coherencia visual web/móvil, eliminar marcas genéricas “360”, endurecer onboarding/registro, reparar activos nativos, ampliar QA y volver a validar en Render QA.
- **Alcance de este bloque:** código y assets de la rama QA + documentación. Sin cambios de Supabase productivo ni de Render producción.
- **Riesgos conocidos:** 28 advisories npm móviles pendientes de triage; build físico Android/iOS aún no ejecutado; job WhatsApp registró un 503 histórico que requiere revalidación separada.
- **Criterio de cierre:** `npm run qa` + TypeScript móvil + Expo Web export en Render QA, verificación de assets nativos decodificables y smoke de rutas críticas. Si alguno falla, no promover.

### Resultado del hardening
- **Rama candidata:** `fix/hse-release-hardening-2026-10-08` sobre E1 QA; PR #4 abierto contra `feat/hse-e1-offline-resilience-2026-10-08`.
- **Render QA aislado:** servicio `informe360-hse-hardening-qa` (`srv-db3hgrtg1s2s73ag2jdg`), deploy `dep-db3hgs5g1s2s73ag2ju0`, commit funcional `1168c390f97829798164fc9b5e0d155c7e906e69`: **BUILD SUCCEEDED / DEPLOY SUCCEEDED**.
- **QA comprobada:** branding web, landing HSE, estructura/UI móvil, assets PNG nativos, login, onboarding, TypeScript web/móvil, ESLint, build Next y export Expo Web: **PASS**.
- **Correcciones verificadas:** landing desktop/móvil usa marca HSE en vez del bloque genérico “360”; login/onboarding comparten paleta industrial; los tres PNG nativos son decodificables, cuadrados y >=512 px.
- **No cerrado todavía:** 28 advisories npm móviles (10 moderate, 18 high), QA Android/iOS físico, RLS negativa multi-organización y revalidación del job WhatsApp. No usar `npm audit fix --force` sin triage.
- **Producción:** no modificada en este bloque. No promover hasta integrar el hardening en E1 QA y volver a ejecutar el gate correspondiente.


## 13. Hardening integrado + auditoría runtime/DB — 2026-10-08

- **PR #4 integrado en E1 QA:** merge `b1fe12062d4f46eb325f054daa59ddcb4cf0ed40`. Producción `feat/hse-phases-1-5` no fue modificada.
- **QA integrada final:** Render `informe360-hse-e1-qa`, deploy `dep-db3hpi59fdbs73ds5dog` sobre SHA funcional `3c8a86357b8c1e114ffe91d472ffbc7024496448`: BUILD y DEPLOY **SUCCEEDED**. Incluye branding, PNG nativos, login/onboarding, tests offline/sync/fotos, RLS contract, TypeScript, lint, Next build y Expo Web export.
- **Supabase real:** proyecto Informe360 `wvjmsltqrztlvgmayicr` ACTIVE_HEALTHY. Bucket `hse-evidence` privado; políticas de Storage restringen por organización.
- **Hallazgo de seguridad RLS:** las políticas vigentes de formularios contienen referencias ambiguas que en dos subconsultas se materializan como tautologías (`r.organization_id = r.organization_id` y `t.organization_id = t.organization_id`). Las tablas de formularios están actualmente sin filas. Se prepararon migraciones de hardening no destructivas y un gate QA que pasa; **DDL productivo todavía no aplicado**.
- **Runtime producción verificado desde Supabase:** `/api/hse/health` responde HTTP 200, pero reporta `supabaseAdminConfigured=false`, WhatsApp no configurado y sólo proveedor AI manual. Por lo tanto el 200 es liveness, no readiness completa.
- **Recordatorios WhatsApp:** el dispatcher existe y Vault contiene la referencia `hse_jobs_secret`, pero `cron.job` está vacío. Una prueba controlada sin recordatorios pendientes terminó en timeout del cliente y Render registró 503; no reactivar scheduler hasta corregir configuración runtime del servicio.
- **Dependencias móviles:** continúan 28 advisories npm (10 moderate, 18 high); no se ejecutó actualización forzada.
- **Release gate:** NO promover a producción mientras falten configuración server-side, hardening RLS aplicado/verificado, triage de dependencias y QA nativa física Android/iOS.


## 14. Corrección posterior — RLS aplicado y readiness explícita

- **RLS Supabase aplicado:** las siete políticas objetivo de formularios fueron endurecidas mediante migraciones pequeñas y no destructivas. Supabase registra las migraciones `fix_form_answers_insert_tenant_guard`, `fix_form_versions_insert_tenant_guard_v2`, `fix_form_versions_update_tenant_guard_v2`, `fix_form_answers_update_tenant_guard_v2`, `fix_form_run_findings_insert_tenant_guard_v2`, `fix_form_runs_insert_tenant_guard_v2` y `fix_form_runs_update_tenant_guard_v2`. Se verificó directamente que las políticas críticas ya comparan contra la organización de la fila externa, no contra sí mismas.
- **Health mejorado en E1 QA:** el endpoint ahora conserva `ok=true` como liveness pero expone `ready` y capacidades separadas para datos server-side, IA mejorada y WhatsApp, evitando interpretar un HTTP 200 como configuración completa.
- **QA final de esta pasada:** Render `informe360-hse-e1-qa`, deploy `dep-db3hr9ei0phs73a8h3tg`, SHA `646e70a28e4c1a459ec1ce66d372a8d6f09fc545`: BUILD y DEPLOY **SUCCEEDED**.
- **Bloqueos restantes para producción:** configuración server-side del servicio Render continúa incompleta en el runtime actualmente publicado; WhatsApp y proveedor AI real no están configurados; no hay cron activo; quedan advisories npm y QA nativa física.


## 2026-10-08 — QA WEB-01: autenticación y workspace en navegador
- Se corrigió el error `getValueWithKeyAsync is not a function`: Expo SecureStore sólo se usa en Android/iOS; navegador usa adaptador `localStorage` aislado por origen para sesión y selección del espacio.
- Commit funcional `38ee8d271477d96edac74420dea53e36977f30bc` publicado en Render QA deploy `dep-db3piqss728c73foqbfg` **LIVE**; 3/3 tests browser storage pasan, TypeScript/Expo web export OK.
- Código `mobile/src/lib/{secure-storage,web-storage}.ts`, `mobile/src/services/workspace.ts`; test `scripts/hse-web-storage.test.mjs`.
- Sin deploy a producción ni intervención de DB. El workspace de evaluación creado previamente existe, con usuario owner y sitio; no volver a crearlo.
- **Siguiente punto exacto:** comprobar entrada al panel en la nueva versión desde sesión real. Si hay otro error, capturarlo antes de continuar. Después E1.P3 inicio de inspección offline y E1.P4 QA física Android/iOS.
- Ver [registro cronológico](REGISTRO.md); no afirmar test E2E autenticado hasta realizarlo.


## 2026-10-08 — Separación WEB de escritorio / APP nativa (estado actual)
- **Web QA real**: https://informe360-hse-web-qa.onrender.com/app/hse — servicio Next.js Render `srv-db3pmdbncjis73bbrvig`, `autoDeploy=no`, deploy final `dep-db3pp8c9v7es73e11rf0` **LIVE** (SHA `6ca8c11d6b8ba6c84bc5976779b92fd7b9c99f84`). Menú lateral, dashboard y gestión HSE web reales. Responsive web sin dock nativo flotante.
- **App móvil QA**: `mobile/` React Native + Expo. El servidor `informe360-hse-e1-qa.onrender.com` es **solamente un preview técnico**; al abrirlo en escritorio ≥760px redirige al panel Next QA. Último deploy de la redirección `dep-db3pn8tg1s2s73bddac0` LIVE.
- **Producción web**: `informe360-hse.onrender.com`, servicio `srv-dajaqq7qj5pc73cssr90`, se conserva sin merge. Ambos servicios nuevos en Render plan free.
- **QA**: `npm run test:hse:platforms` OK en la web, `npm run qa` web y builds Next; app preview Expo export OK. No equivale a APK/IPA ni QA de experiencia en teléfonos.
- **Bitácora completa:** [PLATAFORMAS_WEB_MOVIL_2026-10-08.md](PLATAFORMAS_WEB_MOVIL_2026-10-08.md). Invariante establecida en `AGENTS.md` para futuros «seguí».
- **Próximo bloque:** validar visual de web en PC, inspecciones con sesión y datos propios, luego etapa E1.P3 inicio offline, E1.P4 builds nativos y QA. No diseñar la web duplicando React Native.

## 2026-10-08 — EWEB.P1 — Eliminar «Demo» y unificar Informes [EN CURSO]
- Inspección previa de imagen, árbol y código: `/app/reports` usa una página antigua con datos ficticios hardcodeados, CSS oscuro azul ajeno a HSE y sin menú lateral. `/app/hse` posee la UI y autenticación correctas.
- Acción acotada: trasladar Informes HSE a `/app/hse/reports` bajo la misma carcasa HSE y consultar registros reales de Supabase con RLS/organización/sitio. En QA web, redirigir el enlace heredado `/app/reports` al módulo nuevo; proteger integraciones no HSE. Quitar botón Demo y capacidad de sembrar registros de prueba desde la UI HSE.
- No modificar producción ni crear registros ficticios. Evidencia pendiente: QA Render Next.js, test de integración estructural y validación visual.


## 2026-10-08 — EWEB.P1 — Panel de informes HSE coherente [BUILD VALIDADO]

- **Hecho:** el botón «Demo» y acciones de cargar datos ficticios desaparecieron de `HseControl.tsx`; el acceso sin organización ahora muestra aviso honesto y botón de reintento.
- **Informes HSE:** `/app/hse/reports` emplea `HseControl mode="reports"`; conserva exactamente la barra lateral, cabecera, colores, contexto de empresa y navegación de Inicio. Registros reales de Supabase `reports` filtrados por `organization_id`, `site_id` y RLS. Si no hay registros, estado vacío real, nunca ejemplos fabricados.
- **Compatibilidad:** la ruta heredada `/app/reports` envía al módulo HSE **sólo** en el servicio web HSE QA (`HSE_WEB_QA_MODE=1`); otras superficies conservan su implementación legada separada.
- **QA:** Render Web QA `dep-db3qf0ad0e5s73b6jh4g` LIVE, código `5b8f1d3a0fbd565f11b5a6157c35c9187d1f3aa8`, 2026-10-08T14:25:54Z. `test:hse:reports` OK y pipeline `npm run qa` + Next build completos.
- **URL para revisión:** https://informe360-hse-web-qa.onrender.com/app/hse/reports. Esta evidencia **no confirma todavía aceptación visual del usuario** ni una prueba de navegación manual autenticada en escritorio.
- **Próximos bloques:** EWEB.P2 Inspecciones, EWEB.P3 Formularios, EWEB.P4 Agenda/lectura, EWEB.P5 QA visual. La etapa móvil E1.P3 sigue abierta. Producción intacta.

## 2026-10-08 — EWEB.P1.4 — Calidad de indicadores y estados [VALIDADA EN QA]
- Se auditó `HseControl.tsx`: KPI «Cierre en plazo» presentaba `0%` aun cuando no había cierres; etiqueta «En línea» era fija, incluso ante errores de lectura; cero informes también podía presentarse antes de completar consultas. Estas señales pueden inducir al usuario a conclusiones falsas.
- Alcance del siguiente commit: distinguir `loading/ready/error`, no mostrar porcentaje sin denominador, reportar errores de lectura de manera visible y comprobar con unit tests. No introducir datos ficticios, nuevas tablas ni cambios de Auth/producción.
- Dependencia: `EWEB.P1.3` verificada por Render QA sobre `5b8f1d3...`, `PR #3` sigue draft.


### Resultado verificado EWEB.P1.4
- `src/shared/hse/dashboard-metrics.ts`: los cero válidos aparecen **solo después** de obtener datos; «Cierre en plazo» devuelve «—» cuando no existen cierres, cuando falló la consulta o ante dato no numérico.
- `HseControl.tsx`: estado explícito de consulta `loading / ready / error`, etiqueta veraz «Datos actualizados» (no «En línea» fijo), botón Actualizar con excepciones capturadas y estados vacíos mostrados únicamente si la consulta terminó correctamente.
- `scripts/hse-dashboard-metrics.test.mjs`: 4 tests nuevos, incluidos regresión visual de estados, denominador de KPI y actualización recuperable, integrados a `npm run qa`.
- `dep-db3qsml9fdbs73eslmf0` **LIVE** a las 2026-10-08T14:54:53Z, SHA funcional `6377f727ea144c2cc4865aae313f88e66132e83a`, Next.js compilado, typecheck y lint aprobados.
- **Próxima parte exacta al decir «seguí»:** EWEB.P1.5 verificar web con sesión en Inicio e Informes, rutas directas, retorno, diseño escritorio/móvil y estado sin registros; comprobar Render y registrar aceptación. Después EWEB.P2 Inspecciones. Sin merge a producción.
