-- ============================================================
-- VH BULLDIG ERP 9 – MODUL 3: NASTAVENÍ SPOLEČNOSTI / FIREMNÍ ÚDAJE
-- Rozšiřuje tabulku companies (založenou v Modulu 1) o firemní údaje,
-- logo a vodoznak. Nevytváří žádnou duplicitní tabulku - vše je na
-- jednom místě, odkud to ostatní moduly budou pouze číst.
-- ============================================================

-- ------------------------------------------------------------
-- 1) Rozšíření tabulky companies o pole z Modulu 3
-- ------------------------------------------------------------
alter table public.companies
  add column if not exists slogan text,
  add column if not exists ico text,
  add column if not exists is_vat_payer boolean not null default false,
  add column if not exists dic text,
  add column if not exists phone text,
  add column if not exists email text,
  add column if not exists web text,
  add column if not exists bank_account text,
  add column if not exists jednatel text,
  add column if not exists ucetni_email text,
  add column if not exists street text,
  add column if not exists city text,
  add column if not exists zip text,
  add column if not exists country text not null default 'Česká republika',
  add column if not exists logo_url text,
  add column if not exists logo_path text,
  add column if not exists watermark_url text,
  add column if not exists watermark_path text,
  add column if not exists watermark_opacity numeric not null default 12,
  add column if not exists watermark_size text not null default 'automaticky';

-- DIČ je povinné pouze pro plátce DPH - kontroluje se v aplikaci,
-- databáze zde záměrně nevynucuje NOT NULL (bod 8 zadání).

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'companies_watermark_opacity_range'
  ) then
    alter table public.companies
      add constraint companies_watermark_opacity_range
      check (watermark_opacity >= 5 and watermark_opacity <= 20);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'companies_watermark_size_values'
  ) then
    alter table public.companies
      add constraint companies_watermark_size_values
      check (watermark_size in ('maly', 'stredni', 'velky', 'automaticky'));
  end if;
end $$;

-- ------------------------------------------------------------
-- 2) UPDATE politika: měnit firemní údaje smí pouze Majitel,
--    nebo Administrátor s oprávněním k modulu 'nastaveni-spolecnosti'.
-- ------------------------------------------------------------
drop policy if exists "companies_update_by_majitel_or_admin" on public.companies;
create policy "companies_update_by_majitel_or_admin"
  on public.companies for update
  using (
    id = public.current_company_id()
    and (
      public.current_role() = 'majitel'
      or (
        public.current_role() = 'administrator'
        and exists (
          select 1 from public.module_permissions
          where profile_id = auth.uid()
            and module_key = 'nastaveni-spolecnosti'
            and can_access = true
        )
      )
    )
  )
  with check (id = public.current_company_id());

-- Poznámka: SELECT politika "companies_select_own" z Modulu 1 zůstává
-- beze změny - firmu ve své firmě vidí každý přihlášený profil (to
-- využívá už Dashboard pro zobrazení názvu firmy všem rolím). Jemnější
-- omezení viditelnosti citlivých polí (např. pro Účetní/Zaměstnance)
-- řeší samotná stránka Modulu 3 na úrovni UI/přístupu k routě, nikoli
-- RLS, aby se nerozbilo již funkční čtení názvu firmy v Dashboardu.

-- ------------------------------------------------------------
-- 3) Veřejný pohled pro branding na nepřihlášených stránkách
--    (přihlašovací a uvítací obrazovka potřebují zobrazit logo,
--    přestože uživatel ještě není přihlášený).
-- ------------------------------------------------------------
create or replace view public.company_branding as
select id, name, logo_url, watermark_url, watermark_opacity, watermark_size
from public.companies
order by created_at asc
limit 1;

grant select on public.company_branding to anon, authenticated;

-- ------------------------------------------------------------
-- 4) Supabase Storage buckety pro logo a vodoznak
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('company-logos', 'company-logos', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('company-watermarks', 'company-watermarks', true)
on conflict (id) do nothing;

-- Veřejné čtení (potřebné pro zobrazení loga na přihlašovací stránce
-- a ve všech PDF dokumentech, i mimo přihlášenou relaci).
drop policy if exists "company_logos_public_read" on storage.objects;
create policy "company_logos_public_read"
  on storage.objects for select
  using (bucket_id = 'company-logos');

drop policy if exists "company_watermarks_public_read" on storage.objects;
create policy "company_watermarks_public_read"
  on storage.objects for select
  using (bucket_id = 'company-watermarks');

-- Nahrávat/měnit/mazat smí pouze Majitel, nebo Administrátor
-- s oprávněním k modulu 'nastaveni-spolecnosti'.
drop policy if exists "company_logos_write_by_admins" on storage.objects;
create policy "company_logos_write_by_admins"
  on storage.objects for all
  using (
    bucket_id = 'company-logos'
    and (
      public.current_role() = 'majitel'
      or (
        public.current_role() = 'administrator'
        and exists (
          select 1 from public.module_permissions
          where profile_id = auth.uid()
            and module_key = 'nastaveni-spolecnosti'
            and can_access = true
        )
      )
    )
  )
  with check (bucket_id = 'company-logos');

drop policy if exists "company_watermarks_write_by_admins" on storage.objects;
create policy "company_watermarks_write_by_admins"
  on storage.objects for all
  using (
    bucket_id = 'company-watermarks'
    and (
      public.current_role() = 'majitel'
      or (
        public.current_role() = 'administrator'
        and exists (
          select 1 from public.module_permissions
          where profile_id = auth.uid()
            and module_key = 'nastaveni-spolecnosti'
            and can_access = true
        )
      )
    )
  )
  with check (bucket_id = 'company-watermarks');
