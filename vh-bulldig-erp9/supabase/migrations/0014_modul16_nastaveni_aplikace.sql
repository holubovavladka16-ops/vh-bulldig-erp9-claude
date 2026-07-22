-- ============================================================
-- VH BULLDIG ERP 9 – MODUL 16: NASTAVENÍ APLIKACE
-- ============================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_design') then
    create type app_design as enum ('classic', 'professional', 'industrial', 'modern', 'executive', 'field');
  end if;

  if not exists (select 1 from pg_type where typname = 'landing_page') then
    create type landing_page as enum ('dashboard', 'prehled_modulu');
  end if;
end $$;

-- ------------------------------------------------------------
-- 1) Výchozí firemní design pro nově vytvořené uživatele (bod 7)
--    Firemní údaje/logo/vodoznak zůstávají výhradně v Modulu 3 -
--    tento sloupec se týká POUZE výchozího designu, nic jiného
--    z Modulu 3 se zde neduplikuje.
-- ------------------------------------------------------------
alter table public.companies
  add column if not exists default_user_design app_design not null default 'professional';

-- ------------------------------------------------------------
-- 2) Nastavení aplikace za uživatele - jeden řádek na profil
--    (design pro telefon/tablet/počítač, synchronizace, výchozí
--    úvodní stránka). Design lze nastavit samostatně podle zařízení
--    (bod 5) nebo sjednotit přepínačem sync_devices (bod 6).
-- ------------------------------------------------------------
create table if not exists public.user_app_settings (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles (id) on delete cascade,

  sync_devices boolean not null default false,
  theme_synced app_design not null default 'professional',
  theme_phone app_design not null default 'professional',
  theme_tablet app_design not null default 'professional',
  theme_desktop app_design not null default 'professional',

  default_landing_page landing_page not null default 'dashboard',

  updated_at timestamptz not null default now()
);

drop trigger if exists trg_user_app_settings_updated_at on public.user_app_settings;
create trigger trg_user_app_settings_updated_at
  before update on public.user_app_settings
  for each row execute function public.set_updated_at();

alter table public.user_app_settings enable row level security;

-- Bod 13 - každý uživatel smí měnit POUZE své vlastní nastavení. Beze
-- výjimky pro Majitele nad nastavením jiných uživatelů (na rozdíl od
-- ostatních modulů zde neexistuje "spravovat cizí data" politika).
drop policy if exists "user_app_settings_own_only" on public.user_app_settings;
create policy "user_app_settings_own_only"
  on public.user_app_settings for all
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());
