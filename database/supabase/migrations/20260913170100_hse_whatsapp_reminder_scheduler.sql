-- Dispatch due WhatsApp reminders without a paid external cron service.
-- The scheduler reads HSE_JOBS_SECRET from Supabase Vault at execution time;
-- the real secret is never committed to the repository.

create extension if not exists pg_cron;
create extension if not exists pg_net;

create or replace function private.dispatch_hse_whatsapp_reminders()
returns bigint
language plpgsql
security definer
set search_path = public, private, vault, pg_temp
as $$
declare
  v_secret text;
  v_request_id bigint;
begin
  select decrypted_secret
  into v_secret
  from vault.decrypted_secrets
  where name = 'hse_jobs_secret'
  order by updated_at desc
  limit 1;

  if nullif(btrim(coalesce(v_secret, '')), '') is null then
    raise exception 'Missing hse_jobs_secret in Supabase Vault';
  end if;

  select net.http_post(
    url := 'https://informe360-hse.onrender.com/api/hse/jobs/whatsapp-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-hse-job-secret', v_secret
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 15000
  )
  into v_request_id;

  return v_request_id;
end;
$$;

revoke all on function private.dispatch_hse_whatsapp_reminders() from public, anon, authenticated;
grant execute on function private.dispatch_hse_whatsapp_reminders() to service_role;

-- Keep the migration idempotent when it is replayed in a branch/reset.
do $$
declare
  v_job_id bigint;
begin
  select jobid into v_job_id
  from cron.job
  where jobname = 'hse-whatsapp-reminders'
  order by jobid desc
  limit 1;

  if v_job_id is not null then
    perform cron.unschedule(v_job_id);
  end if;
end;
$$;

select cron.schedule(
  'hse-whatsapp-reminders',
  '*/5 * * * *',
  $job$select private.dispatch_hse_whatsapp_reminders();$job$
);
