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
