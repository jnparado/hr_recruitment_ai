-- current_role must be TEXT (job title from the resume), not an access-role enum.
-- Safe to re-run.

-- Drop the mis-typed column if it exists (enum or otherwise)
alter table public.candidates drop column if exists "current_role";

-- Recreate as plain text
alter table public.candidates add column "current_role" text not null default '';

-- Optional: remove the typo enum type if nothing else uses it
drop type if exists public.curent_role;

-- Ensure the rest of the parse columns exist
alter table public.candidates add column if not exists phone text not null default '';
alter table public.candidates add column if not exists years_of_experience integer not null default 0;
alter table public.candidates add column if not exists skills jsonb not null default '[]';
alter table public.candidates add column if not exists experience jsonb not null default '[]';
alter table public.candidates add column if not exists education jsonb not null default '[]';
alter table public.candidates add column if not exists certificates jsonb not null default '[]';
alter table public.candidates add column if not exists parsed_at timestamptz not null default now();

notify pgrst, 'reload schema';
