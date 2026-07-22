-- ============================================================
-- VH BULLDIG ERP 9 – MODUL 10: FAKTURACE A PŘEHLED ZISKU
-- Toto NENÍ vystavování faktur (to je Modul 18). Ukládá se pouze
-- vyfakturovaná částka za zakázku a období; náklady a zisk/ztráta se
-- vždy počítají za běhu z Modulu 7 (Docházka) a Modulu 9 (Náklady).
-- ============================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'invoicing_change_type') then
    create type invoicing_change_type as enum (
      'vytvoreni', 'zmena_zakazky', 'zmena_obdobi', 'zmena_castky', 'zmena_poznamky'
    );
  end if;
end $$;

-- ------------------------------------------------------------
-- 1) Fakturované částky (přesně dle bod 3 zadání)
-- ------------------------------------------------------------
create table if not exists public.invoicing_records (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  order_id uuid not null references public.orders (id) on delete restrict,

  period_from date not null,
  period_to date not null,
  invoiced_amount numeric(12, 2) not null check (invoiced_amount > 0),
  note text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint invoicing_records_period_order check (period_to >= period_from)
);

create index if not exists invoicing_records_company_id_idx on public.invoicing_records (company_id);
create index if not exists invoicing_records_order_id_idx on public.invoicing_records (order_id);

drop trigger if exists trg_invoicing_records_updated_at on public.invoicing_records;
create trigger trg_invoicing_records_updated_at
  before update on public.invoicing_records
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- 2) Historie změn (bod 17)
-- ------------------------------------------------------------
create table if not exists public.invoicing_history (
  id uuid primary key default gen_random_uuid(),
  invoicing_record_id uuid not null references public.invoicing_records (id) on delete cascade,
  change_type invoicing_change_type not null,
  changed_by uuid references public.profiles (id) on delete set null,
  changed_by_name text,
  details jsonb,
  changed_at timestamptz not null default now()
);

create index if not exists invoicing_history_record_id_idx on public.invoicing_history (invoicing_record_id);

-- ------------------------------------------------------------
-- 3) Row Level Security
-- ------------------------------------------------------------
alter table public.invoicing_records enable row level security;
alter table public.invoicing_history enable row level security;

-- SELECT: Majitel vše. Administrátor/Účetní s oprávněním
-- 'fakturace-a-prehled-zisku' vše v rámci firmy. Zaměstnanec NEMÁ
-- žádnou politiku - finanční přehledy nesmí vidět vůbec (bod 19).
drop policy if exists "invoicing_records_select_scoped" on public.invoicing_records;
create policy "invoicing_records_select_scoped"
  on public.invoicing_records for select
  using (
    company_id = public.current_company_id()
    and (
      public.current_role() = 'majitel'
      or (
        public.current_role() in ('administrator', 'ucetni')
        and exists (
          select 1 from public.module_permissions
          where profile_id = auth.uid() and module_key = 'fakturace-a-prehled-zisku' and can_access = true
        )
      )
    )
  );

-- INSERT/UPDATE: Majitel, nebo Administrátor/Účetní s oprávněním.
-- Žádná DELETE politika.
drop policy if exists "invoicing_records_write_scoped" on public.invoicing_records;
create policy "invoicing_records_write_scoped"
  on public.invoicing_records for all
  using (
    company_id = public.current_company_id()
    and (
      public.current_role() = 'majitel'
      or (
        public.current_role() in ('administrator', 'ucetni')
        and exists (
          select 1 from public.module_permissions
          where profile_id = auth.uid() and module_key = 'fakturace-a-prehled-zisku' and can_access = true
        )
      )
    )
  )
  with check (company_id = public.current_company_id());

drop policy if exists "invoicing_history_select_scoped" on public.invoicing_history;
create policy "invoicing_history_select_scoped"
  on public.invoicing_history for select
  using (
    exists (
      select 1 from public.invoicing_records ir
      where ir.id = invoicing_history.invoicing_record_id
        and ir.company_id = public.current_company_id()
        and (
          public.current_role() = 'majitel'
          or (
            public.current_role() in ('administrator', 'ucetni')
            and exists (
              select 1 from public.module_permissions
              where profile_id = auth.uid() and module_key = 'fakturace-a-prehled-zisku' and can_access = true
            )
          )
        )
    )
  );

drop policy if exists "invoicing_history_insert_scoped" on public.invoicing_history;
create policy "invoicing_history_insert_scoped"
  on public.invoicing_history for insert
  with check (
    exists (
      select 1 from public.invoicing_records ir
      where ir.id = invoicing_history.invoicing_record_id
        and ir.company_id = public.current_company_id()
        and (
          public.current_role() = 'majitel'
          or (
            public.current_role() in ('administrator', 'ucetni')
            and exists (
              select 1 from public.module_permissions
              where profile_id = auth.uid() and module_key = 'fakturace-a-prehled-zisku' and can_access = true
            )
          )
        )
    )
  );
