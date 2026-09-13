-- Transactional close for the server-side WhatsApp channel.
-- The normal close_finding RPC relies on auth.uid(); the webhook runs with
-- service_role, so it must receive and validate the acting HSE user explicitly.

create or replace function public.close_channel_finding(
  p_actor_id uuid,
  p_organization_id uuid,
  p_finding_id uuid,
  p_comment text default null
)
returns table(finding_id uuid, finding_code text, next_version integer)
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_code text;
  v_version integer;
begin
  if p_actor_id is null or not exists (
    select 1
    from public.organization_members m
    where m.organization_id = p_organization_id
      and m.user_id = p_actor_id
  ) then
    raise exception 'Actor is not a member of the organization';
  end if;

  update public.findings f
  set status = 'closed',
      closed_at = now(),
      closed_by = p_actor_id,
      closure_comment = nullif(btrim(coalesce(p_comment, '')), '')
  where f.id = p_finding_id
    and f.organization_id = p_organization_id
    and f.status not in ('closed', 'cancelled')
  returning f.code, f.version into v_code, v_version;

  if v_version is null then
    raise exception 'Finding does not exist, changed organization, or is no longer closable';
  end if;

  update public.smart_actions
  set status = 'completed',
      completed_at = coalesce(completed_at, now())
  where organization_id = p_organization_id
    and finding_id = p_finding_id
    and status in ('pending', 'in_progress');

  update public.reminders
  set status = 'cancelled'
  where organization_id = p_organization_id
    and finding_id = p_finding_id
    and status = 'pending';

  return query select p_finding_id, v_code, v_version;
end;
$$;

revoke all on function public.close_channel_finding(uuid,uuid,uuid,text) from public, anon, authenticated;
grant execute on function public.close_channel_finding(uuid,uuid,uuid,text) to service_role;
