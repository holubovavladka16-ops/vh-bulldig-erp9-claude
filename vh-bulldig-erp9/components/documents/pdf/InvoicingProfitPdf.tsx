import { Document, View, Text, StyleSheet } from "@react-pdf/renderer";
import ReportPdfPage from "@/components/reports/pdf/ReportPdfPage";
import type { Company, InvoicingRecord } from "@/types/database.types";
import type { ProfitCalculation } from "@/lib/profit";

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3, borderBottom: "0.5pt solid #eee" },
  label: { color: "#666" },
  sectionTitle: { fontSize: 10, fontWeight: 700, marginTop: 10, marginBottom: 4 },
  table: { marginTop: 4 },
  tableHeader: { flexDirection: "row", backgroundColor: "#f2f2f2", padding: 4, fontWeight: 700 },
  tableRow: { flexDirection: "row", padding: 4, borderBottom: "0.5pt solid #eee" },
  col: { flex: 1 },
});

interface Props {
  company: Company | null;
  orderName: string;
  dateFrom: string;
  dateTo: string;
  records: InvoicingRecord[];
  calc: ProfitCalculation;
}

export default function InvoicingProfitPdf({ company, orderName, dateFrom, dateTo, records, calc }: Props) {
  const resultLabel = calc.result > 0 ? "Zisk" : calc.result < 0 ? "Ztráta" : "Výsledek";

  return (
    <Document>
      <ReportPdfPage company={company} title="Fakturace a přehled zisku" subtitle={`${orderName} · ${dateFrom || "—"} – ${dateTo || "—"}`}>
        <Text style={styles.sectionTitle}>Přehled výpočtu</Text>
        <View style={styles.row}><Text style={styles.label}>Vyfakturováno</Text><Text>{calc.invoicedAmount.toLocaleString("cs-CZ")} Kč</Text></View>
        <View style={styles.row}><Text style={styles.label}>Mzdové náklady</Text><Text>{calc.laborCost.toLocaleString("cs-CZ")} Kč</Text></View>
        <View style={styles.row}><Text style={styles.label}>Ostatní náklady</Text><Text>{calc.otherCosts.toLocaleString("cs-CZ")} Kč</Text></View>
        <View style={styles.row}><Text style={styles.label}>Celkové náklady</Text><Text>{calc.totalCosts.toLocaleString("cs-CZ")} Kč</Text></View>
        <View style={styles.row}><Text style={styles.label}>{resultLabel}</Text><Text>{calc.result.toLocaleString("cs-CZ")} Kč</Text></View>

        <Text style={styles.sectionTitle}>Fakturované částky</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.col}>Období</Text>
            <Text style={styles.col}>Částka</Text>
            <Text style={styles.col}>Poznámka</Text>
          </View>
          {records.map((r) => (
            <View style={styles.tableRow} key={r.id} wrap={false}>
              <Text style={styles.col}>{new Date(r.period_from).toLocaleDateString("cs-CZ")} – {new Date(r.period_to).toLocaleDateString("cs-CZ")}</Text>
              <Text style={styles.col}>{r.invoiced_amount.toLocaleString("cs-CZ")} Kč</Text>
              <Text style={styles.col}>{r.note ?? "—"}</Text>
            </View>
          ))}
        </View>
      </ReportPdfPage>
    </Document>
  );
}
