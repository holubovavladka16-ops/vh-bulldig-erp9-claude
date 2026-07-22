-- ============================================================
-- VH BULLDIG ERP 9 – MODUL 20: KONTROLA PAPÍROVÉHO FORMULÁŘE
-- (Zadání v dokumentu je opět označeno jako "Modul 19", ale obsah
-- jednoznačně odpovídá Modulu 20 "Kontrola papírového formuláře"
-- z hlavního seznamu - "Modul 19 Papírový formulář" už byl vytvořen
-- minule. Postupuji podle obsahu.)
-- ============================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'check_overall_result') then
    create type check_overall_result as enum ('shoda', 'castecna_shoda', 'neshoda', 'nelze_precist');
  end if;

  if not exists (select 1 from pg_type where typname = 'check_status') then
    create type check_status as enum ('probiha', 'potvrzeno', 'vraceno_k_doreseni', 'uzavreno');
  end if;

  if not exists (select 1 from pg_type where typname = 'check_change_type') then
    create type check_change_type as enum (
      'naskenovani_qr', 'nahrani_fotografie', 'kontrola_kvality', 'rozpoznani_udaju',
      'rucni_oprava', 'spusteni_porovnani', 'potvrzeni', 'vraceni_k_doreseni', 'uzavreni'
    );
  end if;
end $$;

-- ------------------------------------------------------------
-- 1) Kontroly papírového formuláře
-- ------------------------------------------------------------
create table if not exists public.paper_form_checks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  form_id uuid not null references public.paper_forms (id) on delete restrict,
  employee_id uuid not null references public.employees (id) on delete restrict,

  month integer not null,
  year integer not null,

  -- Ručně přepsané ("rozpoznané") údaje z papíru - bod 9. Neexistuje
  -- napojení na žádnou OCR/rozpoznávací službu (viz poznámka v
  -- závěrečném hlášení) - jde o přepis oprávněnou osobou dle fotografie.
  recognized_data jsonb not null default '{}'::jsonb,
  -- Audit log ručních oprav jednotlivých hodnot (bod 10).
  corrections jsonb not null default '[]'::jsonb,
  -- Výsledek porovnání po řádcích + měsíční souhrny + podpisy (bod 13-21).
  comparison_result jsonb not null default '{}'::jsonb,

  image_quality_ok boolean,
  image_quality_note text,

  overall_result check_overall_result,
  status check_status not null default 'probiha',

  reviewer_note text,
  return_reason text,
  returned_at timestamptz,
  returned_by uuid references public.profiles (id) on delete set null,
  returned_by_name text,

  closed_at timestamptz,
  closed_by uuid references public.profiles (id) on delete set null,
  closed_by_name text,

  created_by uuid references public.profiles (id) on delete set null,
  created_by_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists paper_form_checks_company_id_idx on public.paper_form_checks (company_id);
create index if not exists paper_form_checks_form_id_idx on public.paper_form_checks (form_id);
create index if not exists paper_form_checks_employee_id_idx on public.paper_form_checks (employee_id);

drop trigger if exists trg_paper_form_checks_updated_at on public.paper_form_checks;
create trigger trg_paper_form_checks_updated_at
  before update on public.paper_form_checks
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- 2) Fotografie/skeny kontroly (bod 6 - lze nahrát více částí)
-- ------------------------------------------------------------
create table if not exists public.paper_form_check_photos (
  id uuid primary key default gen_random_uuid(),
  check_id uuid not null references public.paper_form_checks (id) on delete cascade,
  file_path text not null,
  file_type text not null,
  created_at timestamptz not null default now()
);

create index if not exists paper_form_check_photos_check_id_idx on public.paper_form_check_photos (check_id);

-- ------------------------------------------------------------
-- 3) Historie kontroly (bod 30)
-- ------------------------------------------------------------
create table if not exists public.paper_form_check_history (
  id uuid primary key default gen_random_uuid(),
  check_id uuid not null references public.paper_form_checks (id) on delete cascade,
  change_type check_change_type not null,
  changed_by uuid references public.profiles (id) on delete set null,
  changed_by_name text,
  details jsonb,
  changed_at timestamptz not null default now()
);

create index if not exists paper_form_check_history_check_id_idx on public.paper_form_check_history (check_id);

-- ------------------------------------------------------------
-- 4) Row Level Security
-- ------------------------------------------------------------
alter table public.paper_form_checks enable row level security;
alter table public.paper_form_check_photos enable row level security;
alter table public.paper_form_check_history enable row level security;

-- SELECT: Majitel vše. Administrátor/Účetní s oprávněním
-- 'kontrola-papiroveho-formulare' vše v rámci firmy. Zaměstnanec vidí
-- pouze kontrolu svého vlastního formuláře (bod 32).
drop policy if exists "paper_form_checks_select_scoped" on public.paper_form_checks;
create policy "paper_form_checks_select_scoped"
  on public.paper_form_checks for select
  using (
    company_id = public.current_company_id()
    and (
      public.current_role() = 'majitel'
      or (
        public.current_role() in ('administrator', 'ucetni')
        and exists (
          select 1 from public.module_permissions
          where profile_id = auth.uid() and module_key = 'kontrola-papiroveho-formulare' and can_access = true
        )
      )
      or exists (
        select 1 from public.employees e
        where e.id = paper_form_checks.employee_id and e.profile_id = auth.uid()
      )
    )
  );

-- INSERT/UPDATE: Majitel, nebo Administrátor/Účetní s oprávněním
-- (bod 32 - Účetní zde smí i provádět kontrolu, ne jen zobrazit).
-- Zaměstnanec nikdy nezapisuje.
drop policy if exists "paper_form_checks_write_scoped" on public.paper_form_checks;
create policy "paper_form_checks_write_scoped"
  on public.paper_form_checks for all
  using (
    company_id = public.current_company_id()
    and (
      public.current_role() = 'majitel'
      or (
        public.current_role() in ('administrator', 'ucetni')
        and exists (
          select 1 from public.module_permissions
          where profile_id = auth.uid() and module_key = 'kontrola-papiroveho-formulare' and can_access = true
        )
      )
    )
  )
  with check (company_id = public.current_company_id());

drop policy if exists "paper_form_check_photos_select_scoped" on public.paper_form_check_photos;
create policy "paper_form_check_photos_select_scoped"
  on public.paper_form_check_photos for select
  using (
    exists (
      select 1 from public.paper_form_checks c
      where c.id = paper_form_check_photos.check_id and c.company_id = public.current_company_id()
        and (
          public.current_role() = 'majitel'
          or (
            public.current_role() in ('administrator', 'ucetni')
            and exists (select 1 from public.module_permissions where profile_id = auth.uid() and module_key = 'kontrola-papiroveho-formulare' and can_access = true)
          )
          or exists (select 1 from public.employees e where e.id = c.employee_id and e.profile_id = auth.uid())
        )
    )
  );

drop policy if exists "paper_form_check_photos_write_scoped" on public.paper_form_check_photos;
create policy "paper_form_check_photos_write_scoped"
  on public.paper_form_check_photos for all
  using (
    exists (
      select 1 from public.paper_form_checks c
      where c.id = paper_form_check_photos.check_id and c.company_id = public.current_company_id()
        and (
          public.current_role() = 'majitel'
          or (
            public.current_role() in ('administrator', 'ucetni')
            and exists (select 1 from public.module_permissions where profile_id = auth.uid() and module_key = 'kontrola-papiroveho-formulare' and can_access = true)
          )
        )
    )
  );

drop policy if exists "paper_form_check_history_select_scoped" on public.paper_form_check_history;
create policy "paper_form_check_history_select_scoped"
  on public.paper_form_check_history for select
  using (
    exists (
      select 1 from public.paper_form_checks c
      where c.id = paper_form_check_history.check_id and c.company_id = public.current_company_id()
        and (
          public.current_role() = 'majitel'
          or (
            public.current_role() in ('administrator', 'ucetni')
            and exists (select 1 from public.module_permissions where profile_id = auth.uid() and module_key = 'kontrola-papiroveho-formulare' and can_access = true)
          )
          or exists (select 1 from public.employees e where e.id = c.employee_id and e.profile_id = auth.uid())
        )
    )
  );

drop policy if exists "paper_form_check_history_insert_scoped" on public.paper_form_check_history;
create policy "paper_form_check_history_insert_scoped"
  on public.paper_form_check_history for insert
  with check (
    exists (
      select 1 from public.paper_form_checks c
      where c.id = paper_form_check_history.check_id and c.company_id = public.current_company_id()
        and (
          public.current_role() = 'majitel'
          or (
            public.current_role() in ('administrator', 'ucetni')
            and exists (select 1 from public.module_permissions where profile_id = auth.uid() and module_key = 'kontrola-papiroveho-formulare' and can_access = true)
          )
        )
    )
  );

-- ------------------------------------------------------------
-- 5) Storage bucket - PRIVÁTNÍ, žádné veřejné odkazy (bod 33).
--    Aplikace generuje pouze časově omezené signed URL.
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('paper-form-checks', 'paper-form-checks', false)
on conflict (id) do update set public = false;

drop policy if exists "paper_form_checks_bucket_scoped" on storage.objects;
create policy "paper_form_checks_bucket_scoped"
  on storage.objects for all
  using (
    bucket_id = 'paper-form-checks'
    and (storage.foldername(name))[1] = public.current_company_id()::text
    and (
      public.current_role() = 'majitel'
      or (
        public.current_role() in ('administrator', 'ucetni')
        and exists (
          select 1 from public.module_permissions
          where profile_id = auth.uid() and module_key = 'kontrola-papiroveho-formulare' and can_access = true
        )
      )
    )
  )
  with check (
    bucket_id = 'paper-form-checks'
    and (storage.foldername(name))[1] = public.current_company_id()::text
  );
