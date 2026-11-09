-- AdvantiQ demo schema.
-- This intentionally permits anonymous CRUD because the prototype has no login.
-- Use dummy data only: technician filtering in the app is not real security.

create table public.technicians (
  id text primary key,
  name text not null
);

create table public.jobs (
  id text primary key,
  technician_id text not null references public.technicians(id),
  project text not null,
  customer text not null,
  address text not null,
  timeslot text not null,
  job_type text not null,
  status text not null check (status in ('not-started', 'ready', 'done')),
  workspace_available boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.job_tasks (
  id text primary key,
  job_id text not null references public.jobs(id) on delete cascade,
  label text not null,
  position integer not null,
  unique (job_id, position)
);

create table public.required_items (
  id text primary key,
  job_id text not null references public.jobs(id) on delete cascade,
  label text not null,
  kind text not null check (kind in ('equipment', 'personnel', 'material')),
  checked boolean not null default false,
  location_status text,
  position integer not null,
  unique (job_id, position)
);

create table public.job_updates (
  id text primary key,
  job_id text not null references public.jobs(id) on delete cascade,
  kind text not null check (kind in ('created', 'assigned', 'reassigned', 'edited')),
  field text not null,
  old_value text not null default '',
  new_value text not null default '',
  task_id text references public.job_tasks(id) on delete set null,
  message text,
  notify boolean not null default true,
  created_at timestamptz not null default now(),
  seen_at timestamptz
);

create index jobs_technician_id_idx on public.jobs(technician_id);
create index job_tasks_job_id_idx on public.job_tasks(job_id);
create index required_items_job_id_idx on public.required_items(job_id);
create index job_updates_job_id_idx on public.job_updates(job_id);

create or replace function public.touch_job_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger jobs_touch_updated_at
before update on public.jobs
for each row execute function public.touch_job_updated_at();

alter table public.technicians enable row level security;
alter table public.jobs enable row level security;
alter table public.job_tasks enable row level security;
alter table public.required_items enable row level security;
alter table public.job_updates enable row level security;

create policy "demo technicians are readable"
on public.technicians for select to anon using (true);
create policy "demo technicians are writable"
on public.technicians for all to anon using (true) with check (true);

create policy "demo jobs are readable"
on public.jobs for select to anon using (true);
create policy "demo jobs are writable"
on public.jobs for all to anon using (true) with check (true);

create policy "demo tasks are readable"
on public.job_tasks for select to anon using (true);
create policy "demo tasks are writable"
on public.job_tasks for all to anon using (true) with check (true);

create policy "demo required items are readable"
on public.required_items for select to anon using (true);
create policy "demo required items are writable"
on public.required_items for all to anon using (true) with check (true);

create policy "demo updates are readable"
on public.job_updates for select to anon using (true);
create policy "demo updates are writable"
on public.job_updates for all to anon using (true) with check (true);

-- Keep all prototype seed content in one place so reset and initial setup cannot drift.
create or replace function public.seed_demo_data()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.technicians (id, name) values
    ('tech-a', 'Technician A'),
    ('tech-b', 'Technician B')
  on conflict (id) do update set name = excluded.name;

  insert into public.jobs (id, technician_id, project, customer, address, timeslot, job_type, status, workspace_available, created_at, updated_at) values
    ('J-2481', 'tech-a', 'Boiler room renovation', 'Van Dijk Facilities', 'Industrieweg 14, Utrecht', 'Today · 08:00 – 12:30', 'Heating', 'not-started', true, '2026-11-06T15:40:00Z', '2026-11-07T07:12:00Z'),
    ('J-2482', 'tech-a', 'Heat pump installation', 'Bakker & Zn', 'Kanaalstraat 88, Amersfoort', 'Tomorrow · 09:00 – 15:00', 'Mechanical', 'not-started', true, '2026-11-05T10:00:00Z', '2026-11-05T10:00:00Z'),
    ('J-2490', 'tech-b', 'Switchboard upgrade', 'De Groot Logistics', 'Havenkade 3, Rotterdam', 'Today · 10:00 – 14:00', 'Electrical', 'ready', true, '2026-11-04T09:00:00Z', '2026-11-04T09:00:00Z'),
    ('J-2491', 'tech-b', 'Ventilation maintenance', 'Stadion Park Offices', 'Olympisch Stadion 21, Amsterdam', 'Yesterday · 08:00 – 12:00', 'Mechanical', 'done', false, '2026-11-03T08:00:00Z', '2026-11-03T08:00:00Z');

  insert into public.job_tasks (id, job_id, label, position) values
    ('J-2481-t1', 'J-2481', 'Isolate & drain heating circuit', 1),
    ('J-2481-t2', 'J-2481', 'Remove old boiler', 2),
    ('J-2481-t3', 'J-2481', 'Mount flue at 12 m — 15 m scissor lift', 3),
    ('J-2481-t4', 'J-2481', 'Connect & pressure test', 4),
    ('J-2482-t1', 'J-2482', 'Place outdoor unit on wall brackets', 1),
    ('J-2482-t2', 'J-2482', 'Run refrigerant lines', 2),
    ('J-2482-t3', 'J-2482', 'Wire indoor unit & thermostat', 3),
    ('J-2490-t1', 'J-2490', 'De-energize main feed', 1),
    ('J-2490-t2', 'J-2490', 'Replace switchboard', 2),
    ('J-2490-t3', 'J-2490', 'Label circuits & test', 3),
    ('J-2491-t1', 'J-2491', 'Replace filters roof unit 1–3', 1),
    ('J-2491-t2', 'J-2491', 'Check fan belts', 2);

  insert into public.required_items (id, job_id, label, kind, position) values
    ('J-2481-i1', 'J-2481', '15 m scissor lift', 'equipment', 1),
    ('J-2481-i2', 'J-2481', 'Flue kit 150 mm', 'material', 2),
    ('J-2481-i3', 'J-2481', '2 technicians', 'personnel', 3),
    ('J-2482-i1', 'J-2482', 'Wall bracket set', 'material', 1),
    ('J-2482-i2', 'J-2482', 'Vacuum pump', 'equipment', 2),
    ('J-2482-i3', 'J-2482', '2 technicians', 'personnel', 3),
    ('J-2490-i1', 'J-2490', 'New switchboard 40A', 'material', 1),
    ('J-2490-i2', 'J-2490', 'Voltage tester', 'equipment', 2),
    ('J-2491-i1', 'J-2491', 'Filter set F7', 'material', 1);

  insert into public.job_updates (id, job_id, kind, field, old_value, new_value, task_id, message, notify, created_at, seen_at) values
    ('u-2481-1', 'J-2481', 'created', 'Job', '', 'Boiler room renovation', null, null, true, '2026-11-06T15:40:00Z', '2026-11-06T16:02:00Z'),
    ('u-2481-2', 'J-2481', 'edited', 'Access equipment', '10 m scissor lift', '15 m scissor lift', 'J-2481-t3', 'Ceiling is higher than measured.', true, '2026-11-07T07:12:00Z', null),
    ('u-2482-1', 'J-2482', 'created', 'Job', '', 'Heat pump installation', null, null, true, '2026-11-05T10:00:00Z', '2026-11-05T12:30:00Z'),
    ('u-2490-1', 'J-2490', 'created', 'Job', '', 'Switchboard upgrade', null, null, true, '2026-11-04T09:00:00Z', '2026-11-04T09:20:00Z'),
    ('u-2491-1', 'J-2491', 'created', 'Job', '', 'Ventilation maintenance', null, null, true, '2026-11-03T08:00:00Z', '2026-11-03T08:15:00Z');
end;
$$;

create or replace function public.reset_demo_data()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  truncate table public.jobs, public.technicians cascade;
  perform public.seed_demo_data();
end;
$$;

revoke all on function public.seed_demo_data() from public;
revoke all on function public.seed_demo_data() from anon;
grant execute on function public.reset_demo_data() to anon;
select public.seed_demo_data();

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'jobs') then
    alter publication supabase_realtime add table public.jobs;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'job_tasks') then
    alter publication supabase_realtime add table public.job_tasks;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'required_items') then
    alter publication supabase_realtime add table public.required_items;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'job_updates') then
    alter publication supabase_realtime add table public.job_updates;
  end if;
end;
$$;
