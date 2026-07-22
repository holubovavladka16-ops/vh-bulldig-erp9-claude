"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import PricingTable from "./PricingTable";
import PricingItemCard from "./PricingItemCard";
import PricingItemForm from "./PricingItemForm";
import type { PricingItem } from "@/types/database.types";

interface Props {
  companyId: string;
  employeeId: string;
  initialItems: PricingItem[];
  canEdit: boolean;
  changedByProfileId: string;
  changedByName: string;
}

export default function PricingList({
  companyId,
  employeeId,
  initialItems,
  canEdit,
  changedByProfileId,
  changedByName,
}: Props) {
  const [items, setItems] = useState(initialItems);
  const [formMode, setFormMode] = useState<"none" | "new" | "edit">("none");
  const [editingItem, setEditingItem] = useState<PricingItem | undefined>(undefined);

  function handleSaved(item: PricingItem) {
    setItems((prev) => {
      const exists = prev.some((i) => i.id === item.id);
      return exists ? prev.map((i) => (i.id === item.id ? item : i)) : [item, ...prev];
    });
    setFormMode("none");
    setEditingItem(undefined);
  }

  return (
    <div className="flex flex-col gap-4">
      {canEdit && formMode === "none" && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setFormMode("new")}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold to-gold-light px-4 py-2.5 text-sm font-semibold text-base-950 transition hover:opacity-90"
          >
            <Plus size={16} />
            Přidat položku
          </button>
        </div>
      )}

      {formMode !== "none" && (
        <PricingItemForm
          companyId={companyId}
          employeeId={employeeId}
          existingItem={editingItem}
          changedByProfileId={changedByProfileId}
          changedByName={changedByName}
          onSaved={handleSaved}
          onCancel={() => {
            setFormMode("none");
            setEditingItem(undefined);
          }}
        />
      )}

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-glass-border p-10 text-center text-sm text-white/40">
          Zatím nejsou zadány žádné ceníkové položky.
        </div>
      ) : (
        <>
          <div className="hidden md:block">
            <PricingTable
              items={items}
              canEdit={canEdit}
              onEdit={(item) => {
                setEditingItem(item);
                setFormMode("edit");
              }}
            />
          </div>
          <div className="flex flex-col gap-3 md:hidden">
            {items.map((item) => (
              <PricingItemCard
                key={item.id}
                item={item}
                canEdit={canEdit}
                onEdit={() => {
                  setEditingItem(item);
                  setFormMode("edit");
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
