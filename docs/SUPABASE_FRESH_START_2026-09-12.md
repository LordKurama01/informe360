# Informe360 — Supabase Fresh Start — 2026-09-12

## Decisión

El Supabase histórico de Informe360 estaba alojado en otro entorno al que ya no se tiene acceso. A partir del 2026-09-12 ese backend se considera **retirado** y no es fuente de verdad.

Se creó un nuevo proyecto Supabase propio para Informe360 y se reconstruyó la base desde cero siguiendo el Plan Maestro HSE Copilot.

## Proyecto vigente

- Nombre: `Informe360`
- Project ref: `wvjmsltqrztlvgmayicr`
- Organización Supabase: `The Prestige Group — Avanza`
- Región: `sa-east-1`
- Estado verificado: `ACTIVE_HEALTHY`
- URL: `https://wvjmsltqrztlvgmayicr.supabase.co`

## Qué se descartó del backend histórico

No se copió el schema viejo de forma ciega. Se retiraron del repositorio:

- `database/supabase/schema.sql`
- `database/supabase/seed_normatives.sql`

El schema histórico mezclaba dominio HSE con pricing, XPRIZE, pagos e integraciones preparadas y no constituía un contrato multiempresa seguro con RLS verificada.

## Qué se reconstruyó

La nueva migración fundacional crea:

1. `profiles` enlazada a `auth.users`.
2. `organizations`.
3. `organization_members` con roles owner/admin/member.
4. `sites`.
5. `field_entries` para conservar captura cruda.
6. `findings` como hallazgo operacional.
7. `smart_actions`.
8. `evidence_files`.
9. `reminders`.
10. `reports`.
11. `report_findings`.
12. `ai_generation_logs` server-only.
13. `tracking_events` server-only.
14. bucket privado `hse-evidence`.

## Seguridad verificada

Se verificó directamente en la base viva que las 13 tablas tienen RLS habilitado.

El bucket `hse-evidence` se verificó como privado y con límite de 25 MB por archivo.

Los logs de IA y tracking permanecen deliberadamente sin políticas para `authenticated`: no están otorgados al cliente y son escritura/lectura exclusiva del backend con credencial server-side.

## Conexión de aplicación

El repositorio queda preparado para usar:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` exclusivamente en servidor

La publishable key puede utilizarse en clientes protegidos por RLS. La credencial server-side no se versiona.

## Estado al cierre

- Supabase nuevo: creado y saludable.
- Schema P0: aplicado y verificado.
- RLS: habilitada en todas las tablas públicas nuevas.
- Storage de evidencia: privado y operativo a nivel de configuración.
- Schema histórico: retirado del branch de implementación.
- `main`: sin modificaciones.
- Próximo paso: conectar runtime y comenzar el cliente mobile Expo sobre este contrato de datos.
