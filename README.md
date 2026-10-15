# Life — secure personal life-planning foundation

Calm cream / dusty pink / sage / brown / gold design. React + TypeScript + Tailwind CSS + Supabase.

## What's included (foundation only)

- Sign up with email verification, login, logout, password reset
- Private account settings, secure PKCE sessions, data export, account deletion
- Responsive navigation + calm landing, dashboard, settings
- Supabase schema prepared (empty) for calendar, tasks, projects, goals, notes, journal, cycle
- Row-level security: every table owner-only via `auth.uid()`
- Tests: 8 passing (auth flows, RLS isolation static check, nav/theme)

No future features are built yet — only the schema.

## Setup

1. Create a Supabase project at https://supabase.com
2. In SQL Editor, run in order:
   - `supabase/migrations/0001_profiles.sql`
   - `supabase/migrations/0002_future_tables.sql`
   - `supabase/migrations/0003_rls_policies.sql`
3. In Authentication → Settings, enable **Confirm email** and set Site URL + Redirect URLs to your app URL (e.g. `http://localhost:5173` and your Pages URL).
4. Copy `.env.example` to `.env` and fill `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_APP_URL`.
5. `npm install` then `npm run dev` (or `npm run build` + `npm run preview`).

## Tests

`npm run test` — 8 tests cover signup validation, RLS policy static checks (all 8 tables owner-only, no anon/public permissive policies, isolation self-test present), and responsive nav/theme.

## Auth flows to verify live (needs Supabase connected)

1. Sign up → verify email → log in
2. Wrong password shows friendly error
3. Forgot password → reset link → set new password
4. Dashboard requires login (redirects to /login when logged out)
5. Settings: save display name, export JSON, delete owned rows with DELETE confirm
6. Isolation: create 2 users, confirm neither sees the other's rows (RLS enforces server-side)

## Security notes

- PKCE flow, `persistSession` + `autoRefreshToken`, session detection in URL
- All tables `enable row level security` with `for all to authenticated using (user_id = auth.uid())`
- No service-role key in frontend; deletions of owned rows only via RLS
- Auth user deletion must be done in Supabase dashboard (or edge function with service role)
