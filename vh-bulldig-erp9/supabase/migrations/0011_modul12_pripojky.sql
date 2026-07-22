-- ============================================================
-- VH BULLDIG ERP 9 – MODUL 12: PŘÍPOJKY
-- ============================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'connection_measurement_method') then
    create type connection_measurement_method as enum ('prubezne_gps', 'body_a_b', 'dve_adresy');
  end if;

  if not exists (select 1 from pg_type where typname = 'connection_change_type') then
    create type connection_change_type as enum (
      'vytvoreni', 'zmena_nazvu', 'zmena_zakazky', 'zmena_mereni', 'zmena_delky',
      'zmena_gps_bodu', 'pridani_fotografie', 'odstraneni_fotografie', 'zmena_poznamky'
    );
  end if;
end $$;

-- ------------------------------------------------------------
-- 1) Přípojky
-- ------------------------------------------------------------
create table if not exists public.connections (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  order_id uuid not null references public.orders (id) on delete restrict,

  connection_date date not null default current_date,
  name text not null,
  note text,

  measurement_method connection_measurement_method not null,
  measured_length_meters numeric(10, 2),
  measurement_started_at timestamptz,
  measurement_ended_at timestamptz,

  created_by uuid references public.profiles (id) on delete set null,
  created_by_name text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists connections_company_id_idx on public.connections (company_id);
create index if not exists connections_order_id_idx on public.connections (order_id);
create index if not exists connections_date_idx on public.connections (connection_date);

drop trigger if exists trg_connections_updated_at on public.connections;
create trigger trg_connections_updated_at
  before update on public.connections
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- 2) GPS body (bod 8)
-- ------------------------------------------------------------
create table if not exists public.connection_points (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.connections (id) on delete cascade,
  latitude double precision not null,
  longitude double precision not null,
  accuracy double precision,
  point_order integer not null default 0,
  label text, -- např. 'A', 'B', 'pocatek', 'cil', nebo prázdné pro průběžnou trasu
  recorded_at timestamptz not null default now()
);

create index if not exists connection_points_connection_id_idx on public.connection_points (connection_id);

-- ------------------------------------------------------------
-- 3) Fotografie přípojky (bod 10)
-- ------------------------------------------------------------
create table if not exists public.connection_photos (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.connections (id) on delete cascade,
  point_id uuid references public.connection_points (id) on delete set null,
  photo_url text not null,
  photo_path text not null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists connection_photos_connection_id_idx on public.connection_photos (connection_id);

-- ------------------------------------------------------------
-- 4) Historie změn (bod 15)
-- ------------------------------------------------------------
create table if not exists public.connection_history (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.connections (id) on delete cascade,
  change_type connection_change_type not null,
  changed_by uuid references public.profiles (id) on delete set null,
  changed_by_name text,
  details jsonb,
  changed_at timestamptz not null default now()
);

create index if not exists connection_history_connection_id_idx on public.connection_history (connection_id);

-- ------------------------------------------------------------
-- 5) Row Level Security
-- ------------------------------------------------------------
alter table public.connections enable row level security;
alter table public.connection_points enable row level security;
alter table public.connection_photos enable row level security;
alter table public.connection_history enable row level security;

-- SELECT: Majitel vše. Administrátor/Účetní s oprávněním 'pripojky'
-- vše v rámci firmy.
--
-- Poznámka k bodu 19 zadání ("Zaměstnanec může vytvářet a zobrazovat
-- pouze povolené záznamy přiřazených zakázek"): v aplikaci zatím
-- neexistuje žádný mechanismus přiřazení konkrétního zaměstnance ke
-- konkrétní zakázce (stejná situace jako u Modulu 6 - Zakázky).
-- Dokud takový mechanismus nevznikne, Zaměstnanec zde záměrně nemá
-- žádnou politiku (výchozí zamítnutí), aby nedostal přístup k datům,
-- ke kterým by podle zadání neměl mít nárok.
drop policy if exists "connections_select_scoped" on public.connections;
create policy "connections_select_scoped"
  on public.connections for select
  using (
    company_id = public.current_company_id()
    and (
      public.current_role() = 'majitel'
      or (
        public.current_role() in ('administrator', 'ucetni')
        and exists (
          select 1 from public.module_permissions
          where profile_id = auth.uid() and module_key = 'pripojky' and can_access = true
        )
      )
    )
  );

drop policy if exists "connections_write_scoped" on public.connections;
create policy "connections_write_scoped"
  on public.connections for all
  using (
    company_id = public.current_company_id()
    and (
      public.current_role() = 'majitel'
      or (
        public.current_role() = 'administrator'
        and exists (
          select 1 from public.module_permissions
          where profile_id = auth.uid() and module_key = 'pripojky' and can_access = true
        )
      )
    )
  )
  with check (company_id = public.current_company_id());

-- Body/fotografie/historie zrcadlí viditelnost a zápis rodičovské přípojky.
drop policy if exists "connection_points_select_scoped" on public.connection_points;
create policy "connection_points_select_scoped"
  on public.connection_points for select
  using (
    exists (
      select 1 from public.connections c
      where c.id = connection_points.connection_id and c.company_id = public.current_company_id()
        and (
          public.current_role() = 'majitel'
          or (
            public.current_role() in ('administrator', 'ucetni')
            and exists (select 1 from public.module_permissions where profile_id = auth.uid() and module_key = 'pripojky' and can_access = true)
          )
        )
    )
  );

drop policy if exists "connection_points_write_scoped" on public.connection_points;
create policy "connection_points_write_scoped"
  on public.connection_points for all
  using (
    exists (
      select 1 from public.connections c
      where c.id = connection_points.connection_id and c.company_id = public.current_company_id()
        and (
          public.current_role() = 'majitel'
          or (
            public.current_role() = 'administrator'
            and exists (select 1 from public.module_permissions where profile_id = auth.uid() and module_key = 'pripojky' and can_access = true)
          )
        )
    )
  );

drop policy if exists "connection_photos_select_scoped" on public.connection_photos;
create policy "connection_photos_select_scoped"
  on public.connection_photos for select
  using (
    exists (
      select 1 from public.connections c
      where c.id = connection_photos.connection_id and c.company_id = public.current_company_id()
        and (
          public.current_role() = 'majitel'
          or (
            public.current_role() in ('administrator', 'ucetni')
            and exists (select 1 from public.module_permissions where profile_id = auth.uid() and module_key = 'pripojky' and can_access = true)
          )
        )
    )
  );

drop policy if exists "connection_photos_write_scoped" on public.connection_photos;
create policy "connection_photos_write_scoped"
  on public.connection_photos for all
  using (
    exists (
      select 1 from public.connections c
      where c.id = connection_photos.connection_id and c.company_id = public.current_company_id()
        and (
          public.current_role() = 'majitel'
          or (
            public.current_role() = 'administrator'
            and exists (select 1 from public.module_permissions where profile_id = auth.uid() and module_key = 'pripojky' and can_access = true)
          )
        )
    )
  );

drop policy if exists "connection_history_select_scoped" on public.connection_history;
create policy "connection_history_select_scoped"
  on public.connection_history for select
  using (
    exists (
      select 1 from public.connections c
      where c.id = connection_history.connection_id and c.company_id = public.current_company_id()
        and (
          public.current_role() = 'majitel'
          or (
            public.current_role() in ('administrator', 'ucetni')
            and exists (select 1 from public.module_permissions where profile_id = auth.uid() and module_key = 'pripojky' and can_access = true)
          )
        )
    )
  );

drop policy if exists "connection_history_insert_scoped" on public.connection_history;
create policy "connection_history_insert_scoped"
  on public.connection_history for insert
  with check (
    exists (
      select 1 from public.connections c
      where c.id = connection_history.connection_id and c.company_id = public.current_company_id()
        and (
          public.current_role() = 'majitel'
          or (
            public.current_role() = 'administrator'
            and exists (select 1 from public.module_permissions where profile_id = auth.uid() and module_key = 'pripojky' and can_access = true)
          )
        )
    )
  );

-- ------------------------------------------------------------
-- 6) Supabase Storage bucket pro fotografie přípojek
--    Veřejně čitelný (stejný vzor jako logo/vodoznak/fotky zaměstnanců)
--    kvůli sdílení PDF s fotografiemi mimo aplikaci (bod 17).
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('connection-photos', 'connection-photos', true)
on conflict (id) do nothing;

drop policy if exists "connection_photos_bucket_public_read" on storage.objects;
create policy "connection_photos_bucket_public_read"
  on storage.objects for select
  using (bucket_id = 'connection-photos');

drop policy if exists "connection_photos_bucket_write_by_admins" on storage.objects;
create policy "connection_photos_bucket_write_by_admins"
  on storage.objects for all
  using (
    bucket_id = 'connection-photos'
    and (
      public.current_role() = 'majitel'
      or (
        public.current_role() = 'administrator'
        and exists (
          select 1 from public.module_permissions
          where profile_id = auth.uid() and module_key = 'pripojky' and can_access = true
        )
      )
    )
  )
  with check (bucket_id = 'connection-photos');
