"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import ContractDocumentCard from "./ContractDocumentCard";
import { DOC_STATUS_LABELS } from "./DocumentStatusBadge";
import { DOCUMENT_TYPE_DEFS } from "@/lib/documentTemplates";
import type { Company, DocumentV2, Employee, Order } from "@/types/database.types";

interface Props {
  documents: DocumentV2[];
  employeesById: Record<string, Employee>;
  ordersById: Record<string, Order>;
  company: Company | null;
  canCreate: boolean;
}

const selectClass =
  "rounded-xl border border-glass-border bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-turquoise";

export default function ContractsListClient({ documents, employeesById, ordersById, company, canCreate }: Props) {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [orderId, setOrderId] = useState("");

  const filtered = documents.filter((d) => {
    if (search && !`${d.title} ${d.document_number}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (type && d.document_type !== type) return false;
    if (status && d.status !== status) return false;
    if (employeeId && d.employee_id !== employeeId) return false;
    if (orderId && d.order_id !== orderId) return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-xl font-semibold text-white">Smlouvy, objednávky a pracovněprávní dokumenty</h1>
        {canCreate && (
          <Link
            href="/moduly/smlouvy-a-dokumenty/novy"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold to-gold-light px-4 py-2.5 text-sm font-semibold text-base-950 transition hover:opacity-90"
          >
            <Plus size={16} />
            Nový dokument
          </Link>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Název nebo číslo dokumentu…" className={selectClass} />
        <select value={type} onChange={(e) => setType(e.target.value)} className={selectClass}>
          <option value="" className="bg-base-900">Všechny typy</option>
          {DOCUMENT_TYPE_DEFS.map((d) => (
            <option key={d.key} value={d.key} className="bg-base-900">{d.label}</option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectClass}>
          <option value="" className="bg-base-900">Všechny stavy</option>
          {Object.entries(DOC_STATUS_LABELS).map(([key, label]) => (
            <option key={key} value={key} className="bg-base-900">{label}</option>
          ))}
        </select>
        <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className={selectClass}>
          <option value="" className="bg-base-900">Všichni zaměstnanci</option>
          {Object.values(employeesById).map((e) => (
            <option key={e.id} value={e.id} className="bg-base-900">{e.first_name} {e.last_name}</option>
          ))}
        </select>
        <select value={orderId} onChange={(e) => setOrderId(e.target.value)} className={selectClass}>
          <option value="" className="bg-base-900">Všechny zakázky</option>
          {Object.values(ordersById).map((o) => (
            <option key={o.id} value={o.id} className="bg-base-900">{o.name}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-glass-border p-10 text-center text-sm text-white/40">
          Žádné dokumenty neodpovídají zadaným kritériím.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((d) => {
            const emp = d.employee_id ? employeesById[d.employee_id] : null;
            const order = d.order_id ? ordersById[d.order_id] : null;
            const relatedName = emp ? `${emp.first_name} ${emp.last_name}` : order ? order.name : d.counterparty?.name ?? null;
            return <ContractDocumentCard key={d.id} doc={d} relatedName={relatedName} company={company} />;
          })}
        </div>
      )}
    </div>
  );
}
