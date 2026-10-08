-- Tighten tenant/reference integrity without recreating policies.
alter policy form_versions_insert on public.form_template_versions
with check (
  private.is_org_admin(form_template_versions.organization_id)
  and form_template_versions.created_by = (select auth.uid())
  and exists (
    select 1 from public.form_templates t
    where t.id = form_template_versions.template_id
      and t.organization_id = form_template_versions.organization_id
  )
);

alter policy form_versions_update on public.form_template_versions
using (private.is_org_admin(form_template_versions.organization_id))
with check (
  private.is_org_admin(form_template_versions.organization_id)
  and exists (
    select 1 from public.form_templates t
    where t.id = form_template_versions.template_id
      and t.organization_id = form_template_versions.organization_id
  )
);

alter policy form_answers_insert on public.form_answers
with check (
  private.is_org_member(form_answers.organization_id)
  and form_answers.answered_by = (select auth.uid())
  and exists (
    select 1 from public.form_runs r
    where r.id = form_answers.form_run_id
      and r.organization_id = form_answers.organization_id
  )
);

alter policy form_answers_update on public.form_answers
using (private.is_org_member(form_answers.organization_id))
with check (
  private.is_org_member(form_answers.organization_id)
  and exists (
    select 1 from public.form_runs r
    where r.id = form_answers.form_run_id
      and r.organization_id = form_answers.organization_id
  )
);

alter policy form_run_findings_insert on public.form_run_findings
with check (
  private.is_org_member(form_run_findings.organization_id)
  and form_run_findings.created_by = (select auth.uid())
  and exists (
    select 1 from public.form_runs r
    where r.id = form_run_findings.form_run_id
      and r.organization_id = form_run_findings.organization_id
  )
  and exists (
    select 1 from public.findings f
    where f.id = form_run_findings.finding_id
      and f.organization_id = form_run_findings.organization_id
  )
);
