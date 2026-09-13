-- Dynamic forms/inspection RPCs do not require elevated definer privileges.
-- Run them as the authenticated caller so RLS and table grants remain authoritative.
alter function public.create_form_run(uuid,uuid,uuid) security invoker;
alter function public.publish_form_version(uuid) security invoker;
alter function public.create_finding_from_form_answer(uuid,text,text,text,text,text,text,timestamptz) security invoker;
alter function public.seed_hse_inspection_templates(uuid) security invoker;
