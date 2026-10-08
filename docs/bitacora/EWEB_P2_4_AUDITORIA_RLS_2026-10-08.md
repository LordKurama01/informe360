# EWEB.P2.4 — Auditoría de inicio, continuación, envío y aislamiento de inspecciones

Fecha: 2026-10-08. Proyecto Supabase Informe360: `wvjmsltqrztlvgmayicr`. Auditoría **solo de lectura**; no se modificaron permisos, usuarios ni registros de producción.

## Evidencia del esquema actual
- `form_templates`, `form_template_versions`, `form_runs` y `form_answers` tienen RLS activado.
- RPC `public.create_form_run(uuid,uuid,uuid)` usa contexto invoker, exige versión publicada, organización del usuario y sitio de la organización, y deduplica con `client_run_id`.
- `form_runs_insert` verifica pertenencia a la empresa, `started_by=auth.uid()`, plantilla/versión y sitio de la misma organización.
- `form_answers_insert` verifica empresa, `answered_by=auth.uid()` y correspondencia de `form_run_id` con la empresa.
- Se constataron 4 plantillas de inspección publicadas y **0 ejecuciones/respuestas** antes de estas pruebas. No se fabricaron ejecuciones para obtener métricas.

## Hallazgos de seguridad a resolver antes de integrar a producción
1. `form_runs_update` usa pertenencia a organización pero no exige que el estado antiguo sea editable ni restringe la transición a submitted/reviewed; tampoco impide modificar `started_by`, plantilla o fecha mediante una actualización arbitraria que preserve vínculos válidos.
2. `form_answers_update` permite actualización por membresía sin imponer `answered_by=auth.uid()` en `WITH CHECK`, ni exigir estado editable del run. `form_answers_delete` permite borrar evidencia asociada con una ejecución ya cerrada a usuarios de la empresa.
3. Las políticas RLS trabajan a nivel organización; **sitio activo** se filtra en la UI, pero no equivale a permisos por sitio en la base. No afirmar aislamiento de sitio por RLS.
4. Faltan pruebas negativas con dos usuarios de organizaciones distintas, y entre roles owner/member, sobre lecturas, guardado, envío, fotografía privada y edición de ejecuciones cerradas.
5. Se requiere asegurar que `form_answers` preserve el nombre histórico del campo y la fotografía privada ante modificaciones, y que `form_runs` tenga transiciones de estado comprobadas en backend, preferentemente mediante función/trigger de seguridad auditable.

## Trabajo permitido ahora (sin mutaciones de infraestructura)
- Código de app WEB usa RPC publicado para iniciar e idempotencia, consulta `form_runs` por empresa y sitio activo, impide escritura desde la interfaz cuando status no es draft/in_progress, valida campos antes de presentar, guarda respuestas por org/run y utiliza Storage privado `hse-evidence` con referencias y URL firmadas.
- Estas comprobaciones de aplicación **no sustituyen** RLS y triggers. No son pruebas de seguridad backend.
- La vista móvil y la web comparten tablas, versiones y evidencia, sin migraciones ni claves de servicio en el navegador.
- Las inspecciones que contengan `repeater` se pueden consultar, pero no enviar desde la web mientras ese editor no exista allí. No ocultar esa limitación.

## Gate de release
1. Diseñar migración compatible con clientes móviles existentes que proteja `form_runs` y `form_answers` durante estados terminales y evite escritura de metadatos inmutables; revisar `owner` y supervisor.
2. Probar la migración en una **base staging aislada**, con roles reales, antes de aplicarla a Supabase compartido.
3. Ejecutar suite de pruebas negativas multiempresa, cargas de fotografías, transición y reanudación.
4. Ejecutar EWEB.P2.5 visual en escritorio y móvil web con sesión autenticada.
5. Sólo después evaluar merge de PR #3. **Sin modificaciones en Supabase o producción en este checkpoint**.

## Fuente de código
- `src/services/hse/forms-browser.ts`, `src/blocks/hse-control/HseInspectionRunPanel.tsx`, `src/app/app/hse/inspections/[runId]/page.tsx`.
- QA Render `informe360-hse-web-qa`, rama `feat/hse-e1-offline-resilience-2026-10-08`.
