# REGISTRO CRONOLÓGICO — Informe360 HSE

**Política:** sólo agregar entradas nuevas al final, preservando las anteriores. Si hay un error, agregar una corrección fechada; no reescribir la historia. Horas expresadas en Argentina cuando se conozcan. No incluir secretos ni información sensible.

## 2026-10-07 — E0.P1 — Auditoría de estado para bitácora
- **Rama de código auditada:** `feat/hse-phases-1-5`.
- **HEAD base observado:** `422f8bcbce65b3e68f892d51d37b1ed0999690c5`.
- **Repo:** `LordKurama01/informe360`; default `main` SHA `a155ef741a082e80ffb1472b2de4b24e12a272d8`.
- **Verificaciones realizadas:** metadata y árbol GitHub, ramas, comparación contra main, mobile `package.json`, `app.json`, servicios offline/sync/forms/inspections, documentación HSE previa, CI y configuración Render.
- **Resultado:** la base móvil Expo/React Native, formularios, inspecciones y sincronización ya existen. **No se efectuó QA funcional**, ni lectura del DB live, ni build nativo.
- **Hallazgo crítico:** Render `informe360-hse` conectado a `feat/hse-phases-1-5`, autoDeploy=yes (commit). Se evita push documental directo ahí.
- **Acción/reversibilidad:** crear documentación en una rama separada. Sin modificaciones a producción, Supabase, código ni Render.
- **Estado:** VALIDADA *sólo como auditoría documental*. Ver detalle y pendientes en `ESTADO.md`.
- **Siguiente:** E0.P2.

## 2026-10-07 — E0.P2 — Protocolo y roadmap versionados
- **Rama creada:** `docs/bitacora-hse-2026-10-07`, a partir de `422f8bcbce65b3e68f892d51d37b1ed0999690c5`.
- **Commits realizados:**
  - `cff31e60e8828323d453cea5f4d853e38477f793` — `AGENTS.md`: lectura antes de cambios, QA, continuidad y bloqueo de deploy accidental.
  - `2cdddbc50cd8cc5901ac2ab647c4fb9a073f67a6` — `docs/bitacora/README.md`: índice y rutina «seguí».
  - `7d1fa871f2b20492ffbdfde8f6eda3764b6aae2b` — `docs/bitacora/ESTADO.md`: fuente de verdad/snapshot.
  - `42eb5f415bbbd6383af7009780aeb20eaa2427b1` — `docs/bitacora/ETAPAS.md`: E0 a E5 con partes y gates.
- **Impacto:** documentación únicamente. No instalar dependencias, ejecutar migraciones, fusionar ramas ni desplegar.
- **Validación:** confirmación de commit SHA emitida por GitHub al crear cada archivo. Relectura remota y PR: **pendientes** hasta E0.P3.
- **Estado:** IMPLEMENTADA SIN QA documental completa.
- **Siguiente:** E0.P3.

## Próxima entrada obligatoria
**E0.P3:** releer archivos remotos, registrar SHA final de rama documental, enlace a PR y checks; confirmar rama HSE auto-desplegada sin cambios. Luego activar **E1.P1** (auditoría offline) en una rama de ejecución separada, no realizar implementación sin antes verificar el estado real.


---

## 2026-10-07 — E0.P3 — Verificación remota, índice GitHub y protección de Render
- **PR creado:** [#1 — bitácora permanente](https://github.com/LordKurama01/informe360/pull/1), **draft**, base `feat/hse-phases-1-5`, head `docs/bitacora-hse-2026-10-07`. Al abrirlo: 5 commits documentales, 5 archivos modificados, sin código.
- **Issue índice creada:** [#2 — BITÁCORA MAESTRA HSE](https://github.com/LordKurama01/informe360/issues/2). Solo apunta a los archivos; no crea otra fuente de verdad.
- **Verificación positiva:** lectura vía API GitHub de `AGENTS.md`, `docs/bitacora/README.md`, `ESTADO.md`, `ETAPAS.md`, `REGISTRO.md`, todos presentes en rama documental.
- **HEAD de desarrollo / Render, revalidado:** `feat/hse-phases-1-5` conserva `422f8bcbce65b3e68f892d51d37b1ed0999690c5`. No se hizo push a rama autoDeploy, ni deploy, ni migración.
- **GitHub Actions en rama documental:** [run #224](https://github.com/LordKurama01/informe360/actions/runs/37715224223) concluyó **FAILURE** en SHA `e27e2d1162df412881b11522469e1cf535e4b1f9`.
- **Comparación con base:** la rama HSE ya tiene [CI FAILURE](https://github.com/LordKurama01/informe360/actions/runs/37714821289) en su HEAD sin estos documentos. La documentación **no demuestra** que haya causado o arreglado el fallo. La descarga del log de job devolvió `BlobNotFound` 404 y los pasos vacíos; causa exacta: **NO CONFIRMADA**.
- **Correcciones al plan y snapshot:** `ea6a3f24e88d7594e24b0675942a7ae1a91b529b` (ETAPAS: E0 documental validada y CI documentado), `276c31b2b727b2ecf4a9e7d96bbba75cd144b6b8` (ESTADO: PR/issue y bloqueo CI).
- **Estado:** E0.P3 VALIDADA para **custodia documental**. QA funcional, build nativo, publicación de App y CI verde: **NO realizados**.
- **Rollback:** eliminar/cerrar PR o revertir solo commits documentales de la rama hija; no hay rollback productivo porque producción no cambió.
- **Próxima parte exacta:** **E1.P1 — Diagnóstico de CI heredado + auditoría diferencial offline**. Antes de programar: leer el árbol/HEAD vigente, conseguir evidencia de error CI o reproducir localmente, inspeccionar cobertura existente y proponer pruebas RED. No copiar app completa; preservar la app actual.

---

## 2026-10-07 — E1.P1 / E1.P2 / E1.P3 — Desarrollo aislado (cierre parcial)
- **Branch:** `feat/hse-e1-offline-resilience-2026-10-08` desde rama de bitácora. PR [#3](https://github.com/LordKurama01/informe360/pull/3), draft. Sin merge ni deploy.
- **E1.P1 [VALIDADA auditoría]:** lectura de código, CI, Render y Supabase. Informe: [E1 P1](E1_P1_DIAGNOSTICO_OFFLINE_2026-10-07.md).
- **E1.P2 [EN CURSO]:** commits de primitiva serial `5abbd93`, colas `818ba63`/`c572739`, tests `367ac2d`, compatibilidad SQLite `498dc47`, recuperación/estado local `1ab74f3`/`bad7ece`, fotos locales `ae332f8`.
- **E1.P3 [EN CURSO]:** propietario `a5c67c6`, sync single-flight `aee79e5`, provider `f8e1c83`, filtro de cuenta `59a2641`/`adcea72`, tests `f88aaf9`, scripts QA `b617e0b`.
- **QA acotado:** 6/6 tests Node de lógica pura + `tsc --strict --noEmit` sobre dos módulos puros: PASS en entorno aislado. No se ejecutó QA full Expo ni pruebas físicas.
- **CI:** [run E1](https://github.com/LordKurama01/informe360/actions/runs/37716323412) FAILURE con runner_name vacío y 0 steps, igual que baseline. Sin log causal; NO afirmar código compilado ni desplegable.
- **Supabase:** ACTIVE_HEALTHY, RLS en tablas; índices únicos de capturas y formularios confirmados. Solo lectura. Sin SQL de escritura.
- **Brecha crítica:** formularios con foto requieren reemplazar URIs locales por rutas de Storage privado verificables; aún NO completado. Legacy sin usuario queda sin upload automático para evitar contaminación intercuentas.
- **Estado:** etapa E1 PARCIAL, sin gate de producción. Detalle: [avance E1](E1_AVANCE_2026-10-07.md).
- **Siguiente acción exacta:** reabrir PR #3, inspeccionar diffs/HEAD; completar E1.P2 fotos remotas seguras y manejo de errores; E1.P3 idempotencia/recuperación legacy; E1.P4 QA completo y físico. Mantener rama Render intacta.


## 2026-10-07 — E1.P2 — Feedback de cola y revisión pre-merge
- **Commit:** `aaf9a2d399912b50aae470a61e8161f916848c97` — `mobile/app/register.tsx` informa error real si SQLite no confirma la cola; no navega como si hubiera guardado.
- **Continuidad:** `aa1ee4daf5403b0ea5f76a723421a3914b7e282c` actualiza el índice activo de bitácora a PR #3.
- **PR #3:** 18 archivos modificados, sigue **draft**, sin merge. [Diff](https://github.com/LordKurama01/informe360/pull/3/files).
- **Rama Render verificada:** `feat/hse-phases-1-5` aún en `422f8bcbce65b3e68f892d51d37b1ed0999690c5`. Sin cambios de runtime.
- **Gate actual:** E1.P2 y E1.P3 **EN CURSO**, E1.P4 **BLOQUEADA** por CI sin runner y QA físico. Prioridad próxima: no guardar referencias locales como evidencia remota, luego pruebas reales.


## 2026-10-07 — E1.P4 — QA aislado en Render (iniciado, sin aprobación final)
- **Entorno QA NUEVO:** Render Static Site `srv-db3fsnnavr4c739kgeag`, URL `https://informe360-hse-e1-qa.onrender.com`; rama `feat/hse-e1-offline-resilience-2026-10-08`, `autoDeploy=no`, sin tocar `informe360-hse` ni su preview histórico.
- **Pipeline del sitio:** normalizar lockfile → instalar web → `npm run qa` (tests, TS, ESLint, build Next) → instalar Expo → TS móvil → export web Expo. Permite probar también la rama candidata sin depender de GitHub Actions.
- **Deploy inicial:** `dep-db3fsnvavr4c739kgf90` BUILD_FAILED. La instalación automática de Render, antes de ejecutar el buildCommand, intentó bajar un tarball npm desde una URL reescrita incorrectamente (`registry.npmjs.org/artifactory/api/npm/npm-public/...`, 404).
- **Corrección de infraestructura:** variable `SKIP_INSTALL_DEPS=true` (mecanismo oficial de Render) para instalar **después** de normalizar el lockfile, y Node `22.16.0`. Esto generó nuevo despliegue `dep-db3ft1egekts73ek6bcg`.
- **Evidencia parcial del segundo deploy:** npm y pruebas HSE iniciales superadas; `tsc --noEmit`, lint y compilación Next avanzaron hasta compilación de páginas. **Resultado final todavía pendiente** al momento de esta entrada.
- **Costo:** sitio estático gratuito sujeto a uso del workspace. No se activó plan de pago ni otra base.
- **Siguiente:** inspeccionar resultado final de `dep-db3ft1egekts73ek6bcg` y logs, corregir fallos genuinos sin modificar producción. Registrar estado real de QA y recordar que export web **no** reemplaza builds ni pruebas físicas iOS/Android.


## 2026-10-07 — E1.P4 — QA Render verificada y corrección de idempotencia
- **Sitio nuevo:** [informe360-hse-e1-qa](https://informe360-hse-e1-qa.onrender.com), servicio Render `srv-db3fsnnavr4c739kgeag`, rama `feat/hse-e1-offline-resilience-2026-10-08`, autoDeploy desactivado, sin costos contratados ni cambios a producción.
- **Deploy inicial fallido:** `dep-db3fsnvavr4c739kgf90`, npm 404 previo al build; solución: `SKIP_INSTALL_DEPS=true`, permitiendo normalizar lockfile antes del install.
- **Primer deploy exitoso:** `dep-db3ft1egekts73ek6bcg`, status **LIVE**, commit `798b48992cbfbc4ab277ba9c740d44af9caf09ee`, Next QA, móvil TS y Expo web export.
- **Corregido client_capture_id:** `10ea3b1fe21c29b2306dbbdd8b983739b69a2075` (reutiliza ID anterior tras captura online fallida; deduplicación local con aislamiento de dueño).
- **Segundo deploy exitoso:** `dep-db3fucl9fdbs73dke9dg`, status **LIVE** (2026-10-08T02:27:29Z), commit `10ea3b1fe21c29b2306dbbdd8b983739b69a2075`; `npm run qa`, TypeScript Expo y `expo export --platform web` pasaron.
- **Advertencia:** npm móvil reportó 28 advisories (10 moderate, 18 high): aún sin triage de dependencias afectadas.
- **QA que NO se ejecutó:** APK Android, IPA iOS, instalación física, permisos de cámara/audio, flujo foto remota, aislamiento de usuarios en RLS real y comienzo de inspecciones 100% offline.
- **Estatus:** E1.P4 **VALIDADA PARCIAL** solo para pipeline Render web/JS; **BLOQUEADA PARA LIBERACIÓN** nativa.
- **Documento fuente:** [QA Render](QA_RENDER_2026-10-07.md).
- **Siguiente paso:** E1.P2 subir imágenes privadas y reabrirlas, E1.P3 idempotencia y offline-start; E1.P4 pruebas en dispositivos, seguridad y auditoría de vulnerabilidades.


## 2026-10-07 — E1.P2 — Fotografías privadas + pasos móviles nativos
- **Fuente:** [E1_P2_FOTOS_UX_NATIVE_2026-10-07.md](E1_P2_FOTOS_UX_NATIVE_2026-10-07.md).
- **Foto remota segura:** `e7b509f` motor de transformación por tipos, `65fdd18` subida a Storage privado y URL firmada, `b7ed84a` integración antes de persistir respuestas, `caff004` previsualización privada, `1d40a54`/`aa3e207` aislamiento de referencias por organización/inspección.
- **QA automatizada:** `f15629f`, `2b0808a`, `e85cb1d`: tests de fotos y seguridad registrados en pipeline Render.
- **Bugs detectados y corregidos:** `b110d01` respuestas ausentes se conservan ausentes (no se introducen `undefined`); `941247f` width de progreso con tipado React Native compatible.
- **Experiencia nativa:** `58876e4` formularios por secciones con barra de progreso, validación y botones grandes; `32e7b25` scroll al comienzo, `ac3fbb0` aviso explícito ante fotos pendientes de envío.
- **Render QA:** build `dep-db3g488m7kps73ehqm70` FAIL de test; después `dep-db3g4ufavr4c739leo6g` LIVE y QA/TS/Expo export OK. Build `dep-db3g5td9fdbs73dldia0` FAIL por TypeScript del progreso (corregido). Nuevo build `dep-db3g6l7avr4c739lltog` disparado, resultado **por comprobar**.
- **Supabase:** bucket privado `hse-evidence` verificado, no se realizaron cambios en DB ni migraciones. Se identificó revisión adicional de RLS en formularios como gate de seguridad; NO corregido ni validado aún.
- **Estado:** E1.P2 IMPLEMENTADA EN CÓDIGO, QA NATIVA PENDIENTE, no integrar a producción. E1.P3 inicio offline pendiente.
- **Próximo:** comprobar resultado exacto de Render QA y continuar E1.P3 con caché de plantillas/arranque offline y pruebas multiusuario.

## 2026-10-07 — E1.P2 — Cierre del ciclo de QA Render
- **Resultado confirmado API Render:** `dep-db3g6l7avr4c739lltog` LIVE, commit `941247fa11bc249ec90f0247473db414a2dbb500`, completado 2026-10-08T02:45:08Z. Pipeline `npm run qa`, TypeScript móvil y export Expo Web completos.
- **Regresiones detectadas por QA y solucionadas:** test con campos omitidos y tipado de ancho en barra de pasos RN, ya documentados en [E1.P2](E1_P2_FOTOS_UX_NATIVE_2026-10-07.md).
- **Ramas:** `feat/hse-phases-1-5` HEAD `422f8b...` sin cambios; PR #3 draft sin merge.
- **Pendientes release E1:** prueba real de subida y vista firmada, iniciar inspecciones sin red, seguridad de RLS/estado, auditoría de dependencias, APK/IPA y QA físico. La prueba Render **no cierra E1.P4 nativa**.
- **Siguiente:** E1.P3 plantillas cacheadas y creación de ejecuciones offline; volver a Render tras cambios; no desplegar a producción.


## 2026-10-07 — E1.UX.P1 — Corrección visual del acceso (captura del usuario)
- **Diagnóstico:** login anterior con gran espacio vacío, ícono de texto “360”, tipografía/inputs sobredimensionados, botón piloto de igual peso y leyenda inferior dispersa. La captura se mantuvo en el chat; no se publicó en GitHub.
- **Implementación:** `mobile/app/login.tsx` `3c0fb39` rediseño con header industrial oscuro, tarjeta compacta, acceso principal, piloto secundario, validación inline, teclado, visibilidad de contraseña. Las funciones Supabase Auth no cambiaron.
- **Pruebas:** `01770ed` nuevo test contractual de login, `a755607` agregado a pipeline.
- **Bug observado en Render:** `dep-db3gan7avr4c739m52f0` **BUILD_FAILED**: PNG de ícono histórico inválido en Metro. Se quitó la dependencia y se dibujó casco de seguridad con componentes RN nativos (`1f5e3d5`), test actualizado (`ede4b81`).
- **QA validada:** `dep-db3gbu3tqb8s73dsunf0` **LIVE** sobre `ede4b812da2713282fe85c773b6fde7553d38776`, completado 2026-10-08T02:56:22Z. QA web, test de login, TypeScript RN y export Expo Web pasan.
- **Protección:** Render `informe360-hse` producción no alterado; PR #3 sigue borrador y sin merge.
- **Gate pendiente:** comprobar visual en teléfono, onboarding coherente, reparación de íconos APK/iOS, compilación nativa y flujos Auth con credenciales de prueba.
- **Punto de reanudación:** https://github.com/LordKurama01/informe360/blob/feat/hse-e1-offline-resilience-2026-10-08/docs/bitacora/E1_UX_LOGIN_2026-10-07.md ; después avanzar E1.P3 offline.


## 2026-10-08 — E1 hardening — marca y QA
- **Candidato:** `fix/hse-release-hardening-2026-10-08`, PR #4 hacia la rama E1 QA. Producción no fue modificada.
- **Cambios:** landing web desktop/móvil con marca HSE; paleta móvil industrial; login/onboarding coherentes; PNG nativos reparados reutilizando assets existentes; nuevos tests de marca y assets agregados a `npm run qa`.
- **Render QA:** `informe360-hse-hardening-qa`, deploy `dep-db3hgs5g1s2s73ag2ju0`, SHA probado `1168c390f97829798164fc9b5e0d155c7e906e69`: BUILD y DEPLOY SUCCEEDED.
- **PASS:** contratos HSE, formularios, inspecciones, branding, landing, UI móvil, assets PNG, login, onboarding, typecheck, lint, Next build, TypeScript móvil y Expo Web export.
- **Pendientes:** 28 advisories npm móviles (10 moderate, 18 high), QA físico Android/iOS y pruebas de seguridad/runtime. No se aplicó actualización forzada de dependencias.
- **Integración:** PR #4 aún no fusionado. Siguiente: integrar solamente a E1 QA y repetir el gate antes de evaluar producción.
