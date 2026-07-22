import { View, Text, StyleSheet } from "@react-pdf/renderer";
import type { ReactElement } from "react";

const styles = StyleSheet.create({
  h1: { fontSize: 14, fontWeight: 700, marginBottom: 6, color: "#1a1a1a" },
  h2: { fontSize: 11, fontWeight: 700, marginTop: 8, marginBottom: 3, color: "#1a1a1a" },
  h3: { fontSize: 9.5, fontWeight: 700, marginTop: 6, marginBottom: 2, color: "#8a6d1f" },
  p: { fontSize: 9, marginBottom: 4, color: "#1a1a1a", lineHeight: 1.4 },
  li: { fontSize: 9, marginBottom: 2, color: "#1a1a1a", flexDirection: "row" },
  bullet: { width: 10 },
  table: { marginVertical: 4, borderTop: "0.75pt solid #999", borderLeft: "0.75pt solid #999" },
  tr: { flexDirection: "row" },
  td: { flex: 1, fontSize: 8, padding: 3, borderRight: "0.75pt solid #999", borderBottom: "0.75pt solid #999" },
  sig: { fontSize: 9, marginTop: 10, color: "#1a1a1a" },
});

function textContent(el: Element): string {
  return el.textContent?.trim() ?? "";
}

export function htmlToPdfElements(html: string): ReactElement[] {
  if (typeof window === "undefined" || !html) return [];

  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html");
  const root = doc.body.firstElementChild;
  if (!root) return [];

  const elements: ReactElement[] = [];
  let key = 0;

  root.childNodes.forEach((node) => {
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as Element;
    key += 1;
    const k = key;

    switch (el.tagName) {
      case "H1":
        elements.push(<Text key={k} style={styles.h1}>{textContent(el)}</Text>);
        break;
      case "H2":
        elements.push(<Text key={k} style={styles.h2}>{textContent(el)}</Text>);
        break;
      case "H3":
        elements.push(<Text key={k} style={styles.h3}>{textContent(el)}</Text>);
        break;
      case "UL":
      case "OL": {
        const items = Array.from(el.querySelectorAll("li"));
        items.forEach((li, i) => {
          elements.push(
            <View key={`${k}-${i}`} style={styles.li}>
              <Text style={styles.bullet}>{el.tagName === "OL" ? `${i + 1}.` : "•"}</Text>
              <Text>{textContent(li)}</Text>
            </View>
          );
        });
        break;
      }
      case "TABLE": {
        const rows = Array.from(el.querySelectorAll("tr"));
        elements.push(
          <View key={k} style={styles.table}>
            {rows.map((row, ri) => (
              <View key={ri} style={styles.tr}>
                {Array.from(row.querySelectorAll("td")).map((cell, ci) => (
                  <Text key={ci} style={styles.td}>{textContent(cell)}</Text>
                ))}
              </View>
            ))}
          </View>
        );
        break;
      }
      case "P": {
        const isSig = el.classList.contains("sig-placeholder");
        elements.push(<Text key={k} style={isSig ? styles.sig : styles.p}>{textContent(el)}</Text>);
        break;
      }
      default:
        if (textContent(el)) elements.push(<Text key={k} style={styles.p}>{textContent(el)}</Text>);
    }
  });

  return elements;
}
