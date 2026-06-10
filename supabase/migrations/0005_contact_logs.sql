-- Creditor contact logs: a record of each call/contact with a creditor and its
-- outcome. Powers "last contact result", call history, and follow-up reminders
-- on the creditor detail screen. Written and read directly by the authenticated
-- client (RLS-protected), mirroring the creditors table pattern.
create table if not exists public.creditor_contact_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  creditor_id uuid not null references public.creditors(id) on delete cascade,
  contact_date timestamptz not null default now(),
  outcome text not null,
  amount_offered numeric(12,2) check (amount_offered >= 0),
  follow_up_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists creditor_contact_logs_creditor_idx
  on public.creditor_contact_logs (creditor_id, contact_date desc);

alter table public.creditor_contact_logs enable row level security;

create policy "creditor_contact_logs own select" on public.creditor_contact_logs
  for select to authenticated using (user_id = (select auth.uid()));
create policy "creditor_contact_logs own insert" on public.creditor_contact_logs
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "creditor_contact_logs own update" on public.creditor_contact_logs
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "creditor_contact_logs own delete" on public.creditor_contact_logs
  for delete to authenticated using (user_id = (select auth.uid()));

grant select, insert, update, delete on public.creditor_contact_logs to authenticated;

create trigger creditor_contact_logs_updated_at
  before update on public.creditor_contact_logs
  for each row execute function public.set_updated_at();
