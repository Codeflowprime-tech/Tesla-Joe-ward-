create table public.site_submissions (
  id uuid primary key default gen_random_uuid(),
  submission_type text not null check (submission_type in ('contact', 'giveaway')),
  name text not null check (char_length(btrim(name)) between 1 and 120),
  email text not null check (char_length(btrim(email)) between 3 and 320 and position('@' in email) > 1),
  vehicle_model text check (vehicle_model is null or char_length(vehicle_model) <= 80),
  message text not null default '' check (char_length(message) <= 5000),
  consented boolean not null check (consented is true),
  created_at timestamptz not null default now()
);

alter table public.site_submissions enable row level security;

revoke all on public.site_submissions from anon, authenticated;
grant insert (submission_type, name, email, vehicle_model, message, consented)
  on public.site_submissions to anon, authenticated;
grant select on public.site_submissions to authenticated;

create policy "Visitors can submit inquiries"
  on public.site_submissions
  for insert
  to anon, authenticated
  with check (
    submission_type in ('contact', 'giveaway')
    and consented is true
    and char_length(btrim(name)) between 1 and 120
    and char_length(btrim(email)) between 3 and 320
    and position('@' in email) > 1
    and (vehicle_model is null or char_length(vehicle_model) <= 80)
    and char_length(message) <= 5000
  );

create policy "Admins can read inquiries"
  on public.site_submissions
  for select
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');