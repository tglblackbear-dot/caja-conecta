create extension if not exists pgcrypto;

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 90),
  business_name text not null check (char_length(business_name) between 2 and 100),
  description text not null check (char_length(description) between 10 and 1200),
  category text not null check (category in (
    'Manutenção e Reformas',
    'Gastronomia e Sabores Locais',
    'Beleza e Estilo',
    'Automotivo',
    'Fretes e Motoboy',
    'Assistência Técnica',
    'Saúde e Bem-Estar',
    'Eventos',
    'Cultura e Educação',
    'Comércio e Utilidades'
  )),
  neighborhood text not null check (neighborhood in (
    'Cajazeiras II', 'Cajazeiras IV', 'Cajazeiras V', 'Cajazeiras VI',
    'Cajazeiras VII', 'Cajazeiras VIII', 'Cajazeiras X', 'Cajazeiras XI',
    'Fazendas Grandes I', 'Fazendas Grandes II', 'Fazendas Grandes III',
    'Fazendas Grandes IV', 'Águas Claras', 'Boca da Mata', 'Palestina'
  )),
  whatsapp text check (whatsapp is null or whatsapp ~ '^[0-9]{8,15}$'),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create index if not exists listings_approved_created_at_idx
  on public.listings (created_at desc)
  where status = 'approved';

alter table public.listings enable row level security;

drop policy if exists "Anyone can read approved listings" on public.listings;
create policy "Anyone can read approved listings"
  on public.listings
  for select
  to anon, authenticated
  using (status = 'approved');

revoke all on public.listings from anon, authenticated;
grant select on public.listings to anon, authenticated;

create table if not exists public.merchant_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 100),
  business_name text not null check (char_length(business_name) between 2 and 100),
  phone text not null check (phone ~ '^[0-9]{8,15}$'),
  category text not null check (category in (
    'Manutenção e Reformas',
    'Gastronomia e Sabores Locais',
    'Beleza e Estilo',
    'Automotivo',
    'Fretes e Motoboy',
    'Assistência Técnica',
    'Saúde e Bem-Estar',
    'Eventos',
    'Cultura e Educação',
    'Comércio e Utilidades'
  )),
  neighborhood text not null check (neighborhood in (
    'Cajazeiras II', 'Cajazeiras IV', 'Cajazeiras V', 'Cajazeiras VI',
    'Cajazeiras VII', 'Cajazeiras VIII', 'Cajazeiras X', 'Cajazeiras XI',
    'Fazendas Grandes I', 'Fazendas Grandes II', 'Fazendas Grandes III',
    'Fazendas Grandes IV', 'Águas Claras', 'Boca da Mata', 'Palestina'
  )),
  whatsapp text check (whatsapp is null or whatsapp ~ '^[0-9]{8,15}$'),
  description text check (description is null or char_length(description) <= 500),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

alter table public.merchant_profiles enable row level security;
revoke all on public.merchant_profiles from anon, authenticated;
grant select on public.merchant_profiles to authenticated;

drop policy if exists "Merchants can read their own profile" on public.merchant_profiles;
create policy "Merchants can read their own profile"
  on public.merchant_profiles
  for select
  to authenticated
  using (auth.uid() = id);

create or replace function public.handle_new_merchant()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.raw_user_meta_data ->> 'account_type' is distinct from 'merchant' then
    return new;
  end if;

  insert into public.merchant_profiles (
    id, full_name, business_name, phone, category, neighborhood, whatsapp, description
  )
  values (
    new.id,
    btrim(new.raw_user_meta_data ->> 'full_name'),
    btrim(new.raw_user_meta_data ->> 'business_name'),
    regexp_replace(coalesce(new.raw_user_meta_data ->> 'phone', ''), '[^0-9]', '', 'g'),
    new.raw_user_meta_data ->> 'category',
    new.raw_user_meta_data ->> 'neighborhood',
    nullif(regexp_replace(coalesce(new.raw_user_meta_data ->> 'whatsapp', ''), '[^0-9]', '', 'g'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'description'), '')
  );
  return new;
end;
$$;

revoke all on function public.handle_new_merchant() from public, anon, authenticated;
drop trigger if exists on_auth_user_created_merchant on auth.users;
create trigger on_auth_user_created_merchant
  after insert on auth.users
  for each row execute function public.handle_new_merchant();
