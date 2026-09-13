# Informe360 — Supabase

## Fuente de verdad

El backend Supabase vigente de Informe360 es el proyecto nuevo creado el 2026-09-12.

- Proyecto: `Informe360`
- Project ref: `wvjmsltqrztlvgmayicr`
- Región: `sa-east-1`
- API URL: `https://wvjmsltqrztlvgmayicr.supabase.co`
- PostgreSQL: 17

El proyecto Supabase histórico que utilizó Informe360 en otra cuenta/entorno ya no es accesible y **no forma parte de la arquitectura vigente**. No intentar sincronizar, restaurar ni inferir estado desde ese backend.

## Migraciones

El historial vivo y el repo deben coincidir. Actualmente hay tres migraciones:

1. `migrations/20260913012835_informe360_fresh_start.sql`
   - crea la base operacional HSE Copilot, RLS y Storage privado;
2. `migrations/20260913013947_lock_server_only_logs.sql`
   - revoca explícitamente acceso de `anon`/`authenticated` a logs server-only y conserva `service_role`;
3. `migrations/20260913014226_protect_owner_role.sql`
   - impide que un `admin` se promueva a `owner` o modifique/elimine owners; esas operaciones requieren owner.

La primera versión fue aplicada durante la noche del 2026-09-12 hora Argentina (2026-09-13 UTC) y crea:

- perfiles enlazados a `auth.users`;
- organizaciones y membresías;
- sitios/establecimientos;
- capturas de campo;
- hallazgos;
- acciones;
- evidencia;
- recordatorios;
- informes y relación informe-hallazgo;
- logs de IA y tracking server-only;
- RLS multiempresa;
- bucket privado `hse-evidence`.

Los archivos históricos `schema.sql` y `seed_normatives.sql` fueron retirados deliberadamente. No deben recrearse.

## Seguridad

1. Toda tabla nueva en un schema expuesto debe tener RLS antes de ser consumida por clientes.
2. Toda tabla accesible por Data API debe recibir grants explícitos sólo para los roles necesarios.
3. `SUPABASE_SERVICE_ROLE_KEY` / secret keys son exclusivamente server-side y nunca deben versionarse.
4. El cliente usa `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
5. `ai_generation_logs` y `tracking_events` son server-only: tienen RLS habilitado, no tienen políticas para `authenticated`, sus grants de cliente fueron revocados explícitamente y `service_role` conserva acceso.
6. El bucket `hse-evidence` es privado. Los objetos deben guardarse bajo la convención `<organization_id>/...` para que las políticas de Storage puedan validar membresía.
7. Datos de autorización viven en la base/membresías; nunca se confía en `user_metadata` para autorizar.
8. El rol `owner` sólo puede ser creado/modificado/eliminado por otro owner de esa organización.

## Variables

Variables públicas:

```env
NEXT_PUBLIC_SUPABASE_URL=https://wvjmsltqrztlvgmayicr.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable key>
```

Variable secreta de servidor:

```env
SUPABASE_SERVICE_ROLE_KEY=<server-only secret>
```

La clave secreta se configura en el runtime/deploy, no en GitHub.

## Cambios futuros

Toda modificación de esquema debe:

1. entrar como migración versionada;
2. preservar aislamiento por `organization_id` cuando corresponda;
3. incluir/actualizar RLS y grants;
4. verificarse en la base viva;
5. ejecutar los advisors de seguridad y rendimiento;
6. generar nuevamente los tipos TypeScript cuando cambie el contrato de datos.
