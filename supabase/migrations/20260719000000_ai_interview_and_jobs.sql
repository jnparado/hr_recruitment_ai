-- AI Interview Room invites (secure candidate links)
create table if not exists ai_interview_invites (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  application_id uuid not null references applications(id) on delete cascade,
  job_title text not null default '',
  candidate_name text not null,
  candidate_email text not null,
  duration_minutes integer not null default 30,
  deadline timestamptz not null,
  status text not null default 'pending',
  consent_at timestamptz,
  devices_ok_at timestamptz,
  identity_ok_at timestamptz,
  verified_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists ai_interview_invites_token_idx on ai_interview_invites(token);
create index if not exists ai_interview_invites_application_idx on ai_interview_invites(application_id);

-- Job lifecycle: open | closed | archived
alter table jobs add column if not exists status text not null default 'open';
alter table jobs add column if not exists updated_at timestamptz not null default now();

-- Candidate management extras
alter table applications add column if not exists notes text not null default '';
alter table applications add column if not exists tags jsonb not null default '[]';
