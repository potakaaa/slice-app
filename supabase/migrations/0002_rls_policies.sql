alter table public.profiles enable row level security;
alter table public.creditors enable row level security;
alter table public.debt_programs enable row level security;
alter table public.settlement_scenarios enable row level security;
alter table public.monthly_savings_plans enable row level security;
alter table public.credit_score_history enable row level security;
alter table public.budgets enable row level security;
alter table public.ai_chat_messages enable row level security;
alter table public.negotiation_scripts enable row level security;
alter table public.credit_repair_tasks enable row level security;
alter table public.coaching_bookings enable row level security;
alter table public.subscription_entitlements enable row level security;
alter table public.referrals enable row level security;
alter table public.push_notification_tokens enable row level security;
alter table public.scheduled_notifications enable row level security;
alter table public.audit_security_logs enable row level security;
alter table public.rate_limits enable row level security;

create policy "profiles select own" on public.profiles
for select to authenticated using (id = (select auth.uid()));

create policy "profiles insert own" on public.profiles
for insert to authenticated with check (id = (select auth.uid()));

create policy "profiles update own" on public.profiles
for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "profiles delete own" on public.profiles
for delete to authenticated using (id = (select auth.uid()));

create policy "creditors own select" on public.creditors for select to authenticated using (user_id = (select auth.uid()));
create policy "creditors own insert" on public.creditors for insert to authenticated with check (user_id = (select auth.uid()));
create policy "creditors own update" on public.creditors for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "creditors own delete" on public.creditors for delete to authenticated using (user_id = (select auth.uid()));

create policy "debt_programs own select" on public.debt_programs for select to authenticated using (user_id = (select auth.uid()));
create policy "debt_programs own insert" on public.debt_programs for insert to authenticated with check (user_id = (select auth.uid()));
create policy "debt_programs own update" on public.debt_programs for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "debt_programs own delete" on public.debt_programs for delete to authenticated using (user_id = (select auth.uid()));

create policy "settlement_scenarios own select" on public.settlement_scenarios for select to authenticated using (user_id = (select auth.uid()));
create policy "settlement_scenarios own insert" on public.settlement_scenarios for insert to authenticated with check (user_id = (select auth.uid()));
create policy "settlement_scenarios own update" on public.settlement_scenarios for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "settlement_scenarios own delete" on public.settlement_scenarios for delete to authenticated using (user_id = (select auth.uid()));

create policy "monthly_savings_plans own select" on public.monthly_savings_plans for select to authenticated using (user_id = (select auth.uid()));
create policy "monthly_savings_plans own insert" on public.monthly_savings_plans for insert to authenticated with check (user_id = (select auth.uid()));
create policy "monthly_savings_plans own update" on public.monthly_savings_plans for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "monthly_savings_plans own delete" on public.monthly_savings_plans for delete to authenticated using (user_id = (select auth.uid()));

create policy "credit_score_history own select" on public.credit_score_history for select to authenticated using (user_id = (select auth.uid()));
create policy "credit_score_history own insert" on public.credit_score_history for insert to authenticated with check (user_id = (select auth.uid()));
create policy "credit_score_history own update" on public.credit_score_history for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "credit_score_history own delete" on public.credit_score_history for delete to authenticated using (user_id = (select auth.uid()));

create policy "budgets own select" on public.budgets for select to authenticated using (user_id = (select auth.uid()));
create policy "budgets own insert" on public.budgets for insert to authenticated with check (user_id = (select auth.uid()));
create policy "budgets own update" on public.budgets for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "budgets own delete" on public.budgets for delete to authenticated using (user_id = (select auth.uid()));

create policy "ai_chat_messages own select" on public.ai_chat_messages for select to authenticated using (user_id = (select auth.uid()));
create policy "negotiation_scripts own select" on public.negotiation_scripts for select to authenticated using (user_id = (select auth.uid()));
create policy "credit_repair_tasks own select" on public.credit_repair_tasks for select to authenticated using (user_id = (select auth.uid()));
create policy "credit_repair_tasks own update" on public.credit_repair_tasks for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "coaching_bookings own select" on public.coaching_bookings for select to authenticated using (user_id = (select auth.uid()));

create policy "subscription_entitlements own select" on public.subscription_entitlements for select to authenticated using (user_id = (select auth.uid()));

create policy "referrals own select" on public.referrals for select to authenticated using (user_id = (select auth.uid()));
create policy "referrals own insert" on public.referrals for insert to authenticated with check (user_id = (select auth.uid()));

create policy "push_tokens own select" on public.push_notification_tokens for select to authenticated using (user_id = (select auth.uid()));
create policy "push_tokens own insert" on public.push_notification_tokens for insert to authenticated with check (user_id = (select auth.uid()));
create policy "push_tokens own update" on public.push_notification_tokens for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "push_tokens own delete" on public.push_notification_tokens for delete to authenticated using (user_id = (select auth.uid()));

create policy "scheduled_notifications own select" on public.scheduled_notifications for select to authenticated using (user_id = (select auth.uid()));
create policy "scheduled_notifications own insert" on public.scheduled_notifications for insert to authenticated with check (user_id = (select auth.uid()));
create policy "scheduled_notifications own update" on public.scheduled_notifications for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "scheduled_notifications own delete" on public.scheduled_notifications for delete to authenticated using (user_id = (select auth.uid()));

create policy "audit_security_logs own select" on public.audit_security_logs
for select to authenticated using (user_id = (select auth.uid()));

create policy "rate_limits own select" on public.rate_limits
for select to authenticated using (user_id = (select auth.uid()));

grant usage on schema public to authenticated;
grant select, insert, update, delete on
  public.profiles,
  public.creditors,
  public.debt_programs,
  public.settlement_scenarios,
  public.monthly_savings_plans,
  public.credit_score_history,
  public.budgets,
  public.referrals,
  public.push_notification_tokens,
  public.scheduled_notifications
to authenticated;

grant select on
  public.ai_chat_messages,
  public.negotiation_scripts,
  public.credit_repair_tasks,
  public.coaching_bookings,
  public.subscription_entitlements,
  public.audit_security_logs,
  public.rate_limits
to authenticated;

grant update on public.credit_repair_tasks to authenticated;
