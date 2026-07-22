-- ============================================================
-- VH BULLDIG ERP 9 – MODUL 11: STAVEBNÍ DENÍK
-- ============================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'construction_log_change_type') then
    create type construction_log_change_type as enum (
      'vytvoreni', 'zmena_data', 'zmena_zakazky', 'zmena_pocasi', 'zmena_techniky',
      'zmena_pocet_delniku', 'zmena_jmen', 'zmena_denni_cinnosti', 'zmena_popisu'
    );
  end if;
end $$;

-- ------------------------------------------------------------
-- 1) Záznamy stavebního deníku (přesně dle bod 3 zadání)
-- ------------------------------------------------------------
create table if not exists public.construction_log_entries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  order_id uuid not null references public.orders (id) on delete restrict,

  log_date date not null default current_date,
  weather text,
  equipment text,
  worker_ids uuid[] not null default '{}',
  worker_count integer not null default 0,
  daily_activity text,
  description text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists construction_log_entries_company_id_idx on public.construction_log_entries (company_id);
create index if not exists construction_log_entries_order_id_idx on public.construction_log_entries (order_id);
create index if not exists construction_log_entries_date_idx on public.construction_log_entries (log_date);
create index if not exists construction_log_entries_worker_ids_idx on public.construction_log_entries using gin (worker_ids);

drop trigger if exists trg_construction_log_entries_updated_at on public.construction_log_entries;
create trigger trg_construction_log_entries_updated_at
  before update on public.construction_log_entries
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- 2) Historie změn (bod 17)
-- ------------------------------------------------------------
create table if not exists public.construction_log_history (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.construction_log_entries (id) on delete cascade,
  change_type construction_log_change_type not null,
  changed_by uuid references public.profiles (id) on delete set null,
  changed_by_name text,
  details jsonb,
  changed_at timestamptz not null default now()
);

create index if not exists construction_log_history_entry_id_idx on public.construction_log_history (entry_id);

-- ------------------------------------------------------------
-- 3) Row Level Security
-- ------------------------------------------------------------
alter table public.construction_log_entries enable row level security;
alter table public.construction_log_history enable row level security;

-- SELECT: Majitel vše. Administrátor/Účetní s oprávněním
-- 'stavebni-denik' vše v rámci firmy. Zaměstnanec vidí pouze záznamy,
-- ve kterých je sám uveden mezi dělníky (bod 20 - "pouze povolené
-- záznamy" - jediná přirozená definice "povolení" v tomto modulu je
-- being uveden jako dělník daného dne).
drop policy if exists "construction_log_select_scoped" on public.construction_log_entries;
create policy "construction_log_select_scoped"
  on public.construction_log_entries for select
  using (
    company_id = public.current_company_id()
    and (
      public.current_role() = 'majitel'
      or (
        public.current_role() in ('administrator', 'ucetni')
        and exists (
          select 1 from public.module_permissions
          where profile_id = auth.uid() and module_key = 'stavebni-denik' and can_access = true
        )
      )
      or exists (
        select 1 from public.employees e
        where e.profile_id = auth.uid() and e.id = any (construction_log_entries.worker_ids)
      )
    )
  );

-- INSERT/UPDATE: Majitel, nebo Administrátor s oprávněním (Účetní má
-- dle bod 20 jen zobrazení a export, ne zápis). Žádná DELETE politika.
drop policy if exists "construction_log_write_scoped" on public.construction_log_entries;
create policy "construction_log_write_scoped"
  on public.construction_log_entries for all
  using (
    company_id = public.current_company_id()
    and (
      public.current_role() = 'majitel'
      or (
        public.current_role() = 'administrator'
        and exists (
          select 1 from public.module_permissions
          where profile_id = auth.uid() and module_key = 'stavebni-denik' and can_access = true
        )
      )
    )
  )
  with check (company_id = public.current_company_id());

drop policy if exists "construction_log_history_select_scoped" on public.construction_log_history;
create policy "construction_log_history_select_scoped"
  on public.construction_log_history for select
  using (
    exists (
      select 1 from public.construction_log_entries cle
      where cle.id = construction_log_history.entry_id
        and cle.company_id = public.current_company_id()
        and (
          public.current_role() = 'majitel'
          or (
            public.current_role() in ('administrator', 'ucetni')
            and exists (
              select 1 from public.module_permissions
              where profile_id = auth.uid() and module_key = 'stavebni-denik' and can_access = true
            )
          )
          or exists (
            select 1 from public.employees e
            where e.profile_id = auth.uid() and e.id = any (cle.worker_ids)
          )
        )
    )
  );

drop policy if exists "construction_log_history_insert_scoped" on public.construction_log_history;
create policy "construction_log_history_insert_scoped"
  on public.construction_log_history for insert
  with check (
    exists (
      select 1 from public.construction_log_entries cle
      where cle.id = construction_log_history.entry_id
        and cle.company_id = public.current_company_id()
        and (
          public.current_role() = 'majitel'
          or (
            public.current_role() = 'administrator'
            and exists (
              select 1 from public.module_permissions
              where profile_id = auth.uid() and module_key = 'stavebni-denik' and can_access = true
            )
          )
        )
    )
  );
