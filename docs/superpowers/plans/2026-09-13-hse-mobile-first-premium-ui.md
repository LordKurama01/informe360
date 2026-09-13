# Plan de implementación — HSE mobile-first premium UI

Fecha: 2026-09-13
Rama: `feat/hse-mobile-first-premium-ui`
Base: `51316f88a450e88c686605441a712010d1fc482a`

## Guardrails

- No tocar Supabase, migraciones, RLS ni servicios backend.
- No cambiar contratos de captura, sync, IA, hallazgos, inspecciones ni formularios.
- No escribir sobre `feat/hse-phases-1-5` hasta completar validación.
- No iniciar IPCR/ATS/PT en este bloque.
- Mantener compatibilidad con rutas existentes cuando sea razonable.
- Cada paso de implementación debe conservar typecheck y Expo Android export.

## 1. Contrato estructural RED

Crear `scripts/check-mobile-premium-ui.mjs` con assertions que hoy fallen y describan el resultado esperado:

- `theme.ts` expone nuevos tokens de espaciado/superficie.
- existen `FieldHeader`, `SectionHeader` y `MetricTile`.
- existen rutas `(tabs)/capture.tsx` e `(tabs)/inspections.tsx`.
- `_layout.tsx` registra `capture` e `inspections`.
- captura enlaza `mode=audio`, `mode=photo`, `mode=text`.
- inspecciones usan una pantalla compartida y no duplican su lógica.
- Home conserva marcadores de sync/review/critical y acceso a captura.

Agregar `test:mobile:ui` al `package.json` raíz e incluirlo dentro de `qa`.

Esperado: CI falla únicamente por el contrato nuevo faltante.

## 2. Design tokens y primitivas

Actualizar:

- `mobile/src/theme.ts`
- `mobile/src/components/Screen.tsx`
- `mobile/src/components/PrimaryButton.tsx`
- `mobile/src/components/FindingCard.tsx`

Crear:

- `mobile/src/components/FieldHeader.tsx`
- `mobile/src/components/SectionHeader.tsx`
- `mobile/src/components/MetricTile.tsx`

Criterio: componentes pequeños, sin dependencia visual nueva y con API simple.

## 3. Navegación de campo

Actualizar `mobile/app/(tabs)/_layout.tsx` a cinco destinos:

- index — Inicio
- findings — Hallazgos
- capture — Capturar
- inspections — Inspecciones
- alerts — Alertas

Crear `mobile/app/(tabs)/capture.tsx` como hub visual que sólo enruta a `register`.

La acción Capturar debe ser central y visualmente dominante.

## 4. Inspecciones como primer nivel

Extraer la implementación de `mobile/app/inspections/index.tsx` a:

- `mobile/src/screens/InspectionsScreen.tsx`

Crear:

- `mobile/app/(tabs)/inspections.tsx`

Mantener `mobile/app/inspections/index.tsx` como wrapper hacia la misma pantalla para compatibilidad con enlaces existentes.

## 5. Inicio mobile-first

Refactor de `mobile/app/(tabs)/index.tsx` sin modificar servicios ni handlers.

Preservar:

- workspace y logout;
- AI runtime;
- pull-to-refresh;
- offline pending + manual sync;
- pending review;
- captura audio/foto/texto;
- métricas y filtros;
- críticos;
- actividad reciente;
- demo empty state.

Reducir altura del hero, mejorar jerarquía y dejar una única acción dominante.

## 6. Hallazgos y alertas

Refactor visual de:

- `mobile/app/(tabs)/findings.tsx`
- `mobile/app/(tabs)/alerts.tsx`

No cambiar búsqueda, debounce, filtros, selección, report generation ni agrupación temporal.

## 7. Captura y autenticación

Refactor visual de:

- `mobile/app/register.tsx`
- `mobile/app/login.tsx`
- `mobile/app/onboarding.tsx`

Preservar permisos, audio, cámara, drafts, offline queue, auth y workspace onboarding.

## 8. Formularios e inspección dinámica

Refactor visual de:

- `mobile/app/forms/index.tsx`
- `mobile/app/forms/[templateId].tsx`
- `mobile/app/form-run/[runId].tsx`
- componentes dinámicos sólo si hace falta para coherencia táctil.

Preservar borradores offline, versionado, campos y navegación.

## 9. Revisión y detalle de hallazgo

Refactor visual de:

- `mobile/app/review-draft.tsx`
- `mobile/app/pending-reviews.tsx`
- `mobile/app/finding/[id].tsx`

Preservar expresamente lenguaje de seguridad normativa, evidencia por fases, cierre, reapertura y trazabilidad.

## 10. GREEN y verificación

Ejecutar mediante GitHub Actions del branch:

- `npm run qa`
- instalación mobile
- `npm run typecheck`
- `npx expo export --platform android --output-dir dist`

Sólo considerar el refactor técnicamente cerrado si el run fresco termina `success`.

## 11. Revisión final antes de promoción

Comparar rama contra `feat/hse-phases-1-5` y verificar que:

- no hay migraciones;
- no hay secretos;
- no hay cambios de servicios de negocio salvo imports necesarios para extraer pantallas;
- el diff es mayormente UI/routing/tests/docs;
- producción no fue modificada.

La promoción a la rama auto-deploy se decide después de esta verificación y de una revisión visual razonable. El APK físico sigue siendo una tarea separada del cierre de Fase 1.
