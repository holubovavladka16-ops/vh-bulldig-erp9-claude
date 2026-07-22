-- ============================================================
-- VH BULLDIG ERP 9 – MODUL (nad rámec původních 20, schváleno):
-- SMLOUVY, OBJEDNÁVKY A PRACOVNĚPRÁVNÍ DOKUMENTY
-- ============================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'document_type_v2') then
    create type document_type_v2 as enum (
      'pracovni_smlouva', 'dpp', 'dpc', 'dodatek_pracovni_smlouvy',
      'dohoda_o_ukonceni', 'vypoved', 'potvrzeni_o_zamestnani',
      'objednavka_praci', 'smlouva_o_dilo', 'dodatek_smlouvy_o_dilo',
      'predavaci_protokol', 'predavaci_protokol_zakazky', 'protokol_o_prevzeti_praci',
      'cestne_prohlaseni', 'plna_moc', 'mlcenlivost', 'souhlas_gdpr',
      'interni_dokument', 'jiny_dokument'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'document_category') then
    create type document_category as enum ('pracovnepravni', 'obchodni', 'ostatni');
  end if;

  if not exists (select 1 from pg_type where typname = 'document_status_v2') then
    create type document_status_v2 as enum (
      'rozepsany', 'pripraveny_ke_kontrole', 'schvaleny', 'odeslany_k_podpisu',
      'podepsany', 'ukonceny', 'zruseny', 'archivovany'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'signature_method') then
    create type signature_method as enum ('rucni_na_papire', 'nahrany_soubor', 'na_obrazovce');
  end if;

  if not exists (select 1 from pg_type where typname = 'document_change_type') then
    create type document_change_type as enum (
      'vytvoreni', 'zmena_typu', 'zmena_nazvu', 'zmena_smluvni_strany', 'zmena_zamestnance',
      'zmena_zakazky', 'zmena_textu', 'zmena_ceny', 'zmena_terminu', 'zmena_stavu',
      'nova_verze', 'schvaleni', 'odeslani', 'podpis', 'ukonceni', 'zruseni', 'archivace'
    );
  end if;
end $$;

-- ------------------------------------------------------------
-- 1) Dokumenty
-- ------------------------------------------------------------
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,

  document_type document_type_v2 not null,
  custom_type_name text, -- pouze pro 'jiny_dokument'
  category document_category not null,

  document_number text not null,
  title text not null,

  created_date date not null default current_date,
  effective_date date,
  expiry_date date,

  status document_status_v2 not null default 'rozepsany',
  version_number integer not null default 1,

  employee_id uuid references public.employees (id) on delete set null,
  order_id uuid references public.orders (id) on delete set null,
  related_document_id uuid references public.documents (id) on delete set null, -- pro dodatky

  counterparty jsonb, -- objednatel/dodavatel (bod 20)
  variables jsonb not null default '{}'::jsonb, -- hodnoty specifické pro daný typ (bod 9-19)
  content text not null default '', -- HTML obsah editoru (bod 24-25)

  note text,

  sent_to_name text,
  sent_to_contact text,
  sent_at timestamptz,
  sent_by uuid references public.profiles (id) on delete set null,
  sent_by_name text,

  approved_at timestamptz,
  approved_by uuid references public.profiles (id) on delete set null,
  approved_by_name text,

  terminated_at timestamptz,
  terminated_by uuid references public.profiles (id) on delete set null,
  cancelled_at timestamptz,
  cancelled_by uuid references public.profiles (id) on delete set null,
  archived_at timestamptz,
  archived_by uuid references public.profiles (id) on delete set null,

  created_by uuid references public.profiles (id) on delete set null,
  created_by_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (company_id, document_number)
);

create index if not exists documents_company_id_idx on public.documents (company_id);
create index if not exists documents_employee_id_idx on public.documents (employee_id);
create index if not exists documents_order_id_idx on public.documents (order_id);
create index if not exists documents_status_idx on public.documents (status);
create index if not exists documents_type_idx on public.documents (document_type);

drop trigger if exists trg_documents_updated_at on public.documents;
create trigger trg_documents_updated_at
  before update on public.documents
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- 2) Verze dokumentu (bod 31)
-- ------------------------------------------------------------
create table if not exists public.document_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents (id) on delete cascade,
  version_number integer not null,
  content text not null,
  variables jsonb not null default '{}'::jsonb,
  reason text,
  created_by uuid references public.profiles (id) on delete set null,
  created_by_name text,
  created_at timestamptz not null default now()
);

create index if not exists document_versions_document_id_idx on public.document_versions (document_id);

-- ------------------------------------------------------------
-- 3) Přílohy (bod 26)
-- ------------------------------------------------------------
create table if not exists public.document_attachments (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents (id) on delete cascade,
  file_path text not null,
  file_name text not null,
  file_type text not null,
  created_by uuid references public.profiles (id) on delete set null,
  created_by_name text,
  created_at timestamptz not null default now()
);

create index if not exists document_attachments_document_id_idx on public.document_attachments (document_id);

-- ------------------------------------------------------------
-- 4) Podpisy (bod 27-28, 37)
-- ------------------------------------------------------------
create table if not exists public.document_signatures (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents (id) on delete cascade,
  signer_name text not null,
  signer_role text not null, -- 'zamestnanec' | 'zamestnavatel' | 'objednatel' | 'zhotovitel' | 'jiny'
  employee_id uuid references public.employees (id) on delete set null,
  method signature_method,
  signed boolean not null default false,
  signed_at timestamptz,
  version_number integer not null default 1,
  signature_image_path text, -- pro podpis na obrazovce
  uploaded_file_path text, -- pro nahraný podepsaný dokument
  created_at timestamptz not null default now()
);

create index if not exists document_signatures_document_id_idx on public.document_signatures (document_id);

-- ------------------------------------------------------------
-- 5) Historie (bod 32)
-- ------------------------------------------------------------
create table if not exists public.document_history (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents (id) on delete cascade,
  change_type document_change_type not null,
  changed_by uuid references public.profiles (id) on delete set null,
  changed_by_name text,
  details jsonb,
  changed_at timestamptz not null default now()
);

create index if not exists document_history_document_id_idx on public.document_history (document_id);

-- ------------------------------------------------------------
-- 6) Row Level Security
-- ------------------------------------------------------------
alter table public.documents enable row level security;
alter table public.document_versions enable row level security;
alter table public.document_attachments enable row level security;
alter table public.document_signatures enable row level security;
alter table public.document_history enable row level security;

-- SELECT: Majitel vše. Administrátor/Účetní s oprávněním
-- 'smlouvy-a-dokumenty' vše v rámci firmy. Zaměstnanec pouze své
-- vlastní pracovněprávní dokumenty (bod 43).
drop policy if exists "documents_select_scoped" on public.documents;
create policy "documents_select_scoped"
  on public.documents for select
  using (
    company_id = public.current_company_id()
    and (
      public.current_role() = 'majitel'
      or (
        public.current_role() in ('administrator', 'ucetni')
        and exists (
          select 1 from public.module_permissions
          where profile_id = auth.uid() and module_key = 'smlouvy-a-dokumenty' and can_access = true
        )
      )
      or (
        category = 'pracovnepravni'
        and exists (select 1 from public.employees e where e.id = documents.employee_id and e.profile_id = auth.uid())
      )
    )
  );

-- INSERT/UPDATE: Majitel, nebo Administrátor/Účetní s oprávněním.
-- Zaměstnanec NIKDY nezapisuje do hlavní tabulky dokumentů (svůj
-- podpis vkládá samostatně do document_signatures - viz níže).
drop policy if exists "documents_write_scoped" on public.documents;
create policy "documents_write_scoped"
  on public.documents for all
  using (
    company_id = public.current_company_id()
    and (
      public.current_role() = 'majitel'
      or (
        public.current_role() in ('administrator', 'ucetni')
        and exists (
          select 1 from public.module_permissions
          where profile_id = auth.uid() and module_key = 'smlouvy-a-dokumenty' and can_access = true
        )
      )
    )
  )
  with check (company_id = public.current_company_id());

-- Verze, přílohy, historie: viditelnost zrcadlí rodičovský dokument.
drop policy if exists "document_versions_select_scoped" on public.document_versions;
create policy "document_versions_select_scoped"
  on public.document_versions for select
  using (
    exists (
      select 1 from public.documents d
      where d.id = document_versions.document_id and d.company_id = public.current_company_id()
        and (
          public.current_role() = 'majitel'
          or (
            public.current_role() in ('administrator', 'ucetni')
            and exists (select 1 from public.module_permissions where profile_id = auth.uid() and module_key = 'smlouvy-a-dokumenty' and can_access = true)
          )
          or (d.category = 'pracovnepravni' and exists (select 1 from public.employees e where e.id = d.employee_id and e.profile_id = auth.uid()))
        )
    )
  );

drop policy if exists "document_versions_write_scoped" on public.document_versions;
create policy "document_versions_write_scoped"
  on public.document_versions for insert
  with check (
    exists (
      select 1 from public.documents d
      where d.id = document_versions.document_id and d.company_id = public.current_company_id()
        and (
          public.current_role() = 'majitel'
          or (
            public.current_role() in ('administrator', 'ucetni')
            and exists (select 1 from public.module_permissions where profile_id = auth.uid() and module_key = 'smlouvy-a-dokumenty' and can_access = true)
          )
        )
    )
  );

drop policy if exists "document_attachments_select_scoped" on public.document_attachments;
create policy "document_attachments_select_scoped"
  on public.document_attachments for select
  using (
    exists (
      select 1 from public.documents d
      where d.id = document_attachments.document_id and d.company_id = public.current_company_id()
        and (
          public.current_role() = 'majitel'
          or (
            public.current_role() in ('administrator', 'ucetni')
            and exists (select 1 from public.module_permissions where profile_id = auth.uid() and module_key = 'smlouvy-a-dokumenty' and can_access = true)
          )
          or (d.category = 'pracovnepravni' and exists (select 1 from public.employees e where e.id = d.employee_id and e.profile_id = auth.uid()))
        )
    )
  );

drop policy if exists "document_attachments_write_scoped" on public.document_attachments;
create policy "document_attachments_write_scoped"
  on public.document_attachments for all
  using (
    exists (
      select 1 from public.documents d
      where d.id = document_attachments.document_id and d.company_id = public.current_company_id()
        and (
          public.current_role() = 'majitel'
          or (
            public.current_role() in ('administrator', 'ucetni')
            and exists (select 1 from public.module_permissions where profile_id = auth.uid() and module_key = 'smlouvy-a-dokumenty' and can_access = true)
          )
        )
    )
  );

-- Podpisy: SELECT stejně jako dokument. INSERT navíc povolen i
-- samotnému zaměstnanci, ale POUZE pro jeho vlastní podpisový řádek
-- (signer se shoduje s jeho employee_id) na dokumentu ve stavu
-- 'odeslany_k_podpisu' - to je jediný zápis, který smí zaměstnanec
-- v tomto modulu provést (bod 43 - "podepsat dokument určený přímo jemu").
drop policy if exists "document_signatures_select_scoped" on public.document_signatures;
create policy "document_signatures_select_scoped"
  on public.document_signatures for select
  using (
    exists (
      select 1 from public.documents d
      where d.id = document_signatures.document_id and d.company_id = public.current_company_id()
        and (
          public.current_role() = 'majitel'
          or (
            public.current_role() in ('administrator', 'ucetni')
            and exists (select 1 from public.module_permissions where profile_id = auth.uid() and module_key = 'smlouvy-a-dokumenty' and can_access = true)
          )
          or (d.category = 'pracovnepravni' and exists (select 1 from public.employees e where e.id = d.employee_id and e.profile_id = auth.uid()))
        )
    )
  );

drop policy if exists "document_signatures_write_by_admins" on public.document_signatures;
create policy "document_signatures_write_by_admins"
  on public.document_signatures for all
  using (
    exists (
      select 1 from public.documents d
      where d.id = document_signatures.document_id and d.company_id = public.current_company_id()
        and (
          public.current_role() = 'majitel'
          or (
            public.current_role() in ('administrator', 'ucetni')
            and exists (select 1 from public.module_permissions where profile_id = auth.uid() and module_key = 'smlouvy-a-dokumenty' and can_access = true)
          )
        )
    )
  );

drop policy if exists "document_signatures_employee_self_sign" on public.document_signatures;
create policy "document_signatures_employee_self_sign"
  on public.document_signatures for insert
  with check (
    public.current_role() = 'zamestnanec'
    and exists (
      select 1 from public.documents d
      join public.employees e on e.id = d.employee_id
      where d.id = document_signatures.document_id
        and d.status = 'odeslany_k_podpisu'
        and e.profile_id = auth.uid()
        and document_signatures.employee_id = e.id
    )
  );

drop policy if exists "document_history_select_scoped" on public.document_history;
create policy "document_history_select_scoped"
  on public.document_history for select
  using (
    exists (
      select 1 from public.documents d
      where d.id = document_history.document_id and d.company_id = public.current_company_id()
        and (
          public.current_role() = 'majitel'
          or (
            public.current_role() in ('administrator', 'ucetni')
            and exists (select 1 from public.module_permissions where profile_id = auth.uid() and module_key = 'smlouvy-a-dokumenty' and can_access = true)
          )
          or (d.category = 'pracovnepravni' and exists (select 1 from public.employees e where e.id = d.employee_id and e.profile_id = auth.uid()))
        )
    )
  );

drop policy if exists "document_history_insert_scoped" on public.document_history;
create policy "document_history_insert_scoped"
  on public.document_history for insert
  with check (
    exists (
      select 1 from public.documents d
      where d.id = document_history.document_id and d.company_id = public.current_company_id()
    )
    -- Historie se zapisuje při jakékoliv povolené akci (vč. podpisu
    -- zaměstnancem) - proto zde není další omezení role; skutečná
    -- kontrola akce proběhla už při zápisu do documents/document_signatures.
  );

-- ------------------------------------------------------------
-- 7) Storage buckety - PRIVÁTNÍ (bod 44-45), jen podepsané URL.
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('document-attachments', 'document-attachments', false)
on conflict (id) do update set public = false;

insert into storage.buckets (id, name, public)
values ('document-signatures', 'document-signatures', false)
on conflict (id) do update set public = false;

drop policy if exists "document_attachments_bucket_scoped" on storage.objects;
create policy "document_attachments_bucket_scoped"
  on storage.objects for all
  using (
    bucket_id = 'document-attachments'
    and (storage.foldername(name))[1] = public.current_company_id()::text
    and (
      public.current_role() = 'majitel'
      or (
        public.current_role() in ('administrator', 'ucetni')
        and exists (select 1 from public.module_permissions where profile_id = auth.uid() and module_key = 'smlouvy-a-dokumenty' and can_access = true)
      )
    )
  )
  with check (
    bucket_id = 'document-attachments'
    and (storage.foldername(name))[1] = public.current_company_id()::text
  );

drop policy if exists "document_signatures_bucket_scoped" on storage.objects;
create policy "document_signatures_bucket_scoped"
  on storage.objects for all
  using (
    bucket_id = 'document-signatures'
    and (storage.foldername(name))[1] = public.current_company_id()::text
  )
  with check (
    bucket_id = 'document-signatures'
    and (storage.foldername(name))[1] = public.current_company_id()::text
  );
