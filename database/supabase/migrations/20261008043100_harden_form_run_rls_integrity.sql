-- Tighten form run references to the same organization.
alter policy form_runs_insert on public.form_runs
with check (
  private.is_org_member(form_runs.organization_id)
  and form_runs.started_by = (select auth.uid())
  and exists (
    select 1
    from public.form_template_versions v
    join public.form_templates t
      on t.id = v.template_id
     and t.organization_id = v.organization_id
    where v.id = form_runs.template_version_id
      and v.organization_id = form_runs.organization_id
      and t.id = form_runs.template_id
  )
  and (
    form_runs.site_id is null
    or exists (
      select 1 from public.sites s
      where s.id = form_runs.site_id
        and s.organization_id = form_runs.organization_id
    )
  )
);

alter policy form_runs_update on public.form_runs
using (private.is_org_member(form_runs.organization_id))
with check (
  private.is_org_member(form_runs.organization_id)
  and exists (
    select 1
    from public.form_template_versions v
    join public.form_templates t
      on t.id = v.template_id
     and t.organization_id = v.organization_id
    where v.id = form_runs.template_version_id
      and v.organization_id = form_runs.organization_id
      and t.id = form_runs.template_id
  )
  and (
    form_runs.site_id is null
    or exists (
      select 1 from public.sites s
      where s.id = form_runs.site_id
        and s.organization_id = form_runs.organization_id
    )
  )
);
