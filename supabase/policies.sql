-- Row Level Security policies for HR Process
-- Run after supabase/schema.sql
--
-- The Next.js app uses SUPABASE_SERVICE_ROLE_KEY (bypasses RLS).
-- These policies lock down direct REST/API access with the anon key.

-- ─── jobs ───────────────────────────────────────────────────────────────────
alter table public.jobs enable row level security;

drop policy if exists "jobs_public_read_active" on public.jobs;
create policy "jobs_public_read_active"
  on public.jobs
  for select
  to anon, authenticated
  using (active = true);

drop policy if exists "jobs_authenticated_manage" on public.jobs;
create policy "jobs_authenticated_manage"
  on public.jobs
  for all
  to authenticated
  using (true)
  with check (true);

-- ─── applications ───────────────────────────────────────────────────────────
alter table public.applications enable row level security;

drop policy if exists "applications_public_insert" on public.applications;
create policy "applications_public_insert"
  on public.applications
  for insert
  to anon, authenticated
  with check (
    char_length(trim(applicant_name)) > 0
    and char_length(trim(applicant_email)) > 0
    and char_length(trim(resume_path)) > 0
    and char_length(trim(resume_url)) > 0
    and status = 'received'
  );

drop policy if exists "applications_authenticated_read" on public.applications;
create policy "applications_authenticated_read"
  on public.applications
  for select
  to authenticated
  using (true);

drop policy if exists "applications_authenticated_update" on public.applications;
create policy "applications_authenticated_update"
  on public.applications
  for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "applications_authenticated_delete" on public.applications;
create policy "applications_authenticated_delete"
  on public.applications
  for delete
  to authenticated
  using (true);

-- anon: INSERT only (no SELECT — prevents scraping all applicants)

-- ─── candidates ─────────────────────────────────────────────────────────────
alter table public.candidates enable row level security;

drop policy if exists "candidates_authenticated_read" on public.candidates;
create policy "candidates_authenticated_read"
  on public.candidates
  for select
  to authenticated
  using (true);

drop policy if exists "candidates_authenticated_insert" on public.candidates;
create policy "candidates_authenticated_insert"
  on public.candidates
  for insert
  to authenticated
  with check (true);

drop policy if exists "candidates_authenticated_update" on public.candidates;
create policy "candidates_authenticated_update"
  on public.candidates
  for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "candidates_authenticated_delete" on public.candidates;
create policy "candidates_authenticated_delete"
  on public.candidates
  for delete
  to authenticated
  using (true);

-- anon: no access (parsed resume data is recruiter-only)

-- ─── interviews ─────────────────────────────────────────────────────────────
alter table public.interviews enable row level security;

drop policy if exists "interviews_authenticated_read" on public.interviews;
create policy "interviews_authenticated_read"
  on public.interviews
  for select
  to authenticated
  using (true);

drop policy if exists "interviews_authenticated_insert" on public.interviews;
create policy "interviews_authenticated_insert"
  on public.interviews
  for insert
  to authenticated
  with check (true);

drop policy if exists "interviews_authenticated_update" on public.interviews;
create policy "interviews_authenticated_update"
  on public.interviews
  for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "interviews_authenticated_delete" on public.interviews;
create policy "interviews_authenticated_delete"
  on public.interviews
  for delete
  to authenticated
  using (true);

-- anon: no access

-- ─── voice_interviews ───────────────────────────────────────────────────────
alter table public.voice_interviews enable row level security;

drop policy if exists "voice_interviews_authenticated_read" on public.voice_interviews;
create policy "voice_interviews_authenticated_read"
  on public.voice_interviews
  for select
  to authenticated
  using (true);

drop policy if exists "voice_interviews_authenticated_insert" on public.voice_interviews;
create policy "voice_interviews_authenticated_insert"
  on public.voice_interviews
  for insert
  to authenticated
  with check (true);

drop policy if exists "voice_interviews_authenticated_update" on public.voice_interviews;
create policy "voice_interviews_authenticated_update"
  on public.voice_interviews
  for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "voice_interviews_authenticated_delete" on public.voice_interviews;
create policy "voice_interviews_authenticated_delete"
  on public.voice_interviews
  for delete
  to authenticated
  using (true);

-- anon: no access (transcripts & scores are sensitive)

-- ─── storage: upload_resume ─────────────────────────────────────────────────
-- Resumes are uploaded server-side with the service role (bypasses RLS).
-- Public read matches getPublicUrl() on the careers flow.

drop policy if exists "resumes_public_read" on storage.objects;
drop policy if exists "upload_resume_public_read" on storage.objects;
create policy "upload_resume_public_read"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'upload_resume');

drop policy if exists "resumes_authenticated_upload" on storage.objects;
drop policy if exists "upload_resume_service_upload" on storage.objects;
create policy "upload_resume_service_upload"
  on storage.objects
  for insert
  to service_role
  with check (bucket_id = 'upload_resume');

drop policy if exists "resumes_authenticated_update" on storage.objects;
drop policy if exists "upload_resume_service_update" on storage.objects;
create policy "upload_resume_service_update"
  on storage.objects
  for update
  to service_role
  using (bucket_id = 'upload_resume')
  with check (bucket_id = 'upload_resume');

drop policy if exists "resumes_authenticated_delete" on storage.objects;
drop policy if exists "upload_resume_service_delete" on storage.objects;
create policy "upload_resume_service_delete"
  on storage.objects
  for delete
  to service_role
  using (bucket_id = 'upload_resume');

drop policy if exists "upload_resume_authenticated_upload" on storage.objects;
create policy "upload_resume_authenticated_upload"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'upload_resume');

drop policy if exists "upload_resume_authenticated_update" on storage.objects;
create policy "upload_resume_authenticated_update"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'upload_resume')
  with check (bucket_id = 'upload_resume');

drop policy if exists "upload_resume_authenticated_delete" on storage.objects;
create policy "upload_resume_authenticated_delete"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'upload_resume');

-- anon: SELECT only (uploads go through Next.js API + service role)

-- ─── storage: certificate ───────────────────────────────────────────────────

drop policy if exists "certificate_public_read" on storage.objects;
create policy "certificate_public_read"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'certificate');

drop policy if exists "certificate_service_upload" on storage.objects;
create policy "certificate_service_upload"
  on storage.objects
  for insert
  to service_role
  with check (bucket_id = 'certificate');

drop policy if exists "certificate_service_update" on storage.objects;
create policy "certificate_service_update"
  on storage.objects
  for update
  to service_role
  using (bucket_id = 'certificate')
  with check (bucket_id = 'certificate');

drop policy if exists "certificate_service_delete" on storage.objects;
create policy "certificate_service_delete"
  on storage.objects
  for delete
  to service_role
  using (bucket_id = 'certificate');

drop policy if exists "certificate_authenticated_upload" on storage.objects;
create policy "certificate_authenticated_upload"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'certificate');

drop policy if exists "certificate_authenticated_update" on storage.objects;
create policy "certificate_authenticated_update"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'certificate')
  with check (bucket_id = 'certificate');

drop policy if exists "certificate_authenticated_delete" on storage.objects;
create policy "certificate_authenticated_delete"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'certificate');
