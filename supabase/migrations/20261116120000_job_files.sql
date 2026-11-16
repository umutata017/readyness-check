-- Files attached to a job (Excel sheets, PDFs, drawings, …).
-- The file itself lives in the private Storage bucket `job-files` under
-- "<job id>/<random id>-<file name>"; this table lists what is attached.
-- Demo access like the rest of the prototype: no login, dummy data only.
-- Safe to run more than once.

insert into storage.buckets (id, name, public, file_size_limit)
values ('job-files', 'job-files', false, 20971520) -- 20 MB per file
on conflict (id) do update set file_size_limit = excluded.file_size_limit;

drop policy if exists "demo job files are readable" on storage.objects;
create policy "demo job files are readable"
on storage.objects for select to anon using (bucket_id = 'job-files');

drop policy if exists "demo job files can be uploaded" on storage.objects;
create policy "demo job files can be uploaded"
on storage.objects for insert to anon with check (bucket_id = 'job-files');

drop policy if exists "demo job files can be removed" on storage.objects;
create policy "demo job files can be removed"
on storage.objects for delete to anon using (bucket_id = 'job-files');

create table if not exists public.job_files (
  id uuid primary key default gen_random_uuid(),
  job_id text not null references public.jobs(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  storage_path text not null unique,
  size_bytes bigint not null check (size_bytes >= 0),
  content_type text,
  uploaded_by text not null, -- technician id or "supervisor"
  created_at timestamptz not null default now()
);

create index if not exists job_files_job_id_idx on public.job_files(job_id);

alter table public.job_files enable row level security;

drop policy if exists "demo job file list is readable" on public.job_files;
create policy "demo job file list is readable"
on public.job_files for select to anon using (true);

drop policy if exists "demo job file list is writable" on public.job_files;
create policy "demo job file list is writable"
on public.job_files for all to anon using (true) with check (true);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'job_files'
  ) then
    alter publication supabase_realtime add table public.job_files;
  end if;
end;
$$;

notify pgrst, 'reload schema';
