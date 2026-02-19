-- Full idempotent executable SQL schema for a multi-tenant AI appointment setter SaaS.
-- This script can be run multiple times without causing errors.

create extension if not exists "pgcrypto";

-- ==========
-- 1. ENUMS & ROLES
-- ==========
do $$ begin
  create type public.user_role as enum ('superadmin', 'tenant_admin', 'customer');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.subscription_status as enum ('trialing', 'active', 'past_due', 'canceled', 'incomplete');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.appointment_status as enum ('pending', 'confirmed', 'cancelled', 'completed', 'no_show');
exception when duplicate_object then null; end $$;

-- ==========
-- 2. CORE TABLES
-- ==========

-- Tenants: The organizations/businesses
create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  admin_email text not null,
  logo_url text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Profiles: The "Users" table for application logic
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid references public.tenants(id) on delete set null,
  role public.user_role not null default 'customer',
  full_name text,
  phone_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- User Settings: Personal preferences
create table if not exists public.user_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  theme text default 'dark',
  notifications_enabled boolean default true,
  language text default 'en',
  updated_at timestamptz default now()
);

-- Tenant Settings: Business-level configuration
create table if not exists public.tenant_settings (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  voice_id text default 'en-US-Neural2-F',
  ai_tone text default 'professional',
  system_prompt text,
  brand_colors jsonb default '{"primary": "#06b6d4", "secondary": "#6366f1"}'::jsonb,
  updated_at timestamptz default now()
);

-- ==========
-- 3. VIEWS
-- ==========

create or replace view public.v_tenant_customers as
select 
  p.id as customer_id,
  p.full_name,
  p.phone_number,
  p.tenant_id,
  u.email
from public.profiles p
join auth.users u on p.id = u.id
where p.role = 'customer';

-- ==========
-- 4. AUTOMATION & FUNCTIONS
-- ==========

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, role, tenant_id)
  values (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'customer'),
    (new.raw_user_meta_data->>'tenant_id')::uuid
  );
    
  insert into public.user_settings (user_id) values (new.id);
  return new;
end;
$$;

-- Idempotent Trigger Creation
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created 
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ==========
-- 5. ACCESS CONTROL (RLS)
-- ==========

alter table public.tenants enable row level security;
alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;
alter table public.tenant_settings enable row level security;

-- Clear existing policies to avoid conflicts on re-run
drop policy if exists "Superadmins bypass RLS" on public.profiles;
drop policy if exists "Tenants see own org" on public.profiles;
drop policy if exists "Customers manage self" on public.profiles;

-- Apply fresh policies
create policy "Superadmins bypass RLS" on public.profiles for all 
  using ((select role from public.profiles where id = auth.uid()) = 'superadmin');

create policy "Tenants see own org" on public.profiles for select
  using (tenant_id = (select tenant_id from public.profiles where id = auth.uid()));

create policy "Customers manage self" on public.profiles for all
  using (auth.uid() = id);
