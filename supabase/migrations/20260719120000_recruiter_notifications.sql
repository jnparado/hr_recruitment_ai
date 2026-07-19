-- Recruiter Admin notifications (new applications / CV uploads)
create table if not exists recruiter_notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null default 'application',
  title text not null,
  body text not null default '',
  application_id uuid references applications(id) on delete cascade,
  href text not null default '/dashboard/applicants',
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists recruiter_notifications_created_idx
  on recruiter_notifications (created_at desc);

create index if not exists recruiter_notifications_unread_idx
  on recruiter_notifications (created_at desc)
  where read_at is null;
