# AI Appointment Setter (Next.js 16 + Tailwind 4 + Supabase + Stripe)

Multi-tenant appointment setter with plan-based AI/voice controls, Stripe subscription checkout, and an admin dashboard for tenant activity.

## What’s included

- **Next.js 16 App Router** with Tailwind CSS v4.
- **Framer Motion** animations for plan cards and booking UX.
- **Tenant-aware booking** (`tenantSlug`) so each tenant has isolated slots.
- **Plan guardrails** (Starter, Voice Pro, AI Agent) to enable/disable AI and voice by subscription tier.
- **Supabase availability API** at `POST /api/availability`.
- **Stripe checkout API** at `POST /api/stripe/checkout` (subscription mode).
- **Admin panel** at `/admin` to inspect tenant plans and activity logs.
- **Full SQL schema** in `supabase/schema.sql` for tenants, plans, subscriptions, slots, and activity.

## SQL setup (Supabase)

Run this file in Supabase SQL editor:

- `supabase/schema.sql`

It creates:

- `platform_plans`
- `tenants`
- `tenant_subscriptions`
- `appointment_slots`
- `tenant_activity`
- `v_tenant_plan_status`

And seeds a demo tenant:

- slug: `demo-clinic`

## Stripe setup

1. Create recurring prices in Stripe and set these lookup keys:
   - `starter-monthly`
   - `voice-pro-monthly`
   - `ai-agent-monthly`
2. Set env vars from `.env.example` into `.env.local`.
3. Use the **Pay plan with Stripe** button in the app.

## Run

```bash
npm install
npm run dev
```

Open:

- App: `http://localhost:3000`
- Admin: `http://localhost:3000/admin`
# AI Voice Appointment Setter (Next.js 16 + Supabase)

A plan-aware appointment booking app with:

- Next.js 16 App Router
- Tailwind CSS 4 styling
- Motion animations (`motion` package)
- Supabase availability search + booking API
- AI voice booking gates based on subscription plan

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create your environment file:

```bash
cp .env.example .env.local
```

3. Add Supabase credentials to `.env.local`.

4. Create an `appointment_slots` table in Supabase:

```sql
create table if not exists appointment_slots (
  id uuid primary key default gen_random_uuid(),
  starts_at timestamptz not null,
  provider_name text not null,
  is_available boolean not null default true
);
```

5. Run locally:

```bash
npm run dev
```

## Plan behavior

- **Starter**: availability search + manual flow, AI voice disabled.
- **Pro Voice AI**: includes voice-assisted booking endpoint.
