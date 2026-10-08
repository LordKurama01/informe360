-- PROPOSAL ONLY — NOT APPLIED. Requires isolated staging with two organizations.
-- Protect submitted HSE inspections from subsequent edits while preserving an admin review transition.
-- Review compatibility with the native client and data corrections before promotion.
BEGIN;

CREATE OR REPLACE FUNCTION private.guard_hse_form_run_update()
RETURNS trigger LANGUAGE plpgsql
SET search_path = public, private, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authenticated form run update required';
  END IF;
  IF OLD.organization_id IS DISTINCT FROM NEW.organization_id
    OR OLD.site_id IS DISTINCT FROM NEW.site_id
    OR OLD.template_id IS DISTINCT FROM NEW.template_id
    OR OLD.template_version_id IS DISTINCT FROM NEW.template_version_id
    OR OLD.started_by IS DISTINCT FROM NEW.started_by
    OR OLD.client_run_id IS DISTINCT FROM NEW.client_run_id
    OR OLD.started_at IS DISTINCT FROM NEW.started_at
    OR OLD.created_at IS DISTINCT FROM NEW.created_at THEN
    RAISE EXCEPTION 'form run metadata is immutable';
  END IF;

  IF OLD.status IN ('submitted','reviewed','cancelled') THEN
    IF OLD.status = 'submitted' AND NEW.status = 'reviewed'
       AND private.is_org_admin(OLD.organization_id)
       AND NEW.reviewed_by = auth.uid() AND NEW.reviewed_at IS NOT NULL
       AND OLD.notes IS NOT DISTINCT FROM NEW.notes
       AND OLD.submitted_at IS NOT DISTINCT FROM NEW.submitted_at THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'submitted or closed form runs cannot be edited';
  END IF;

  IF NEW.status NOT IN ('draft','in_progress','submitted','cancelled') THEN
    RAISE EXCEPTION 'invalid transition for a draft form run';
  END IF;
  IF OLD.status = 'in_progress' AND NEW.status = 'draft' THEN
    RAISE EXCEPTION 'form run cannot return to draft';
  END IF;
  IF NEW.status = 'submitted' AND NEW.submitted_at IS NULL THEN
    RAISE EXCEPTION 'submission timestamp is required';
  END IF;
  IF NEW.reviewed_at IS NOT NULL OR NEW.reviewed_by IS NOT NULL THEN
    RAISE EXCEPTION 'review metadata only allowed during admin review';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_hse_form_run_update ON public.form_runs;
CREATE TRIGGER guard_hse_form_run_update
BEFORE UPDATE ON public.form_runs
FOR EACH ROW EXECUTE FUNCTION private.guard_hse_form_run_update();

CREATE OR REPLACE FUNCTION private.guard_hse_form_answer_write()
RETURNS trigger LANGUAGE plpgsql
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_run public.form_runs%ROWTYPE;
  v_run_id uuid;
  v_org_id uuid;
BEGIN
  v_run_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.form_run_id ELSE NEW.form_run_id END;
  v_org_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.organization_id ELSE NEW.organization_id END;
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authenticated form answer change required';
  END IF;
  SELECT * INTO v_run FROM public.form_runs
  WHERE id = v_run_id AND organization_id = v_org_id FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'form answer run not found in organization';
  END IF;
  IF v_run.status NOT IN ('draft','in_progress') THEN
    RAISE EXCEPTION 'answers of submitted form runs are immutable';
  END IF;
  IF TG_OP = 'UPDATE' AND
    (OLD.organization_id IS DISTINCT FROM NEW.organization_id
     OR OLD.form_run_id IS DISTINCT FROM NEW.form_run_id
     OR OLD.field_id IS DISTINCT FROM NEW.field_id
     OR OLD.created_at IS DISTINCT FROM NEW.created_at) THEN
    RAISE EXCEPTION 'form answer references are immutable';
  END IF;
  IF TG_OP <> 'DELETE' AND NEW.answered_by IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'answer author must be authenticated user';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_hse_form_answer_write ON public.form_answers;
CREATE TRIGGER guard_hse_form_answer_write
BEFORE INSERT OR UPDATE OR DELETE ON public.form_answers
FOR EACH ROW EXECUTE FUNCTION private.guard_hse_form_answer_write();

COMMIT;

-- STAGING CHECKLIST (not executable in production):
-- 1. member A saves draft and submits; writes to the same answer/run after submit must fail
-- 2. member B of same org must not modify a submitted run or its answers
-- 3. unrelated organization must not read or write via RLS
-- 4. admin review submitted -> reviewed succeeds only with proper review metadata
-- 5. native app submission still succeeds, upserts happen before transition
-- 6. test race: answer upsert versus submission update serializes without data loss
-- 7. confirm site role requirements separately; current system has org-based membership only
-- ROLLBACK: DROP TRIGGERs first, then DROP FUNCTIONs if explicitly approved.
