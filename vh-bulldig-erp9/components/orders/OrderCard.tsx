import Link from "next/link";
import OrderStatusBadge from "./OrderStatusBadge";
import type { Order } from "@/types/database.types";

export default function OrderCard({ order }: { order: Order }) {
  return (
    <Link
      href={`/moduly/zakazky/${order.id}`}
      className="flex flex-col gap-3 rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs transition hover:border-turquoise/40 hover:bg-white/[0.06]"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="font-display text-base font-semibold text-white">{order.name}</p>
        <OrderStatusBadge status={order.status} />
      </div>

      <span className="text-xs text-white/40">
        Založeno: {new Date(order.founded_date).toLocaleDateString("cs-CZ")}
      </span>

      <span className="mt-1 inline-block self-start rounded-xl border border-glass-border px-3 py-1.5 text-xs font-medium text-white/70">
        Otevřít
      </span>
    </Link>
  );
}
