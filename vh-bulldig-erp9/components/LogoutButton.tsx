"use client";

import { useAuth } from "@/components/AuthProvider";

export default function LogoutButton() {
  const { signOut } = useAuth();

  return (
    <button
      onClick={() => signOut()}
      className="rounded-xl border border-glass-border px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/5"
    >
      Odhlásit se
    </button>
  );
}
