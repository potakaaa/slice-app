create index if not exists audit_security_logs_user_id_idx on public.audit_security_logs(user_id);
create index if not exists coaching_bookings_user_id_idx on public.coaching_bookings(user_id);
create index if not exists credit_repair_tasks_user_id_idx on public.credit_repair_tasks(user_id);
create index if not exists credit_score_history_user_id_idx on public.credit_score_history(user_id);
create index if not exists debt_programs_user_id_idx on public.debt_programs(user_id);
create index if not exists monthly_savings_plans_user_id_idx on public.monthly_savings_plans(user_id);
create index if not exists monthly_savings_plans_creditor_id_idx on public.monthly_savings_plans(creditor_id);
create index if not exists negotiation_scripts_user_id_idx on public.negotiation_scripts(user_id);
create index if not exists negotiation_scripts_creditor_id_idx on public.negotiation_scripts(creditor_id);
create index if not exists referrals_user_id_idx on public.referrals(user_id);
create index if not exists referrals_referred_by_user_id_idx on public.referrals(referred_by_user_id);
create index if not exists scheduled_notifications_user_id_idx on public.scheduled_notifications(user_id);
create index if not exists settlement_scenarios_user_id_idx on public.settlement_scenarios(user_id);
create index if not exists settlement_scenarios_creditor_id_idx on public.settlement_scenarios(creditor_id);

create or replace function public.seed_default_credit_repair_tasks(target_user_id uuid)
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  insert into public.credit_repair_tasks (user_id, title, category, description)
  select target_user_id, task.title, task.category, task.description
  from (
    values
      ('Request your free credit report from AnnualCreditReport.com', 'Report', 'Use AnnualCreditReport.com to review your report.'),
      ('Review report for errors or inaccurate items', 'Report', 'Look for inaccurate balances, dates, ownership, or collection reporting.'),
      ('Dispute any inaccurate items in writing', 'Dispute', 'Send clear written disputes with documentation to the credit bureaus.'),
      ('Get settlement agreement in writing before paying', 'Settlement', 'Keep written terms before sending money to any creditor or collector.'),
      ('Ask creditor to update credit reporting after settlement', 'Settlement', 'Ask how the account will be reported after payment.'),
      ('Keep copies of all settlement letters and confirmations', 'Documentation', 'Store settlement letters, receipts, emails, and payoff confirmations.'),
      ('Track all calls with date and representative name', 'Documentation', 'Record the date, number called, representative name, and next steps.'),
      ('Monitor account status after each payment', 'Monitoring', 'Verify the creditor marks the account according to the written agreement.'),
      ('Review your credit score monthly', 'Monitoring', 'Track credit score changes as accounts update.'),
      ('Set up a dedicated savings account for settlements', 'Planning', 'Keep settlement savings separate from day-to-day spending.')
  ) as task(title, category, description)
  where not exists (
    select 1
    from public.credit_repair_tasks existing
    where existing.user_id = target_user_id
      and existing.title = task.title
  );
$$;

revoke execute on function public.seed_default_credit_repair_tasks(uuid) from public, anon, authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')
  )
  on conflict (id) do nothing;

  perform public.seed_default_credit_repair_tasks(new.id);

  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

select public.seed_default_credit_repair_tasks(id)
from public.profiles;
