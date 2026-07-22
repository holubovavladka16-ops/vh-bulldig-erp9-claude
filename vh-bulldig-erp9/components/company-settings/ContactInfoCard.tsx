import SettingsCard from "./SettingsCard";

interface Props {
  phone: string;
  email: string;
  web: string;
  bankAccount: string;
  jednatel: string;
  ucetniEmail: string;
  readOnly: boolean;
  onChange: (patch: Partial<{
    phone: string;
    email: string;
    web: string;
    bankAccount: string;
    jednatel: string;
    ucetniEmail: string;
  }>) => void;
}

const inputClass =
  "w-full rounded-xl border border-glass-border bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition focus:border-turquoise focus:ring-1 focus:ring-turquoise disabled:opacity-50";

export default function ContactInfoCard({
  phone,
  email,
  web,
  bankAccount,
  jednatel,
  ucetniEmail,
  readOnly,
  onChange,
}: Props) {
  return (
    <SettingsCard title="Kontaktní údaje">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-white/60">Telefon</span>
          <input
            value={phone}
            disabled={readOnly}
            onChange={(e) => onChange({ phone: e.target.value })}
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-white/60">E-mail</span>
          <input
            type="email"
            value={email}
            disabled={readOnly}
            onChange={(e) => onChange({ email: e.target.value })}
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-white/60">Web</span>
          <input
            value={web}
            disabled={readOnly}
            onChange={(e) => onChange({ web: e.target.value })}
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-white/60">Bankovní účet</span>
          <input
            value={bankAccount}
            disabled={readOnly}
            onChange={(e) => onChange({ bankAccount: e.target.value })}
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-white/60">Jednatel společnosti</span>
          <input
            value={jednatel}
            disabled={readOnly}
            onChange={(e) => onChange({ jednatel: e.target.value })}
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-white/60">E-mail účetní</span>
          <input
            type="email"
            value={ucetniEmail}
            disabled={readOnly}
            onChange={(e) => onChange({ ucetniEmail: e.target.value })}
            className={inputClass}
          />
          <span className="text-xs text-white/35">
            Použije se pro odesílání paragonů k zaúčtování.
          </span>
        </label>
      </div>
    </SettingsCard>
  );
}
