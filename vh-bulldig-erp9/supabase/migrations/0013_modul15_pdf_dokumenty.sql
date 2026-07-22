-- ============================================================
-- VH BULLDIG ERP 9 – MODUL 15: PDF DOKUMENTY A VÝPLATNÍ PÁSKY
-- Ukládá se evidence vygenerovaných dokumentů a jejich SKUTEČNÝ PDF
-- soubor (ne jen data k přegenerování) - staré dokumenty (např.
-- výplatní pásky) se tak nikdy nezmění, i kdyby se později změnil
-- ceník, šablona nebo cokoliv jiného (bod 12 zadání).
-- ============================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'document_type') then
    create type document_type as enum (
      'firemni_udaje',
      'karta_zamestnance',
      'seznam_zamestnancu',
      'dochazka_zamestnance',
      'dochazka_za_obdobi',
      'vykaz_zamestnance',
      'vykaz_zakazky',
      'prehled_nakladu',
      'stavebni_denik',
      'fakturace_a_prehled_zisku',
      'kompletni_mzdovy_prehled',
      'vyplatni_paska',
      'dokumentace_pripojky',
      'gps_fotodokumentace'
    );
  end if;
end $$;

create table if not exists public.generated_documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,

  document_type document_type not null,
  file_name text not null,
  file_url text not null,
  file_path text not null,

  employee_id uuid references public.employees (id) on delete set null,
  order_id uuid references public.orders (id) on delete set null,
  period_from date,
  period_to date,

  created_by uuid references public.profiles (id) on delete set null,
  created_by_name text,

  created_at timestamptz not null default now()
);

create index if not exists generated_documents_company_id_idx on public.generated_documents (company_id);
create index if not exists generated_documents_type_idx on public.generated_documents (document_type);
create index if not exists generated_documents_employee_id_idx on public.generated_documents (employee_id);
create index if not exists generated_documents_order_id_idx on public.generated_documents (order_id);

alter table public.generated_documents enable row level security;

-- SELECT: Majitel vše. Administrátor/Účetní s oprávněním
-- 'pdf-a-vyplatni-pasky' vše v rámci firmy. Zaměstnanec pouze
-- dokumenty/výplatní pásky vztahující se k jeho vlastnímu záznamu
-- zaměstnance (bod 18 - "pouze své povolené dokumenty").
drop policy if exists "generated_documents_select_scoped" on public.generated_documents;
create policy "generated_documents_select_scoped"
  on public.generated_documents for select
  using (
    company_id = public.current_company_id()
    and (
      public.current_role() = 'majitel'
      or (
        public.current_role() in ('administrator', 'ucetni')
        and exists (
          select 1 from public.module_permissions
          where profile_id = auth.uid() and module_key = 'pdf-a-vyplatni-pasky' and can_access = true
        )
      )
      or exists (
        select 1 from public.employees e
        where e.id = generated_documents.employee_id and e.profile_id = auth.uid()
      )
    )
  );

-- INSERT: Majitel, nebo Administrátor/Účetní s oprávněním.
-- Zaměstnanec si dokumenty sám nevytváří (bod 18 mu dává jen
-- zobrazení a stažení, ne vytváření).
drop policy if exists "generated_documents_insert_scoped" on public.generated_documents;
create policy "generated_documents_insert_scoped"
  on public.generated_documents for insert
  with check (
    company_id = public.current_company_id()
    and (
      public.current_role() = 'majitel'
      or (
        public.current_role() in ('administrator', 'ucetni')
        and exists (
          select 1 from public.module_permissions
          where profile_id = auth.uid() and module_key = 'pdf-a-vyplatni-pasky' and can_access = true
        )
      )
    )
  );

-- Žádné UPDATE/DELETE politiky - jednou vytvořený dokument je
-- neměnná evidence (odpovídá požadavku na zachování starých
-- dokumentů beze změny).

-- ------------------------------------------------------------
-- Storage bucket pro uložené PDF soubory
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('generated-documents', 'generated-documents', true)
on conflict (id) do nothing;

drop policy if exists "generated_documents_bucket_public_read" on storage.objects;
create policy "generated_documents_bucket_public_read"
  on storage.objects for select
  using (bucket_id = 'generated-documents');

-- Cesta k souboru má tvar <company_id>/<neco>. Nahrát smí kdokoliv,
-- kdo smí vytvořit odpovídající řádek evidence (viz výše) - kontrola
-- probíhá primárně přes generated_documents INSERT politiku;
-- storage zápis stačí omezit na stejnou firmu.
drop policy if exists "generated_documents_bucket_write_same_company" on storage.objects;
create policy "generated_documents_bucket_write_same_company"
  on storage.objects for insert
  with check (
    bucket_id = 'generated-documents'
    and (storage.foldername(name))[1] = public.current_company_id()::text
  );
