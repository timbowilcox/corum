-- Enable UUID extension
create extension if not exists "pgcrypto";

-- Organisations
create table organisations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Link auth.users to organisations (one user = one org at MVP)
create table user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organisation_id uuid not null references organisations(id),
  full_name text,
  created_at timestamptz default now()
);

-- Sites (individual farm/packhouse/factory locations)
create table sites (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references organisations(id) on delete cascade,
  name text not null,
  site_type text not null check (site_type in ('farm','packhouse','factory','warehouse','office')),
  address text,
  country text not null default 'AU',
  employee_count int,
  intake_mode text not null default 'conversation' check (intake_mode in ('conversation','form')),
  intake_status text not null default 'not_started' check (intake_status in ('not_started','in_progress','submitted')),
  deleted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Intake responses (one row per question per site)
create table intake_responses (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sites(id) on delete cascade,
  question_id text not null,
  pillar text not null check (pillar in ('labour','health_safety','environment','business_ethics')),
  response_value text,
  response_type text not null check (response_type in ('yes_no','text','number','select','multiselect')),
  source text not null default 'form' check (source in ('form','conversation','quick_check')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (site_id, question_id)
);

-- Conversation turns (for conversational intake resumability)
create table conversation_turns (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sites(id) on delete cascade,
  turn_number int not null,
  role text not null check (role in ('assistant','user')),
  content text not null,
  extracted_question_ids text[],
  created_at timestamptz default now()
);

-- Analysis jobs
create table analysis_jobs (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sites(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','running','complete','failed')),
  analysis_narrative text,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now()
);

-- Gap findings (output of AI analysis — pass 2 extraction)
create table gap_findings (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sites(id) on delete cascade,
  analysis_job_id uuid not null references analysis_jobs(id) on delete cascade,
  criteria_id text not null,
  pillar text not null check (pillar in ('labour','health_safety','environment','business_ethics')),
  severity text not null check (severity in ('zero_tolerance','critical','major','minor','conformant')),
  finding text not null,
  recommendation text not null,
  confidence numeric(3,2) not null default 1.0,
  estimated_effort text check (estimated_effort in ('low','medium','high')),
  evidence_needed text,
  created_at timestamptz default now()
);

-- Finding notes (user evidence/progress notes on specific findings)
create table finding_notes (
  id uuid primary key default gen_random_uuid(),
  finding_id uuid not null references gap_findings(id) on delete cascade,
  note text not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz default now()
);

-- Readiness scores (computed from gap_findings, stored for fast retrieval and history)
create table readiness_scores (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sites(id) on delete cascade,
  analysis_job_id uuid not null references analysis_jobs(id) on delete cascade,
  pillar text check (pillar in ('labour','health_safety','environment','business_ethics','overall')),
  score numeric(5,2) not null,
  findings_count int not null default 0,
  zero_tolerance_count int not null default 0,
  critical_count int not null default 0,
  major_count int not null default 0,
  minor_count int not null default 0,
  conformant_count int not null default 0,
  created_at timestamptz default now()
);

-- Quick check submissions (unauthenticated, for rate limiting and optional import)
create table quick_check_submissions (
  id uuid primary key default gen_random_uuid(),
  ip_hash text not null,
  site_type text not null,
  country text not null default 'AU',
  responses jsonb not null,
  risk_grade text not null check (risk_grade in ('high_risk','moderate_risk','low_risk')),
  risk_summary text not null,
  created_at timestamptz default now()
);
