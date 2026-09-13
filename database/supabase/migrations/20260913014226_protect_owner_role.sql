-- Prevent organization admins from escalating themselves/others to owner
-- or modifying/deleting existing owners. Owner-level operations require owner.

create or replace function private.is_org_owner(target_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.organization_members m
    where m.organization_id = target_org
      and m.user_id = (select auth.uid())
      and m.role = 'owner'
  );
$$;

revoke all on function private.is_org_owner(uuid) from public;
grant execute on function private.is_org_owner(uuid) to authenticated, service_role;

drop policy if exists organizations_delete_owner on public.organizations;
create policy organizations_delete_owner
on public.organizations for delete to authenticated
using (private.is_org_owner(id));

drop policy if exists members_insert_admin on public.organization_members;
create policy members_insert_admin
on public.organization_members for insert to authenticated
with check (
  private.is_org_admin(organization_id)
  and (role <> 'owner' or private.is_org_owner(organization_id))
);

drop policy if exists members_update_admin on public.organization_members;
create policy members_update_admin
on public.organization_members for update to authenticated
using (
  private.is_org_admin(organization_id)
  and (role <> 'owner' or private.is_org_owner(organization_id))
)
with check (
  private.is_org_admin(organization_id)
  and (role <> 'owner' or private.is_org_owner(organization_id))
);

drop policy if exists members_delete_admin on public.organization_members;
create policy members_delete_admin
on public.organization_members for delete to authenticated
using (
  private.is_org_admin(organization_id)
  and (role <> 'owner' or private.is_org_owner(organization_id))
);
