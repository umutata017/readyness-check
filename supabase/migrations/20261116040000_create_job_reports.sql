-- Job reports are intentionally anonymous and openly readable/writable for this
-- dummy-data prototype. This is not a production authorization boundary.
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  job_id text not null unique references public.jobs(id) on delete cascade,
  technician_id text not null references public.technicians(id),
  notes text not null default '',
  nothing_to_report boolean not null default false,
  follow_up_needed boolean not null default false,
  follow_up_text text,
  started_at time,
  ended_at time,
  status text not null default 'draft' check (status in ('draft', 'submitted', 'reviewed')),
  submitted_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.report_problems (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  tag text not null,
  note text,
  unique (report_id, tag)
);

create table public.report_materials (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  name text not null,
  used boolean not null default false,
  is_extra boolean not null default false,
  position integer not null,
  unique (report_id, name, is_extra)
);

create index reports_job_id_idx on public.reports(job_id);
create index reports_status_idx on public.reports(status);
create index report_problems_report_id_idx on public.report_problems(report_id);
create index report_materials_report_id_idx on public.report_materials(report_id);

create or replace function public.touch_report_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger reports_touch_updated_at
before update on public.reports
for each row execute function public.touch_report_updated_at();

alter table public.reports enable row level security;
alter table public.report_problems enable row level security;
alter table public.report_materials enable row level security;

create policy "demo reports are readable"
on public.reports for select to anon using (true);
create policy "demo reports are writable"
on public.reports for insert to anon with check (true);
create policy "demo reports are editable"
on public.reports for update to anon using (true) with check (true);

create policy "demo report problems are readable"
on public.report_problems for select to anon using (true);
create policy "demo report problems are writable"
on public.report_problems for insert to anon with check (true);
create policy "demo report problems are editable"
on public.report_problems for update to anon using (true) with check (true);
create policy "demo report problems can be replaced"
on public.report_problems for delete to anon using (true);

create policy "demo report materials are readable"
on public.report_materials for select to anon using (true);
create policy "demo report materials are writable"
on public.report_materials for insert to anon with check (true);
create policy "demo report materials are editable"
on public.report_materials for update to anon using (true) with check (true);
create policy "demo report materials can be replaced"
on public.report_materials for delete to anon using (true);

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
) on conflict (job_id) do update set
  notes = excluded.notes,
  status = excluded.status,
  submitted_at = excluded.submitted_at;

insert into public.report_materials (report_id, name, used, is_extra, position)
values (
  '00000000-0000-0000-0000-000000002491',
  'Filter set F7',
  true,
  false,
  1
) on conflict (report_id, name, is_extra) do nothing;

create or replace function public.reset_demo_data()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
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
      and tablename = 'reports'
  ) then
    alter publication supabase_realtime add table public.reports;
  end if;
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'report_problems'
  ) then
    alter publication supabase_realtime add table public.report_problems;
  end if;
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'report_materials'
  ) then
    alter publication supabase_realtime add table public.report_materials;
  end if;
end;
$$;
