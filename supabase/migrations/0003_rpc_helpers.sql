create or replace function public.current_user_tier()
returns public.subscription_tier
language sql
stable
security invoker
as $$
  select coalesce((select tier from public.profiles where id = auth.uid()), 'free'::public.subscription_tier);
$$;

create or replace function public.tier_rank(tier public.subscription_tier)
returns integer
language sql
immutable
security invoker
as $$
  select case tier
    when 'free' then 0
    when 'silver' then 1
    when 'gold' then 2
    when 'platinum' then 3
  end;
$$;

create or replace function public.has_min_tier(required_tier public.subscription_tier)
returns boolean
language sql
stable
security invoker
as $$
  select public.tier_rank(public.current_user_tier()) >= public.tier_rank(required_tier);
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;
