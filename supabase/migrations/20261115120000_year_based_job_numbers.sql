-- Human-readable, year-based job numbers such as J26-0042 ("the 42nd job of 2026").
-- The internal jobs.id stays unchanged so links, tasks and history keep working.
-- Safe to run more than once.

alter table public.jobs
  add column if not exists job_year integer,
  add column if not exists job_seq integer;

-- Number the existing jobs per year, in the order they were created.
with numbered as (
  select
    id,
    extract(year from created_at at time zone 'Europe/Amsterdam')::integer as year,
    row_number() over (
      partition by extract(year from created_at at time zone 'Europe/Amsterdam')
      order by id
    ) as seq
  from public.jobs
  where job_year is null or job_seq is null
)
update public.jobs j
set job_year = numbered.year,
    job_seq = numbered.seq + coalesce(
      (select max(job_seq) from public.jobs k where k.job_year = numbered.year),
      0
    )
from numbered
where j.id = numbered.id;

alter table public.jobs
  alter column job_year set not null,
  alter column job_seq set not null;

alter table public.jobs
  add column if not exists job_number text
  generated always as (
    'J' || lpad((job_year % 100)::text, 2, '0') || '-' ||
    case when job_seq < 10000 then lpad(job_seq::text, 4, '0') else job_seq::text end
  ) stored;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'jobs_job_year_seq_key') then
    alter table public.jobs add constraint jobs_job_year_seq_key unique (job_year, job_seq);
  end if;
end;
$$;

-- New jobs get the next number of their year automatically. If two jobs are
-- created at the same moment, the unique constraint rejects one and the app retries.
create or replace function public.assign_job_number()
returns trigger
language plpgsql
as $$
begin
  if new.job_year is null then
    new.job_year := extract(year from coalesce(new.created_at, now()) at time zone 'Europe/Amsterdam')::integer;
  end if;
  if new.job_seq is null then
    select coalesce(max(job_seq), 0) + 1 into new.job_seq
    from public.jobs
    where job_year = new.job_year;
  end if;
  return new;
end;
$$;

drop trigger if exists jobs_assign_job_number on public.jobs;
create trigger jobs_assign_job_number
before insert on public.jobs
for each row execute function public.assign_job_number();

notify pgrst, 'reload schema';
