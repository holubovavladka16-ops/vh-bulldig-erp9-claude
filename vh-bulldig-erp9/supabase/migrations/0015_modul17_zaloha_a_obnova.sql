-- ============================================================
-- VH BULLDIG ERP 9 – MODUL 17: ZÁLOHA A OBNOVA DATABÁZE
--
-- DŮLEŽITÁ POZNÁMKA (transparentnost): Tento modul poskytuje aplikační
-- (per-firma) zálohu a obnovu dat v rámci veřejného schématu Postgres,
-- spouštěnou pod rolí přihlášeného uživatele. NENÍ to náhrada za
-- infrastrukturní zálohování Supabase (Point-in-Time Recovery / pg_dump
-- na úrovni celého projektu) - to zůstává v kompetenci Supabase a mělo
-- by být zapnuté nezávisle na tomto modulu jako druhá bezpečnostní
-- vrstva. Tento modul nikdy nečte ani nezálohuje auth.users (hesla),
-- ani žádné tajné klíče - to je v souladu s bodem 19 zadání a je to
-- zde technicky zajištěno tím, že se pracuje výhradně se schématem
-- public.
-- ============================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'backup_status') then
    create type backup_status as enum ('probiha', 'dokonceno', 'selhalo');
  end if;
end $$;

-- ------------------------------------------------------------
-- 1) Evidence záloh
-- ------------------------------------------------------------
create table if not exists public.database_backups (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,

  status backup_status not null default 'probiha',
  storage_path text,
  size_bytes bigint,

  created_by uuid references public.profiles (id) on delete set null,
  created_by_name text,
  created_at timestamptz not null default now(),
  completed_at timestamptz,

  -- Technický záznam chyby - viditelný pouze administrátorské rovině
  -- (řešeno na úrovni RLS/UI, ne zvlášť skrytým sloupcem).
  error_message text
);

create index if not exists database_backups_company_id_idx on public.database_backups (company_id);

-- ------------------------------------------------------------
-- 2) Evidence obnov
-- ------------------------------------------------------------
create table if not exists public.database_restores (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,

  backup_id uuid references public.database_backups (id) on delete set null,
  safety_backup_id uuid references public.database_backups (id) on delete set null,

  status backup_status not null default 'probiha',
  initiated_by uuid references public.profiles (id) on delete set null,
  initiated_by_name text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  error_message text
);

create index if not exists database_restores_company_id_idx on public.database_restores (company_id);

alter table public.database_backups enable row level security;
alter table public.database_restores enable row level security;

-- SELECT: Majitel vidí vše. Administrátor s oprávněním 'zaloha-obnova'
-- vidí zálohy/obnovy své firmy (bod 18 - Účetní a Zaměstnanec nesmí
-- vůbec).
drop policy if exists "database_backups_select_scoped" on public.database_backups;
create policy "database_backups_select_scoped"
  on public.database_backups for select
  using (
    company_id = public.current_company_id()
    and (
      public.current_role() = 'majitel'
      or (
        public.current_role() = 'administrator'
        and exists (
          select 1 from public.module_permissions
          where profile_id = auth.uid() and module_key = 'zaloha-obnova' and can_access = true
        )
      )
    )
  );

-- INSERT: Zálohu smí vytvořit Majitel, nebo Administrátor s
-- oprávněním (bod 18).
drop policy if exists "database_backups_insert_scoped" on public.database_backups;
create policy "database_backups_insert_scoped"
  on public.database_backups for insert
  with check (
    company_id = public.current_company_id()
    and (
      public.current_role() = 'majitel'
      or (
        public.current_role() = 'administrator'
        and exists (
          select 1 from public.module_permissions
          where profile_id = auth.uid() and module_key = 'zaloha-obnova' and can_access = true
        )
      )
    )
  );

-- UPDATE (jen na dokončení/stav zálohy) - stejná pravidla jako INSERT.
drop policy if exists "database_backups_update_scoped" on public.database_backups;
create policy "database_backups_update_scoped"
  on public.database_backups for update
  using (
    company_id = public.current_company_id()
    and (
      public.current_role() = 'majitel'
      or (
        public.current_role() = 'administrator'
        and exists (
          select 1 from public.module_permissions
          where profile_id = auth.uid() and module_key = 'zaloha-obnova' and can_access = true
        )
      )
    )
  );

-- Obnovu smí spustit POUZE Majitel (bod 18 - přísnější než záloha).
drop policy if exists "database_restores_select_scoped" on public.database_restores;
create policy "database_restores_select_scoped"
  on public.database_restores for select
  using (company_id = public.current_company_id() and public.current_role() = 'majitel');

drop policy if exists "database_restores_insert_scoped" on public.database_restores;
create policy "database_restores_insert_scoped"
  on public.database_restores for insert
  with check (company_id = public.current_company_id() and public.current_role() = 'majitel');

drop policy if exists "database_restores_update_scoped" on public.database_restores;
create policy "database_restores_update_scoped"
  on public.database_restores for update
  using (company_id = public.current_company_id() and public.current_role() = 'majitel');

-- ------------------------------------------------------------
-- 3) Storage bucket pro záložní soubory - VEŘEJNĚ NEPŘÍSTUPNÝ
--    (bod 19 - žádný veřejný přístup k záložním souborům).
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('database-backups', 'database-backups', false)
on conflict (id) do update set public = false;

drop policy if exists "database_backups_bucket_scoped" on storage.objects;
create policy "database_backups_bucket_scoped"
  on storage.objects for all
  using (
    bucket_id = 'database-backups'
    and (storage.foldername(name))[1] = public.current_company_id()::text
    and (
      public.current_role() = 'majitel'
      or (
        public.current_role() = 'administrator'
        and exists (
          select 1 from public.module_permissions
          where profile_id = auth.uid() and module_key = 'zaloha-obnova' and can_access = true
        )
      )
    )
  )
  with check (
    bucket_id = 'database-backups'
    and (storage.foldername(name))[1] = public.current_company_id()::text
  );

-- ------------------------------------------------------------
-- 4) Funkce: vytvoření konzistentního snímku dat firmy (bod 4-5)
--    SECURITY DEFINER - obchází RLS ZÁMĚRNĚ (potřebuje sebrat data
--    napříč tabulkami v jedné konzistentní transakci), ale sama si
--    ověřuje roli volajícího, takže ji nelze zneužít z klienta.
--    NIKDY nečte auth.users ani žádné tajné/API klíče.
-- ------------------------------------------------------------
create or replace function public.create_company_backup(p_company_id uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_role user_role;
  v_has_perm boolean;
  v_snapshot jsonb;
begin
  select public.current_role() into v_role;

  if v_role = 'administrator' then
    select exists (
      select 1 from public.module_permissions
      where profile_id = auth.uid() and module_key = 'zaloha-obnova' and can_access = true
    ) into v_has_perm;
  end if;

  if not (v_role = 'majitel' or (v_role = 'administrator' and v_has_perm)) then
    raise exception 'Nemáte oprávnění vytvořit zálohu.';
  end if;

  if p_company_id <> public.current_company_id() then
    raise exception 'Nemáte oprávnění vytvořit zálohu jiné firmy.';
  end if;

  select jsonb_build_object(
    'companies', (select to_jsonb(c) from public.companies c where c.id = p_company_id),
    'profiles', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.profiles t where t.company_id = p_company_id),
    'module_permissions', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.module_permissions t join public.profiles p on p.id = t.profile_id where p.company_id = p_company_id),
    'user_app_settings', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.user_app_settings t join public.profiles p on p.id = t.profile_id where p.company_id = p_company_id),
    'employment_types', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.employment_types t where t.company_id = p_company_id),
    'employees', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.employees t where t.company_id = p_company_id),
    'employee_history', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.employee_history t join public.employees e on e.id = t.employee_id where e.company_id = p_company_id),
    'pricing_items', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.pricing_items t where t.company_id = p_company_id),
    'pricing_price_history', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.pricing_price_history t join public.pricing_items pi on pi.id = t.pricing_item_id where pi.company_id = p_company_id),
    'orders', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.orders t where t.company_id = p_company_id),
    'order_history', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.order_history t join public.orders o on o.id = t.order_id where o.company_id = p_company_id),
    'attendance_records', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.attendance_records t where t.company_id = p_company_id),
    'attendance_work_items', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.attendance_work_items t join public.attendance_records ar on ar.id = t.attendance_record_id where ar.company_id = p_company_id),
    'attendance_history', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.attendance_history t join public.attendance_records ar on ar.id = t.attendance_record_id where ar.company_id = p_company_id),
    'costs', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.costs t where t.company_id = p_company_id),
    'cost_history', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.cost_history t join public.costs c on c.id = t.cost_id where c.company_id = p_company_id),
    'invoicing_records', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.invoicing_records t where t.company_id = p_company_id),
    'invoicing_history', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.invoicing_history t join public.invoicing_records ir on ir.id = t.invoicing_record_id where ir.company_id = p_company_id),
    'construction_log_entries', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.construction_log_entries t where t.company_id = p_company_id),
    'construction_log_history', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.construction_log_history t join public.construction_log_entries cle on cle.id = t.entry_id where cle.company_id = p_company_id),
    'connections', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.connections t where t.company_id = p_company_id),
    'connection_points', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.connection_points t join public.connections c on c.id = t.connection_id where c.company_id = p_company_id),
    'connection_photos', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.connection_photos t join public.connections c on c.id = t.connection_id where c.company_id = p_company_id),
    'connection_history', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.connection_history t join public.connections c on c.id = t.connection_id where c.company_id = p_company_id),
    'gps_photos', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.gps_photos t where t.company_id = p_company_id),
    'gps_photo_history', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.gps_photo_history t join public.gps_photos g on g.id = t.photo_id where g.company_id = p_company_id),
    'generated_documents', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.generated_documents t where t.company_id = p_company_id)
  ) into v_snapshot;

  return v_snapshot;
end;
$$;

-- ------------------------------------------------------------
-- 5) Funkce: obnova dat firmy ze snímku (bod 11-16)
--    Celá funkce běží v JEDNÉ transakci - jakákoliv neošetřená chyba
--    kdekoliv uvnitř funkci ukončí a VŠECHNY změny se vrátí zpět,
--    takže původní data zůstanou při chybě nedotčená (bod 10, 16).
--    Bezpečnostní záloha (bod 13) se vytváří MIMO tuto funkci, v
--    aplikační vrstvě, ještě předtím, než je tato funkce vůbec
--    zavolána - pokud se nepovede, obnova se podle bodu 13 vůbec
--    nespustí.
-- ------------------------------------------------------------
create or replace function public.restore_company_backup(p_company_id uuid, p_snapshot jsonb)
returns void
language plpgsql
security definer
as $$
begin
  if public.current_role() <> 'majitel' then
    raise exception 'Obnovu databáze smí spustit pouze Majitel.';
  end if;

  if p_company_id <> public.current_company_id() then
    raise exception 'Nemáte oprávnění obnovit data jiné firmy.';
  end if;

  -- ---- MAZÁNÍ (pořadí respektuje cizí klíče - závislé nejdřív) ----
  delete from public.generated_documents where company_id = p_company_id;
  delete from public.connections where company_id = p_company_id; -- kaskádově smaže body/foto/historii
  delete from public.gps_photos where company_id = p_company_id; -- kaskádově smaže historii
  delete from public.construction_log_entries where company_id = p_company_id; -- kaskádově smaže historii
  delete from public.invoicing_records where company_id = p_company_id; -- kaskádově smaže historii
  delete from public.costs where company_id = p_company_id; -- kaskádově smaže historii
  delete from public.attendance_records where company_id = p_company_id; -- kaskádově smaže položky/historii
  delete from public.pricing_items where company_id = p_company_id; -- kaskádově smaže historii cen
  delete from public.employees where company_id = p_company_id; -- kaskádově smaže historii zaměstnance
  delete from public.employment_types where company_id = p_company_id;
  delete from public.orders where company_id = p_company_id; -- kaskádově smaže historii zakázky
  delete from public.user_app_settings where profile_id in (select id from public.profiles where company_id = p_company_id);
  delete from public.module_permissions where profile_id in (select id from public.profiles where company_id = p_company_id);
  delete from public.profiles where company_id = p_company_id;

  -- ---- OBNOVENÍ FIREMNÍCH ÚDAJŮ (update na místě, NE smazání řádku) ----
  update public.companies c
  set
    name = coalesce((p_snapshot->'companies'->>'name'), c.name),
    slogan = p_snapshot->'companies'->>'slogan',
    ico = p_snapshot->'companies'->>'ico',
    is_vat_payer = coalesce((p_snapshot->'companies'->>'is_vat_payer')::boolean, c.is_vat_payer),
    dic = p_snapshot->'companies'->>'dic',
    phone = p_snapshot->'companies'->>'phone',
    email = p_snapshot->'companies'->>'email',
    web = p_snapshot->'companies'->>'web',
    bank_account = p_snapshot->'companies'->>'bank_account',
    jednatel = p_snapshot->'companies'->>'jednatel',
    ucetni_email = p_snapshot->'companies'->>'ucetni_email',
    street = p_snapshot->'companies'->>'street',
    city = p_snapshot->'companies'->>'city',
    zip = p_snapshot->'companies'->>'zip',
    country = coalesce((p_snapshot->'companies'->>'country'), c.country),
    logo_url = p_snapshot->'companies'->>'logo_url',
    logo_path = p_snapshot->'companies'->>'logo_path',
    watermark_url = p_snapshot->'companies'->>'watermark_url',
    watermark_path = p_snapshot->'companies'->>'watermark_path',
    watermark_opacity = coalesce((p_snapshot->'companies'->>'watermark_opacity')::numeric, c.watermark_opacity),
    watermark_size = coalesce((p_snapshot->'companies'->>'watermark_size'), c.watermark_size),
    default_user_design = coalesce((p_snapshot->'companies'->>'default_user_design')::app_design, c.default_user_design)
  where c.id = p_company_id;

  -- ---- ZNOVUVLOŽENÍ (rodiče před potomky) ----
  insert into public.profiles select * from jsonb_populate_recordset(null::public.profiles, p_snapshot->'profiles');
  insert into public.employment_types select * from jsonb_populate_recordset(null::public.employment_types, p_snapshot->'employment_types');
  insert into public.employees select * from jsonb_populate_recordset(null::public.employees, p_snapshot->'employees');
  insert into public.pricing_items select * from jsonb_populate_recordset(null::public.pricing_items, p_snapshot->'pricing_items');
  insert into public.orders select * from jsonb_populate_recordset(null::public.orders, p_snapshot->'orders');
  insert into public.attendance_records select * from jsonb_populate_recordset(null::public.attendance_records, p_snapshot->'attendance_records');
  insert into public.attendance_work_items select * from jsonb_populate_recordset(null::public.attendance_work_items, p_snapshot->'attendance_work_items');
  insert into public.costs select * from jsonb_populate_recordset(null::public.costs, p_snapshot->'costs');
  insert into public.invoicing_records select * from jsonb_populate_recordset(null::public.invoicing_records, p_snapshot->'invoicing_records');
  insert into public.construction_log_entries select * from jsonb_populate_recordset(null::public.construction_log_entries, p_snapshot->'construction_log_entries');
  insert into public.connections select * from jsonb_populate_recordset(null::public.connections, p_snapshot->'connections');
  insert into public.connection_points select * from jsonb_populate_recordset(null::public.connection_points, p_snapshot->'connection_points');
  insert into public.connection_photos select * from jsonb_populate_recordset(null::public.connection_photos, p_snapshot->'connection_photos');
  insert into public.gps_photos select * from jsonb_populate_recordset(null::public.gps_photos, p_snapshot->'gps_photos');
  insert into public.generated_documents select * from jsonb_populate_recordset(null::public.generated_documents, p_snapshot->'generated_documents');
  insert into public.module_permissions select * from jsonb_populate_recordset(null::public.module_permissions, p_snapshot->'module_permissions');
  insert into public.user_app_settings select * from jsonb_populate_recordset(null::public.user_app_settings, p_snapshot->'user_app_settings');

  -- ---- HISTORIE (na konec, jen odkazují na už vložené řádky) ----
  insert into public.employee_history select * from jsonb_populate_recordset(null::public.employee_history, p_snapshot->'employee_history');
  insert into public.pricing_price_history select * from jsonb_populate_recordset(null::public.pricing_price_history, p_snapshot->'pricing_price_history');
  insert into public.order_history select * from jsonb_populate_recordset(null::public.order_history, p_snapshot->'order_history');
  insert into public.attendance_history select * from jsonb_populate_recordset(null::public.attendance_history, p_snapshot->'attendance_history');
  insert into public.cost_history select * from jsonb_populate_recordset(null::public.cost_history, p_snapshot->'cost_history');
  insert into public.invoicing_history select * from jsonb_populate_recordset(null::public.invoicing_history, p_snapshot->'invoicing_history');
  insert into public.construction_log_history select * from jsonb_populate_recordset(null::public.construction_log_history, p_snapshot->'construction_log_history');
  insert into public.connection_history select * from jsonb_populate_recordset(null::public.connection_history, p_snapshot->'connection_history');
  insert into public.gps_photo_history select * from jsonb_populate_recordset(null::public.gps_photo_history, p_snapshot->'gps_photo_history');
end;
$$;

grant execute on function public.create_company_backup(uuid) to authenticated;
grant execute on function public.restore_company_backup(uuid, jsonb) to authenticated;
