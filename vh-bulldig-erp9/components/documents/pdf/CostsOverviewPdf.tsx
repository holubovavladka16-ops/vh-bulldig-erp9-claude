import { Document, View, Text, StyleSheet } from "@react-pdf/renderer";
import ReportPdfPage from "@/components/reports/pdf/ReportPdfPage";
import { COST_CATEGORY_LABELS } from "@/lib/costs";
import type { Company, Cost, CostCategory } from "@/types/database.types";

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3, borderBottom: "0.5pt solid #eee" },
  label: { color: "#666" },
  sectionTitle: { fontSize: 10, fontWeight: 700, marginTop: 10, marginBottom: 4 },
  table: { marginTop: 4 },
  tableHeader: { flexDirection: "row", backgroundColor: "#f2f2f2", padding: 4, fontWeight: 700 },
  tableRow: { flexDirection: "row", padding: 4, borderBottom: "0.5pt solid #eee" },
  col: { flex: 1 },
  colWide: { flex: 2 },
});

interface Props {
  company: Company | null;
  orderName: string;
  dateFrom: string;
  dateTo: string;
  costs: Cost[];
  categoryTotals: Record<CostCategory, number>;
  laborCost: number;
}

export default function CostsOverviewPdf({ company, orderName, dateFrom, dateTo, costs, categoryTotals, laborCost }: Props) {
  const otherTotal = Object.values(categoryTotals).reduce((s, v) => s + v, 0);

  return (
    <Document>
      <ReportPdfPage company={company} title="Přehled nákladů" subtitle={`${orderName} · ${dateFrom || "—"} – ${dateTo || "—"}`}>
        <Text style={styles.sectionTitle}>Souhrn podle kategorií</Text>
        {Object.entries(categoryTotals).map(([key, value]) => (
          <View style={styles.row} key={key}>
            <Text style={styles.label}>{COST_CATEGORY_LABELS[key as CostCategory]}</Text>
            <Text>{value.toLocaleString("cs-CZ")} Kč</Text>
          </View>
        ))}
        <View style={styles.row}><Text style={styles.label}>Mzdové náklady</Text><Text>{laborCost.toLocaleString("cs-CZ")} Kč</Text></View>
        <View style={styles.row}><Text style={styles.label}>Ostatní náklady celkem</Text><Text>{otherTotal.toLocaleString("cs-CZ")} Kč</Text></View>
        <View style={styles.row}><Text style={styles.label}>Celkové náklady</Text><Text>{(otherTotal + laborCost).toLocaleString("cs-CZ")} Kč</Text></View>

        <Text style={styles.sectionTitle}>Jednotlivé náklady</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.col}>Datum</Text>
            <Text style={styles.col}>Kategorie</Text>
            <Text style={styles.colWide}>Popis</Text>
            <Text style={styles.col}>Částka</Text>
          </View>
          {costs.map((c) => (
            <View style={styles.tableRow} key={c.id} wrap={false}>
              <Text style={styles.col}>{new Date(c.cost_date).toLocaleDateString("cs-CZ")}</Text>
              <Text style={styles.col}>{COST_CATEGORY_LABELS[c.category]}</Text>
              <Text style={styles.colWide}>{c.description}</Text>
              <Text style={styles.col}>{c.amount.toLocaleString("cs-CZ")} Kč</Text>
            </View>
          ))}
        </View>
      </ReportPdfPage>
    </Document>
  );
}
