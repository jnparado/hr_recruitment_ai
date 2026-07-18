-- Storage policies for the upload_resume bucket (public).
-- Run in Supabase SQL Editor: Dashboard → SQL → New query → Run

drop policy if exists "upload_resume_public_read" on storage.objects;
create policy "upload_resume_public_read"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'upload_resume');

drop policy if exists "upload_resume_service_upload" on storage.objects;
create policy "upload_resume_service_upload"
  on storage.objects for insert to service_role
  with check (bucket_id = 'upload_resume');

drop policy if exists "upload_resume_service_update" on storage.objects;
create policy "upload_resume_service_update"
  on storage.objects for update to service_role
  using (bucket_id = 'upload_resume')
  with check (bucket_id = 'upload_resume');

drop policy if exists "upload_resume_service_delete" on storage.objects;
create policy "upload_resume_service_delete"
  on storage.objects for delete to service_role
  using (bucket_id = 'upload_resume');
