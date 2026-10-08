# Plataformas separadas — Informe360 HSE (2026-10-08)

## Decisión de producto
**La web es una aplicación de escritorio en Next.js; la app es una aplicación nativa Android/iOS en React Native + Expo.** Comparten Supabase (cuenta, organizaciones, hallazgos, inspecciones), pero tienen UI, navegación, compilación y despliegues independientes. La versión Expo Web es solamente una vista técnica de la app móvil, no la web comercial.

El problema se detectó al abrir `informe360-hse-e1-qa.onrender.com` desde un escritorio de 1779px: se mostraban el botón gigante «Capturar», tarjetas expandidas y barra inferior de Expo. Es un **error de distribución**, no un requisito de diseñar otra app o sustituir React Native.

## URLs y despliegues

| Destino | Implementación | Render | Estado |
| --- | --- | --- | --- |
| **Web HSE de escritorio QA** | Next.js, `src/app/app/hse/page.tsx`, `src/blocks/hse-control/` | `informe360-hse-web-qa`, `srv-db3pmdbncjis73bbrvig` | Primer build LIVE, segundo build de ruta raíz en validación |
| **App móvil — vista previa web técnica** | React Native/Expo, `mobile/` | `informe360-hse-e1-qa`, `srv-db3fsnnavr4c739kgeag` | Redirección de escritorio LIVE |
| **Web HSE producción** | Next.js, rama `feat/hse-phases-1-5` | `informe360-hse`, `srv-dajaqq7qj5pc73cssr90` | No se ha tocado |
| **Android/iOS nativos** | `mobile/`, Expo/React Native; futura APK/iOS | No depende de Render para UI | Builds físicos pendientes |

Enlaces:
- Web escritorio: https://informe360-hse-web-qa.onrender.com/app/hse
- App preview técnica: https://informe360-hse-e1-qa.onrender.com
- Web producción (no fusionar): https://informe360-hse.onrender.com/app/hse

Ambos nuevos entornos QA en plan Render **free** y `autoDeploy=no`. La web usa el mismo Supabase que ya existía; abrirla desde otro origen puede requerir iniciar sesión nuevamente con el mismo usuario. No copiar tokens ni sesiones entre dominios.

## Cambios de código
1. `mobile/app/_layout.tsx`: solo en **navegador ≥760 px**, redirigir desde Expo Web Preview al verdadero panel web, URL configurable por `EXPO_PUBLIC_WEB_APP_URL`; Android/iOS nativos mantienen íntegros AuthProvider/WorkspaceProvider/SyncProvider y navegación de tabs.
2. `src/app/page.tsx`: en **instancias web QA con `HSE_WEB_QA_MODE=1`** abrir `/app/hse` en lugar de la landing genérica. Fuera de esa variable, mantener landing existente sin cambios.
3. `scripts/check-hse-platform-separation.mjs`: regresión estructural para que el panel web siga siendo Next.js de escritorio y la app RN no se sustituya por webview; conectado a `npm run qa`.
4. Render QA de Expo: `EXPO_PUBLIC_WEB_APP_URL=https://informe360-hse-web-qa.onrender.com/app/hse`.
5. Render Web QA: `HSE_WEB_QA_MODE=1`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` de proyecto Informe360, sin claves privilegiadas. `SKIP_INSTALL_DEPS=true`; se normaliza lockfile antes de npm install, se corren QA y Next build.

## Aceptación y QA
- Web QA primer build `dep-db3pmgbncjis73bbs980` **LIVE**, commit `60af9cde195be1c6e0d48066d6237eea344ed8c2`, en la URL separada de Next.js.
- App Preview QA `dep-db3pn8tg1s2s73bddac0` **LIVE**, commit `e00b68bb8d5a2aa3dfa518042dd0808781506732`, con redirección solo en escritorio; Android/iOS no se modifican por condición de plataforma.
- **Pendiente de certificar:** nuevo build Web QA `dep-db3poaflk1mc73cfvd5g`, commit `1651a1900e2ddb73a01bcf434555d8ab699b4ca7`, para verificar redirección raíz y nuevo contrato.
- **QA visual manual:** revisar la web en desktop 1366/1440/1920 y celular web; inspección con sesión real. No afirmar que existe APK instalada ni prueba nativa.
- **Gate crítico anterior:** inicio y sync de inspecciones offline en teléfono, RLS/signed images y branding PNG siguen pendientes; esta separación no los da por cerrados.

## Reanudación
Cuando se diga «seguí»: leer `REGISTRO.md`, `ESTADO.md` y este archivo; comprobar ambos servicios QA LIVE con HEAD verificado; confirmar web responsive real sin tabs Expo; continuar E1.P3 offline + gate Android/iOS, y auditar experiencia visual del Next HSE. Mantener `feat/hse-phases-1-5` sin merge/despliegue durante QA.
