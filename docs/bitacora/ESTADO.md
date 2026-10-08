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

- **Trabajo de este ciclo:** E0 — institucionalizar continuidad en GitHub; docs/bitácora y PR documental.
- **Bloque funcional siguiente:** E1.P1 — auditoría del guardado local y sincronización preexistentes, inventario de pruebas y fallos; **no implementar todavía** hasta leer el registro y comprobar HEAD y CI.
- **Estado de cierre:** leer la última entrada de [REGISTRO.md](REGISTRO.md). Si el PR de bitácora sigue abierto, tomar los archivos de la rama documental y mantenerlo separado de Render.
- **Orden futura «seguí»:** verificar GitHub y estado real; completar el primer paso pendiente de ETAPAS, registrar resultado y siguiente paso. No pedir al usuario repetir este contexto.
