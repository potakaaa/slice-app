-- Settlement fund: how much cash the user has already saved toward their
-- first settlement offer. Reused by the settlement-readiness engine alongside
-- the existing default_monthly_savings (the monthly set-aside).
alter table public.profiles
  add column if not exists current_saved_cash numeric(12,2) not null default 0
    check (current_saved_cash >= 0);
