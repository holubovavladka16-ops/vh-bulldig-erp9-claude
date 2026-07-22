"use client";

import dynamic from "next/dynamic";

const ConnectionMapInner = dynamic(() => import("./ConnectionMapInner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-80 items-center justify-center rounded-xl border border-glass-border bg-white/5 text-sm text-white/40">
      Načítám mapu…
    </div>
  ),
});

export default ConnectionMapInner;
export type { MapPoint, MapRoute } from "./ConnectionMapInner";
