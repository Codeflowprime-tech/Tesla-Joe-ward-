# Supabase setup

The site stores contact and giveaway inquiries in `public.site_submissions` and verified reviews in `public.testimonials`. Run both migrations in timestamp order (`supabase/migrations/20261105000000_site_submissions.sql` followed by `supabase/migrations/20261106000000_admin_chatbot_testimonials.sql`) in the Supabase SQL Editor for your project. Then add the project URL and public anon key to your local `.env` using `.env.example` as a template. Set the same values in the hosting provider's environment configuration before deployment.

The public reviews section reads only records where both `is_verified` and `is_published` are true, ordered newest first, and displays at most three. Add only authentic customer feedback, and publish it through the authorized admin workflow after verification. If the project URL cannot resolve or the table/migration is missing, reviews cannot be loaded; confirm the project URL and apply both migrations.

Only the public anon key is used by the browser. The migration permits visitors to insert consented inquiries, denies public reads and other writes, and limits authenticated reads to accounts with the server-managed `app_metadata.role` value `admin`. Never put a service-role key in a `VITE_` variable or browser bundle.

Use the Supabase project dashboard to review submissions. Create your own account through Supabase Auth, then assign its admin role through a trusted server-side admin workflow or the project's SQL Editor. For example, an authorized project owner can set the role for a known account with:

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
where email = 'your-admin-email@example.com';
```

The app does not contain an admin login or create Supabase accounts. Project ownership credentials must be created and managed in Supabase; they are not stored in this repository.