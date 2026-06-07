alter table public.debt_programs
  add column if not exists settlement_rate numeric(5,4) not null default 0.50
    check (settlement_rate between 0.01 and 1),
  add column if not exists savings_disclosure_accepted_at timestamptz;

alter table public.monthly_savings_plans
  add column if not exists program_id uuid references public.debt_programs(id) on delete cascade,
  add column if not exists month_index integer,
  add column if not exists saved_at timestamptz;

update public.monthly_savings_plans
set status = 'pending'
where status is null or status not in ('pending', 'saved');

alter table public.monthly_savings_plans
  alter column status set default 'pending';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'monthly_savings_plans_status_check'
  ) then
    alter table public.monthly_savings_plans
      add constraint monthly_savings_plans_status_check
      check (status in ('pending', 'saved'));
  end if;
end $$;

create unique index if not exists monthly_savings_plans_program_month_idx
  on public.monthly_savings_plans(program_id, month_index);

create index if not exists monthly_savings_plans_program_id_idx
  on public.monthly_savings_plans(program_id);
