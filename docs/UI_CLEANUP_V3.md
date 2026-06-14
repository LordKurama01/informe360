# Informe360 UI Cleanup V3

Cambios aplicados:

- Landing pública orientada a venta comercial, sin menciones visibles a XPRIZE, demo técnica ni Control.
- Header público limpio: cómo funciona, para quién es, acceso fundador e ingreso.
- CTA principal a acceso fundador y CTA secundario a sección interna de funcionamiento.
- App usuario reconstruida como centro operativo: informes, acciones, vencimientos, plan, historial, mapa y normativa.
- Login con acceso directo en modo local para revisar la app sin configurar Supabase.
- Control interno limpiado: lenguaje profesional, evidencia comercial, trazabilidad IA, métricas de impacto y seguimiento de uso.
- Decision Trail renombrado a trazabilidad de IA, sin frases informales.
- Evidencia interna profesionalizada.
- Google Stack limpiado como integraciones útiles para operar, medir y escalar.
- API de login Google ajustada para respetar el puerto local actual cuando no hay Supabase configurado.

QA ejecutado:

- npm run test:structure
- npm run typecheck
- npm run lint
- npm run build

Rutas confirmadas por build:

- /
- /login
- /app
- /app/reports/new
- /app/actions
- /app/calendar
- /app/maps
- /app/normativa
- /app/payments
- /control
- /control/decision-trail
- /control/google
- /control/xprize
- /demo
