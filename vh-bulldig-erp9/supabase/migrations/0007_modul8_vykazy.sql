-- ============================================================
-- VH BULLDIG ERP 9 – MODUL 8: VÝKAZY
-- Výkazy se počítají za běhu z dat Modulu 7 (Docházka) - nevytváří se
-- žádná duplicitní tabulka s daty. Tato migrace pouze doplňuje na
-- attendance_records metadata o schválení a vrácení k opravě, která
-- Modul 7 ještě neměl (bod 16-17 zadání Modulu 8 je vyžadují).
-- ============================================================

alter table public.attendance_records
  add column if not exists approved_by uuid references public.profiles (id) on delete set null,
  add column if not exists approved_at timestamptz,
  add column if not exists returned_reason text,
  add column if not exists returned_by uuid references public.profiles (id) on delete set null,
  add column if not exists returned_at timestamptz;

-- Poznámka: veškerá logika Výkazů (agregace, filtrování, PDF export)
-- je vždy počítaná pouze nad záznamy se stavem 'schvaleny' pro
-- oficiální součty (bod 4, 8, 11, 12 zadání) - řeší aplikační vrstva,
-- ne databáze, protože jde čistě o READ agregaci nad existujícími
-- RLS-chráněnými tabulkami z Modulu 7.
