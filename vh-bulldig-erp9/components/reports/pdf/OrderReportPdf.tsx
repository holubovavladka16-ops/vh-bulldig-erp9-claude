import { Document, View, Text, StyleSheet } from "@react-pdf/renderer";
import ReportPdfPage from "./ReportPdfPage";
import type { OrderReport } from "@/lib/reports";
import type { Company } from "@/types/database.types";

const styles = StyleSheet.create({
  section: { marginBottom: 12 },
  sectionTitle: { fontSize: 10, fontWeight: 700, marginBottom: 6 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2, borderBottom: "0.5pt solid #eee" },
  label: { color: "#666" },
  table: { marginTop: 4 },
  tableHeader: { flexDirection: "row", backgroundColor: "#f2f2f2", padding: 4, fontWeight: 700 },
  tableRow: { flexDirection: "row", padding: 4, borderBottom: "0.5pt solid #eee" },
  col: { flex: 1 },
  colWide: { flex: 2 },
});

export default function OrderReportPdf({ report, company }: { report: OrderReport; company: Company | null }) {
  const { order, totals } = report;

  return (
    <Document>
      <ReportPdfPage
        company={company}
        title="Výkaz zakázky"
        subtitle={`Období: ${report.dateFrom || "—"} – ${report.dateTo || "—"}`}
      >
        <View style={styles.section}>
          <Text style={styles.row}>{order.name}</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Stav zakázky</Text>
            <Text>{order.status === "aktivni" ? "Aktivní" : "Neaktivní"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Počet pracovních dnů</Text>
            <Text>{report.workDays}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Souhrn pracovního výkonu</Text>
          <View style={styles.row}><Text style={styles.label}>Hodiny výkonu</Text><Text>{totals.hoursWorked} hod</Text></View>
          <View style={styles.row}><Text style={styles.label}>Ruční výkop</Text><Text>{totals.manualDigBm} bm</Text></View>
          <View style={styles.row}><Text style={styles.label}>Průrazy</Text><Text>{totals.breakthroughsKs} ks</Text></View>
          <View style={styles.row}><Text style={styles.label}>Demontáž zámkové dlažby</Text><Text>{totals.pavingRemovalM2} m²</Text></View>
          <View style={styles.row}><Text style={styles.label}>Pokládka zámkové dlažby</Text><Text>{totals.pavingLayingM2} m²</Text></View>
          <View style={styles.row}><Text style={styles.label}>Denní sazby</Text><Text>{totals.dailyRateDays} dnů</Text></View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Zaměstnanci na zakázce</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.colWide}>Jméno</Text>
              <Text style={styles.col}>Dny</Text>
              <Text style={styles.col}>Hodiny</Text>
              <Text style={styles.col}>Výdělek</Text>
              <Text style={styles.col}>Zálohy</Text>
              <Text style={styles.col}>Doplatek</Text>
            </View>
            {report.employees.map((e) => (
              <View style={styles.tableRow} key={e.employee.id}>
                <Text style={styles.colWide}>{e.employee.first_name} {e.employee.last_name}</Text>
                <Text style={styles.col}>{e.workDays}</Text>
                <Text style={styles.col}>{e.hoursWorked}</Text>
                <Text style={styles.col}>{e.totalEarnings.toLocaleString("cs-CZ")} Kč</Text>
                <Text style={styles.col}>{e.totalAdvances.toLocaleString("cs-CZ")} Kč</Text>
                <Text style={styles.col}>{e.totalBalance.toLocaleString("cs-CZ")} Kč</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Celkové mzdové náklady</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Celkem</Text>
            <Text>{report.totalLaborCost.toLocaleString("cs-CZ")} Kč</Text>
          </View>
        </View>

        <View style={styles.section} wrap>
          <Text style={styles.sectionTitle}>Detail jednotlivých dnů</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.col}>Datum</Text>
              <Text style={styles.col}>Přítomnost</Text>
              <Text style={styles.col}>Výdělek</Text>
            </View>
            {report.days.map((d) => (
              <View style={styles.tableRow} key={d.record.id} wrap={false}>
                <Text style={styles.col}>{new Date(d.record.record_date).toLocaleDateString("cs-CZ")}</Text>
                <Text style={styles.col}>{d.record.work_start ?? "—"}–{d.record.work_end ?? "—"}</Text>
                <Text style={styles.col}>{d.record.total_earnings.toLocaleString("cs-CZ")} Kč</Text>
              </View>
            ))}
          </View>
        </View>
      </ReportPdfPage>
    </Document>
  );
}
