create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

do $$
declare
  existing_job record;
begin
  for existing_job in
    select jobid from cron.job where jobname = 'slice-push-schedule-reminders'
  loop
    perform cron.unschedule(existing_job.jobid);
  end loop;
end;
$$;

select cron.schedule(
  'slice-push-schedule-reminders',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := 'https://pwfcubzigfjozdjqutbd.supabase.co/functions/v1/push-schedule-reminders',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
