"use client";

import { useEffect, useRef } from "react";
import { Bold, Heading1, Heading2, List, ListOrdered, Table as TableIcon } from "lucide-react";

interface Props {
  value: string;
  onChange: (html: string) => void;
  readOnly?: boolean;
}

export default function RichTextEditor({ value, onChange, readOnly }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (ref.current && isFirstRender.current) {
      ref.current.innerHTML = value;
      isFirstRender.current = false;
    }
  }, [value]);

  function exec(command: string, arg?: string) {
    if (readOnly) return;
    document.execCommand(command, false, arg);
    if (ref.current) onChange(ref.current.innerHTML);
    ref.current?.focus();
  }

  function insertTable() {
    if (readOnly) return;
    const html =
      "<table><tbody>" +
      Array.from({ length: 3 })
        .map(() => "<tr>" + Array.from({ length: 3 }).map(() => "<td>&nbsp;</td>").join("") + "</tr>")
        .join("") +
      "</tbody></table><p><br/></p>";
    document.execCommand("insertHTML", false, html);
    if (ref.current) onChange(ref.current.innerHTML);
  }

  return (
    <div className="rounded-xl border border-glass-border bg-white/5">
      {!readOnly && (
        <div className="flex flex-wrap gap-1 border-b border-glass-border p-2">
          <ToolbarButton onClick={() => exec("formatBlock", "H1")} icon={<Heading1 size={14} />} label="Nadpis 1" />
          <ToolbarButton onClick={() => exec("formatBlock", "H2")} icon={<Heading2 size={14} />} label="Nadpis 2" />
          <ToolbarButton onClick={() => exec("bold")} icon={<Bold size={14} />} label="Tučně" />
          <ToolbarButton onClick={() => exec("insertUnorderedList")} icon={<List size={14} />} label="Odrážky" />
          <ToolbarButton onClick={() => exec("insertOrderedList")} icon={<ListOrdered size={14} />} label="Číslovaný seznam" />
          <ToolbarButton onClick={insertTable} icon={<TableIcon size={14} />} label="Tabulka" />
        </div>
      )}
      <div
        ref={ref}
        contentEditable={!readOnly}
        suppressContentEditableWarning
        onBlur={() => ref.current && onChange(ref.current.innerHTML)}
        onInput={() => ref.current && onChange(ref.current.innerHTML)}
        className="prose-doc min-h-[300px] max-w-none px-4 py-3 text-sm text-white/90 outline-none [&_h1]:text-lg [&_h1]:font-bold [&_h1]:text-white [&_h2]:mt-3 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-white [&_h3]:mt-2 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-turquoise-light [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-white/20 [&_td]:p-1"
      />
    </div>
  );
}

function ToolbarButton({ onClick, icon, label }: { onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className="flex items-center gap-1 rounded-lg border border-glass-border px-2 py-1.5 text-xs text-white/70 transition hover:bg-white/5"
    >
      {icon}
    </button>
  );
}
