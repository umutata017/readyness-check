-- Keep the Ready Check history kind when extending the update constraint for cancellation.
alter table public.job_updates drop constraint if exists job_updates_kind_check;
alter table public.job_updates
  add constraint job_updates_kind_check
  check (kind in ('created', 'assigned', 'reassigned', 'edited', 'ready', 'cancelled'));

notify pgrst, 'reload schema';
