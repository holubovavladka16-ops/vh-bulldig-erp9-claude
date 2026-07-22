"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BackupStatusBadge from "./BackupStatusBadge";
import { formatBytes } from "@/lib/formatBytes";
import type { DatabaseBackup } from "@/types/database.types";

interface Props {
  backups: DatabaseBackup[];
  canCreateBackup: boolean;
  canRestore: boolean;
}

export default function BackupModuleClient({ backups, canCreateBackup, canRestore }: Props) {
  const router = useRouter();

  const [confirmingCreate, setConfirmingCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createMessage, setCreateMessage] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  const [restoreTargetId, setRestoreTargetId] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const lastBackup = backups[0] ?? null;

  async function handleCreateBackup() {
    setCreating(true);
    setCreateError(null);
    setCreateMessage(null);
    try {
      const res = await fetch("/api/backup/create", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.error ?? "Zálohu se nepodařilo dokončit. Původní data zůstala zachována.");
        return;
      }
      setCreateMessage("Záloha databáze byla úspěšně vytvořena.");
      router.refresh();
    } finally {
      setCreating(false);
      setConfirmingCreate(false);
    }
  }

  async function handleRestore(backupId: string) {
    setRestoring(true);
    setRestoreError(null);
    setRestoreMessage(null);
    try {
      const res = await fetch("/api/backup/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ backupId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRestoreError(data.error ?? "Obnovu databáze se nepodařilo dokončit. Původní data byla zachována.");
        return;
      }
      setRestoreMessage("Databáze byla úspěšně obnovena.");
      router.refresh();
    } finally {
      setRestoring(false);
      setRestoreTargetId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Záloha databáze */}
      <section className="rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
        <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-wide text-white/50">
          Záloha databáze
        </h2>

        {lastBackup ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Poslední záloha" value={new Date(lastBackup.created_at).toLocaleString("cs-CZ")} />
            <Stat label="Stav" value={<BackupStatusBadge status={lastBackup.status} />} />
            <Stat label="Velikost" value={formatBytes(lastBackup.size_bytes)} />
            <Stat label="Autor" value={lastBackup.created_by_name ?? "—"} />
          </div>
        ) : (
          <p className="text-sm text-white/40">Zatím nebyla vytvořena žádná záloha.</p>
        )}

        {canCreateBackup && (
          <div className="mt-4">
            {!confirmingCreate ? (
              <button
                type="button"
                onClick={() => setConfirmingCreate(true)}
                className="rounded-xl bg-gradient-to-r from-gold to-gold-light px-5 py-2.5 text-sm font-semibold text-base-950 transition hover:opacity-90"
              >
                Vytvořit zálohu
              </button>
            ) : (
              <div className="rounded-xl border border-glass-border bg-white/5 p-4">
                <p className="text-sm text-white/80">Opravdu chcete vytvořit novou zálohu databáze?</p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={handleCreateBackup}
                    disabled={creating}
                    className="rounded-xl bg-gradient-to-r from-gold to-gold-light px-4 py-2 text-sm font-semibold text-base-950 transition hover:opacity-90 disabled:opacity-50"
                  >
                    {creating ? "Probíhá…" : "Vytvořit zálohu"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingCreate(false)}
                    disabled={creating}
                    className="rounded-xl border border-glass-border px-4 py-2 text-sm font-medium text-white/70 transition hover:bg-white/5"
                  >
                    Zrušit
                  </button>
                </div>
              </div>
            )}
            {createMessage && <p className="mt-3 text-sm text-turquoise-light">{createMessage}</p>}
            {createError && <p className="mt-3 text-sm text-red-300">{createError}</p>}
          </div>
        )}
      </section>

      {/* Historie záloh */}
      <section className="rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
        <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-wide text-white/50">
          Historie záloh
        </h2>

        {backups.length === 0 ? (
          <p className="text-sm text-white/35">Zatím nejsou žádné zálohy.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {backups.map((b) => (
              <div key={b.id} className="rounded-xl border border-glass-border bg-white/5 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-white/85">{new Date(b.created_at).toLocaleString("cs-CZ")}</p>
                    <p className="text-xs text-white/40">{b.created_by_name ?? "—"} · {formatBytes(b.size_bytes)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <BackupStatusBadge status={b.status} />
                    <button
                      type="button"
                      onClick={() => setExpandedId((id) => (id === b.id ? null : b.id))}
                      className="rounded-xl border border-glass-border px-3 py-1.5 text-xs font-medium text-white/70 transition hover:bg-white/5"
                    >
                      Detail
                    </button>
                    {canRestore && b.status === "dokonceno" && (
                      <button
                        type="button"
                        onClick={() => setRestoreTargetId(b.id)}
                        className="rounded-xl border border-glass-border px-3 py-1.5 text-xs font-medium text-white/70 transition hover:bg-white/5"
                      >
                        Obnovit
                      </button>
                    )}
                  </div>
                </div>

                {expandedId === b.id && (
                  <div className="mt-3 border-t border-white/10 pt-3 text-xs text-white/50">
                    <p>ID zálohy: {b.id}</p>
                    <p>Vytvořeno: {new Date(b.created_at).toLocaleString("cs-CZ")}</p>
                    {b.completed_at && <p>Dokončeno: {new Date(b.completed_at).toLocaleString("cs-CZ")}</p>}
                    {b.error_message && <p className="text-red-300">Chyba: {b.error_message}</p>}
                  </div>
                )}

                {restoreTargetId === b.id && (
                  <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                    <p className="text-sm font-medium text-amber-200">
                      Obnova databáze může nahradit současná data obsahem vybrané zálohy.
                    </p>
                    <p className="mt-1 text-xs text-amber-200/70">
                      Před obnovou se automaticky vytvoří bezpečnostní záloha aktuálního stavu.
                    </p>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleRestore(b.id)}
                        disabled={restoring}
                        className="rounded-xl bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/30 disabled:opacity-50"
                      >
                        {restoring ? "Obnova probíhá…" : "Potvrdit obnovu"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setRestoreTargetId(null)}
                        disabled={restoring}
                        className="rounded-xl border border-glass-border px-4 py-2 text-sm font-medium text-white/70 transition hover:bg-white/5"
                      >
                        Zrušit
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {restoreMessage && (
          <p className="mt-4 rounded-xl bg-turquoise/10 px-4 py-3 text-center text-sm text-turquoise-light">
            {restoreMessage}
          </p>
        )}
        {restoreError && (
          <p className="mt-4 rounded-xl bg-red-500/10 px-4 py-3 text-center text-sm text-red-300">{restoreError}</p>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-glass-border bg-white/5 p-3 text-center">
      <div className="font-display text-sm font-semibold text-white">{value}</div>
      <p className="mt-1 text-[11px] text-white/40">{label}</p>
    </div>
  );
}
