import SettingsCard from "./SettingsCard";

interface Props {
  street: string;
  city: string;
  zip: string;
  country: string;
  readOnly: boolean;
  onChange: (patch: Partial<{ street: string; city: string; zip: string; country: string }>) => void;
}

const inputClass =
  "w-full rounded-xl border border-glass-border bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition focus:border-turquoise focus:ring-1 focus:ring-turquoise disabled:opacity-50";

export default function AddressCard({ street, city, zip, country, readOnly, onChange }: Props) {
  return (
    <SettingsCard title="Adresa">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-sm text-white/60">Ulice a číslo</span>
          <input
            value={street}
            disabled={readOnly}
            onChange={(e) => onChange({ street: e.target.value })}
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-white/60">Město</span>
          <input
            value={city}
            disabled={readOnly}
            onChange={(e) => onChange({ city: e.target.value })}
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-white/60">PSČ</span>
          <input
            value={zip}
            disabled={readOnly}
            onChange={(e) => onChange({ zip: e.target.value })}
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-white/60">Stát</span>
          <input
            value={country}
            disabled={readOnly}
            onChange={(e) => onChange({ country: e.target.value })}
            className={inputClass}
          />
        </label>
      </div>
    </SettingsCard>
  );
}
