-- Defence in depth for applicant PII in rust_scholarship_applications.
-- The public form only needs INSERT (it uses Prefer: return=minimal), and the admin page
-- reads/updates through server functions using the service role, which bypasses these grants.
-- The app does not use Supabase Auth, so the "authenticated" role is never a real admin.

alter table public.rust_scholarship_applications enable row level security;

revoke select, update, delete on public.rust_scholarship_applications from anon, authenticated;
