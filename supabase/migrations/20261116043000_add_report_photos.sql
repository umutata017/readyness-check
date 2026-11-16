-- Report photos use a private bucket with anonymous prototype policies.
-- This is intentionally permissive for dummy data and is not production auth.
insert into storage.buckets (id, name, public)
values ('report-photos', 'report-photos', false)
on conflict (id) do update set public = false;

create table public.report_photos (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  storage_path text not null unique,
  content_type text not null default 'image/jpeg',
  size_bytes integer not null,
  created_at timestamptz not null default now()
);

create index report_photos_report_id_idx on public.report_photos(report_id);

alter table public.report_photos enable row level security;

create policy "demo report photos are readable"
on public.report_photos for select to anon using (true);
create policy "demo report photos are writable"
on public.report_photos for insert to anon with check (true);
create policy "demo report photos can be deleted"
on public.report_photos for delete to anon using (true);

create policy "demo report photo objects are readable"
on storage.objects for select to anon using (bucket_id = 'report-photos');
create policy "demo report photo objects are writable"
on storage.objects for insert to anon with check (bucket_id = 'report-photos');
create policy "demo report photo objects can be deleted"
on storage.objects for delete to anon using (bucket_id = 'report-photos');

create or replace function public.reset_demo_data()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from storage.objects where bucket_id = 'report-photos';
  truncate table public.jobs, public.technicians cascade;
  perform public.seed_demo_data();

  insert into public.reports (
    id, job_id, technician_id, notes, nothing_to_report, follow_up_needed,
    status, submitted_at
  ) values (
    '00000000-0000-0000-0000-000000002491',
    'J-2491',
    'tech-b',
    'Replaced filters and checked the roof unit fan belts.',
    false,
    false,
    'submitted',
    '2026-11-03T12:00:00Z'
  );

  insert into public.report_materials (report_id, name, used, is_extra, position)
  values (
    '00000000-0000-0000-0000-000000002491',
    'Filter set F7',
    true,
    false,
    1
  );
end;
$$;

notify pgrst, 'reload schema';

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'report_photos'
  ) then
    alter publication supabase_realtime add table public.report_photos;
  end if;
end;
$$;
