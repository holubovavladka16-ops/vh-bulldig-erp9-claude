import type { OrderStatus } from "@/types/database.types";

const LABELS: Record<OrderStatus, string> = {
  aktivni: "Aktivní",
  neaktivni: "Neaktivní",
};

const CLASSES: Record<OrderStatus, string> = {
  aktivni: "bg-emerald-500/10 text-emerald-300",
  neaktivni: "bg-white/10 text-white/50",
};

export default function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${CLASSES[status]}`}>
      {LABELS[status]}
    </span>
  );
}

export const ORDER_STATUS_LABELS = LABELS;
