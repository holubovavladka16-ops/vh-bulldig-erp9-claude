-- ============================================================
-- VH BULLDIG ERP 9 – MODUL 6: ZAKÁZKY
-- ============================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'order_status') then
    create type order_status as enum ('aktivni', 'neaktivni');
  end if;

  if not exists (select 1 from pg_type where typname = 'order_change_type') then
    create type order_change_type as enum (
      'vytvoreni', 'zmena_nazvu', 'zmena_data_zalozeni', 'zmena_stavu'
    );
  end if;
end $$;

-- ------------------------------------------------------------
-- 1) Zakázky - záměrně jen 3 pole dle zadání (bez adresy,
--    investora, kontaktu, čísla zakázky či poznámky).
-- ------------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  name text not null,
  founded_date date not null default current_date,
  status order_status not null default 'aktivni',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_company_id_idx on public.orders (company_id);
create index if not exists orders_status_idx on public.orders (status);

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- 2) Historie změn zakázky
-- ------------------------------------------------------------
create table if not exists public.order_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  change_type order_change_type not null,
  changed_by uuid references public.profiles (id) on delete set null,
  changed_by_name text,
  details jsonb,
  changed_at timestamptz not null default now()
);

create index if not exists order_history_order_id_idx on public.order_history (order_id);

-- ------------------------------------------------------------
-- 3) Row Level Security
-- ------------------------------------------------------------
alter table public.orders enable row level security;
alter table public.order_history enable row level security;

-- SELECT: Majitel vidí vše. Administrátor/Účetní s oprávněním k modulu
-- 'zakazky' vidí vše v rámci firmy.
--
-- Zaměstnanec zatím NEMÁ žádnou politiku, a proto (RLS = výchozí deny)
-- prozatím nevidí žádnou zakázku. To je záměr: "zakázky, ke kterým má
-- přístup" budou zaměstnanci přiřazovány až přes moduly Docházka /
-- Výkazy (bod 8-9 zadání Modulu 6 výslovně říká, že tato propojení se
-- teprve připravují a jejich logika se nyní nevytváří). Až tyto moduly
-- vzniknou, přibude sem odpovídající politika bez nutnosti měnit tuto
-- migraci destruktivně.
drop policy if exists "orders_select_scoped" on public.orders;
create policy "orders_select_scoped"
  on public.orders for select
  using (
    company_id = public.current_company_id()
    and (
      public.current_role() = 'majitel'
      or (
        public.current_role() in ('administrator', 'ucetni')
        and exists (
          select 1 from public.module_permissions
          where profile_id = auth.uid() and module_key = 'zakazky' and can_access = true
        )
      )
    )
  );

-- INSERT/UPDATE: pouze Majitel, nebo Administrátor s oprávněním.
-- Žádná DELETE politika - zakázka se pouze deaktivuje (bod 11 zadání).
drop policy if exists "orders_write_by_admins" on public.orders;
create policy "orders_write_by_admins"
  on public.orders for all
  using (
    company_id = public.current_company_id()
    and (
      public.current_role() = 'majitel'
      or (
        public.current_role() = 'administrator'
        and exists (
          select 1 from public.module_permissions
          where profile_id = auth.uid() and module_key = 'zakazky' and can_access = true
        )
      )
    )
  )
  with check (company_id = public.current_company_id());

drop policy if exists "order_history_select_scoped" on public.order_history;
create policy "order_history_select_scoped"
  on public.order_history for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_history.order_id
        and o.company_id = public.current_company_id()
        and (
          public.current_role() = 'majitel'
          or (
            public.current_role() in ('administrator', 'ucetni')
            and exists (
              select 1 from public.module_permissions
              where profile_id = auth.uid() and module_key = 'zakazky' and can_access = true
            )
          )
        )
    )
  );

drop policy if exists "order_history_insert_by_admins" on public.order_history;
create policy "order_history_insert_by_admins"
  on public.order_history for insert
  with check (
    exists (
      select 1 from public.orders o
      where o.id = order_history.order_id
        and o.company_id = public.current_company_id()
        and (
          public.current_role() = 'majitel'
          or (
            public.current_role() = 'administrator'
            and exists (
              select 1 from public.module_permissions
              where profile_id = auth.uid() and module_key = 'zakazky' and can_access = true
            )
          )
        )
    )
  );
