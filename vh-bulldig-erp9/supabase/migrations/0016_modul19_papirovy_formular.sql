-- ============================================================
-- VH BULLDIG ERP 9 – MODUL 19: PAPÍROVÝ FORMULÁŘ
-- (Zadání v dokumentu je číslováno jako "Modul 19" - v souladu s
-- hlavním seznamem 20 modulů. Poslední řádek zprávy uváděl "Modul 18",
-- což je zjevný překlep - obsah i všechny odkazy v zadání odpovídají
-- Modulu 19 "Papírový formulář", proto postupuji podle obsahu.)
-- ============================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'paper_form_status') then
    create type paper_form_status as enum (
      'vytvoreny', 'vytisteny', 'prirazeny', 'odevzdany', 'zkontrolovany', 'uzavreny', 'zneplatneny'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'paper_form_change_type') then
    create type paper_form_change_type as enum (
      'vytvoreni', 'tisk', 'stazeni_pdf', 'prvni_naskenovani', 'prirazeni',
      'zmena_stavu', 'odevzdani', 'kontrola', 'uzavreni', 'zneplatneni'
    );
  end if;
end $$;

-- ------------------------------------------------------------
-- 1) Papírové formuláře
--    form_number = čitelné, dohledatelné ID zobrazené na formuláři.
--    share_token = samostatný nepředvídatelný token použitý VÝHRADNĚ
--    v QR odkazu (bod 6, 28) - nikdy neobsahuje osobní údaje, heslo
--    ani tajný klíč.
-- ------------------------------------------------------------
create table if not exists public.paper_forms (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,

  form_number text not null,
  share_token uuid not null default gen_random_uuid() unique,

  month integer not null check (month between 1 and 12),
  year integer not null check (year between 2000 and 2100),

  status paper_form_status not null default 'vytvoreny',

  employee_id uuid references public.employees (id) on delete set null,
  assigned_at timestamptz,
  assigned_by uuid references public.profiles (id) on delete set null,
  assigned_by_name text,

  invalidated_reason text,
  invalidated_at timestamptz,
  invalidated_by uuid references public.profiles (id) on delete set null,
  invalidated_by_name text,

  created_by uuid references public.profiles (id) on delete set null,
  created_by_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (company_id, form_number)
);

create index if not exists paper_forms_company_id_idx on public.paper_forms (company_id);
create index if not exists paper_forms_employee_id_idx on public.paper_forms (employee_id);
create index if not exists paper_forms_status_idx on public.paper_forms (status);

drop trigger if exists trg_paper_forms_updated_at on public.paper_forms;
create trigger trg_paper_forms_updated_at
  before update on public.paper_forms
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- 2) Historie formuláře (bod 25)
-- ------------------------------------------------------------
create table if not exists public.paper_form_history (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.paper_forms (id) on delete cascade,
  change_type paper_form_change_type not null,
  changed_by uuid references public.profiles (id) on delete set null,
  changed_by_name text,
  details jsonb,
  changed_at timestamptz not null default now()
);

create index if not exists paper_form_history_form_id_idx on public.paper_form_history (form_id);

-- ------------------------------------------------------------
-- 3) Row Level Security
-- ------------------------------------------------------------
alter table public.paper_forms enable row level security;
alter table public.paper_form_history enable row level security;

-- SELECT: Majitel vše. Administrátor/Účetní s oprávněním
-- 'papirovy-formular' vše v rámci firmy. Zaměstnanec pouze svůj
-- vlastní přiřazený formulář (bod 27, 9).
drop policy if exists "paper_forms_select_scoped" on public.paper_forms;
create policy "paper_forms_select_scoped"
  on public.paper_forms for select
  using (
    company_id = public.current_company_id()
    and (
      public.current_role() = 'majitel'
      or (
        public.current_role() in ('administrator', 'ucetni')
        and exists (
          select 1 from public.module_permissions
          where profile_id = auth.uid() and module_key = 'papirovy-formular' and can_access = true
        )
      )
      or exists (
        select 1 from public.employees e
        where e.id = paper_forms.employee_id and e.profile_id = auth.uid()
      )
    )
  );

-- INSERT/UPDATE: Majitel, nebo Administrátor s oprávněním (bod 27 -
-- Účetní a Zaměstnanec nesmí vytvářet ani přiřazovat formuláře).
drop policy if exists "paper_forms_write_scoped" on public.paper_forms;
create policy "paper_forms_write_scoped"
  on public.paper_forms for all
  using (
    company_id = public.current_company_id()
    and (
      public.current_role() = 'majitel'
      or (
        public.current_role() = 'administrator'
        and exists (
          select 1 from public.module_permissions
          where profile_id = auth.uid() and module_key = 'papirovy-formular' and can_access = true
        )
      )
    )
  )
  with check (company_id = public.current_company_id());

-- Žádná DELETE politika - zneplatnění je jediný způsob "zrušení"
-- formuláře, historie zůstává zachovaná (bod 24).

drop policy if exists "paper_form_history_select_scoped" on public.paper_form_history;
create policy "paper_form_history_select_scoped"
  on public.paper_form_history for select
  using (
    exists (
      select 1 from public.paper_forms pf
      where pf.id = paper_form_history.form_id
        and pf.company_id = public.current_company_id()
        and (
          public.current_role() = 'majitel'
          or (
            public.current_role() in ('administrator', 'ucetni')
            and exists (
              select 1 from public.module_permissions
              where profile_id = auth.uid() and module_key = 'papirovy-formular' and can_access = true
            )
          )
          or exists (
            select 1 from public.employees e
            where e.id = pf.employee_id and e.profile_id = auth.uid()
          )
        )
    )
  );

drop policy if exists "paper_form_history_insert_scoped" on public.paper_form_history;
create policy "paper_form_history_insert_scoped"
  on public.paper_form_history for insert
  with check (
    exists (
      select 1 from public.paper_forms pf
      where pf.id = paper_form_history.form_id
        and pf.company_id = public.current_company_id()
        and (
          public.current_role() = 'majitel'
          or (
            public.current_role() in ('administrator', 'ucetni')
            and exists (
              select 1 from public.module_permissions
              where profile_id = auth.uid() and module_key = 'papirovy-formular' and can_access = true
            )
          )
          or exists (
            select 1 from public.employees e
            where e.id = pf.employee_id and e.profile_id = auth.uid()
          )
        )
    )
  );
