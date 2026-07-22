# Založení hlavního účtu Majitele (vladka@vhbulldig.cz)

Toto je jediný správný a bezpečný postup. Heslo se NIKDY nezapisuje
do kódu, GitHubu, migrace, dokumentace ani do žádného výstupu práce.

## Krok 1 – Založení uživatele v Supabase Authentication

**Pokud se majitelka bude přihlašovat výhradně přes Google** (jak bylo
potvrzeno), NENÍ potřeba zakládat heslo vůbec – stačí provést Krok 3
(zapnutí Google Provider) a nechat uživatele vzniknout automaticky
při prvním kliknutí na "Přihlásit se přes Google" v aplikaci. Supabase
při prvním Google přihlášení sám vytvoří záznam v `auth.users` s tímto
e-mailem. Pokračujte rovnou Krokem 2 (přiřazení role) až PO prvním
skutečném přihlášení přes Google, kdy už bude znát jeho `id`.

Alternativně, chcete-li mít účet připravený předem (např. pro
otestování e-mailového přihlášení jako záložní cesty):

1. Otevřete Supabase Dashboard → Authentication → Users.
2. Klikněte na "Add user" (nebo nechte uživatele projít flow
   "Zapomenuté heslo" / "Sign up", pokud preferujete samoobslužné
   nastavení hesla přímo majitelem).
3. E-mail: `vladka@vhbulldig.cz`.
4. Heslo zadá a nastaví SÁM MAJITEL, přímo v Supabase Authentication
   rozhraní nebo přes odkaz "Nastavit heslo" zaslaný e-mailem.
   Nikdo jiný heslo nezadává a nikam jej neopisuje.

## Krok 2 – Propojení s rolí Majitel v databázi

Po založení uživatele zkopírujte jeho `id` (UUID) ze Supabase
Dashboard → Authentication → Users → detail uživatele.

Spusťte v SQL editoru (nahraďte `<USER_ID>` a `<COMPANY_ID>` skutečnými
hodnotami; `<COMPANY_ID>` vznikne vložením řádku do `companies`):

```sql
insert into public.companies (name)
values ('Váš název firmy')
returning id; -- zkopírujte vrácené id jako <COMPANY_ID>

insert into public.profiles (id, company_id, email, full_name, role, is_active)
values ('<USER_ID>', '<COMPANY_ID>', 'vladka@vhbulldig.cz', 'Vladka Holubová', 'majitel', true);
```

Toto SQL neobsahuje a nikdy nesmí obsahovat heslo.

## Krok 3 – Google přihlášení

1. Supabase Dashboard → Authentication → Providers → Google → zapnout.
2. Do Google Cloud Console (OAuth Client) doplňte správné "Authorized
   redirect URI" ve tvaru:
   `https://<VÁŠ-SUPABASE-PROJEKT>.supabase.co/auth/v1/callback`
3. Do `NEXT_PUBLIC_SITE_URL` (viz `.env.local`) nastavte skutečnou
   produkční Vercel adresu, aby po Google přihlášení uživatel skončil
   na správné adrese, ne na testovací.
4. Google účet `vladka@vhbulldig.cz` se po prvním přihlášení
   napáruje na stejný řádek v `profiles` podle e-mailu (viz trigger
   v Kroku 4).

## Krok 4 – Automatické vytvoření profilu při registraci (pro budoucí uživatele)

Pro Modul 1 se řeší pouze účet Majitele ručně (Kroky 1–2 výše).
Automatické vytváření profilů pro Administrátora, Účetní a Zaměstnance
při registraci bude součástí modulu Zaměstnanci a Karta dělníka
(Modul 4), aby nedošlo k vytvoření vlastní funkce nad rámec Modulu 1.
