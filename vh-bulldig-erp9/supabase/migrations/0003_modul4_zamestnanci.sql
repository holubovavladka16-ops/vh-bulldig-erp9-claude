-- ============================================================
-- VH BULLDIG ERP 9 – MODUL 4: ZAMĚSTNANCI A KARTA DĚLNÍKA
-- ============================================================

-- ------------------------------------------------------------
-- 1) Enum: stav zaměstnance (přesně 4 stavy dle zadání)
-- ------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'employee_status') then
    create type employee_status as enum ('aktivni', 'neaktivni', 'ukonceny', 'pozastaveny');
  end if;
end $$;

-- ------------------------------------------------------------
-- 2) Typy pracovního poměru (spravuje Majitel/Administrátor)
-- ------------------------------------------------------------
create table if not exists public.employment_types (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (company_id, name)
);

alter table public.employment_types enable row level security;

drop policy if exists "employment_types_select_same_company" on public.employment_types;
create policy "employment_types_select_same_company"
  on public.employment_types for select
  using (company_id = public.current_company_id());

drop policy if exists "employment_types_manage_by_admins" on public.employment_types;
create policy "employment_types_manage_by_admins"
  on public.employment_types for all
  using (
    company_id = public.current_company_id()
    and (
      public.current_role() = 'majitel'
      or (
        public.current_role() = 'administrator'
        and exists (
          select 1 from public.module_permissions
          where profile_id = auth.uid() and module_key = 'zamestnanci' and can_access = true
        )
      )
    )
  )
  with check (company_id = public.current_company_id());

-- ------------------------------------------------------------
-- 3) Zaměstnanci (registrace + údaje Karty dělníka na jednom místě,
--    aby nevznikala duplicitní data)
-- ------------------------------------------------------------
create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  profile_id uuid references public.profiles (id) on delete set null,

  -- Povinné registrační údaje
  first_name text not null,
  last_name text not null,
  birth_date date not null,
  position text not null,
  start_date date not null,
  employment_type_id uuid not null references public.employment_types (id),
  payment_method text not null check (payment_method in ('hotove', 'bankovni_ucet')),

  -- Nepovinné registrační údaje
  birth_number text,
  address text,
  id_card_number text,
  phone text,
  email text,
  bank_account text,
  note text,
  photo_url text,
  photo_path text,
  end_date date,

  -- Stav
  status employee_status not null default 'aktivni',

  -- Sdílený formulář zaměstnance
  share_token uuid not null default gen_random_uuid() unique,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists employees_company_id_idx on public.employees (company_id);
create index if not exists employees_status_idx on public.employees (status);

alter table public.employees enable row level security;

-- SELECT: Majitel vidí vše. Administrátor/Účetní s oprávněním vidí vše
-- v rámci firmy. Zaměstnanec vidí pouze svůj vlastní záznam.
drop policy if exists "employees_select_scoped" on public.employees;
create policy "employees_select_scoped"
  on public.employees for select
  using (
    company_id = public.current_company_id()
    and (
      public.current_role() = 'majitel'
      or (
        public.current_role() in ('administrator', 'ucetni')
        and exists (
          select 1 from public.module_permissions
          where profile_id = auth.uid() and module_key = 'zamestnanci' and can_access = true
        )
      )
      or profile_id = auth.uid()
    )
  );

-- INSERT/UPDATE: pouze Majitel, nebo Administrátor s oprávněním.
drop policy if exists "employees_write_by_admins" on public.employees;
create policy "employees_write_by_admins"
  on public.employees for all
  using (
    company_id = public.current_company_id()
    and (
      public.current_role() = 'majitel'
      or (
        public.current_role() = 'administrator'
        and exists (
          select 1 from public.module_permissions
          where profile_id = auth.uid() and module_key = 'zamestnanci' and can_access = true
        )
      )
    )
  )
  with check (company_id = public.current_company_id());

-- Žádná DELETE politika záměrně neexistuje - zaměstnanec se nesmí
-- trvale smazat (bod 18 zadání), pouze změnou stavu.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_employees_updated_at on public.employees;
create trigger trg_employees_updated_at
  before update on public.employees
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- 4) Historie změn zaměstnance
-- ------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'employee_change_type') then
    create type employee_change_type as enum (
      'vytvoreni', 'osobni_udaje', 'pracovni_udaje', 'zmena_stavu'
    );
  end if;
end $$;

create table if not exists public.employee_history (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  change_type employee_change_type not null,
  changed_by uuid references public.profiles (id) on delete set null,
  changed_by_name text,
  details jsonb,
  changed_at timestamptz not null default now()
);

create index if not exists employee_history_employee_id_idx on public.employee_history (employee_id);

alter table public.employee_history enable row level security;

drop policy if exists "employee_history_select_scoped" on public.employee_history;
create policy "employee_history_select_scoped"
  on public.employee_history for select
  using (
    exists (
      select 1 from public.employees e
      where e.id = employee_history.employee_id
        and e.company_id = public.current_company_id()
        and (
          public.current_role() = 'majitel'
          or (
            public.current_role() in ('administrator', 'ucetni')
            and exists (
              select 1 from public.module_permissions
              where profile_id = auth.uid() and module_key = 'zamestnanci' and can_access = true
            )
          )
          or e.profile_id = auth.uid()
        )
    )
  );

drop policy if exists "employee_history_insert_by_admins" on public.employee_history;
create policy "employee_history_insert_by_admins"
  on public.employee_history for insert
  with check (
    exists (
      select 1 from public.employees e
      where e.id = employee_history.employee_id
        and e.company_id = public.current_company_id()
        and (
          public.current_role() = 'majitel'
          or (
            public.current_role() = 'administrator'
            and exists (
              select 1 from public.module_permissions
              where profile_id = auth.uid() and module_key = 'zamestnanci' and can_access = true
            )
          )
        )
    )
  );

-- ------------------------------------------------------------
-- 5) Supabase Storage bucket pro fotografie zaměstnanců
--    Veřejně čitelný (stejně jako logo/vodoznak) - cesty obsahují
--    nehádatelné UUID, a fotografie musí být zobrazitelná i na
--    veřejném sdíleném formuláři zaměstnance (bod 15 zadání).
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('employee-photos', 'employee-photos', true)
on conflict (id) do nothing;

drop policy if exists "employee_photos_public_read" on storage.objects;
create policy "employee_photos_public_read"
  on storage.objects for select
  using (bucket_id = 'employee-photos');

drop policy if exists "employee_photos_write_by_admins" on storage.objects;
create policy "employee_photos_write_by_admins"
  on storage.objects for all
  using (
    bucket_id = 'employee-photos'
    and (
      public.current_role() = 'majitel'
      or (
        public.current_role() = 'administrator'
        and exists (
          select 1 from public.module_permissions
          where profile_id = auth.uid() and module_key = 'zamestnanci' and can_access = true
        )
      )
    )
  )
  with check (bucket_id = 'employee-photos');

-- ------------------------------------------------------------
-- 6) Veřejná funkce pro sdílený formulář zaměstnance (bez přihlášení)
--    Vrací POUZE údaje daného zaměstnance podle jeho unikátního tokenu.
-- ------------------------------------------------------------
create or replace function public.get_employee_by_share_token(p_token uuid)
returns table (
  id uuid,
  first_name text,
  last_name text,
  position text,
  start_date date,
  end_date date,
  employment_type_name text,
  payment_method text,
  status employee_status,
  photo_url text,
  phone text,
  email text,
  note text,
  company_name text,
  company_logo_url text
)
language sql
security definer
stable
as $$
  select
    e.id, e.first_name, e.last_name, e.position, e.start_date, e.end_date,
    et.name, e.payment_method, e.status, e.photo_url, e.phone, e.email, e.note,
    c.name, c.logo_url
  from public.employees e
  join public.employment_types et on et.id = e.employment_type_id
  join public.companies c on c.id = e.company_id
  where e.share_token = p_token;
$$;

grant execute on function public.get_employee_by_share_token(uuid) to anon, authenticated;
