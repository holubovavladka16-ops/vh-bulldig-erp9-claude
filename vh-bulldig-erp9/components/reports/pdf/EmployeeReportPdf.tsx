import { Document, View, Text, StyleSheet } from "@react-pdf/renderer";
import ReportPdfPage from "./ReportPdfPage";
import type { EmployeeReport } from "@/lib/reports";
import type { Company } from "@/types/database.types";
import { UNIT_LABELS } from "@/lib/pricing";

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

export default function EmployeeReportPdf({ report, company }: { report: EmployeeReport; company: Company | null }) {
  const { employee, totals } = report;

  return (
    <Document>
      <ReportPdfPage
        company={company}
        title="Výkaz zaměstnance"
        subtitle={`Období: ${report.dateFrom || "—"} – ${report.dateTo || "—"}`}
      >
        <View style={styles.section}>
          <Text style={styles.row}>
            {employee.first_name} {employee.last_name} · {employee.position}
          </Text>
          <View style={styles.row}>
            <Text style={styles.label}>Počet pracovních dnů</Text>
            <Text>{report.workDays}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Zakázky</Text>
            <Text>{report.orderNames.join(", ") || "—"}</Text>
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
          {totals.otherActivities.map((o) => (
            <View style={styles.row} key={o.name}>
              <Text style={styles.label}>{o.name}</Text>
              <Text>{o.quantity} {UNIT_LABELS[o.unit as keyof typeof UNIT_LABELS] ?? o.unit}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Finanční souhrn</Text>
          <View style={styles.row}><Text style={styles.label}>Celkový výdělek</Text><Text>{report.totalEarnings.toLocaleString("cs-CZ")} Kč</Text></View>
          <View style={styles.row}><Text style={styles.label}>Celkové zálohy</Text><Text>{report.totalAdvances.toLocaleString("cs-CZ")} Kč</Text></View>
          <View style={styles.row}><Text style={styles.label}>Doplatek</Text><Text>{report.totalBalance.toLocaleString("cs-CZ")} Kč</Text></View>
        </View>

        <View style={styles.section} wrap>
          <Text style={styles.sectionTitle}>Detail jednotlivých dnů</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.col}>Datum</Text>
              <Text style={styles.colWide}>Zakázka</Text>
              <Text style={styles.col}>Přítomnost</Text>
              <Text style={styles.col}>Výdělek</Text>
              <Text style={styles.col}>Záloha</Text>
              <Text style={styles.col}>Doplatek</Text>
            </View>
            {report.days.map((d) => (
              <View style={styles.tableRow} key={d.record.id} wrap={false}>
                <Text style={styles.col}>{new Date(d.record.record_date).toLocaleDateString("cs-CZ")}</Text>
                <Text style={styles.colWide}>{d.orderName}</Text>
                <Text style={styles.col}>{d.record.work_start ?? "—"}–{d.record.work_end ?? "—"}</Text>
                <Text style={styles.col}>{d.record.total_earnings.toLocaleString("cs-CZ")} Kč</Text>
                <Text style={styles.col}>{d.record.daily_advance.toLocaleString("cs-CZ")} Kč</Text>
                <Text style={styles.col}>{d.record.balance_due.toLocaleString("cs-CZ")} Kč</Text>
              </View>
            ))}
          </View>
        </View>
      </ReportPdfPage>
    </Document>
  );
}
