"use client";

interface Props {
  onContinue: () => void;
  onLogout: () => void;
}

export default function SessionTimeoutModal({ onContinue, onLogout }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-glass-border bg-base-900/95 p-6 text-center shadow-2xl backdrop-blur-xs">
        <p className="font-body text-base text-white">
          Vaše relace brzy vyprší. Chcete pokračovat v práci?
        </p>
        <div className="mt-6 flex gap-3">
          <button
            onClick={onContinue}
            className="flex-1 rounded-xl bg-turquoise px-4 py-3 font-semibold text-base-950 transition hover:bg-turquoise-light"
          >
            Pokračovat
          </button>
          <button
            onClick={onLogout}
            className="flex-1 rounded-xl border border-glass-border px-4 py-3 font-semibold text-white transition hover:bg-white/5"
          >
            Odhlásit se
          </button>
        </div>
      </div>
    </div>
  );
}
