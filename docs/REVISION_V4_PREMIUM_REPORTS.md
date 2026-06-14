# Informe360 V4 - UI premium + informes profesionales

## Cambios principales

- Rehecha la pantalla `/app/reports/new` como flujo guiado por pasos.
- Agregada carga de evidencias del informe.
- Agregada carga de documentos de referencia para tomar estilo técnico del usuario.
- Agregado selector de estilo de redacción y plantilla activa.
- Mejorado el motor de informe para generar salidas profesionales, no listas pobres.
- Mejorado el PDF exportado: ahora se abre una vista imprimible limpia del informe final, no del formulario.
- Agregado editor del informe generado para ajustar título, resumen, descripción y conclusión antes de exportar.
- Agregadas secciones técnicas: descripción general, detalle técnico, estado final, acciones SMART, normativa, documentación adjunta, seguimiento y resumen para cliente.
- Rehecho `/app` con datos demo/local profesionales para que no se vea vacío.
- Agregada ruta `/app/reports` para historial de informes.
- Agregada ruta `/app/locations` como alias de ubicaciones/mapas.
- Mejoradas pantallas de acciones, calendario y plan/pagos.
- Mejoradas capas desktop y mobile en pantallas principales.

## QA ejecutado

- `npm run test:structure`
- `npm run typecheck`
- `npm run lint`
- `npm run build`

## Nota

Sigue preparado para modo local sin claves. Gemini real, Supabase, Google Auth, Calendar, Maps y pagos se conectan después con variables reales.
