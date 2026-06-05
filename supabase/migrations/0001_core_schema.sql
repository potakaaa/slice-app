create extension if not exists pgcrypto;

do $$ begin
  create type public.subscription_tier as enum ('free','silver','gold','platinum');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.creditor_status as enum ('active','negotiating','settled','closed');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.booking_status as enum ('pending','confirmed','completed','cancelled');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.ai_message_role as enum ('user','assistant','system');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.audit_severity as enum ('info','warning','critical');
exception when duplicate_object then null;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  primary_goal text check (primary_goal in ('settle','repair','prepare','payoff')),
  credit_score integer check (credit_score between 300 and 850),
  default_settlement_percentage numeric(5,4) default 0.50 check (default_settlement_percentage between 0.01 and 1),
  default_monthly_savings numeric(12,2) default 0 check (default_monthly_savings >= 0),
  tier public.subscription_tier not null default 'free',
  revenuecat_app_user_id text unique,
  privacy_policy_version text,
  privacy_policy_accepted_at timestamptz,
  terms_version text,
  terms_accepted_at timestamptz,
  marketing_emails_enabled boolean not null default false,
  transactional_emails_enabled boolean not null default true,
  push_enabled boolean not null default false,
  onboarding_complete boolean not null default false,
  deletion_requested_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.creditors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  phone text,
  balance numeric(12,2) not null check (balance >= 0),
  settlement_percentage numeric(5,4) not null check (settlement_percentage between 0.01 and 1),
  monthly_savings numeric(12,2) not null default 0 check (monthly_savings >= 0),
  status public.creditor_status not null default 'active',
  priority integer not null default 0,
  notes text,
  account_last4 text check (account_last4 is null or account_last4 ~ '^[0-9]{4}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.debt_programs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  total_debt numeric(12,2) not null default 0,
  target_settlement_amount numeric(12,2) not null default 0,
  monthly_savings numeric(12,2) not null default 0,
  estimated_months integer not null default 0,
  disclaimer_version text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.settlement_scenarios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  creditor_id uuid references public.creditors(id) on delete cascade,
  offer_percentage numeric(5,4) not null check (offer_percentage between 0.01 and 1),
  offer_amount numeric(12,2) not null check (offer_amount >= 0),
  estimated_savings numeric(12,2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.monthly_savings_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  creditor_id uuid references public.creditors(id) on delete cascade,
  monthly_amount numeric(12,2) not null check (monthly_amount >= 0),
  target_date date,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.credit_score_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  score integer not null check (score between 300 and 850),
  source text,
  recorded_on date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  month date not null,
  income numeric(12,2) not null default 0,
  essentials numeric(12,2) not null default 0,
  debt_savings numeric(12,2) not null default 0,
  discretionary numeric(12,2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, month)
);

create table if not exists public.ai_chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null default 'gemini',
  feature text not null,
  role public.ai_message_role not null,
  content text not null,
  redacted_context jsonb not null default '{}'::jsonb,
  tokens_used integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.negotiation_scripts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  creditor_id uuid references public.creditors(id) on delete set null,
  tone text not null,
  script jsonb not null,
  provider text not null default 'gemini',
  model text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.credit_repair_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  category text not null,
  description text,
  completed_at timestamptz,
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.coaching_bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  tier_at_booking public.subscription_tier not null,
  topic text not null,
  notes text,
  calendly_event_uri text,
  status public.booking_status not null default 'pending',
  starts_at timestamptz,
  priority boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscription_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  tier public.subscription_tier not null,
  source text not null default 'revenuecat',
  revenuecat_product_id text,
  revenuecat_app_user_id text,
  expires_at timestamptz,
  raw_event jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  code text not null unique,
  referred_by_user_id uuid references public.profiles(id) on delete set null,
  redeemed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.push_notification_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  expo_token text not null,
  platform text not null check (platform in ('ios','android','web')),
  enabled boolean not null default true,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, expo_token)
);

create table if not exists public.scheduled_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  scheduled_for timestamptz not null,
  sent_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_security_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  actor_type text not null default 'user',
  action text not null,
  severity public.audit_severity not null default 'info',
  ip_hash text,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.rate_limits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  feature text not null,
  window_start date not null default current_date,
  count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, feature, window_start)
);

create index if not exists creditors_user_id_idx on public.creditors(user_id);
create index if not exists ai_chat_messages_user_feature_idx on public.ai_chat_messages(user_id, feature, created_at desc);
create index if not exists scheduled_notifications_due_idx on public.scheduled_notifications(scheduled_for) where sent_at is null and cancelled_at is null;
create index if not exists subscription_entitlements_user_idx on public.subscription_entitlements(user_id, created_at desc);

create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger creditors_updated_at before update on public.creditors for each row execute function public.set_updated_at();
create trigger debt_programs_updated_at before update on public.debt_programs for each row execute function public.set_updated_at();
create trigger settlement_scenarios_updated_at before update on public.settlement_scenarios for each row execute function public.set_updated_at();
create trigger monthly_savings_plans_updated_at before update on public.monthly_savings_plans for each row execute function public.set_updated_at();
create trigger credit_score_history_updated_at before update on public.credit_score_history for each row execute function public.set_updated_at();
create trigger budgets_updated_at before update on public.budgets for each row execute function public.set_updated_at();
create trigger ai_chat_messages_updated_at before update on public.ai_chat_messages for each row execute function public.set_updated_at();
create trigger negotiation_scripts_updated_at before update on public.negotiation_scripts for each row execute function public.set_updated_at();
create trigger credit_repair_tasks_updated_at before update on public.credit_repair_tasks for each row execute function public.set_updated_at();
create trigger coaching_bookings_updated_at before update on public.coaching_bookings for each row execute function public.set_updated_at();
create trigger subscription_entitlements_updated_at before update on public.subscription_entitlements for each row execute function public.set_updated_at();
create trigger referrals_updated_at before update on public.referrals for each row execute function public.set_updated_at();
create trigger push_notification_tokens_updated_at before update on public.push_notification_tokens for each row execute function public.set_updated_at();
create trigger scheduled_notifications_updated_at before update on public.scheduled_notifications for each row execute function public.set_updated_at();
create trigger audit_security_logs_updated_at before update on public.audit_security_logs for each row execute function public.set_updated_at();
create trigger rate_limits_updated_at before update on public.rate_limits for each row execute function public.set_updated_at();
