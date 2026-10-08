-- Harden tenant/reference integrity for dynamic HSE forms.
-- Fixes ambiguous unqualified organization_id references in nested policy queries.

drop policy if exists form_versions_insert on public.form_template_versions;
create policy form_versions_insert on public.form_template_versions
for insert to authenticated
with check (
  private.is_org_admin(form_template_versions.organization_id)
  and form_template_versions.created_by = (select auth.uid())
  and exists (
    select 1
    from public.form_templates t
    where t.id = form_template_versions.template_id
      and t.organization_id = form_template_versions.organization_id
  )
);

drop policy if exists form_versions_update on public.form_template_versions;
create policy form_versions_update on public.form_template_versions
for update to authenticated
using (private.is_org_admin(form_template_versions.organization_id))
with check (
  private.is_org_admin(form_template_versions.organization_id)
  and exists (
    select 1
    from public.form_templates t
    where t.id = form_template_versions.template_id
      and t.organization_id = form_template_versions.organization_id
  )
);

drop policy if exists form_runs_insert on public.form_runs;
create policy form_runs_insert on public.form_runs
for insert to authenticated
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
      select 1
      from public.sites s
      where s.id = form_runs.site_id
        and s.organization_id = form_runs.organization_id
    )
  )
);

drop policy if exists form_runs_update on public.form_runs;
create policy form_runs_update on public.form_runs
for update to authenticated
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
      select 1
      from public.sites s
      where s.id = form_runs.site_id
        and s.organization_id = form_runs.organization_id
    )
  )
);

drop policy if exists form_answers_insert on public.form_answers;
create policy form_answers_insert on public.form_answers
for insert to authenticated
with check (
  private.is_org_member(form_answers.organization_id)
  and form_answers.answered_by = (select auth.uid())
  and exists (
    select 1
    from public.form_runs r
    where r.id = form_answers.form_run_id
      and r.organization_id = form_answers.organization_id
  )
);

drop policy if exists form_answers_update on public.form_answers;
create policy form_answers_update on public.form_answers
for update to authenticated
using (private.is_org_member(form_answers.organization_id))
with check (
  private.is_org_member(form_answers.organization_id)
  and exists (
    select 1
    from public.form_runs r
    where r.id = form_answers.form_run_id
      and r.organization_id = form_answers.organization_id
  )
);

drop policy if exists form_run_findings_insert on public.form_run_findings;
create policy form_run_findings_insert on public.form_run_findings
for insert to authenticated
with check (
  private.is_org_member(form_run_findings.organization_id)
  and form_run_findings.created_by = (select auth.uid())
  and exists (
    select 1
    from public.form_runs r
    where r.id = form_run_findings.form_run_id
      and r.organization_id = form_run_findings.organization_id
  )
  and exists (
    select 1
    from public.findings f
    where f.id = form_run_findings.finding_id
      and f.organization_id = form_run_findings.organization_id
  )
);
