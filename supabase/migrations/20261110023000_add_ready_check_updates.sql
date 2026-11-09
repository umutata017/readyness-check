-- Record completion of the prototype ready check in the shared job history.
alter table public.job_updates drop constraint if exists job_updates_kind_check;

alter table public.job_updates
  add constraint job_updates_kind_check
  check (kind in ('created', 'assigned', 'reassigned', 'edited', 'ready'));
