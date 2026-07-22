"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { DOCUMENT_TYPES } from "@/lib/documentTypes";
import type { Connection, Employee, Order } from "@/types/database.types";

interface Props {
  employees: Employee[];
  orders: Order[];
  connections: Connection[];
}

const selectClass =
  "w-full rounded-xl border border-glass-border bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-turquoise";

export default function DocumentTypeForm({ employees, orders, connections }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [typ, setTyp] = useState(searchParams.get("typ") ?? "");
  const [zamestnanec, setZamestnanec] = useState(searchParams.get("zamestnanec") ?? "");
  const [zakazka, setZakazka] = useState(searchParams.get("zakazka") ?? "");
  const [pripojka, setPripojka] = useState(searchParams.get("pripojka") ?? "");
  const [od, setOd] = useState(searchParams.get("od") ?? "");
  const [doDate, setDoDate] = useState(searchParams.get("do") ?? "");

  const def = DOCUMENT_TYPES.find((d) => d.key === typ);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    params.set("typ", typ);
    if (zamestnanec) params.set("zamestnanec", zamestnanec);
    if (zakazka) params.set("zakazka", zakazka);
    if (pripojka) params.set("pripojka", pripojka);
    if (od) params.set("od", od);
    if (doDate) params.set("do", doDate);
    router.push(`/moduly/pdf-a-vyplatni-pasky/vytvorit?${params.toString()}`);
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-white/60">Typ dokumentu<span className="text-red-300"> *</span></span>
        <select value={typ} onChange={(e) => setTyp(e.target.value)} className={selectClass}>
          <option value="" className="bg-base-900">Vyberte…</option>
          {DOCUMENT_TYPES.map((d) => (
            <option key={d.key} value={d.key} className="bg-base-900">{d.label}</option>
          ))}
        </select>
      </label>

      {def?.needsEmployee && (
        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-white/60">Zaměstnanec<span className="text-red-300"> *</span></span>
          <select value={zamestnanec} onChange={(e) => setZamestnanec(e.target.value)} className={selectClass}>
            <option value="" className="bg-base-900">Vyberte…</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id} className="bg-base-900">{e.first_name} {e.last_name}</option>
            ))}
          </select>
        </label>
      )}

      {def?.needsOrder && (
        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-white/60">Zakázka<span className="text-red-300"> *</span></span>
          <select value={zakazka} onChange={(e) => setZakazka(e.target.value)} className={selectClass}>
            <option value="" className="bg-base-900">Vyberte…</option>
            {orders.map((o) => (
              <option key={o.id} value={o.id} className="bg-base-900">{o.name}</option>
            ))}
          </select>
        </label>
      )}

      {def?.needsConnection && (
        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-white/60">Přípojka<span className="text-red-300"> *</span></span>
          <select value={pripojka} onChange={(e) => setPripojka(e.target.value)} className={selectClass}>
            <option value="" className="bg-base-900">Vyberte…</option>
            {connections.map((c) => (
              <option key={c.id} value={c.id} className="bg-base-900">
                {c.name} ({new Date(c.connection_date).toLocaleDateString("cs-CZ")})
              </option>
            ))}
          </select>
        </label>
      )}

      {def?.needsPeriod && (
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-white/60">Období od</span>
            <input type="date" value={od} onChange={(e) => setOd(e.target.value)} className={selectClass} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-white/60">Období do</span>
            <input type="date" value={doDate} onChange={(e) => setDoDate(e.target.value)} className={selectClass} />
          </label>
        </div>
      )}

      <button
        type="submit"
        disabled={!typ}
        className="self-start rounded-xl bg-gradient-to-r from-gold to-gold-light px-6 py-2.5 text-sm font-semibold text-base-950 transition hover:opacity-90 disabled:opacity-50"
      >
        Pokračovat
      </button>
    </form>
  );
}
