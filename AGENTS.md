# Instrucciones permanentes para agentes — Informe360 / HSE Copilot

## Lectura obligatoria antes de modificar
1. Consultar el repositorio real, rama y HEAD actual de GitHub; NO suponer que el último chat es el estado real.
2. Leer `docs/bitacora/README.md`, `docs/bitacora/ESTADO.md`, `docs/bitacora/ETAPAS.md` y `docs/bitacora/REGISTRO.md`.
3. Contrastar cada tarea con código, migraciones, tests, CI, arquitectura y documentación histórica; verificar Render/Supabase cuando el cambio los afecte.
4. Buscar implementaciones existentes antes de copiar o programar. Reutilizar > duplicar o reescribir.
5. Confirmar destino de commit, integración, deploy automático y rollback antes de una escritura.

## Contrato operativo
- La orden «seguí», «continuá» o «siguiente parte» significa reanudar el **próximo paso pendiente verificado** en `docs/bitacora/ETAPAS.md`, nunca iniciar desde cero.
- La continuidad vive en GitHub, no en memorias ni mensajes previos.
- Actualizar `docs/bitacora/ESTADO.md` antes de comenzar un bloque material, anotando objetivo, ref de Git y supuestos no verificados.
- Registrar en `docs/bitacora/REGISTRO.md` cada parte ejecutada: fecha, rama, HEAD antes/después, cambio, archivos, tests/QA, resultado, riesgos, rollback y siguiente acción. No borrar entradas anteriores: agregar entradas cronológicas.
- Cada parte funcional debe quedar asociada a commit/PR identificable. No marcar FINALIZADA sin evidencia de aceptación y pruebas proporcionadas.
- Estatus válidos: PENDIENTE / EN CURSO / BLOQUEADA / IMPLEMENTADA SIN QA / VALIDADA / DESCARTADA. «Existe el archivo» no equivale a «funciona en producción».
- Antes de cerrar una sesión, actualizar punto de reanudación explícito y bloqueos.
- Respetar las normas de seguridad de instalaciones petroleras; IA puede sugerir, nunca autorizar trabajo ni suplantar aprobación HSE.

## Protección de producción
- `main`: estable; NO hacer push sin revisar integración/despliegue.
- `feat/hse-phases-1-5`: rama de trabajo con **Render autoDeploy=yes**, servicio `informe360-hse`, según inspección de 2026-10-07. Incluso cambios documentales pueden gatillar un deploy.
- No hacer push directo a una rama auto-desplegada sin evaluar impacto, QA y rollback. Preferir rama hija + PR; no hacer merge/desplegar por defecto.
- Supabase: única fuente de verdad. No duplicar Auth/DB ni aplicar migraciones en producción sin verificar entorno/RLS/rollback.
- Jamás poner claves privadas, datos reales de clientes o evidencias sensibles en la bitácora pública.

## Alcance
`docs/bitacora/ETAPAS.md` es el backlog operativo; los planes antiguos son referencias, no autorizaciones implícitas para ejecutar, replicar o desplegar.


## Separación obligatoria WEB / APP (2026-10-08)
- **Web HSE de escritorio:** Next.js `src/app/app/hse/` + `src/blocks/hse-control/`, con menú lateral, métricas, listados, informes y configuración. URL QA `https://informe360-hse-web-qa.onrender.com/app/hse` (`srv-db3pmdbncjis73bbrvig`); `HSE_WEB_QA_MODE=1` redirige la raíz del servicio al panel. Navegación del navegador debe ser web, incluso en su responsive móvil.
- **App Android/iOS:** React Native + Expo en `mobile/`, navegación propia, cámara, voz, guardado offline y sincronización. La exportación Expo Web `informe360-hse-e1-qa.onrender.com` es exclusivamente **preview técnica**, no el sitio comercial. En desktop web (>=760 px) envía al portal Next.js, mediante `EXPO_PUBLIC_WEB_APP_URL`. No crear webview ni estirar layout móvil para reemplazar la web.
- Las dos plataformas utilizan el mismo Supabase con Auth/RLS; no compartir tokens entre diferentes orígenes ni duplicar usuarios/DB.
- **QA obligatorio:** `npm run test:hse:platforms`, Next.js web build, Expo typecheck/web export para preview, y builds/pruebas nativas separadas antes de publicar Android/iOS. No confundir `LIVE` de Render con APK nativa aprobada.
- Ver `docs/bitacora/PLATAFORMAS_WEB_MOVIL_2026-10-08.md`. Nunca cambiar rama de Render producción directamente.
