-- ============================================================
-- VH BULLDIG ERP 9 – MODUL 9: NÁKLADY
-- Mzdové náklady se NEUKLÁDAJÍ v této tabulce - počítají se za běhu
-- ze schválených záznamů public.attendance_records (Modul 7/8), aby
-- nevznikla duplicita dat (bod 11 zadání).
-- ============================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'cost_category') then
    create type cost_category as enum (
      'material', 'naradi', 'pujcovna', 'ubytovani', 'phm', 'jizdenky', 'jine'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'cost_change_type') then
    create type cost_change_type as enum (
      'vytvoreni', 'zmena_data', 'zmena_zakazky', 'zmena_kategorie', 'zmena_popisu', 'zmena_castky'
    );
  end if;
end $$;

-- ------------------------------------------------------------
-- 1) Náklady - ručně zadané (nemzdové) náklady, přesně dle zadání
--    (bod 4: pouze Datum, Zakázka, Kategorie, Popis, Částka).
-- ------------------------------------------------------------
create table if not exists public.costs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  order_id uuid not null references public.orders (id) on delete restrict,

  cost_date date not null default current_date,
  category cost_category not null,
  description text not null,
  amount numeric(12, 2) not null check (amount > 0),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists costs_company_id_idx on public.costs (company_id);
create index if not exists costs_order_id_idx on public.costs (order_id);
create index if not exists costs_category_idx on public.costs (category);
create index if not exists costs_date_idx on public.costs (cost_date);

drop trigger if exists trg_costs_updated_at on public.costs;
create trigger trg_costs_updated_at
  before update on public.costs
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- 2) Historie změn nákladu (bod 16)
-- ------------------------------------------------------------
create table if not exists public.cost_history (
  id uuid primary key default gen_random_uuid(),
  cost_id uuid not null references public.costs (id) on delete cascade,
  change_type cost_change_type not null,
  changed_by uuid references public.profiles (id) on delete set null,
  changed_by_name text,
  details jsonb,
  changed_at timestamptz not null default now()
);

create index if not exists cost_history_cost_id_idx on public.cost_history (cost_id);

-- ------------------------------------------------------------
-- 3) Row Level Security
-- ------------------------------------------------------------
alter table public.costs enable row level security;
alter table public.cost_history enable row level security;

-- SELECT: Majitel vše. Administrátor/Účetní s oprávněním 'naklady'
-- vše v rámci firmy. Zaměstnanec NEMÁ žádnou politiku - firemní
-- náklady nesmí vidět vůbec (bod 18 zadání, na rozdíl od Docházky
-- a Výkazů zde není výjimka pro vlastní data).
drop policy if exists "costs_select_scoped" on public.costs;
create policy "costs_select_scoped"
  on public.costs for select
  using (
    company_id = public.current_company_id()
    and (
      public.current_role() = 'majitel'
      or (
        public.current_role() in ('administrator', 'ucetni')
        and exists (
          select 1 from public.module_permissions
          where profile_id = auth.uid() and module_key = 'naklady' and can_access = true
        )
      )
    )
  );

-- INSERT/UPDATE: Majitel, Administrátor s oprávněním, NEBO Účetní
-- s oprávněním (bod 18 - Účetní zde smí i vytvářet a upravovat,
-- na rozdíl od jiných modulů kde měla jen zobrazení).
-- Žádná DELETE politika - žádné trvalé mazání nákladů.
drop policy if exists "costs_write_scoped" on public.costs;
create policy "costs_write_scoped"
  on public.costs for all
  using (
    company_id = public.current_company_id()
    and (
      public.current_role() = 'majitel'
      or (
        public.current_role() in ('administrator', 'ucetni')
        and exists (
          select 1 from public.module_permissions
          where profile_id = auth.uid() and module_key = 'naklady' and can_access = true
        )
      )
    )
  )
  with check (company_id = public.current_company_id());

drop policy if exists "cost_history_select_scoped" on public.cost_history;
create policy "cost_history_select_scoped"
  on public.cost_history for select
  using (
    exists (
      select 1 from public.costs c
      where c.id = cost_history.cost_id
        and c.company_id = public.current_company_id()
        and (
          public.current_role() = 'majitel'
          or (
            public.current_role() in ('administrator', 'ucetni')
            and exists (
              select 1 from public.module_permissions
              where profile_id = auth.uid() and module_key = 'naklady' and can_access = true
            )
          )
        )
    )
  );

drop policy if exists "cost_history_insert_scoped" on public.cost_history;
create policy "cost_history_insert_scoped"
  on public.cost_history for insert
  with check (
    exists (
      select 1 from public.costs c
      where c.id = cost_history.cost_id
        and c.company_id = public.current_company_id()
        and (
          public.current_role() = 'majitel'
          or (
            public.current_role() in ('administrator', 'ucetni')
            and exists (
              select 1 from public.module_permissions
              where profile_id = auth.uid() and module_key = 'naklady' and can_access = true
            )
          )
        )
    )
  );
