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
