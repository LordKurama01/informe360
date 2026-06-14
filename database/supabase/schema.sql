-- Informe360 AI Agent - Supabase schema
-- Ejecutar en Supabase SQL Editor.

create extension if not exists "uuid-ossp";

create table if not exists profiles (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  full_name text,
  company_name text,
  province text,
  role text default 'user',
  status text default 'registrado',
  plan_id text,
  source text,
  created_at timestamptz default now(),
  last_login_at timestamptz
);

create table if not exists companies (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references profiles(id) on delete set null,
  name text not null,
  province text,
  industry text,
  created_at timestamptz default now()
);

create table if not exists plans (
  id text primary key,
  name text not null,
  price_ars integer not null,
  regular_price_ars integer,
  valid_until date,
  regular_starts_at date,
  metadata jsonb default '{}'::jsonb
);

insert into plans (id, name, price_ars, regular_price_ars, valid_until, regular_starts_at, metadata)
values ('founder-full-access-2026', 'Acceso fundador completo', 30000, 50000, '2026-12-31', '2027-01-01', '{"offer_deadline":"2026-08-30"}')
on conflict (id) do update set price_ars = excluded.price_ars, regular_price_ars = excluded.regular_price_ars, valid_until = excluded.valid_until, regular_starts_at = excluded.regular_starts_at, metadata = excluded.metadata;

create table if not exists subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  plan_id text references plans(id),
  status text default 'pending_payment',
  started_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists payments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete set null,
  plan_id text,
  amount_ars integer not null,
  method text default 'manual',
  status text default 'registered_manual',
  paid_at timestamptz,
  proof_url text,
  notes text,
  created_at timestamptz default now()
);

create table if not exists reports (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete set null,
  company_id uuid references companies(id) on delete set null,
  title text,
  report_type text,
  province text,
  site_name text,
  field_notes text,
  audio_transcript text,
  photo_notes text,
  generated_report jsonb,
  status text default 'draft',
  ai_provider text,
  estimated_manual_time_minutes integer,
  estimated_ai_time_minutes integer,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists smart_actions (
  id uuid primary key default uuid_generate_v4(),
  report_id uuid references reports(id) on delete cascade,
  user_id uuid references profiles(id) on delete set null,
  action text not null,
  responsible text,
  due_date date,
  evidence text,
  status text default 'pendiente',
  created_at timestamptz default now(),
  closed_at timestamptz
);

create table if not exists calendar_events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete set null,
  report_id uuid references reports(id) on delete set null,
  action_id uuid references smart_actions(id) on delete set null,
  title text not null,
  company_name text,
  location text,
  reason text,
  event_date timestamptz,
  reminder_days_before integer default 7,
  google_calendar_event_id text,
  status text default 'pending',
  created_at timestamptz default now()
);

create table if not exists normatives (
  id text primary key,
  jurisdiction text,
  type text,
  number text,
  year integer,
  title text,
  topics text[],
  modules text[],
  status text default 'vigente',
  created_at timestamptz default now()
);

create table if not exists ai_generation_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete set null,
  report_id uuid references reports(id) on delete set null,
  provider text not null,
  model text,
  prompt_type text,
  input_summary text,
  output_preview text,
  latency_ms integer,
  raw_response text,
  created_at timestamptz default now()
);

create table if not exists tracking_events (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  user_id uuid references profiles(id) on delete set null,
  session_id text,
  source text,
  path text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists customer_feedback (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete set null,
  company_name text,
  feedback text,
  score integer,
  time_saved_minutes integer,
  consent_xprize boolean default false,
  consent_public_testimonial boolean default false,
  created_at timestamptz default now()
);

create table if not exists xprize_evidence_assets (
  id uuid primary key default uuid_generate_v4(),
  type text not null,
  title text not null,
  description text,
  file_url text,
  related_user_id uuid references profiles(id) on delete set null,
  related_report_id uuid references reports(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

insert into settings (key, value) values
('founder_offer', '{"priceARS":30000,"deadline":"2026-08-30","validUntil":"2026-12-31","regularPriceARS":50000,"regularStartsAt":"2027-01-01"}')
on conflict (key) do update set value = excluded.value, updated_at = now();

create index if not exists idx_tracking_events_name on tracking_events(name);
create index if not exists idx_ai_logs_created_at on ai_generation_logs(created_at);
create index if not exists idx_payments_created_at on payments(created_at);
create index if not exists idx_reports_created_at on reports(created_at);


-- V2 final additions: judge-proof evidence, Google integrations and impact metrics
create table if not exists ai_decision_trail (
  id uuid primary key default uuid_generate_v4(),
  ai_log_id uuid references ai_generation_logs(id) on delete set null,
  report_id uuid references reports(id) on delete cascade,
  step_type text not null,
  agent_name text not null,
  input_used text,
  recommendation text,
  reasoning text,
  output text,
  created_at timestamptz default now()
);

create table if not exists inspection_locations (
  id uuid primary key default uuid_generate_v4(),
  report_id uuid references reports(id) on delete cascade,
  company_id uuid references companies(id) on delete set null,
  company_name text,
  site_name text,
  address text,
  city text,
  province text,
  latitude numeric,
  longitude numeric,
  google_maps_url text,
  created_at timestamptz default now()
);

create table if not exists google_integration_status (
  id text primary key,
  name text not null,
  status text default 'prepared',
  purpose text,
  evidence text,
  updated_at timestamptz default now()
);

create table if not exists gmail_delivery_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete set null,
  report_id uuid references reports(id) on delete set null,
  recipient_email text,
  subject text,
  status text default 'prepared',
  provider_message_id text,
  created_at timestamptz default now()
);

create table if not exists impact_metrics (
  id uuid primary key default uuid_generate_v4(),
  report_id uuid references reports(id) on delete cascade,
  user_id uuid references profiles(id) on delete set null,
  estimated_manual_time_minutes integer,
  estimated_ai_time_minutes integer,
  estimated_time_saved_minutes integer,
  estimated_time_saved_percent integer,
  self_reported boolean default false,
  created_at timestamptz default now()
);

insert into google_integration_status (id, name, status, purpose, evidence)
values
('gemini-api','Gemini API','ready','Core agents for reports, SMART actions, normativa, calendar and evidence','ai_generation_logs + ai_decision_trail'),
('google-auth','Google Auth / Gmail login','prepared','Simple login and identity','profiles + tracking_events'),
('google-calendar','Google Calendar API','prepared','Follow-ups, visits and due dates','calendar_events'),
('google-maps','Google Maps Platform','prepared','Inspection locations and site links','inspection_locations'),
('gmail-api','Gmail API','future','Send PDFs and follow-up emails after explicit permission','gmail_delivery_logs'),
('cloud-run','Google Cloud Run','future','AI backend services','deployment evidence'),
('cloud-storage','Google Cloud Storage','future','PDFs, photos and evidence assets','xprize_evidence_assets'),
('cloud-logging','Cloud Logging','future','Technical logs for Google evidence','cloud logs + Supabase logs'),
('vertex-ai','Vertex AI','future','Optional enterprise evaluation and prompt/model governance','vertex eval logs')
on conflict (id) do update set name=excluded.name, status=excluded.status, purpose=excluded.purpose, evidence=excluded.evidence, updated_at=now();

create index if not exists idx_ai_decision_trail_report on ai_decision_trail(report_id);
create index if not exists idx_impact_metrics_report on impact_metrics(report_id);
create index if not exists idx_inspection_locations_report on inspection_locations(report_id);
