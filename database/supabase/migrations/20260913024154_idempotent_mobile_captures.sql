alter table public.field_entries add column if not exists client_capture_id text;
create unique index if not exists idx_field_entries_org_client_capture on public.field_entries(organization_id,client_capture_id) where client_capture_id is not null;

create or replace function public.upsert_field_entry_from_client(
  p_organization_id uuid,
  p_site_id uuid,
  p_client_capture_id text,
  p_input_type text,
  p_raw_text text default null
) returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  uid uuid := (select auth.uid());
  entry_id uuid;
begin
  if uid is null then raise exception 'authentication required'; end if;
  if not private.is_org_member(p_organization_id) then raise exception 'organization access denied'; end if;
  if p_input_type not in ('text','audio','photo','mixed') then raise exception 'invalid input type'; end if;
  if nullif(btrim(p_client_capture_id),'') is null then raise exception 'client capture id required'; end if;

  select id into entry_id
  from public.field_entries
  where organization_id=p_organization_id and client_capture_id=p_client_capture_id
  limit 1;
  if entry_id is not null then return entry_id; end if;

  insert into public.field_entries(organization_id,site_id,created_by,input_type,raw_text,processing_status,client_capture_id)
  values(p_organization_id,p_site_id,uid,p_input_type,p_raw_text,'raw',p_client_capture_id)
  returning id into entry_id;
  return entry_id;
end;
$$;
revoke all on function public.upsert_field_entry_from_client(uuid,uuid,text,text,text) from public, anon;
grant execute on function public.upsert_field_entry_from_client(uuid,uuid,text,text,text) to authenticated, service_role;
