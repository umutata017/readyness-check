-- Storage objects must be removed through the Storage API, not by deleting
-- directly from storage.objects. The client performs that cleanup before
-- calling reset_demo_data().
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
