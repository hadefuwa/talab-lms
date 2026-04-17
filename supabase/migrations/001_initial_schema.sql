-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- ORGANIZATIONS (family units)
-- ============================================
create table public.organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  subscription_status text not null default 'inactive'
    check (subscription_status in ('active', 'inactive', 'trialing')),
  stripe_customer_id text unique,
  created_at timestamptz not null default now()
);

-- ============================================
-- PROFILES (users, linked to auth.users)
-- ============================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  org_id uuid references public.organizations(id) on delete set null,
  role text not null default 'student'
    check (role in ('founder', 'parent', 'student')),
  full_name text not null default '',
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Auto-create profile on sign-up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email, ''),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- COURSES (global curriculum, founder-owned)
-- ============================================
create table public.courses (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  subject_category text not null default 'Other',
  is_published boolean not null default false,
  thumbnail_key text,
  created_at timestamptz not null default now()
);

-- ============================================
-- LESSONS (global content, founder-owned)
-- ============================================
create table public.lessons (
  id uuid primary key default uuid_generate_v4(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  r2_key text,
  content_body text,
  position integer not null default 1,
  duration_seconds integer,
  created_at timestamptz not null default now()
);

create index lessons_course_id_position on public.lessons(course_id, position);

-- ============================================
-- PROGRESS LOGS (per-student, org-scoped)
-- ============================================
create table public.progress_logs (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  org_id uuid not null references public.organizations(id) on delete cascade,
  status text not null default 'not_started'
    check (status in ('not_started', 'in_progress', 'completed')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(student_id, lesson_id)
);

-- ============================================
-- STRIPE EVENTS (idempotency for webhooks)
-- ============================================
create table public.stripe_events (
  id text primary key,
  type text not null,
  processed_at timestamptz not null default now()
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.lessons enable row level security;
alter table public.progress_logs enable row level security;

-- Helper: get calling user's role
create or replace function public.get_my_role()
returns text as $$
  select role from public.profiles where id = auth.uid()
$$ language sql security definer;

-- Helper: get calling user's org_id
create or replace function public.get_my_org_id()
returns uuid as $$
  select org_id from public.profiles where id = auth.uid()
$$ language sql security definer;

-- Profiles: users can read their own; founder reads all
create policy "profiles_select" on public.profiles
  for select using (
    id = auth.uid() or public.get_my_role() = 'founder'
  );

create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid());

-- Organizations: members can see their own org; founder sees all
create policy "orgs_select" on public.organizations
  for select using (
    id = public.get_my_org_id() or public.get_my_role() = 'founder'
  );

create policy "orgs_all_founder" on public.organizations
  for all using (public.get_my_role() = 'founder');

-- Courses: everyone with auth can read published; founder has full access
create policy "courses_select_published" on public.courses
  for select using (
    is_published = true or public.get_my_role() = 'founder'
  );

create policy "courses_all_founder" on public.courses
  for all using (public.get_my_role() = 'founder');

-- Lessons: visible if course is published or user is founder
create policy "lessons_select" on public.lessons
  for select using (
    public.get_my_role() = 'founder'
    or exists (
      select 1 from public.courses c
      where c.id = course_id and c.is_published = true
    )
  );

create policy "lessons_all_founder" on public.lessons
  for all using (public.get_my_role() = 'founder');

-- Progress logs: students see their own; parents see their org; founder sees all
create policy "progress_select" on public.progress_logs
  for select using (
    student_id = auth.uid()
    or org_id = public.get_my_org_id()
    or public.get_my_role() = 'founder'
  );

create policy "progress_insert_own" on public.progress_logs
  for insert with check (student_id = auth.uid());

create policy "progress_update_own" on public.progress_logs
  for update using (student_id = auth.uid());
