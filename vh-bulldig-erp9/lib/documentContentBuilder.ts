import { findDocumentTypeDef, SIGNER_ROLES } from "@/lib/documentTemplates";
import type { Company, DocumentTypeV2, Employee, Order, PaymentMethod } from "@/types/database.types";

export const UNFILLED_MARKER_REGEX = /\[\[DOPLNIT[^\]]*\]\]/g;

function esc(v: string | null | undefined): string {
  if (!v) return "";
  return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function marker(label: string): string {
  return `[[DOPLNIT: ${label}]]`;
}

const PAYMENT_LABELS: Record<PaymentMethod, string> = { hotove: "Hotově", bankovni_ucet: "Bankovní účet" };

export function buildInitialContent(
  type: DocumentTypeV2,
  company: Company | null,
  employee: Employee | null,
  employmentTypeName: string | null,
  order: Order | null,
  variables: Record<string, string>,
  customTypeName: string
): string {
  const def = findDocumentTypeDef(type);
  const title = type === "jiny_dokument" ? esc(customTypeName) || def.label : def.label;
  const roles = SIGNER_ROLES[type];

  let html = `<h1>${title}</h1>`;

  html += `<p><strong>${esc(company?.name)}</strong>`;
  if (company?.street) html += `, ${esc(company.street)}, ${esc(company.city)} ${esc(company.zip)}`;
  if (company?.ico) html += `, IČO: ${esc(company.ico)}`;
  if (company?.is_vat_payer && company.dic) html += `, DIČ: ${esc(company.dic)}`;
  html += `</p>`;

  if (def.category === "pracovnepravni" && employee) {
    html += `<h2>Zaměstnanec</h2><p>${esc(employee.first_name)} ${esc(employee.last_name)}`;
    html += employee.birth_date ? `, nar. ${new Date(employee.birth_date).toLocaleDateString("cs-CZ")}` : "";
    html += employee.address ? `, bytem ${esc(employee.address)}` : "";
    html += `</p>`;
    html += `<p>Pracovní pozice: ${esc(employee.position)} · Pracovní poměr: ${esc(employmentTypeName)} · `;
    html += `Datum nástupu: ${employee.start_date ? new Date(employee.start_date).toLocaleDateString("cs-CZ") : marker("datum nástupu")} · `;
    html += `Způsob platby: ${PAYMENT_LABELS[employee.payment_method]}</p>`;
  }

  if (def.category === "obchodni" && order) {
    html += `<h2>Zakázka</h2><p>${esc(order.name)}</p>`;
  }

  for (const field of def.fields) {
    const value = variables[field.key];
    html += `<h3>${esc(field.label)}</h3>`;
    if (field.type === "textarea") {
      html += `<p>${value ? esc(value).replace(/\n/g, "<br/>") : marker(field.label)}</p>`;
    } else {
      html += `<p>${value ? esc(value) : marker(field.label)}</p>`;
    }
  }

  html += `<h2>Podpisy</h2>`;
  for (const role of roles) {
    html += `<p class="sig-placeholder" data-role="${esc(role)}">Podpis – ${esc(role)}: ______________________</p>`;
  }

  return html;
}

export function findUnfilledMarkers(content: string): string[] {
  const matches = content.match(UNFILLED_MARKER_REGEX);
  return matches ? Array.from(new Set(matches)) : [];
}
