-- Photos taken on site are stored like other job files, but marked as photos
-- so the app can show them as a photo gallery instead of a file list.
-- Safe to run more than once.

alter table public.job_files
  add column if not exists kind text not null default 'file';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'job_files_kind_check') then
    alter table public.job_files add constraint job_files_kind_check check (kind in ('file', 'photo'));
  end if;
end;
$$;

notify pgrst, 'reload schema';
