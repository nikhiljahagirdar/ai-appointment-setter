# AI Appointment Setter SaaS (Next.js 16 + Tailwind 4 + Supabase + Stripe)

This project now includes:

- Supabase Auth with OAuth providers: **Google**, **Facebook**, **Apple**.
- Custom user table (`user_profiles`) mapped from `auth.users`.
- Multi-tenant registration with plan assignment and Stripe subscription checkout.
- Monthly/yearly pricing support per plan.
- Superadmin pages for tenants, plans, and analytics.
- Supabase Edge Functions for tenant registration bootstrap, Stripe webhook sync, and analytics sync.

## Key App Flows

1. **Tenant registration + checkout**
   - UI collects tenant info and desired plan interval.
   - `POST /api/tenant/register` creates/updates tenant and starts Stripe subscription checkout.
2. **Availability + booking**
   - `POST /api/availability` checks tenant availability from Supabase.
   - Voice can be enabled/disabled by plan capabilities.
3. **Superadmin controls**
   - `/superadmin/tenants`
   - `/superadmin/plans`
   - `/superadmin/analytics`

## Supabase Setup

Run:

- `supabase/schema.sql`

This creates:

- `platform_plans`
- `tenants`
- `tenant_subscriptions`
- `user_profiles`
- `appointment_slots`
- `tenant_activity`
- `v_tenant_plan_status`
- RLS policies and auth trigger (`handle_new_user`)

## Supabase Auth Provider Setup

In Supabase Dashboard → Authentication → Providers, enable:

- Google
- Facebook
- Apple

Set each provider callback/redirect URL to your deployed app URL and local URL for development.

## Stripe Setup

Create recurring Stripe Prices and set lookup keys:

- `starter-monthly`, `starter-yearly`
- `voice-pro-monthly`, `voice-pro-yearly`
- `ai-agent-monthly`, `ai-agent-yearly`

Set env vars from `.env.example`.

## Supabase Edge Functions

Located in:

- `supabase/functions/create-tenant-registration/index.ts`
- `supabase/functions/stripe-webhook/index.ts`
- `supabase/functions/sync-analytics/index.ts`

Deploy examples:

```bash
supabase functions deploy create-tenant-registration
supabase functions deploy stripe-webhook
supabase functions deploy sync-analytics
```

## Run

```bash
npm install
npm run dev
```

Open:

- Main app: `http://localhost:3000`
- Tenant admin: `http://localhost:3000/admin`
- Superadmin: `http://localhost:3000/superadmin`
