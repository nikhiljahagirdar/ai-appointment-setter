-- Full executable SQL schema for multi-tenant AI appointment setter with auth and billing.
-- Run in Supabase SQL editor.

create extension if not exists "pgcrypto";

-- =====================
-- Plans + tenant billing
-- =====================
create table if not exists public.platform_plans (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  monthly_price_cents integer not null check (monthly_price_cents >= 0),
  yearly_price_cents integer not null check (yearly_price_cents >= 0),
  ai_enabled boolean not null default false,
  voice_enabled boolean not null default false,
  max_monthly_bookings integer not null default 100,
  stripe_monthly_price_lookup_key text,
  stripe_yearly_price_lookup_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.platform_plans (
  code,
  name,
  monthly_price_cents,
  yearly_price_cents,
  ai_enabled,
  voice_enabled,
  max_monthly_bookings,
  stripe_monthly_price_lookup_key,
  stripe_yearly_price_lookup_key
)
values
  ('starter', 'Starter', 2900, 29000, false, false, 100, 'starter-monthly', 'starter-yearly'),
  ('voice-pro', 'Voice Pro', 9900, 99000, false, true, 500, 'voice-pro-monthly', 'voice-pro-yearly'),
  ('ai-agent', 'AI Agent', 24900, 249000, true, true, 2000, 'ai-agent-monthly', 'ai-agent-yearly')
on conflict (code) do nothing;

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  admin_email text not null,
  timezone text not null default 'UTC',
  stripe_customer_id text unique,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tenant_subscriptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  plan_id uuid not null references public.platform_plans(id),
  billing_interval text not null default 'month' check (billing_interval in ('month', 'year')),
  status text not null default 'trialing' check (status in ('trialing', 'active', 'past_due', 'canceled')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  stripe_subscription_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id)
);

-- =====================
-- Auth + custom users
-- =====================
create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  avatar_url text,
  provider text,
  is_superadmin boolean not null default false,
  tenant_id uuid references public.tenants(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (id, email, full_name, avatar_url, provider)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', ''),
    coalesce(new.app_metadata ->> 'provider', 'email')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- =====================
-- Booking + activity
-- =====================
create table if not exists public.appointment_slots (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  date date not null,
  time text not null,
  is_booked boolean not null default false,
  booked_by_name text,
  booked_by_phone text,
  booked_at timestamptz,
  booked_by_user_id uuid references public.user_profiles(id) on delete set null,
  unique (tenant_id, date, time)
);

create index if not exists idx_appointment_slots_tenant_date on public.appointment_slots(tenant_id, date);

create table if not exists public.tenant_activity (
  id bigint generated always as identity primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  actor text not null default 'system',
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_tenant_activity_tenant_created on public.tenant_activity(tenant_id, created_at desc);

-- =====================
-- Utility functions/triggers/views
-- =====================
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_platform_plans_updated_at on public.platform_plans;
create trigger set_platform_plans_updated_at before update on public.platform_plans
for each row execute procedure public.touch_updated_at();

drop trigger if exists set_tenants_updated_at on public.tenants;
create trigger set_tenants_updated_at before update on public.tenants
for each row execute procedure public.touch_updated_at();

drop trigger if exists set_tenant_subscriptions_updated_at on public.tenant_subscriptions;
create trigger set_tenant_subscriptions_updated_at before update on public.tenant_subscriptions
for each row execute procedure public.touch_updated_at();

drop trigger if exists set_user_profiles_updated_at on public.user_profiles;
create trigger set_user_profiles_updated_at before update on public.user_profiles
for each row execute procedure public.touch_updated_at();

create or replace view public.v_tenant_plan_status as
select
  t.id as tenant_id,
  t.slug,
  t.name,
  t.admin_email,
  t.active,
  ts.status as subscription_status,
  ts.billing_interval,
  pp.code as plan_code,
  pp.name as plan_name,
  pp.ai_enabled,
  pp.voice_enabled,
  pp.monthly_price_cents,
  pp.yearly_price_cents,
  ts.current_period_end
from public.tenants t
left join public.tenant_subscriptions ts on ts.tenant_id = t.id
left join public.platform_plans pp on pp.id = ts.plan_id;

-- =====================
-- RLS
-- =====================
alter table public.user_profiles enable row level security;
alter table public.appointment_slots enable row level security;
alter table public.tenant_activity enable row level security;
alter table public.tenants enable row level security;
alter table public.tenant_subscriptions enable row level security;

create policy "users_can_read_own_profile"
  on public.user_profiles for select
  using (auth.uid() = id);

create policy "users_can_update_own_profile"
  on public.user_profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "tenant_users_can_read_slots"
  on public.appointment_slots for select
  using (
    exists (
      select 1 from public.user_profiles up
      where up.id = auth.uid() and up.tenant_id = appointment_slots.tenant_id
    )
  );

create policy "tenant_users_can_read_activity"
  on public.tenant_activity for select
  using (
    exists (
      select 1 from public.user_profiles up
      where up.id = auth.uid() and up.tenant_id = tenant_activity.tenant_id
    )
  );

-- =====================
-- Seed demo tenant + slots + superadmin
-- =====================
with seeded_tenant as (
  insert into public.tenants (slug, name, admin_email, timezone)
  values ('demo-clinic', 'Demo Clinic', 'owner@demo-clinic.com', 'America/New_York')
  on conflict (slug) do update set name = excluded.name
  returning id
), seeded_plan as (
  select id from public.platform_plans where code = 'voice-pro' limit 1
)
insert into public.tenant_subscriptions (tenant_id, plan_id, status, billing_interval)
select st.id, sp.id, 'active', 'month'
from seeded_tenant st cross join seeded_plan sp
on conflict (tenant_id) do nothing;

with st as (select id from public.tenants where slug = 'demo-clinic' limit 1)
insert into public.appointment_slots (tenant_id, date, time)
select st.id, current_date + 1, slot_time
from st, unnest(array['09:00', '10:30', '13:00', '15:30']) as slot_time
on conflict (tenant_id, date, time) do nothing;

insert into public.tenant_activity (tenant_id, actor, action, metadata)
select id, 'system', 'tenant_seeded', jsonb_build_object('source', 'schema.sql')
from public.tenants where slug = 'demo-clinic';
