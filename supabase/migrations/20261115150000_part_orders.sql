-- Parts ordered for a job. Each order is numbered per job, so with the job
-- number it reads as J26-0042-P1 ("first part order for job J26-0042").
-- Flow: requested (by technician or supervisor) -> ordered -> delivered, or cancelled.
-- Safe to run more than once.

create table if not exists public.part_orders (
  id text primary key,
  job_id text not null references public.jobs(id) on delete cascade,
  seq integer not null,
  part text not null check (length(trim(part)) > 0),
  quantity integer not null default 1 check (quantity > 0),
  note text,
  status text not null default 'requested'
    check (status in ('requested', 'ordered', 'delivered', 'cancelled')),
  requested_by text not null,
  created_at timestamptz not null default now(),
  ordered_at timestamptz,
  delivered_at timestamptz,
  cancelled_at timestamptz,
  unique (job_id, seq)
);

create index if not exists part_orders_job_id_idx on public.part_orders(job_id);

-- Same demo access as the other prototype tables: no login, dummy data only.
alter table public.part_orders enable row level security;

drop policy if exists "demo part orders are readable" on public.part_orders;
create policy "demo part orders are readable"
on public.part_orders for select to anon using (true);

drop policy if exists "demo part orders are writable" on public.part_orders;
create policy "demo part orders are writable"
on public.part_orders for all to anon using (true) with check (true);

-- Live updates, so the technician sees "Ordered"/"Delivered" without reloading.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'part_orders'
  ) then
    alter publication supabase_realtime add table public.part_orders;
  end if;
end;
$$;

notify pgrst, 'reload schema';
