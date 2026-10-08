# E1.P2 — Fotos privadas y flujo móvil nativo (2026-10-07)

**Rama:** `feat/hse-e1-offline-resilience-2026-10-08` — [PR #3](https://github.com/LordKurama01/informe360/pull/3) en modo borrador. **No fusionado a Render producción**.

## Funcionalidad incorporada (sin afirmar prueba real de dispositivo)

1. `mobile/src/services/form-evidence.ts`: transformación **solo de campos `photo` declarados en la plantilla publicada**, también en repetidores. Texto arbitrario no se interpreta como fichero. Acepta URIs locales y referencias privadas válidas; rechaza URLs arbitrarias, rutas inválidas y referencias fuera de la organización/ejecución.
2. `mobile/src/services/form-media.ts`: subida de fotos JPEG usando `uploadLocalFile` al bucket privado `hse-evidence`, bajo `organizationId/form-runs/runId/`, con nombre estable para reintentos y acceso por URL firmada temporal (15 minutos). **Nunca convertir evidencias a buckets públicos.**
3. `mobile/src/services/forms.ts`: resuelve la versión inmutable de plantilla antes de guardar y sube fotos antes del `upsert` de respuestas. Evita almacenar nuevas rutas `file://` en `form_answers`.
4. `mobile/src/components/forms/FormField.tsx`: la imagen de cámara se copia a almacenamiento durable, se visualiza mediante URI local mientras está pendiente y se resuelve vía URL firmada al reabrir un formulario remoto; mensaje de error en lugar de exponer ruta privada.
5. `mobile/src/components/forms/DynamicForm.tsx`: flujo móvil por **pasos con barra de avance**, validación antes de continuar, volver y controles de 48–54 puntos; no se sustituye React Native por una webview. El modo consulta mantiene todas las secciones visibles.
6. `mobile/app/form-run/[runId].tsx`: desplaza el scroll al inicio al cambiar de paso y distingue guardado local frente a subida fallida de respuestas/fotos.

## Tests de regresión

- `scripts/hse-form-evidence.test.mjs`: fotos de secciones y repetidores, no tocar campos de texto, referencias previas idempotentes, bloqueo de rutas inválidas y de otra organización/ejecución.
- `package.json`: `test:hse:form-evidence` ejecutado dentro de `npm run qa`.
- Render QA `dep-db3g488m7kps73ehqm70` **BUILD_FAILED** por test que detectó inclusión de `notes: undefined` al preparar un registro que no tenía respuesta. Corregido por commit `b110d01e99d272dee92e299e57b9865ab41979d0`.
- Render QA `dep-db3g4ufavr4c739leo6g` **LIVE** sobre ese commit: `npm run qa`, TypeScript web y Expo, compilación Next y export Expo web pasaron. No confirma prueba física ni conectividad real autenticada.
- Render QA `dep-db3g5td9fdbs73dldia0` **BUILD_FAILED** después de sumar wizard por error de tipado de porcentaje RN; corregido en commit `941247fa11bc249ec90f0247473db414a2dbb500`.
- **Validación siguiente**: consultar deploy manual `dep-db3g6l7avr4c739lltog`, sobre commit `941247fa11bc249ec90f0247473db414a2dbb500`. Registrar resultado real; no declarar gate sin confirmación.

## Auditoría de seguridad

- Bucket `hse-evidence` verificado **privado** en Supabase Informe360 y sujeto a políticas RLS; ninguna migración ni dato de producción modificado.
- Las políticas de `form_answers` requieren **revisión adicional de integridad referencial y estados** con pruebas negativas antes de autorizar un release. No usar evidencia de typecheck web para afirmar RLS segura.
- No exponer credenciales, datos reales ni detalles de riesgos de autorización en un repositorio público.
- Mantener la documentación de esas verificaciones en el backlog de seguridad.

## Pendientes y criterio de cierre

- **E1.P2:** validación integrada con cuenta de prueba, 2 dispositivos, JPG real, URL firmada, cambio de sesión, fallo de red y reintento; evaluar limpieza de ficheros locales y huérfanos con política de retención.
- **E1.P3:** iniciar nuevas inspecciones offline desde plantillas cacheadas, recuperación offline, sincronización idempotente en pruebas reales, aislamiento por empresa, investigación de pruebas RLS.
- **E1.P4:** APK Android e iOS nativo, interfaz (accesibilidad y ergonomía), cámara, audio, firma, ciclo completo con técnico HSE, auditoría de dependencias.
- **Regla de integración:** QA Render aislada `informe360-hse-e1-qa`, `autoDeploy=no`; producción `informe360-hse` no se modifica.

**Próxima parte exacta:** al decir «seguí», comprobar deploy `dep-db3g6l7avr4c739lltog`, registrar estado, luego implementar el arranque/reanudación offline de nuevas inspecciones con aislamiento y tests, sin integrar el PR antes del gate.
