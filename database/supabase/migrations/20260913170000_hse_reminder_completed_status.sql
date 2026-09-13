-- Calendar reminders can be explicitly completed by an HSE user.
-- WhatsApp delivery continues to use `sent`; completion is a distinct operational state.

alter table public.reminders drop constraint if exists reminders_status_check;
alter table public.reminders add constraint reminders_status_check
  check (status in ('pending','sent','cancelled','failed','completed'));
