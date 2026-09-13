create or replace function public.create_finding_bundle(
  p_field_entry_id uuid,
  p_title text,
  p_description text default null,
  p_category text default null,
  p_severity text default 'medium',
  p_location_text text default null,
  p_element_text text default null,
  p_responsible_text text default null,
  p_due_at timestamptz default null,
  p_action text default null
) returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  entry public.field_entries%rowtype;
  finding_id uuid;
begin
  select * into entry from public.field_entries where id = p_field_entry_id;
  if not found then raise exception 'field entry not found'; end if;
  if entry.created_by <> (select auth.uid()) then raise exception 'field entry is not owned by current user'; end if;
  if p_severity not in ('low','medium','high','critical') then raise exception 'invalid severity'; end if;

  insert into public.findings(
    organization_id, site_id, field_entry_id, created_by, title, description, category,
    severity, due_at, responsible_text, location_text, element_text
  ) values (
    entry.organization_id, entry.site_id, entry.id, (select auth.uid()), trim(p_title), p_description, p_category,
    p_severity, p_due_at, p_responsible_text, p_location_text, p_element_text
  ) returning id into finding_id;

  if nullif(trim(coalesce(p_action,'')), '') is not null then
    insert into public.smart_actions(organization_id, finding_id, created_by, action, responsible_text, due_at)
    values(entry.organization_id, finding_id, (select auth.uid()), trim(p_action), p_responsible_text, p_due_at);
  end if;

  if p_due_at is not null then
    insert into public.reminders(organization_id, finding_id, created_by, scheduled_for, channel)
    values(entry.organization_id, finding_id, (select auth.uid()), p_due_at, 'in_app');
  end if;

  update public.field_entries set processing_status='structured', processing_error=null where id=entry.id;
  return finding_id;
end;
$$;

revoke all on function public.create_finding_bundle(uuid,text,text,text,text,text,text,text,timestamptz,text) from public, anon;
grant execute on function public.create_finding_bundle(uuid,text,text,text,text,text,text,text,timestamptz,text) to authenticated, service_role;
