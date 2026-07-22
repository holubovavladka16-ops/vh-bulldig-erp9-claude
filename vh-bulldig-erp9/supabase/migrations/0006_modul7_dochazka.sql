-- ============================================================
-- VH BULLDIG ERP 9 – MODUL 7: DOCHÁZKA
-- ============================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'attendance_status') then
    create type attendance_status as enum ('rozepsany', 'odeslany', 'schvaleny', 'vraceny_k_oprave');
  end if;

  if not exists (select 1 from pg_type where typname = 'attendance_change_type') then
    create type attendance_change_type as enum (
      'vytvoreni', 'zmena_zamestnance', 'zmena_zakazky', 'zmena_pritomnosti',
      'zmena_pracovni_cinnosti', 'zmena_zalohy', 'zmena_stavu'
    );
  end if;
end $$;

-- ------------------------------------------------------------
-- 1) Záznamy docházky
--    Evidence přítomnosti (od-do) je striktně oddělená od pracovního
--    výkonu (attendance_work_items) - viz bod 1 a 22 zadání.
-- ------------------------------------------------------------
create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  employee_id uuid not null references public.employees (id) on delete restrict,
  order_id uuid not null references public.orders (id) on delete restrict,

  record_date date not null default current_date,
  note text,

  -- Evidence přítomnosti (POUZE evidence, nikdy základ mzdy)
  work_start time,
  work_end time,
  break_minutes integer not null default 0,
  presence_total_minutes integer,

  -- Záloha
  daily_advance numeric(12, 2) not null default 0,
  advance_payment_method payment_method,
  advance_note text,

  -- Souhrn (dopočítáno ze work items)
  total_earnings numeric(12, 2) not null default 0,
  balance_due numeric(12, 2) not null default 0,

  status attendance_status not null default 'rozepsany',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists attendance_records_company_id_idx on public.attendance_records (company_id);
create index if not exists attendance_records_employee_id_idx on public.attendance_records (employee_id);
create index if not exists attendance_records_order_id_idx on public.attendance_records (order_id);
create index if not exists attendance_records_status_idx on public.attendance_records (status);

drop trigger if exists trg_attendance_records_updated_at on public.attendance_records;
create trigger trg_attendance_records_updated_at
  before update on public.attendance_records
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- 2) Pracovní výkon - jednotlivé řádky činností za daný den
--    (bod 6, 9, 10 - cena se ukládá jako snapshot platný v daný den,
--    NE jako odkaz na aktuální cenu v ceníku)
-- ------------------------------------------------------------
create table if not exists public.attendance_work_items (
  id uuid primary key default gen_random_uuid(),
  attendance_record_id uuid not null references public.attendance_records (id) on delete cascade,
  pricing_item_id uuid references public.pricing_items (id) on delete set null,

  activity_name text not null,
  unit pricing_unit not null,
  unit_price numeric(12, 2) not null,
  quantity numeric(12, 2) not null,
  total_price numeric(12, 2) not null,
  note text,

  created_at timestamptz not null default now()
);

create index if not exists attendance_work_items_record_id_idx on public.attendance_work_items (attendance_record_id);

-- ------------------------------------------------------------
-- 3) Historie změn (bod 18)
-- ------------------------------------------------------------
create table if not exists public.attendance_history (
  id uuid primary key default gen_random_uuid(),
  attendance_record_id uuid not null references public.attendance_records (id) on delete cascade,
  change_type attendance_change_type not null,
  changed_by uuid references public.profiles (id) on delete set null,
  changed_by_name text,
  details jsonb,
  changed_at timestamptz not null default now()
);

create index if not exists attendance_history_record_id_idx on public.attendance_history (attendance_record_id);

-- ------------------------------------------------------------
-- 4) Row Level Security
-- ------------------------------------------------------------
alter table public.attendance_records enable row level security;
alter table public.attendance_work_items enable row level security;
alter table public.attendance_history enable row level security;

-- Pomocná podmínka "má administrátorský/účetní přístup k modulu" se
-- opakuje, proto ji zapisujeme přímo v každé politice (Postgres nemá
-- jednoduchý způsob sdílet WHERE fragment mezi policies bez funkce -
-- používáme stejný vzor jako u ostatních modulů).

-- SELECT: Majitel vše. Administrátor/Účetní s oprávněním 'dochazka'
-- vše v rámci firmy. Zaměstnanec pouze své vlastní záznamy.
drop policy if exists "attendance_records_select_scoped" on public.attendance_records;
create policy "attendance_records_select_scoped"
  on public.attendance_records for select
  using (
    company_id = public.current_company_id()
    and (
      public.current_role() = 'majitel'
      or (
        public.current_role() in ('administrator', 'ucetni')
        and exists (
          select 1 from public.module_permissions
          where profile_id = auth.uid() and module_key = 'dochazka' and can_access = true
        )
      )
      or exists (
        select 1 from public.employees e
        where e.id = attendance_records.employee_id and e.profile_id = auth.uid()
      )
    )
  );

-- INSERT: Majitel, Administrátor s oprávněním, NEBO zaměstnanec
-- zapisující výhradně svůj vlastní záznam (bod 19 - "vytvořit vlastní
-- záznam"). Zaměstnanec nesmí založit záznam rovnou jako schválený.
drop policy if exists "attendance_records_insert_scoped" on public.attendance_records;
create policy "attendance_records_insert_scoped"
  on public.attendance_records for insert
  with check (
    company_id = public.current_company_id()
    and (
      public.current_role() = 'majitel'
      or (
        public.current_role() = 'administrator'
        and exists (
          select 1 from public.module_permissions
          where profile_id = auth.uid() and module_key = 'dochazka' and can_access = true
        )
      )
      or (
        exists (
          select 1 from public.employees e
          where e.id = attendance_records.employee_id and e.profile_id = auth.uid()
        )
        and status in ('rozepsany', 'odeslany')
      )
    )
  );

-- UPDATE: Majitel/Administrátor s oprávněním smí upravit cokoliv
-- (včetně schvalování a vrácení k opravě). Zaměstnanec smí upravovat
-- POUZE svůj vlastní záznam, a POUZE dokud není schválený, a NIKDY jej
-- sám nesmí přepnout do stavu "Schválený" (bod 19 - nesmí sám schválit).
drop policy if exists "attendance_records_update_scoped" on public.attendance_records;
create policy "attendance_records_update_scoped"
  on public.attendance_records for update
  using (
    company_id = public.current_company_id()
    and (
      public.current_role() = 'majitel'
      or (
        public.current_role() = 'administrator'
        and exists (
          select 1 from public.module_permissions
          where profile_id = auth.uid() and module_key = 'dochazka' and can_access = true
        )
      )
      or (
        exists (
          select 1 from public.employees e
          where e.id = attendance_records.employee_id and e.profile_id = auth.uid()
        )
        and status in ('rozepsany', 'vraceny_k_oprave')
      )
    )
  )
  with check (
    company_id = public.current_company_id()
    and (
      public.current_role() = 'majitel'
      or (
        public.current_role() = 'administrator'
        and exists (
          select 1 from public.module_permissions
          where profile_id = auth.uid() and module_key = 'dochazka' and can_access = true
        )
      )
      or (
        exists (
          select 1 from public.employees e
          where e.id = attendance_records.employee_id and e.profile_id = auth.uid()
        )
        and status in ('rozepsany', 'odeslany')
      )
    )
  );

-- Žádná DELETE politika (žádné trvalé mazání záznamů docházky).

-- Work items: viditelnost/zápis zrcadlí rodičovský záznam.
drop policy if exists "attendance_work_items_select_scoped" on public.attendance_work_items;
create policy "attendance_work_items_select_scoped"
  on public.attendance_work_items for select
  using (
    exists (
      select 1 from public.attendance_records ar
      where ar.id = attendance_work_items.attendance_record_id
        and ar.company_id = public.current_company_id()
        and (
          public.current_role() = 'majitel'
          or (
            public.current_role() in ('administrator', 'ucetni')
            and exists (
              select 1 from public.module_permissions
              where profile_id = auth.uid() and module_key = 'dochazka' and can_access = true
            )
          )
          or exists (
            select 1 from public.employees e
            where e.id = ar.employee_id and e.profile_id = auth.uid()
          )
        )
    )
  );

drop policy if exists "attendance_work_items_write_scoped" on public.attendance_work_items;
create policy "attendance_work_items_write_scoped"
  on public.attendance_work_items for all
  using (
    exists (
      select 1 from public.attendance_records ar
      where ar.id = attendance_work_items.attendance_record_id
        and ar.company_id = public.current_company_id()
        and (
          public.current_role() = 'majitel'
          or (
            public.current_role() = 'administrator'
            and exists (
              select 1 from public.module_permissions
              where profile_id = auth.uid() and module_key = 'dochazka' and can_access = true
            )
          )
          or (
            exists (
              select 1 from public.employees e
              where e.id = ar.employee_id and e.profile_id = auth.uid()
            )
            and ar.status in ('rozepsany', 'vraceny_k_oprave')
          )
        )
    )
  )
  with check (
    exists (
      select 1 from public.attendance_records ar
      where ar.id = attendance_work_items.attendance_record_id
        and ar.company_id = public.current_company_id()
    )
  );

-- Historie: viditelná stejně jako záznam, zapisovat smí kdokoliv kdo
-- smí záznam vytvořit/upravit (aplikace vkládá řádek historie sama).
drop policy if exists "attendance_history_select_scoped" on public.attendance_history;
create policy "attendance_history_select_scoped"
  on public.attendance_history for select
  using (
    exists (
      select 1 from public.attendance_records ar
      where ar.id = attendance_history.attendance_record_id
        and ar.company_id = public.current_company_id()
        and (
          public.current_role() = 'majitel'
          or (
            public.current_role() in ('administrator', 'ucetni')
            and exists (
              select 1 from public.module_permissions
              where profile_id = auth.uid() and module_key = 'dochazka' and can_access = true
            )
          )
          or exists (
            select 1 from public.employees e
            where e.id = ar.employee_id and e.profile_id = auth.uid()
          )
        )
    )
  );

drop policy if exists "attendance_history_insert_scoped" on public.attendance_history;
create policy "attendance_history_insert_scoped"
  on public.attendance_history for insert
  with check (
    exists (
      select 1 from public.attendance_records ar
      where ar.id = attendance_history.attendance_record_id
        and ar.company_id = public.current_company_id()
        and (
          public.current_role() = 'majitel'
          or (
            public.current_role() = 'administrator'
            and exists (
              select 1 from public.module_permissions
              where profile_id = auth.uid() and module_key = 'dochazka' and can_access = true
            )
          )
          or exists (
            select 1 from public.employees e
            where e.id = ar.employee_id and e.profile_id = auth.uid()
          )
        )
    )
  );

-- ------------------------------------------------------------
-- 5) Poznámka pro budoucí Modul 8 (Výkazy) a další navazující moduly
-- ------------------------------------------------------------
-- Do konečných výkazů/mezd/nákladů se smí započítávat POUZE záznamy se
-- stavem 'schvaleny' (bod 16 zadání). Tuto podmínku musí dodržet
-- dotazy budoucích modulů (Výkazy, Náklady, Fakturace, Výplatní pásky) -
-- tato migrace sama žádná navazující data nevytváří.
