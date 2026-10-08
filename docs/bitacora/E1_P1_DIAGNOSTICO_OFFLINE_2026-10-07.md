# E1.P1 — Auditoría diferencial mobile offline (Informe360 HSE)

**Fecha:** 2026-10-07 (Argentina)  
**Rama auditada:** `feat/hse-e1-offline-resilience-2026-10-08`, creada desde `docs/bitacora-hse-2026-10-07` HEAD `818576a0ccfb8e1033c828b791cc1538d1a2e3d8`.  
**Línea de base HSE:** `422f8bcbce65b3e68f892d51d37b1ed0999690c5`.  
**Método:** lectura directa de archivos GitHub, metadata GitHub Actions, consultas de **solo lectura** a Supabase y contraste con repo MIT `FolderITDev/mobile-field-inspections`. No se ejecutaron cambios DDL, migraciones ni deploy.

## Diagnóstico CI (bloqueante para gates finales)

- HEAD base HSE `422f8b...`: [Actions failure](https://github.com/LordKurama01/informe360/actions/runs/37714821289), 2026-10-08T01:49:24Z, job `verify-web-and-mobile` falló entre 01:49:25 y 01:49:27 (≈2 segundos).
- El job devuelto por GitHub reporta **`steps: []` y `runner_name: ""`**. La descarga de logs de job mediante conector devuelve error 404 BlobNotFound; no hubo salida de tests disponible.
- También falló la rama documental [run #224](https://github.com/LordKurama01/informe360/actions/runs/37715224223) antes de estas modificaciones de código.
- **Conclusión respaldada:** no existe evidencia de que los scripts de test se hayan siquiera ejecutado. La causa raíz del fallo de GitHub Actions **no puede confirmarse con los datos disponibles**. Investigar disponibilidad/cupo/infra de runners y obtener anotaciones antes de atribuirlo a código o cambiar el workflow. No cambiar `.github/workflows/ci.yml` a ciegas.
- Acción independiente posible: desarrollar tests `node --test` puros y ejecutarlos localmente, etiquetar CI externo BLOQUEADA hasta que el runner se habilite.

## Estado Supabase verificado (lectura)

- Proyecto `Informe360` `wvjmsltqrztlvgmayicr`: **ACTIVE_HEALTHY**.
- 16 migraciones aplicadas visibles; últimas `hse_whatsapp_reminder_scheduler`; `dynamic_forms_phase1` y `inspection_checklists_phase3` presentes.
- Tablas `field_entries`, `evidence_files`, `findings`, `form_templates`, `form_template_versions`, `form_runs`, `form_answers` y membresías reportaron **RLS activada**; conteo de políticas para tablas relevantes: 3–4.
- Tablas de aplicación consultadas reportaron 0 filas en resumen. **No significa** que RLS, Storage o los RPC estén probados end-to-end; no se enviaron datos ni se probaron cuentas reales.

## Brechas halladas — severidad y prueba exigida

| ID | Severidad | Evidencia en código | Acción segura y criterio de aceptación |
| --- | --- | --- | --- |
| OFF-01 | CRÍTICA | `offline-queue.ts` usa read→modify→write concurrente sin serialización | Dos encolados simultáneos preservan ambos; remover/marcar error no pisa una captura nueva; pruebas de carreras con almacenamiento simulado |
| OFF-02 | CRÍTICA | `offline-queue.ts` descarta silenciosamente excedentes con `.slice(0, 100)`; `form-offline.ts` con `.slice(0, 50)` | Límite explícito, falla visible, sin destruir el registro previo |
| OFF-03 | ALTA | Ambos lectores convierten JSON corrupto en `[]` | Rechazar formato inválido, conservar byte original para recuperación, no sobrescribirlo |
| OFF-04 | ALTA | `sync.ts` permite invocaciones concurrentes desde network event/manual; Provider no evita doble ejecución | Single-flight; misma captura procesada una sola vez en una sincronización concurrente |
| OFF-05 | ALTA | `form-run/[runId].tsx` no carga el borrador local y dispara guardados asíncronos por pulsación sin esperar confirmación | Reabrir ejecución recupera última respuesta local confirmada; al fallar escritura, aviso y bloqueo de envío destructivo |
| OFF-06 | CRÍTICA | `FormField.tsx` guarda la URI efímera de cámara como respuesta `photo`, sin copiar archivo a documento ni subirlo a Storage | Persistir evidencia, referenciar ruta durable, no dejar referencias `file://` en DB (trabajo separado por impacto) |
| OFF-07 | ALTA | `sync-provider.tsx` puede sincronizar sin workspace resuelto, y colas compartidas en el mismo dispositivo | Filtrar y autorizar por organización/usuario antes de procesar; preservar entradas de otras cuentas, nunca transferirlas |
| OFF-08 | MEDIA | `capture-pipeline.ts` genera archivos temporales de compresión; no los libera explícitamente | Limpiar caché *solo* después de confirmar subida; guardar original hasta confirmación; pruebas de fallo parcial |
| OFF-09 | MEDIA | `syncOfflineFormDraft` puede reemplazar una edición reciente con snapshot viejo después de una petición lenta | No sobrescribir respuestas recientes; compare-and-swap por revisión local; no duplicar ejecuciones RPC |
| OFF-10 | ALTA | Pruebas actuales `check-mobile-p0.mjs` comprueban estructura, no atomicidad, reintentos ni persistencia | Tests unitarios Node sin Expo, simulando fallos y reinicio, luego QA native E1.P4 |

## Donante open source seleccionado

`FolderITDev/mobile-field-inspections` (licencia MIT verificada): **patrones** de autosave explícito, SQLite como fuente local, cola serial, estados de error honestos, revisión de cambios y archivos persistidos. No tiene backend/Supabase. No copiar su proyecto, esquema fijo ni dependencias completas; implementar mejoras focalizadas sobre servicios que ya existen. Evitar nuevo servicio cloud, nueva base de datos, nuevo login o motor de formularios.

## Partes siguientes

1. **E1.P2:** agregar primitiva serializada de KV validable sin Expo; adaptar ambas colas sin truncamientos/JSON silencioso, y tests RED→GREEN. Restituir al usuario la capacidad de reabrir borradores de inspección en pantalla existente; sin cambiar su fuente de verdad remota.
2. **E1.P3:** sincronización single-flight, aislamiento de cuentas/empresa, resolución de carreras y controles idempotentes. Resolver almacenamiento de fotos de formularios con validación backend antes de modificar esquema.
3. **E1.P4:** `npm run qa`, TypeScript móvil, tests offline/Android/iOS, CI y prueba física; si runners/dispositivo/entorno no están disponibles, dejar BLOQUEADA y no vender como finalizado.

**Restricción:** ningún cambio sobre `feat/hse-phases-1-5` con auto-deploy; trabajar en rama hija y PR. No guardar fotos personales ni secretos en GitHub.
