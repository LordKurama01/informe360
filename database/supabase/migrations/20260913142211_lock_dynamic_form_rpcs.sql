-- Defense in depth: dynamic-form RPCs are never callable by anonymous clients.
revoke all on function public.create_form_run(uuid,uuid,uuid) from public, anon;
revoke all on function public.publish_form_version(uuid) from public, anon;
grant execute on function public.create_form_run(uuid,uuid,uuid) to authenticated, service_role;
grant execute on function public.publish_form_version(uuid) to authenticated, service_role;
