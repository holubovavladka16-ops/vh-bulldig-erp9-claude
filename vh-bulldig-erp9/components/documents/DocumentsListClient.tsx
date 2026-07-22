"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import DocumentCard from "./DocumentCard";
import { DOCUMENT_TYPES } from "@/lib/documentTypes";
import type { Employee, GeneratedDocument, Order } from "@/types/database.types";

interface Props {
  documents: GeneratedDocument[];
  employees: Employee[];
  orders: Order[];
  canCreate: boolean;
}

const selectClass =
  "rounded-xl border border-glass-border bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-turquoise";

export default function DocumentsListClient({ documents, employees, orders, canCreate }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [typ, setTyp] = useState(searchParams.get("typ") ?? "");
  const [zamestnanec, setZamestnanec] = useState(searchParams.get("zamestnanec") ?? "");
  const [zakazka, setZakazka] = useState(searchParams.get("zakazka") ?? "");
  const [od, setOd] = useState(searchParams.get("od") ?? "");
  const [doDate, setDoDate] = useState(searchParams.get("do") ?? "");

  const employeeNameById = Object.fromEntries(employees.map((e) => [e.id, `${e.first_name} ${e.last_name}`]));
  const orderNameById = Object.fromEntries(orders.map((o) => [o.id, o.name]));

  function applyFilters(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (typ) params.set("typ", typ);
    if (zamestnanec) params.set("zamestnanec", zamestnanec);
    if (zakazka) params.set("zakazka", zakazka);
    if (od) params.set("od", od);
    if (doDate) params.set("do", doDate);
    router.push(`/moduly/pdf-a-vyplatni-pasky?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-xl font-semibold text-white">PDF dokumenty a výplatní pásky</h1>
        {canCreate && (
          <Link
            href="/moduly/pdf-a-vyplatni-pasky/vytvorit"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold to-gold-light px-4 py-2.5 text-sm font-semibold text-base-950 transition hover:opacity-90"
          >
            <Plus size={16} />
            Vytvořit dokument
          </Link>
        )}
      </div>

      <form onSubmit={applyFilters} className="flex flex-wrap gap-3">
        <select value={typ} onChange={(e) => setTyp(e.target.value)} className={selectClass}>
          <option value="" className="bg-base-900">Všechny typy</option>
          {DOCUMENT_TYPES.map((d) => (
            <option key={d.key} value={d.key} className="bg-base-900">{d.label}</option>
          ))}
        </select>
        <select value={zamestnanec} onChange={(e) => setZamestnanec(e.target.value)} className={selectClass}>
          <option value="" className="bg-base-900">Všichni zaměstnanci</option>
          {employees.map((e) => (
            <option key={e.id} value={e.id} className="bg-base-900">{e.first_name} {e.last_name}</option>
          ))}
        </select>
        <select value={zakazka} onChange={(e) => setZakazka(e.target.value)} className={selectClass}>
          <option value="" className="bg-base-900">Všechny zakázky</option>
          {orders.map((o) => (
            <option key={o.id} value={o.id} className="bg-base-900">{o.name}</option>
          ))}
        </select>
        <input type="date" value={od} onChange={(e) => setOd(e.target.value)} className={selectClass} />
        <span className="self-center text-white/30">–</span>
        <input type="date" value={doDate} onChange={(e) => setDoDate(e.target.value)} className={selectClass} />
        <button type="submit" className="rounded-xl border border-glass-border px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/5">
          Použít filtr
        </button>
      </form>

      {documents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-glass-border p-10 text-center text-sm text-white/40">
          Žádné dokumenty neodpovídají zadaným kritériím.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {documents.map((d) => (
            <DocumentCard
              key={d.id}
              doc={d}
              employeeName={d.employee_id ? employeeNameById[d.employee_id] ?? null : null}
              orderName={d.order_id ? orderNameById[d.order_id] ?? null : null}
            />
          ))}
        </div>
      )}
    </div>
  );
}
