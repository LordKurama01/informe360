-- Defense in depth for server-only telemetry tables.
-- These tables intentionally have RLS enabled with no authenticated policies.
-- Revoke Data API table privileges from client roles and retain service-role access.

revoke all on table public.ai_generation_logs from anon, authenticated;
revoke all on table public.tracking_events from anon, authenticated;

grant all on table public.ai_generation_logs to service_role;
grant all on table public.tracking_events to service_role;
