-- Add certificate file references on applications (paths/urls in certificate bucket)

alter table public.applications
  add column if not exists certificate_files jsonb not null default '[]';
