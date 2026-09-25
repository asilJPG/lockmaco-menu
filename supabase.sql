create extension if not exists pgcrypto;

create table if not exists public.loyalty_customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null unique,
  card_number text not null unique,
  balance integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.loyalty_transactions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.loyalty_customers(id) on delete cascade,
  type text not null check (type in ('earn', 'spend', 'adjust')),
  amount integer not null,
  source text,
  external_id text unique,
  status text not null default 'available' check (status in ('pending', 'available', 'cancelled')),
  created_at timestamptz not null default now()
);

create index if not exists loyalty_transactions_customer_id_idx
  on public.loyalty_transactions(customer_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_loyalty_customers_updated_at on public.loyalty_customers;
create trigger set_loyalty_customers_updated_at
before update on public.loyalty_customers
for each row execute function public.set_updated_at();

alter table public.loyalty_customers enable row level security;
alter table public.loyalty_transactions enable row level security;

-- Клиентский сайт ходит через server-side API с SUPABASE_SERVICE_ROLE_KEY.
-- Поэтому публичные RLS-политики здесь не нужны.

-- ==========================================================
-- Аналитика посещений сайта (счётчик)
-- ==========================================================
create table if not exists public.site_visits (
  id bigint generated always as identity primary key,
  visitor_id text not null,
  path text not null default '/',
  created_at timestamptz not null default now()
);

create index if not exists site_visits_created_at_idx on public.site_visits (created_at desc);
create index if not exists site_visits_visitor_created_idx on public.site_visits (visitor_id, created_at desc);

alter table public.site_visits enable row level security;

-- Быстрая агрегация статистики одной функцией
create or replace function public.get_site_stats()
returns jsonb
language plpgsql
security definer
as $$
declare
  v_today_start timestamptz := date_trunc('day', now());
  v_week_start timestamptz := now() - interval '7 days';
  v_month_start timestamptz := now() - interval '30 days';

  v_today_visits int;
  v_today_uniques int;
  v_week_visits int;
  v_week_uniques int;
  v_month_visits int;
  v_month_uniques int;
  v_all_visits int;
begin
  select count(*), count(distinct visitor_id)
  into v_today_visits, v_today_uniques
  from public.site_visits
  where created_at >= v_today_start;

  select count(*), count(distinct visitor_id)
  into v_week_visits, v_week_uniques
  from public.site_visits
  where created_at >= v_week_start;

  select count(*), count(distinct visitor_id)
  into v_month_visits, v_month_uniques
  from public.site_visits
  where created_at >= v_month_start;

  select count(*)
  into v_all_visits
  from public.site_visits;

  return jsonb_build_object(
    'today', jsonb_build_object('visits', v_today_visits, 'uniques', v_today_uniques),
    'week', jsonb_build_object('visits', v_week_visits, 'uniques', v_week_uniques),
    'month', jsonb_build_object('visits', v_month_visits, 'uniques', v_month_uniques),
    'allTime', jsonb_build_object('visits', v_all_visits, 'uniques', v_month_uniques)
  );
end;
$$;

