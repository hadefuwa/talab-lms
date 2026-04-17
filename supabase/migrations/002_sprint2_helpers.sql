-- Helper function for invite flow: look up user ID by email
create or replace function public.get_user_id_by_email(email_input text)
returns uuid as $$
  select id from auth.users where email = email_input limit 1
$$ language sql security definer;

-- Allow parents to update students in their own org
create policy "profiles_update_org_members" on public.profiles
  for update using (
    org_id = public.get_my_org_id()
    and public.get_my_role() in ('parent', 'founder')
  );

-- Allow parents/founder to insert progress on behalf of org
create policy "progress_insert_org" on public.progress_logs
  for insert with check (
    org_id = public.get_my_org_id()
    or public.get_my_role() = 'founder'
  );

-- Stripe events: only service role can insert (webhook uses service key)
alter table public.stripe_events enable row level security;

create policy "stripe_events_service_only" on public.stripe_events
  for all using (false);
