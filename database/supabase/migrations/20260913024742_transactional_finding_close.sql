create or replace function public.close_finding(
  p_finding_id uuid,
  p_expected_version integer,
  p_comment text default null
) returns integer
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  uid uuid := (select auth.uid());
  next_version integer;
begin
  if uid is null then raise exception 'authentication required'; end if;

  update public.findings
  set status='closed', closed_at=now(), closed_by=uid, closure_comment=nullif(btrim(coalesce(p_comment,'')),'')
  where id=p_finding_id
    and version=p_expected_version
    and status not in ('closed','cancelled')
  returning version into next_version;

  if next_version is null then raise exception 'finding changed or is no longer closable'; end if;

  update public.smart_actions
  set status='completed', completed_at=coalesce(completed_at,now())
  where finding_id=p_finding_id and status in ('pending','in_progress');

  update public.reminders
  set status='cancelled'
  where finding_id=p_finding_id and status='pending';

  return next_version;
end;
$$;
revoke all on function public.close_finding(uuid,integer,text) from public, anon;
grant execute on function public.close_finding(uuid,integer,text) to authenticated, service_role;

create or replace function public.reopen_finding(
  p_finding_id uuid,
  p_expected_version integer
) returns integer
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  next_version integer;
begin
  if (select auth.uid()) is null then raise exception 'authentication required'; end if;
  update public.findings
  set status='open', closed_at=null, closed_by=null, closure_comment=null
  where id=p_finding_id and version=p_expected_version and status='closed'
  returning version into next_version;
  if next_version is null then raise exception 'finding changed or is not closed'; end if;
  return next_version;
end;
$$;
revoke all on function public.reopen_finding(uuid,integer) from public, anon;
grant execute on function public.reopen_finding(uuid,integer) to authenticated, service_role;
