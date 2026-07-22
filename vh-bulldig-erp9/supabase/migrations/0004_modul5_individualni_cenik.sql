-- ============================================================
-- VH BULLDIG ERP 9 – MODUL 5: INDIVIDUÁLNÍ CENÍK ZAMĚSTNANCE
-- ============================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'pricing_activity_key') then
    create type pricing_activity_key as enum (
      'hodinova_sazba', 'rucni_vykop', 'pruraz', 'demontaz_dlazby',
      'pokladka_dlazby', 'denni_sazba_ukol', 'jine'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'pricing_unit') then
    create type pricing_unit as enum ('hod', 'bm', 'ks', 'm2', 'den');
  end if;

  if not exists (select 1 from pg_type where typname = 'pricing_item_status') then
    create type pricing_item_status as enum ('aktivni', 'neaktivni');
  end if;
end $$;

-- ------------------------------------------------------------
-- 1) Ceníkové položky
-- ------------------------------------------------------------
create table if not exists public.pricing_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  employee_id uuid not null references public.employees (id) on delete cascade,

  activity_key pricing_activity_key not null,
  activity_name text not null, -- pevný český název pro přednastavené činnosti, vlastní text pro 'jine'
  unit pricing_unit not null,
  unit_price numeric(12, 2) not null check (unit_price >= 0),

  valid_from date not null default current_date,
  valid_to date,

  status pricing_item_status not null default 'aktivni',
  note text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pricing_items_employee_id_idx on public.pricing_items (employee_id);
create index if not exists pricing_items_company_id_idx on public.pricing_items (company_id);

drop trigger if exists trg_pricing_items_updated_at on public.pricing_items;
create trigger trg_pricing_items_updated_at
  before update on public.pricing_items
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- 2) Historie změn ceny (bod 9 zadání)
-- ------------------------------------------------------------
create table if not exists public.pricing_price_history (
  id uuid primary key default gen_random_uuid(),
  pricing_item_id uuid not null references public.pricing_items (id) on delete cascade,
  old_price numeric(12, 2) not null,
  new_price numeric(12, 2) not null,
  new_valid_from date not null,
  changed_by uuid references public.profiles (id) on delete set null,
  changed_by_name text,
  changed_at timestamptz not null default now()
);

create index if not exists pricing_price_history_item_id_idx on public.pricing_price_history (pricing_item_id);

-- Poznámka k bodu 10 hlavního zadání Modulu 5: až vzniknou moduly
-- Docházka a Výkazy, MUSÍ si při použití ceníkové položky do vlastního
-- pracovního záznamu OKOPÍROVAT název činnosti, jednotku a aktuální
-- jednotkovou cenu (ne jen uložit odkaz na pricing_items.id). Teprve
-- tak zůstanou staré záznamy nezávislé na pozdější změně ceny zde.
-- Tato migrace sama o sobě žádný pracovní záznam nevytváří.

-- ------------------------------------------------------------
-- 3) Row Level Security
-- ------------------------------------------------------------
alter table public.pricing_items enable row level security;
alter table public.pricing_price_history enable row level security;

-- SELECT: Majitel vidí vše. Administrátor/Účetní s oprávněním k modulu
-- 'individualni-cenik' vidí vše v rámci firmy. Zaměstnanec vidí pouze
-- svůj vlastní ceník (přes vazbu employees.profile_id).
drop policy if exists "pricing_items_select_scoped" on public.pricing_items;
create policy "pricing_items_select_scoped"
  on public.pricing_items for select
  using (
    company_id = public.current_company_id()
    and (
      public.current_role() = 'majitel'
      or (
        public.current_role() in ('administrator', 'ucetni')
        and exists (
          select 1 from public.module_permissions
          where profile_id = auth.uid() and module_key = 'individualni-cenik' and can_access = true
        )
      )
      or exists (
        select 1 from public.employees e
        where e.id = pricing_items.employee_id and e.profile_id = auth.uid()
      )
    )
  );

-- INSERT/UPDATE: pouze Majitel, nebo Administrátor s oprávněním.
-- Žádná DELETE politika - položka se pouze deaktivuje (bod 8 zadání).
drop policy if exists "pricing_items_write_by_admins" on public.pricing_items;
create policy "pricing_items_write_by_admins"
  on public.pricing_items for all
  using (
    company_id = public.current_company_id()
    and (
      public.current_role() = 'majitel'
      or (
        public.current_role() = 'administrator'
        and exists (
          select 1 from public.module_permissions
          where profile_id = auth.uid() and module_key = 'individualni-cenik' and can_access = true
        )
      )
    )
  )
  with check (company_id = public.current_company_id());

-- Historie cen: viditelná stejně jako položka samotná; zapisovat smí
-- jen ten, kdo smí položku upravovat.
drop policy if exists "pricing_price_history_select_scoped" on public.pricing_price_history;
create policy "pricing_price_history_select_scoped"
  on public.pricing_price_history for select
  using (
    exists (
      select 1 from public.pricing_items pi
      where pi.id = pricing_price_history.pricing_item_id
        and pi.company_id = public.current_company_id()
        and (
          public.current_role() = 'majitel'
          or (
            public.current_role() in ('administrator', 'ucetni')
            and exists (
              select 1 from public.module_permissions
              where profile_id = auth.uid() and module_key = 'individualni-cenik' and can_access = true
            )
          )
          or exists (
            select 1 from public.employees e
            where e.id = pi.employee_id and e.profile_id = auth.uid()
          )
        )
    )
  );

drop policy if exists "pricing_price_history_insert_by_admins" on public.pricing_price_history;
create policy "pricing_price_history_insert_by_admins"
  on public.pricing_price_history for insert
  with check (
    exists (
      select 1 from public.pricing_items pi
      where pi.id = pricing_price_history.pricing_item_id
        and pi.company_id = public.current_company_id()
        and (
          public.current_role() = 'majitel'
          or (
            public.current_role() = 'administrator'
            and exists (
              select 1 from public.module_permissions
              where profile_id = auth.uid() and module_key = 'individualni-cenik' and can_access = true
            )
          )
        )
    )
  );
