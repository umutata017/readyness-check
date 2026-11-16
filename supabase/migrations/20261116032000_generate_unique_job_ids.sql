-- Allocate human-readable job IDs in the database so concurrent devices cannot
-- generate the same next ID from a stale list of jobs.
create sequence if not exists public.job_number_seq;

select setval(
  'public.job_number_seq',
  greatest(
    coalesce(
      (
        select max((substring(id from 3))::bigint)
        from public.jobs
        where id ~ '^J-[0-9]+$'
      ),
      0
    ),
    1
  ),
  true
);

alter table public.jobs
  alter column id set default format('J-%s', nextval('public.job_number_seq'));
