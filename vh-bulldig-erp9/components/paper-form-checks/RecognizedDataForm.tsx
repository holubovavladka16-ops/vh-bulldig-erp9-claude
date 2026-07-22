"use client";

import type { RecognizedData, RecognizedDay, SignatureAnswer } from "@/lib/paperFormComparison";

const inputClass =
  "w-full rounded-lg border border-glass-border bg-white/5 px-2 py-1.5 text-xs text-white outline-none focus:border-turquoise";

interface Props {
  data: RecognizedData;
  onChange: (data: RecognizedData) => void;
  readOnly?: boolean;
}

export default function RecognizedDataForm({ data, onChange, readOnly }: Props) {
  function updateDay(day: number, patch: Partial<RecognizedDay>) {
    onChange({ ...data, days: data.days.map((d) => (d.day === day ? { ...d, ...patch } : d)) });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {data.days.map((d) => (
          <div key={d.day} className="rounded-xl border border-glass-border bg-white/5 p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-white">Den {d.day}</p>
              <label className="flex items-center gap-1.5 text-[11px] text-amber-300">
                <input
                  type="checkbox"
                  checked={d.nelzePrecist}
                  disabled={readOnly}
                  onChange={(e) => updateDay(d.day, { nelzePrecist: e.target.checked })}
                />
                Nelze přečíst
              </label>
            </div>

            {!d.nelzePrecist && (
              <div className="grid grid-cols-2 gap-2">
                <input placeholder="Zakázka" value={d.zakazka} disabled={readOnly} onChange={(e) => updateDay(d.day, { zakazka: e.target.value })} className={`${inputClass} col-span-2`} />
                <input placeholder="Od" value={d.od} disabled={readOnly} onChange={(e) => updateDay(d.day, { od: e.target.value })} className={inputClass} />
                <input placeholder="Do" value={d.do} disabled={readOnly} onChange={(e) => updateDay(d.day, { do: e.target.value })} className={inputClass} />
                <input placeholder="Hodin" value={d.hodin} disabled={readOnly} onChange={(e) => updateDay(d.day, { hodin: e.target.value })} className={inputClass} />
                <input placeholder="Výkop bm" value={d.vykop} disabled={readOnly} onChange={(e) => updateDay(d.day, { vykop: e.target.value })} className={inputClass} />
                <input placeholder="Průrazy ks" value={d.pruraz} disabled={readOnly} onChange={(e) => updateDay(d.day, { pruraz: e.target.value })} className={inputClass} />
                <input placeholder="Záloha Kč" value={d.zaloha} disabled={readOnly} onChange={(e) => updateDay(d.day, { zaloha: e.target.value })} className={inputClass} />
                <label className="col-span-2 flex items-center gap-1.5 text-[11px] text-white/60">
                  <input type="checkbox" checked={d.podpis} disabled={readOnly} onChange={(e) => updateDay(d.day, { podpis: e.target.checked })} />
                  Podpis u tohoto dne je vyplněn
                </label>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-glass-border bg-white/5 p-4">
        <p className="mb-2 text-sm font-semibold text-white">Měsíční souhrny (z papíru)</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          <input placeholder="Dny" value={data.summary.dny} disabled={readOnly} onChange={(e) => onChange({ ...data, summary: { ...data.summary, dny: e.target.value } })} className={inputClass} />
          <input placeholder="Hodin" value={data.summary.hodin} disabled={readOnly} onChange={(e) => onChange({ ...data, summary: { ...data.summary, hodin: e.target.value } })} className={inputClass} />
          <input placeholder="Výkop bm" value={data.summary.vykop} disabled={readOnly} onChange={(e) => onChange({ ...data, summary: { ...data.summary, vykop: e.target.value } })} className={inputClass} />
          <input placeholder="Průrazy ks" value={data.summary.pruraz} disabled={readOnly} onChange={(e) => onChange({ ...data, summary: { ...data.summary, pruraz: e.target.value } })} className={inputClass} />
          <input placeholder="Zálohy Kč" value={data.summary.zaloha} disabled={readOnly} onChange={(e) => onChange({ ...data, summary: { ...data.summary, zaloha: e.target.value } })} className={inputClass} />
        </div>
      </div>

      <div className="rounded-xl border border-glass-border bg-white/5 p-4">
        <p className="mb-2 text-sm font-semibold text-white">Podpisy</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <SignatureSelect
            label="Podpis zaměstnance"
            value={data.signatures.zamestnanec}
            disabled={readOnly}
            onChange={(v) => onChange({ ...data, signatures: { ...data.signatures, zamestnanec: v } })}
          />
          <SignatureSelect
            label="Podpis vedoucího / zaměstnavatele"
            value={data.signatures.vedouci}
            disabled={readOnly}
            onChange={(v) => onChange({ ...data, signatures: { ...data.signatures, vedouci: v } })}
          />
        </div>
      </div>
    </div>
  );
}

function SignatureSelect({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: SignatureAnswer;
  disabled?: boolean;
  onChange: (v: SignatureAnswer) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-white/60">{label}</span>
      <select value={value} disabled={disabled} onChange={(e) => onChange(e.target.value as SignatureAnswer)} className={inputClass}>
        <option value="uveden" className="bg-base-900">Podpis je uveden</option>
        <option value="chybi" className="bg-base-900">Podpis chybí</option>
        <option value="nelze_rozpoznat" className="bg-base-900">Nelze rozpoznat</option>
      </select>
    </label>
  );
}
