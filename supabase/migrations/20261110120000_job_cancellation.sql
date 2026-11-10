-- Supervisors can remove (cancel) a job. The row is kept so the technician
-- still sees the job, highlighted as cancelled, together with the reason.
-- Idempotent so it is safe if it was already applied by hand in the SQL editor.

alter table public.jobs
  add column if not exists cancel_reason text check (cancel_reason in ('resident', 'supervisor')),
  add column if not exists cancel_note text,
  add column if not exists cancelled_at timestamptz;

alter table public.job_updates drop constraint if exists job_updates_kind_check;
alter table public.job_updates
  add constraint job_updates_kind_check
  check (kind in ('created', 'assigned', 'reassigned', 'edited', 'cancelled'));

-- Make the API pick up the new columns immediately.
notify pgrst, 'reload schema';
