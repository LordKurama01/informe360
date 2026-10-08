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


## 2026-10-08 — Integración hardening + auditoría runtime y RLS
- **Integración:** PR #4 fusionado en rama E1 QA; merge `b1fe12062d4f46eb325f054daa59ddcb4cf0ed40`. Luego se alineó splash/adaptive background y se añadieron gates de RLS.
- **QA final integrada:** Render deploy `dep-db3hpi59fdbs73ds5dog` en `3c8a86357b8c1e114ffe91d472ffbc7024496448`: SUCCEEDED. El gate `HSE current form RLS tenant-integrity contract OK` pasó junto con branding, assets, login, onboarding, offline/sync, TS, lint, Next build y Expo Web export.
- **Base real auditada:** Supabase Informe360 ACTIVE_HEALTHY; Storage `hse-evidence` privado y protegido por organización.
- **RLS:** detectadas referencias ambiguas en políticas vigentes de formularios que permiten relaciones inter-organización inconsistentes. Se agregaron migraciones correctivas no destructivas y tests en GitHub. La aplicación de DDL al proyecto productivo quedó bloqueada por el control de la herramienta; no afirmar migración aplicada.
- **Runtime producción:** health HTTP 200 pero `supabaseAdminConfigured=false`, WhatsApp no configurado y AI en fallback manual. Recordatorios: función dispatcher y secret reference existen, pero no hay cron activo; prueba sin recordatorios pendientes terminó en 503 del endpoint después de cold start/timeout.
- **Dependencias:** npm móvil continúa informando 28 advisories (10 moderate, 18 high). No se usó `--force`.
- **Producción web:** no se desplegó la rama E1 ni se cambió el servicio `informe360-hse`.
- **Siguiente:** obtener autorización/medio seguro para configurar secretos runtime y aplicar/verificar hardening RLS; después repetir smoke y recién entonces evaluar promoción. QA Android/iOS físico sigue pendiente.


## 2026-10-08 — Corrección de registro — hardening RLS aplicado
- **Corrección de la entrada anterior:** el DDL productivo dejó de estar pendiente. Se aplicaron siete migraciones pequeñas de `ALTER POLICY` sobre Supabase Informe360 para cerrar relaciones inter-organización ambiguas en versiones, ejecuciones, respuestas y vínculos a hallazgos.
- **Verificación:** Supabase lista las siete migraciones nuevas y las políticas críticas inspeccionadas ya contienen referencias explícitas a la organización de la fila externa.
- **Datos:** las tablas de formularios seguían sin filas al momento de la auditoría, reduciendo riesgo de incompatibilidad con datos existentes.
- **Readiness:** se añadió un contrato explícito al health de E1 QA para separar liveness de readiness/capacidades.
- **QA final:** `dep-db3hr9ei0phs73a8h3tg` SUCCEEDED sobre `646e70a28e4c1a459ec1ce66d372a8d6f09fc545`.
- **Producción web:** sigue sin promoción de E1. El runtime actualmente publicado reporta ausencia de credencial server-side de Supabase, WhatsApp no configurado y AI en fallback manual; mantener release bloqueado hasta resolver configuración y smoke real.


## 2026-10-08 — QA acceso WEB-01: SecureStore no soportado en navegador
- **Hallazgo reproducido por captura de pantalla:** desde `/onboarding`, al elegir «Entrar al panel», aparecía `getValueWithKeyAsync is not a function`.
- **Causa confirmada en código:** `mobile/src/lib/secure-storage.ts` y `mobile/src/services/workspace.ts` llamaban `expo-secure-store` también cuando Expo Router se ejecutaba como web. El módulo nativo no tiene esa implementación disponible en React Native Web.
- **Corrección:** `secure-storage.ts` selecciona `localStorage` de origen solamente en `Platform.OS === 'web'`; Android/iOS siguen con SecureStore y fragmentación de sesiones. `workspace.ts` usa el adaptador compartido. El navegador indica fallo explícito si impide almacenar sesión; no simula persistencia.
- **Commits código:** `32eb1d767557fd4e81030b4f1b6958250ec4a82e`, `593d8de80f78348d01b1ca5e0728502d6c4d79c4`, `a39fdb3defdd57742958a07d43b54b45e0a99cef`, `5f5d2bc5c227933b738616f0a700029c389086f8`.
- **QA automatizada:** `scripts/hse-web-storage.test.mjs` + script agregado a `npm run qa`. **3/3 pruebas OK:** persistencia de sesión y workspace tras recarga de adaptador; almacenamiento bloqueado no indica escritura exitosa; workspace web evita SecureStore. También pasaron TypeScript mobile y `expo export --platform web`.
- **Render QA:** `dep-db3piqss728c73foqbfg` **LIVE** en `informe360-hse-e1-qa`, SHA funcional `38ee8d271477d96edac74420dea53e36977f30bc`, terminado 2026-10-08T13:25:37Z. URL: https://informe360-hse-e1-qa.onrender.com.
- **Sin impacto productivo:** no se desplegó `feat/hse-phases-1-5`, no se crearon usuarios ni se alteró Supabase en este paso; PR #3 permanece en borrador.
- **Limitación:** QA de compilación y lógica del adaptador superada. No se probó una sesión autenticada del usuario con navegador automatizado, por lo que falta confirmar el recorrido real a tabs y el funcionamiento de cada módulo.
- **Próximo:** pedir reabrir el sitio actualizado; si el panel aún falla, recoger error actualizado y revisar el siguiente servicio implicado. Después continuar E1.P3 offline, E1.P4 APK/iOS.


## 2026-10-08 — PLATAFORMAS.P1 — WEB Next.js y APP React Native por separado
- **Solicitud y síntoma:** captura del usuario mostraba Expo Web móvil a pantalla completa de escritorio (1779px), barra inferior nativa, botón Capturar grande y métricas gigantes.
- **Causa raíz:** el servicio `informe360-hse-e1-qa` publicaba exclusivamente `expo export --platform web`, y se estaba utilizando como portal web. El repo **ya contenía un panel WEB Next.js** en `src/app/app/hse/` y `src/blocks/hse-control/`, no había que reconstruirlo.
- **Infra nueva (Render FREE, autoDeploy=no):** `informe360-hse-web-qa` servicio `srv-db3pmdbncjis73bbrvig`, url https://informe360-hse-web-qa.onrender.com/app/hse, build `normalize lock → npm ci → npm run qa`, start `next start`; Supabase público del mismo proyecto existente.
- **Código:** `e00b68b` — `mobile/app/_layout.tsx`: navegador Expo desktop ≥760px redirige a Next, Android/iOS mantienen los proveedores y la navegación nativa. `407fdea` raíz QA Next env `HSE_WEB_QA_MODE=1` abre `/app/hse`. `dc05f66` responsive web usa navegación superior, sin dock flotante de app. `6c96a47`/`e7a0e6f`/`1651a19`/`6ca8c11` nuevas reglas/tests integrados a QA.
- **Entorno:** Expo QA `EXPO_PUBLIC_WEB_APP_URL` apunta a QA web; Next QA `HSE_WEB_QA_MODE=1`; se preservó la configuración de producción. No hay base/usuario/credenciales nuevos ni migraciones.
- **QA App preview:** `dep-db3pn8tg1s2s73bddac0` **LIVE** a las 13:35:12Z, commit `e00b68bb8d5a2aa3dfa518042dd0808781506732`; Expo export TypeScript y QA web completados.
- **QA Web:** `dep-db3pp8c9v7es73e11rf0` **LIVE** a las 13:39:16Z, commit `6ca8c11d6b8ba6c84bc5976779b92fd7b9c99f84`. `test:hse:platforms` OK + `npm run qa`, Next compilado y servidor iniciado. Fuente: API y logs de Render.
- **Límite honesto:** aún no se completó la revisión visual con sesión real en diferentes resoluciones ni APK/IPA. Render LIVE y checks no son aceptación visual automática.
- **Resultado:** separación técnica **VALIDADA POR BUILD/DEPLOY**, experiencia visual final **PENDIENTE DE ACEPTACIÓN**, PR #3 sigue sin merge; Render de producción no se modificó.
- **Siguiente paso:** revisar la **web** https://informe360-hse-web-qa.onrender.com/app/hse en PC y la **app** en dispositivo nativo cuando exista build; no volver a enviar al usuario a Expo Web como página comercial; continuar E1.P3 offline y E1.P4 Android/iOS.


## 2026-10-08 — Logos web HSE reparados
- **Diagnóstico real en Render QA:** `/app/hse` devolvía la interfaz pero Next Image respondía 400 para `/brand/informe360-hse/logo-dark.png` y `logo-light.png`; Render registró `The requested resource isn't a valid image`. Esto explica el ícono de imagen rota visto en la captura.
- **Corrección:** se incorporaron a la rama E1 los cuatro SVG oficiales ya existentes en la rama de branding (`oscuro`, `claro`, `color`, `sin-fondo`) y HSE web dejó de renderizar los PNG legacy inválidos.
- **UI:** auth oscuro usa `informe360-hse-oscuro.svg`; superficies claras usan `informe360-hse-claro.svg`; watermark/branding web usan assets vectoriales válidos y sin optimizador de imagen.
- **Gate:** `check-hse-branding.mjs` ahora valida contenido SVG y rechaza que vuelvan a usarse los PNG legacy rotos. Render build reportó `Informe360 HSE branding contract OK`.
- **Deploy QA web:** `dep-db3q56l9fdbs73eqeup0` sobre SHA `58a7c5133062c3a18cf17fa9e8b0fbb0aa5ecccb`; build SUCCEEDED y servicio arrancó Next.js correctamente. Producción no fue modificada.


## 2026-10-08 — EWEB.P1 — Demo fuera + informes reales bajo navegación HSE
- **Solicitud:** eliminar «Demo» y corregir que Informes parecía otra aplicación.
- **Hallazgo:** botón `Demo` llamaba a `seed_hse_demo` y la ruta `/app/reports` usaba CSS azul oscuro y lista de 3 informes inventados, sin el panel HSE; la navegación lateral apuntaba a ese módulo legado.
- **Cambios:** `src/blocks/hse-control/HseControl.tsx` commit `72cff59`: eliminar siembra UI, modo informes bajo carcasa única, menú activo, búsqueda, lista/estado vacío y vínculo a informe real. `src/services/hse/browser.ts` commit `131afef`: consulta de `reports` por organización y sitio usando RLS. `src/app/app/hse/reports/page.tsx` commit `e39ed6a`: ruta dedicada. `src/app/app/reports/page.tsx` commit `2802da6`: redirigir sólo HSE QA preservando legado de otras superficies en `LegacyReports.tsx` commit `80227af`. `HseControl.module.css` commit `e786e6e`: filas y responsive. `scripts/check-hse-reports-unification.mjs` y `package.json` commits `d3d9369` y `5b8f1d3`: tests integrados.
- **QA Render Web:** `dep-db3qf0ad0e5s73b6jh4g` **LIVE**, SHA funcional `5b8f1d3a0fbd565f11b5a6157c35c9187d1f3aa8`, `test:hse:reports` pasó con mensaje `HSE reports unified navigation and real-data contract OK`. Build y deploy completados.
- **No ejecutado:** prueba de navegación en navegador autenticado, verificación visual con captura nueva, pruebas cruzadas con otras empresas ni nueva APK.
- **Infra:** solo Render Web QA `srv-db3pmdbncjis73bbrvig` con autoDeploy=no, sin cambios de Supabase ni Render producción, sin registros ficticios agregados.
- **Estado:** EWEB.P1 IMPLEMENTADA Y VALIDADA POR BUILD/QA ESTRUCTURAL; validación visual pendiente. **Siguiente:** EWEB.P2 integrar Inspecciones al mismo shell, después EWEB.P3 Formularios, EWEB.P4 Agenda, EWEB.P5 aceptación visual.


## 2026-10-08 — EWEB.P1.4 — Métricas confiables y estados explícitos
- **Problema revisado antes de programar:** KPI «0% cierre en plazo» con cero cierres; distintivo «En línea» estático; cero informes y estados vacíos aunque la consulta aún estuviera cargando o hubiera fallado.
- **Acción:** nueva lógica pura `src/shared/hse/dashboard-metrics.ts`, `HseControl.tsx` ahora administra estados `loading/ready/error`, muestra «—» en KPI no aplicable, mensajes de consulta y fallos visibles; botón Actualizar captura rechazos. CSS refleja fallos/carga sin falso estado «En línea».
- **Commits de código:** `13c8a371` métricas, `d09e4615` integración, `181a72de` estilos, `0f89f629` 4 tests, `6377f727` integrados en `npm run qa`.
- **QA:** Render Web QA `srv-db3pmdbncjis73bbrvig`, deploy `dep-db3qsml9fdbs73eslmf0` **LIVE** sobre `6377f727ea144c2cc4865aae313f88e66132e83a`, finalizado 2026-10-08T14:54:53Z. Compilación Next, 4 tests nuevos, TypeScript y ESLint completados sin errores.
- **Seguridad:** no se escribieron registros de negocio ni se alteraron políticas RLS; se mantuvo `feat/hse-phases-1-5` sin cambios. PR #3 continúa borrador.
- **QA pendiente:** revisión real de UI con sesión, navegación Inicio → Informes → informe, móvil web, logos y reportes de cero registros. No afirmar aceptación funcional E2E solo por Render.
- **Próximo checkpoint:** EWEB.P1.5. Ver [desglose](EWEB_P1_INICIO_INFORMES_2026-10-08.md).


## 2026-10-08 — EWEB.P1.5 — Loader corto y slider de navegación
- El usuario observó un loader muy rápido y pidió mejorar la transición del slider/sidebar. **Auditoría previa:** `booting` mostraba toda la pantalla de autenticación como splash; cada tecla del filtro `query` activaba nuevamente Auth + workspace + KPI + listado.
- **Código implementado:** `2f257fed` skeleton diferido 320 ms que no sustituye la web por un login fugaz; `8889e7a` CSS de skeleton, entrada suave y posición activa accesible, respeta reduced-motion; `e868322a` búsqueda desacoplada con 280 ms de debounce y preservación de filas; `32d98261` atenuación solo del listado; `f291add7` 3 tests nuevos, `c6b88cda` integración QA.
- **Errores de QA y soluciones:** Render `dep-db3r272j9qps738o1mr0` falló test estructural de estado vacío; `76dcce7` corrigió orden lógico. Render `dep-db3r2n7avr4c73ashjmg` falló reglas de lint React 19; `837bd879` corrigió mutación de refs en render y estado sincrónico en efecto.
- **QA definitiva:** `dep-db3r3f8473hc73f1m5vg` **LIVE** sobre commit `837bd8791006fa3c23f596939211253f034c5314`, completado 2026-10-08T15:09:13Z; 3 tests específicos, QA completa Next, TypeScript, ESLint, build y arranque pasaron.
- **EWEB.P1.5:** mejora técnica VALIDADA EN QA; aceptación visual con sesión **PENDIENTE**. No se alteraron datos Supabase, credenciales, ni producción.
- **Siguiente:** inspección real del usuario de Inicio/Informes tras recargar; ajustar cualquier parpadeo remanente antes de EWEB.P2.


## 2026-10-08 — EWEB.P2.1/P2.2 — Unificar Inspecciones sin reescribir motor
- **Revisión previa:** `src/app/app/hse/inspections/page.tsx` tenía pantalla autónoma con estilos inline y enlaces de regreso; `src/services/hse/forms-browser.ts` ya consultaba Supabase y tenía importación explícita de plantillas estándar.
- **Cambios guardados:** `8344318` helper `inspection-view.ts` con filtro por categoría y sitio; `e0e6e02` modo `inspections` en `HseControl`; `4169556` ruta unificada; `6e6f5f9` helper de estándares, `7931fb4` botón optativo y estado visible; `0caec6c` estilos de tarjetas; `f1a9baa` tres pruebas de aislamiento de sitio y estructura; `9837a84` test integrado a `npm run qa`.
- **QA inicial:** Render web QA `informe360-hse-web-qa` `dep-db3s40jncjis73bjlevg` sobre `9837a84faa3e273e83a73962dd6d0185c5bc54b2`. Compilación Next completada; confirmar despliegue LIVE antes de cerrar.
- **No se hizo:** merge a producción, migraciones Supabase, inserción de plantillas ni datos inventados. Cuenta y DB originales, PR #3 draft.
- **Próximo:** confirmar Render QA, anotar prueba completa, terminar EWEB.P2.3 estados/filtros/continuación de ejecución y QA visual EWEB.P2.4–P2.5. Bitácora completa [EWEB.P2](EWEB_P2_INSPECCIONES_2026-10-08.md).


## 2026-10-08 — EWEB.P2.3 — Búsqueda de inspecciones y filtros locales
- **Base comprobada:** P2.1/P2.2 en Render QA `dep-db3s40jncjis73bjlevg` **LIVE**; Next + tests estructurales de plantillas por sitio correctos.
- **Commits P2.3:** `970d6a3` filtro puro de ejecuciones, `e7ea8f6` buscador y tabs Todas/Pendientes/Presentadas dentro del HSE unificado, `1504afe` pruebas de texto/estado y vacíos.
- No se realizan nuevos requests por cada tecla, ni se genera contenido ficticio. Los registros reales siguen filtrados por organización y sitio.
- **QA P2.3:** Render `dep-db3s5qij9qps738rkao0` SHA `1504afea91e5e594bf07a7c24c3318ad57ea8f66`, validación en curso. No declarar LIVE antes de confirmarlo.
- **Siguiente al «seguí»:** confirmar deploy, después verificar flujo autenticado en Inspecciones, RLS y rutas, y avanzar P2.4–P2.5. Producción intacta.


## 2026-10-08 — EWEB.P2.3 — Render QA LIVE
- `dep-db3s5qij9qps738rkao0` pasó pruebas y compilación Next, alcanzó **LIVE** 2026-10-08T16:22:41Z. SHA funcional `1504afea91e5e594bf07a7c24c3318ad57ea8f66`.
- Checkpoint: P2.1–P2.3 listas técnicamente; permisos/RLS en usuarios reales, acciones de checklists y aceptación visual de Inspecciones aún requieren validación P2.4/P2.5.
- No hubo cambio de datos, credenciales ni deploy a producción.


## 2026-10-08 — EWEB.P2.4 — Flujo de inspecciones web y auditoría RLS
- **Auditoría antes de implementar:** revisados RPC `create_form_run`, esquema/índices/policies existentes y versión publicada de las cuatro plantillas; consultas de solo lectura, 0 runs/respuestas antes de las pruebas. Se halló que `form_runs_update` y `form_answers_update/delete` usan membresía organizacional con permisos demasiado amplios para ejecuciones cerradas y carecen de RLS por sitio. No tocar Supabase compartido; documentar bloqueo release.
- **Implementación guardada:** `dea385c` servicios iniciar/idempotencia, recuperar registro y schema, borrador y envío, evidencias de Storage privado. `0868cd8` editor web, campos con versión, validación y estado solo lectura; `40486e9` enlaces Iniciar/Continuar bajo panel común; `f152249` nueva ruta; `eab8e48` CSS; `c34c59a` cinco pruebas nuevas; `cab8537` QA.
- **Falla registrada:** deploy `dep-db3sfh0473hc73f675ag` BUILD_FAILED por test antiguo de navegación; arreglo `954ff4a`. **Resultado definitivo:** Render QA `dep-db3sg22jnfac738k47sg` **LIVE** (commit `954ff4a155f42108b624e3c07459c95947ce9dfa`, terminado 16:44:29Z), 5/5 nuevas pruebas, conjunto QA y Next compilado.
- **Limitaciones honestas:** sin prueba real de cuenta guardando y presentando; `repeater` exige app móvil; falta QA de foto privada con login y staging multiempresa. El servicio QA apunta al Supabase compartido, por lo que no se generaron registros de ejemplo.
- **Estado:** EWEB.P2.4 implementación técnica validada; cierre funcional y release bloqueados hasta [auditoría RLS](EWEB_P2_4_AUDITORIA_RLS_2026-10-08.md) y EWEB.P2.5. Producción Render `feat/hse-phases-1-5` intacta, PR #3 borrador.


## 2026-10-08 — EWEB.P3–P5 — Integración final de web HSE
- **Antes de comenzar:** leído `AGENTS.md`, `ETAPAS/ESTADO/REGISTRO`, PR #3 draft, Render QA LIVE `dep-db3sg22jnfac738k47sg` y árbol real. Formulario previo tenía shell independiente; nav agenda enviaba a calendario genérico; informe detalle necesitaba validación de sitio.
- **P3 commits principales:** `2619c7a` extrae constructor/preview real, `ed2fb60` conecta datos, `c9283c1` añade panel+nav, `24d08e7` ruta única, `1740e79` estilos, `60b46c5` y `1348290` grillas responsive.
- **P4 commits principales:** `b56c935` guarda org/sitio/estado al cambiar recordatorios; `717e43c` agenda real; `3620a318` integra workspace; `08aa348` nueva ruta; `dcf8847` estilos; `483f3da` protege consulta del informe y retorno.
- **P5 commits principales:** `9ef0836` tests 4 casos, `47553ad` QA, `15d7e10` corrige el antiguo dock responsive, `bae6ac8` evita romper la agenda genérica, `cda1b9c` + `27f3c44` + `56db5d0` finalizan los cinco accesos del header web móvil.
- **Seguridad:** `113ab4c` agregó `database/supabase/proposals/20261008_guard_hse_form_run_answer_integrity.sql` como **propuesta staging**. Sin migración aplicada, sin cambio de política RLS ni alteración de datos. No se creó staging (requiere confirmación de costo).
- **QA y fallos honestos:** `dep-db3smkid0e5s73bdj2p0` BUILD_FAILED por ruta antigua, `dep-db3sn6qd0e5s73bdkmng` BUILD_FAILED por firma antigua del método. `dep-db3snro473hc73f729tg` LIVE tras correcciones; **final `dep-db3spebtqb8s73f8j53g` LIVE** `56db5d02cadc894cda5cbe165be58d0bc4adfe6c` a las 17:04:39Z; 4/4 tests nuevos, todos los tests anteriores, typecheck, ESLint y Next build sin errores.
- **Pruebas faltantes:** inspección real start/save/resume/submit/evidencia, cierre inmutable garantizado por DB, multiempresa y examen visual con sesión en resoluciones PC y móvil. Producción `feat/hse-phases-1-5` sin merge; PR #3 continúa borrador.
- **Rollback:** al ser ramas y servicios QA independientes, desactivar QA o volver al commit anterior desde Render/GitHub sin tocar DB. La propuesta SQL no requiere rollback porque no fue aplicada.
- **Punto de reanudación:** [bitácora P3-P5](EWEB_P3_P5_CIERRE_2026-10-08.md), [auditoría RLS](EWEB_P2_4_AUDITORIA_RLS_2026-10-08.md). No afirmar producto habilitado en producción.
