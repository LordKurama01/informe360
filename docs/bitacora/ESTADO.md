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

