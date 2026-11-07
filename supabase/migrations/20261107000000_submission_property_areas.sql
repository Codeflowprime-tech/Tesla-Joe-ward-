alter table public.site_submissions
  add column property_area text,
  add column referral_code text;

alter table public.site_submissions
  add constraint site_submissions_property_area_check
    check (property_area is null or property_area in ('Cyprus', 'United States', 'United Kingdom')),
  add constraint site_submissions_referral_code_check
    check (referral_code is null or referral_code ~ '^[A-Z0-9]{6,12}$');

grant insert (submission_type, name, email, vehicle_model, property_area, message, consented, referral_code)
  on public.site_submissions to anon, authenticated;

drop policy "Visitors can submit inquiries" on public.site_submissions;
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
    and property_area in ('Cyprus', 'United States', 'United Kingdom')
    and (referral_code is null or referral_code ~ '^[A-Z0-9]{6,12}$')
    and char_length(message) <= 5000
  );
