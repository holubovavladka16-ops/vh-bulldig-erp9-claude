# VH Bulldig ERP 9 – Modul 1: Přihlášení uživatelů

Toto je technický základ + Modul 1 aplikace VH Bulldig ERP 9, postavený na
Next.js 14 (App Router) + Supabase (Auth, Postgres, Row Level Security)
+ Tailwind CSS (Design 2 – Professional).

## Instalace

```bash
npm install
cp .env.local.example .env.local
# doplňte NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_SITE_URL
npm run dev
```

## Databáze

Spusťte migraci `supabase/migrations/0001_modul1_prihlaseni.sql` ve vašem
Supabase projektu (SQL editor nebo `supabase db push`).

Poté založte hlavní účet Majitele podle přesného postupu v
`docs/OWNER_ACCOUNT_SETUP.md` (heslo se nikdy nezapisuje do kódu ani
dokumentace – nastavuje si ho sám majitel přes Supabase Authentication).

## Google přihlášení

V Supabase Dashboard → Authentication → Providers zapněte Google a
nastavte OAuth Client v Google Cloud Console. Podrobnosti v
`docs/OWNER_ACCOUNT_SETUP.md`, krok 3.

## Struktura tohoto modulu

- `app/(auth)/prihlaseni` – přihlašovací obrazovka
- `app/(auth)/zapomenute-heslo` – žádost o odkaz na obnovení hesla
- `app/(auth)/obnoveni-hesla` – nastavení nového hesla
- `app/auth/callback` – návrat z Google OAuth
- `app/uvitani` – uvítací obrazovka (10 s, povinný text)
- `app/(protected)/prehled` – **dočasná** technická stránka, NENÍ Dashboard
  (Dashboard je Modul 2 a vznikne na samostatný příkaz)
- `middleware.ts` + `lib/supabase/middleware.ts` – ochrana rout
- `supabase/migrations/0001_modul1_prihlaseni.sql` – companies, profiles,
  module_permissions, RLS politiky

## Nasazení na Vercel

1. Repozitář nahrajte na GitHub (bez `.env.local` – je v `.gitignore`).
2. Ve Vercelu propojte repozitář a doplňte stejné 3 environment proměnné
   jako v `.env.local`, s `NEXT_PUBLIC_SITE_URL` nastaveným na skutečnou
   produkční adresu.
3. V Supabase i Google Cloud Console doplňte tuto produkční adresu do
   povolených redirect URL.
