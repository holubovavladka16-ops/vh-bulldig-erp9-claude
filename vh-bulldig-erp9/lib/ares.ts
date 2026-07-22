export interface AresResult {
  name: string;
  ico: string;
  dic: string;
  address: string;
}

/** Veřejný registr ekonomických subjektů (ARES) - žádný API klíč není potřeba. */
export async function lookupByIco(ico: string): Promise<AresResult | null> {
  const cleaned = ico.trim();
  if (!cleaned) return null;

  const response = await fetch(`https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/${cleaned}`, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) return null;

  const data = await response.json();
  if (!data || !data.obchodniJmeno) return null;

  const sidlo = data.sidlo ?? {};
  const addressParts = [
    sidlo.nazevUlice ? `${sidlo.nazevUlice} ${sidlo.cisloDomovni ?? ""}`.trim() : "",
    sidlo.nazevObce,
    sidlo.psc ? String(sidlo.psc) : "",
  ].filter(Boolean);

  return {
    name: data.obchodniJmeno,
    ico: data.ico ?? cleaned,
    dic: data.dic ?? "",
    address: addressParts.join(", "),
  };
}
