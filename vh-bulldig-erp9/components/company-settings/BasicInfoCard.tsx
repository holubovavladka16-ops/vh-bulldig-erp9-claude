import SettingsCard from "./SettingsCard";

interface Props {
  name: string;
  slogan: string;
  ico: string;
  isVatPayer: boolean;
  dic: string;
  readOnly: boolean;
  onChange: (patch: Partial<{ name: string; slogan: string; ico: string; isVatPayer: boolean; dic: string }>) => void;
  errors: { name?: string; dic?: string };
}

export default function BasicInfoCard({ name, slogan, ico, isVatPayer, dic, readOnly, onChange, errors }: Props) {
  return (
    <SettingsCard title="Základní údaje">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Název společnosti" required error={errors.name}>
          <input
            value={name}
            disabled={readOnly}
            onChange={(e) => onChange({ name: e.target.value })}
            className={inputClass}
          />
        </Field>

        <Field label="Slogan / popis firmy">
          <input
            value={slogan}
            disabled={readOnly}
            onChange={(e) => onChange({ slogan: e.target.value })}
            className={inputClass}
          />
        </Field>

        <Field label="IČO">
          <input
            value={ico}
            disabled={readOnly}
            onChange={(e) => onChange({ ico: e.target.value })}
            className={inputClass}
          />
        </Field>

        <Field label="Plátce DPH">
          <div className="flex gap-4 pt-2">
            <label className="flex items-center gap-2 text-sm text-white/80">
              <input
                type="radio"
                name="is_vat_payer"
                disabled={readOnly}
                checked={isVatPayer}
                onChange={() => onChange({ isVatPayer: true })}
              />
              Ano
            </label>
            <label className="flex items-center gap-2 text-sm text-white/80">
              <input
                type="radio"
                name="is_vat_payer"
                disabled={readOnly}
                checked={!isVatPayer}
                onChange={() => onChange({ isVatPayer: false })}
              />
              Ne
            </label>
          </div>
        </Field>

        <Field label="DIČ" required={isVatPayer} error={errors.dic}>
          <input
            value={dic}
            disabled={readOnly}
            onChange={(e) => onChange({ dic: e.target.value })}
            className={inputClass}
          />
        </Field>
      </div>
    </SettingsCard>
  );
}

const inputClass =
  "w-full rounded-xl border border-glass-border bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition focus:border-turquoise focus:ring-1 focus:ring-turquoise disabled:opacity-50";

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm text-white/60">
        {label}
        {required && <span className="text-red-300"> *</span>}
      </span>
      {children}
      {error && <span className="text-xs text-red-300">{error}</span>}
    </label>
  );
}
