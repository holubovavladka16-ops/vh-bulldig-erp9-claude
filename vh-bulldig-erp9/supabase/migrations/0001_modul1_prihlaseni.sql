-- ============================================================
-- VH BULLDIG ERP 9 – MODUL 1: PŘIHLÁŠENÍ UŽIVATELŮ
-- Databázový základ pro role, oprávnění a oddělení firem (company_id).
-- Tato migrace vytváří POUZE to, co Modul 1 vyžaduje. Žádná další
-- tabulka pro budoucí moduly zde není zakládána.
-- ============================================================

-- Rozšíření pro generování UUID
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- 1) Enum: role uživatelů (přesně 4 role dle zadání)
-- ------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum ('majitel', 'administrator', 'ucetni', 'zamestnanec');
  end if;
end $$;

-- ------------------------------------------------------------
-- 2) Tabulka firem (oddělení dat mezi firmami)
-- ------------------------------------------------------------
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 3) Tabulka profilů (1:1 na auth.users)
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  company_id uuid not null references public.companies (id) on delete restrict,
  email text not null,
  full_name text,
  role user_role not null default 'zamestnanec',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists profiles_company_id_idx on public.profiles (company_id);

-- ------------------------------------------------------------
-- 4) Tabulka oprávnění k modulům (pro pozdější moduly, ale
--    struktura je nutná už nyní pro kontrolu přístupu při přihlášení)
-- ------------------------------------------------------------
create table if not exists public.module_permissions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  module_key text not null,
  can_access boolean not null default false,
  unique (profile_id, module_key)
);

-- ------------------------------------------------------------
-- 5) Pomocná funkce: vrátí company_id aktuálně přihlášeného uživatele
--    (SECURITY DEFINER, aby RLS politiky nevytvářely nekonečnou rekurzi)
-- ------------------------------------------------------------
create or replace function public.current_company_id()
returns uuid
language sql
security definer
stable
as $$
  select company_id from public.profiles where id = auth.uid();
$$;

create or replace function public.current_role()
returns user_role
language sql
security definer
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ------------------------------------------------------------
-- 6) Row Level Security
-- ------------------------------------------------------------
alter table public.companies enable row level security;
alter table public.profiles enable row level security;
alter table public.module_permissions enable row level security;

-- Companies: uživatel vidí pouze svou vlastní firmu.
drop policy if exists "companies_select_own" on public.companies;
create policy "companies_select_own"
  on public.companies for select
  using (id = public.current_company_id());

-- Profiles: uživatel vidí pouze profily ve své firmě.
drop policy if exists "profiles_select_same_company" on public.profiles;
create policy "profiles_select_same_company"
  on public.profiles for select
  using (company_id = public.current_company_id());

-- Profiles: uživatel smí upravit pouze svůj vlastní profil (např. jméno).
-- Roli a company_id nesmí měnit sám sobě - to zajišťuje trigger níže.
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- Module permissions: uživatel vidí pouze svá vlastní oprávnění.
drop policy if exists "module_permissions_select_own" on public.module_permissions;
create policy "module_permissions_select_own"
  on public.module_permissions for select
  using (profile_id = auth.uid());

-- Majitel a Administrátor smí spravovat oprávnění v rámci své firmy.
drop policy if exists "module_permissions_manage_by_admin" on public.module_permissions;
create policy "module_permissions_manage_by_admin"
  on public.module_permissions for all
  using (
    public.current_role() in ('majitel', 'administrator')
    and profile_id in (select id from public.profiles where company_id = public.current_company_id())
  )
  with check (
    public.current_role() in ('majitel', 'administrator')
    and profile_id in (select id from public.profiles where company_id = public.current_company_id())
  );

-- ------------------------------------------------------------
-- 7) Trigger: znemožnit, aby si běžný uživatel sám změnil roli/company_id
-- ------------------------------------------------------------
create or replace function public.prevent_self_role_escalation()
returns trigger
language plpgsql
security definer
as $$
begin
  if auth.uid() = old.id and public.current_role() not in ('majitel', 'administrator') then
    if new.role <> old.role or new.company_id <> old.company_id then
      raise exception 'Nemáte oprávnění změnit roli nebo firmu.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_self_role_escalation on public.profiles;
create trigger trg_prevent_self_role_escalation
  before update on public.profiles
  for each row execute function public.prevent_self_role_escalation();

-- ------------------------------------------------------------
-- 8) Poznámka k hlavnímu účtu Majitele
-- ------------------------------------------------------------
-- Účet vladka@vhbulldig.cz se ZAKLÁDÁ výhradně přes Supabase
-- Authentication (Dashboard nebo `supabase auth` CLI), NIKDY v této
-- migraci a NIKDY s heslem zapsaným v kódu. Postup viz:
-- docs/OWNER_ACCOUNT_SETUP.md
--
-- Po založení uživatele v auth.users je nutné ručně (jednorázově)
-- vložit odpovídající řádek do public.profiles s rolí 'majitel'.
-- Přesný SQL příkaz (bez hesla) je uveden v docs/OWNER_ACCOUNT_SETUP.md.
