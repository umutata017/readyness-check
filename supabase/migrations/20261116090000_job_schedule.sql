-- Real planned start/end times for jobs, so the app can show a planning agenda.
-- The old free-text `timeslot` column stays as a readable label.
-- Jobs whose timeslot reads "Today|Tomorrow|Yesterday · 08:00 – 12:30" (the demo
-- jobs) get their times filled in automatically, relative to the day they are
-- inserted, so a demo reset always lands in the current week.
-- Safe to run more than once.

alter table public.jobs
  add column if not exists scheduled_start timestamptz,
  add column if not exists scheduled_end timestamptz;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'jobs_schedule_order_check') then
    alter table public.jobs add constraint jobs_schedule_order_check
      check (scheduled_end is null or scheduled_start is null or scheduled_end > scheduled_start);
  end if;
end;
$$;

create index if not exists jobs_scheduled_start_idx on public.jobs(scheduled_start);

create or replace function public.fill_job_schedule()
returns trigger
language plpgsql
as $$
declare
  parts text[];
  day date;
  today date := (now() at time zone 'Europe/Amsterdam')::date;
begin
  if new.scheduled_start is null then
    parts := regexp_match(
      new.timeslot,
      '^(today|tomorrow|yesterday)\s*·\s*(\d{1,2}:\d{2})\s*[–-]\s*(\d{1,2}:\d{2})',
      'i'
    );
    if parts is not null then
      day := today + case lower(parts[1]) when 'tomorrow' then 1 when 'yesterday' then -1 else 0 end;
      new.scheduled_start := (day + parts[2]::time) at time zone 'Europe/Amsterdam';
      new.scheduled_end := (day + parts[3]::time) at time zone 'Europe/Amsterdam';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists jobs_fill_schedule on public.jobs;
create trigger jobs_fill_schedule
before insert or update of scheduled_start on public.jobs
for each row execute function public.fill_job_schedule();

-- Give the existing jobs their times (fires the trigger above).
update public.jobs set scheduled_start = null where scheduled_start is null;

notify pgrst, 'reload schema';
