-- ============================================================
-- VH BULLDIG ERP 9 – MODUL 13: FOTODOKUMENTACE S GPS
-- ============================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'gps_photo_change_type') then
    create type gps_photo_change_type as enum (
      'vytvoreni', 'zmena_zakazky', 'zmena_poznamky', 'opakovane_nacteni_gps', 'zmena_adresy'
    );
  end if;
end $$;

-- ------------------------------------------------------------
-- 1) Fotografie s GPS (bod 9, 11)
-- ------------------------------------------------------------
create table if not exists public.gps_photos (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  order_id uuid not null references public.orders (id) on delete restrict,

  photo_url text not null,
  photo_path text not null,

  latitude double precision,
  longitude double precision,
  accuracy double precision,
  address text,

  taken_at timestamptz not null default now(),
  author_id uuid references public.profiles (id) on delete set null,
  author_name text,
  note text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists gps_photos_company_id_idx on public.gps_photos (company_id);
create index if not exists gps_photos_order_id_idx on public.gps_photos (order_id);
create index if not exists gps_photos_taken_at_idx on public.gps_photos (taken_at);

drop trigger if exists trg_gps_photos_updated_at on public.gps_photos;
create trigger trg_gps_photos_updated_at
  before update on public.gps_photos
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- 2) Historie změn (bod 24)
-- ------------------------------------------------------------
create table if not exists public.gps_photo_history (
  id uuid primary key default gen_random_uuid(),
  photo_id uuid not null references public.gps_photos (id) on delete cascade,
  change_type gps_photo_change_type not null,
  changed_by uuid references public.profiles (id) on delete set null,
  changed_by_name text,
  details jsonb,
  changed_at timestamptz not null default now()
);

create index if not exists gps_photo_history_photo_id_idx on public.gps_photo_history (photo_id);

-- ------------------------------------------------------------
-- 3) Row Level Security
-- ------------------------------------------------------------
alter table public.gps_photos enable row level security;
alter table public.gps_photo_history enable row level security;

-- SELECT: Majitel vše. Administrátor/Účetní s oprávněním 'foto-gps'
-- vše v rámci firmy. Zaměstnanec vidí pouze fotografie, které sám
-- pořídil (bod 26 - "své povolené fotografie"; jediný jednoznačný
-- význam "svých" fotografií je autorství, protože v aplikaci
-- neexistuje mechanismus přiřazení zaměstnance k zakázce).
drop policy if exists "gps_photos_select_scoped" on public.gps_photos;
create policy "gps_photos_select_scoped"
  on public.gps_photos for select
  using (
    company_id = public.current_company_id()
    and (
      public.current_role() = 'majitel'
      or (
        public.current_role() in ('administrator', 'ucetni')
        and exists (
          select 1 from public.module_permissions
          where profile_id = auth.uid() and module_key = 'foto-gps' and can_access = true
        )
      )
      or author_id = auth.uid()
    )
  );

-- INSERT: Majitel, Administrátor s oprávněním, NEBO libovolný
-- přihlášený Zaměstnanec (bod 26 mu výslovně dovoluje pořizovat
-- fotografie) - ale vždy pouze se svým vlastním author_id.
drop policy if exists "gps_photos_insert_scoped" on public.gps_photos;
create policy "gps_photos_insert_scoped"
  on public.gps_photos for insert
  with check (
    company_id = public.current_company_id()
    and (
      public.current_role() = 'majitel'
      or (
        public.current_role() = 'administrator'
        and exists (
          select 1 from public.module_permissions
          where profile_id = auth.uid() and module_key = 'foto-gps' and can_access = true
        )
      )
      or (public.current_role() = 'zamestnanec' and author_id = auth.uid())
    )
  );

-- UPDATE: Majitel, Administrátor s oprávněním, nebo autor své vlastní
-- fotografie (úprava zakázky/poznámky/opakované načtení GPS).
-- Žádná DELETE politika.
drop policy if exists "gps_photos_update_scoped" on public.gps_photos;
create policy "gps_photos_update_scoped"
  on public.gps_photos for update
  using (
    company_id = public.current_company_id()
    and (
      public.current_role() = 'majitel'
      or (
        public.current_role() = 'administrator'
        and exists (
          select 1 from public.module_permissions
          where profile_id = auth.uid() and module_key = 'foto-gps' and can_access = true
        )
      )
      or author_id = auth.uid()
    )
  )
  with check (company_id = public.current_company_id());

drop policy if exists "gps_photo_history_select_scoped" on public.gps_photo_history;
create policy "gps_photo_history_select_scoped"
  on public.gps_photo_history for select
  using (
    exists (
      select 1 from public.gps_photos p
      where p.id = gps_photo_history.photo_id
        and p.company_id = public.current_company_id()
        and (
          public.current_role() = 'majitel'
          or (
            public.current_role() in ('administrator', 'ucetni')
            and exists (select 1 from public.module_permissions where profile_id = auth.uid() and module_key = 'foto-gps' and can_access = true)
          )
          or p.author_id = auth.uid()
        )
    )
  );

drop policy if exists "gps_photo_history_insert_scoped" on public.gps_photo_history;
create policy "gps_photo_history_insert_scoped"
  on public.gps_photo_history for insert
  with check (
    exists (
      select 1 from public.gps_photos p
      where p.id = gps_photo_history.photo_id
        and p.company_id = public.current_company_id()
        and (
          public.current_role() = 'majitel'
          or (
            public.current_role() = 'administrator'
            and exists (select 1 from public.module_permissions where profile_id = auth.uid() and module_key = 'foto-gps' and can_access = true)
          )
          or p.author_id = auth.uid()
        )
    )
  );

-- ------------------------------------------------------------
-- 4) Supabase Storage bucket pro fotografie s GPS
--    Veřejně čitelný (stejný vzor jako u ostatních modulů) kvůli
--    sdílení PDF fotodokumentace mimo aplikaci.
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('gps-photos', 'gps-photos', true)
on conflict (id) do nothing;

drop policy if exists "gps_photos_bucket_public_read" on storage.objects;
create policy "gps_photos_bucket_public_read"
  on storage.objects for select
  using (bucket_id = 'gps-photos');

-- Cesta k souboru má tvar <company_id>/<neco>. Nahrát smí kdokoliv
-- přihlášený ve stejné firmě (Zaměstnanec fotí sám sobě, viz výše).
drop policy if exists "gps_photos_bucket_write_same_company" on storage.objects;
create policy "gps_photos_bucket_write_same_company"
  on storage.objects for all
  using (
    bucket_id = 'gps-photos'
    and (storage.foldername(name))[1] = public.current_company_id()::text
  )
  with check (
    bucket_id = 'gps-photos'
    and (storage.foldername(name))[1] = public.current_company_id()::text
  );
