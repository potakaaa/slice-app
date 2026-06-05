alter function public.set_updated_at() set search_path = public, pg_temp;
alter function public.current_user_tier() set search_path = public, auth, pg_temp;
alter function public.tier_rank(public.subscription_tier) set search_path = public, pg_temp;
alter function public.has_min_tier(public.subscription_tier) set search_path = public, auth, pg_temp;
