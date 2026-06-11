-- Debt-free video academy for the marketing website.
-- Adds the `course_videos` metadata table and a private `course-videos`
-- storage bucket. The website reads this with the service-role key and mints
-- short-lived signed URLs after checking the user's tier (graduated unlock:
-- Free=L1, Silver=L2, Gold=L4, Platinum=all). Nothing here is exposed to the
-- anon/authenticated roles, so `storage_path` never leaves the server.

create table if not exists public.course_videos (
  id uuid primary key default gen_random_uuid(),
  level integer not null check (level >= 1),
  sort_order integer not null default 0,
  title text not null,
  description text,
  storage_path text not null,
  duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists course_videos_level_idx
  on public.course_videos(level, sort_order);

create trigger course_videos_updated_at
  before update on public.course_videos
  for each row execute function public.set_updated_at();

-- RLS on, with NO anon/authenticated policies: only the service role (used by
-- the website's server functions) can read rows. Keeps `storage_path` private.
alter table public.course_videos enable row level security;

grant all on public.course_videos to service_role;

-- Private bucket — playback is only possible via a service-role signed URL.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'course-videos',
  'course-videos',
  false,
  5368709120, -- 5 GB
  array['video/mp4', 'video/webm', 'video/quicktime']
)
on conflict (id) do nothing;

-- Seed the initial curriculum (only when the table is empty, so re-running is
-- safe). Upload matching files to the `course-videos` bucket at these paths.
insert into public.course_videos (level, sort_order, title, description, storage_path, duration_seconds)
select v.level, v.sort_order, v.title, v.description, v.storage_path, v.duration_seconds
from (
  values
    (1, 1, 'Facing Your Debt Without Fear',
        'Get honest about what you owe and why a DIY settlement plan beats paying a settlement company 25%.',
        'level-1/facing-your-debt.mp4', 480),
    (1, 2, 'How Debt Settlement Actually Works',
        'The mechanics of settling for 30–70% — who you negotiate with, and what creditors are really willing to accept.',
        'level-1/how-settlement-works.mp4', 540),
    (2, 1, 'Building Your Settlement Plan',
        'Turn your creditor list into a month-by-month savings target and a realistic payoff timeline.',
        'level-2/building-your-plan.mp4', 600),
    (3, 1, 'Making Your First Offer',
        'Scripts, timing, and tone for that first call — and how to counter when a creditor pushes back.',
        'level-3/making-your-first-offer.mp4', 660),
    (4, 1, 'Getting Every Settlement in Writing',
        'Never send a dollar without written terms. How to confirm settlements and protect yourself.',
        'level-4/settlements-in-writing.mp4', 420),
    (5, 1, 'Rebuilding Credit & Staying Debt-Free',
        'After the last settlement: repairing your credit, building a buffer, and never going back into the hole.',
        'level-5/rebuilding-credit.mp4', 720)
) as v(level, sort_order, title, description, storage_path, duration_seconds)
where not exists (select 1 from public.course_videos);
