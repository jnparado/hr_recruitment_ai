-- Run this in the Supabase SQL Editor to set up the career application flow.
-- Then run supabase/policies.sql for Row Level Security on every table.

create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  department text not null default 'General',
  location text not null default 'Remote',
  type text not null default 'Full-time',
  description text not null,
  requirements text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references jobs(id) on delete set null,
  job_title text not null default '',
  applicant_name text not null,
  applicant_email text not null,
  resume_path text not null,
  resume_url text not null,
  certificate_files jsonb not null default '[]',
  status text not null default 'received',
  match_score integer,
  rank integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists candidates (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references applications(id) on delete cascade unique,
  name text not null,
  email text not null default '',
  phone text not null default '',
  current_role text not null default '',
  years_of_experience integer not null default 0,
  skills jsonb not null default '[]',
  experience jsonb not null default '[]',
  education jsonb not null default '[]',
  certificates jsonb not null default '[]',
  parsed_at timestamptz not null default now()
);

create table if not exists interviews (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references applications(id) on delete cascade,
  job_title text not null,
  candidate_name text not null,
  candidate_email text not null,
  scheduled_date date not null,
  scheduled_time text not null,
  format text not null default 'video',
  duration_minutes integer not null default 30,
  calendar_event_id text,
  reminder_sent boolean not null default false,
  notes text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists voice_interviews (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references applications(id) on delete cascade unique,
  transcript jsonb not null default '[]',
  evaluation jsonb not null default '{}',
  overall_score integer not null default 0,
  recommendation text not null default '',
  completed_at timestamptz not null default now()
);

create index if not exists voice_interviews_application_idx on voice_interviews(application_id);
create index if not exists voice_interviews_score_idx on voice_interviews(overall_score desc);

create index if not exists applications_status_idx on applications(status);
create index if not exists applications_job_id_idx on applications(job_id);
create index if not exists interviews_scheduled_date_idx on interviews(scheduled_date);

-- Seed sample jobs (safe to re-run — skips if title exists)
insert into jobs (title, department, location, type, description, requirements)
select * from (values
  (
    'Senior Software Engineer',
    'Engineering',
    'Remote',
    'Full-time',
    'Build and scale our HR automation platform using Next.js, TypeScript, and Supabase. You will own features end-to-end from design through deployment.',
    '5+ years software engineering. Strong TypeScript/React. Experience with PostgreSQL or Supabase. Familiarity with AI APIs a plus.'
  ),
  (
    'HR Operations Specialist',
    'People',
    'Manila, PH',
    'Full-time',
    'Manage the full recruitment lifecycle — from job posting through onboarding. Partner with hiring managers to define roles and run structured interview processes.',
    '3+ years HR or recruitment experience. Strong communication. Comfortable with ATS tools and data-driven hiring.'
  ),
  (
    'AI/ML Engineer',
    'Engineering',
    'Remote',
    'Full-time',
    'Design and improve our AI resume parsing, job matching, and interview scoring pipelines powered by OpenAI and n8n automation.',
    'Experience with LLM APIs, prompt engineering, and workflow automation (n8n/Zapier). Python or TypeScript. ML fundamentals.'
  )
) as v(title, department, location, type, description, requirements)
where not exists (select 1 from jobs j where j.title = v.title);
