alter table public.site_submissions
  add column if not exists reply_text text,
  add column if not exists reply_kind text check (reply_kind is null or reply_kind in ('manual', 'ai')),
  add column if not exists reply_approved_at timestamptz,
  add column if not exists reply_status text not null default 'open' check (reply_status in ('open', 'approved'));

grant update (reply_text, reply_kind, reply_approved_at, reply_status)
  on public.site_submissions to authenticated;

create policy "Admins can update inquiry responses"
  on public.site_submissions
  for update
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create table public.chatbot_inquiries (
  id uuid primary key default gen_random_uuid(),
  email text not null check (char_length(btrim(email)) between 3 and 320 and position('@' in email) > 1),
  message text not null check (char_length(btrim(message)) between 1 and 5000),
  created_at timestamptz not null default now(),
  reply_text text,
  reply_kind text check (reply_kind is null or reply_kind in ('manual', 'ai')),
  reply_approved_at timestamptz,
  reply_status text not null default 'open' check (reply_status in ('open', 'approved'))
);

alter table public.chatbot_inquiries enable row level security;
revoke all on public.chatbot_inquiries from anon, authenticated;
grant insert (email, message) on public.chatbot_inquiries to anon, authenticated;
grant select on public.chatbot_inquiries to authenticated;
grant update (reply_text, reply_kind, reply_approved_at, reply_status)
  on public.chatbot_inquiries to authenticated;

create policy "Visitors can create chatbot inquiries"
  on public.chatbot_inquiries
  for insert
  to anon, authenticated
  with check (
    char_length(btrim(email)) between 3 and 320
    and position('@' in email) > 1
    and char_length(btrim(message)) between 1 and 5000
  );

create policy "Admins can read chatbot inquiries"
  on public.chatbot_inquiries
  for select
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "Admins can update chatbot responses"
  on public.chatbot_inquiries
  for update
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  display_name text not null check (char_length(btrim(display_name)) between 1 and 100),
  region text not null default '',
  vehicle_model text not null default '',
  review_text text not null check (char_length(btrim(review_text)) between 1 and 2000),
  rating smallint not null check (rating between 1 and 5),
  review_type text not null check (review_type in ('buyer', 'giveaway')),
  avatar_url text,
  is_verified boolean not null default false,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.testimonials enable row level security;
revoke all on public.testimonials from anon, authenticated;
grant select on public.testimonials to anon, authenticated;
grant insert, update, delete on public.testimonials to authenticated;

create policy "Visitors can read published verified testimonials"
  on public.testimonials
  for select
  to anon, authenticated
  using (is_verified is true and is_published is true);

create policy "Admins can read all testimonials"
  on public.testimonials
  for select
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "Admins can insert testimonials"
  on public.testimonials
  for insert
  to authenticated
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "Admins can update testimonials"
  on public.testimonials
  for update
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "Admins can delete testimonials"
  on public.testimonials
  for delete
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
