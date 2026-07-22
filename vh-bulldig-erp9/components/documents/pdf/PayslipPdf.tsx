import { Document, View, Text, StyleSheet } from "@react-pdf/renderer";
import ReportPdfPage from "@/components/reports/pdf/ReportPdfPage";
import { UNIT_LABELS } from "@/lib/pricing";
import type { Company, PaymentMethod } from "@/types/database.types";
import type { EmployeeReport } from "@/lib/reports";

const PAYMENT_LABELS: Record<PaymentMethod, string> = { hotove: "Hotově", bankovni_ucet: "Bankovní účet" };

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3, borderBottom: "0.5pt solid #eee" },
  label: { color: "#666" },
  sectionTitle: { fontSize: 10, fontWeight: 700, marginTop: 10, marginBottom: 4 },
  table: { marginTop: 4 },
  tableHeader: { flexDirection: "row", backgroundColor: "#f2f2f2", padding: 4, fontWeight: 700 },
  tableRow: { flexDirection: "row", padding: 4, borderBottom: "0.5pt solid #eee" },
  col: { flex: 1 },
  colWide: { flex: 2 },
  recap: { marginTop: 10, borderTop: "1pt solid #333", paddingTop: 6 },
  recapRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3, fontWeight: 700 },
  signatures: { flexDirection: "row", justifyContent: "space-between", marginTop: 40 },
  signatureBlock: { width: "40%", borderTop: "1pt solid #333", paddingTop: 4, textAlign: "center", fontSize: 8 },
  note: { fontSize: 7, color: "#888", marginTop: 8 },
});

interface Props {
  company: Company | null;
  report: EmployeeReport;
  paymentMethod: PaymentMethod;
}

export default function PayslipPdf({ company, report, paymentMethod }: Props) {
  const { employee, totals } = report;

  return (
    <Document>
      <ReportPdfPage
        company={company}
        title="Výplatní páska"
        subtitle={`${employee.first_name} ${employee.last_name} · Období: ${report.dateFrom || "—"} – ${report.dateTo || "—"}`}
      >
        <View style={styles.row}><Text style={styles.label}>Pracovní pozice</Text><Text>{employee.position}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Způsob platby</Text><Text>{PAYMENT_LABELS[paymentMethod]}</Text></View>

        <Text style={styles.sectionTitle}>Přehled práce (evidence přítomnosti)</Text>
        <View style={styles.row}><Text style={styles.label}>Počet pracovních dnů</Text><Text>{report.workDays}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Zakázky</Text><Text>{report.orderNames.join(", ") || "—"}</Text></View>
        <Text style={styles.note}>
          Evidence přítomnosti (čas od–do) je pouze záznam docházky a sama o sobě nevytváří mzdu.
        </Text>

        <Text style={styles.sectionTitle}>Přehled pracovních činností</Text>
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

        <Text style={styles.sectionTitle}>Detail jednotlivých dnů</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.col}>Datum</Text>
            <Text style={styles.colWide}>Zakázka</Text>
            <Text style={styles.col}>Výdělek</Text>
          </View>
          {report.days.map((d) => (
            <View style={styles.tableRow} key={d.record.id} wrap={false}>
              <Text style={styles.col}>{new Date(d.record.record_date).toLocaleDateString("cs-CZ")}</Text>
              <Text style={styles.colWide}>{d.orderName}</Text>
              <Text style={styles.col}>{d.record.total_earnings.toLocaleString("cs-CZ")} Kč</Text>
            </View>
          ))}
        </View>

        <View style={styles.recap}>
          <Text style={styles.sectionTitle}>Mzdová rekapitulace</Text>
          <View style={styles.recapRow}><Text>Celkový výdělek</Text><Text>{report.totalEarnings.toLocaleString("cs-CZ")} Kč</Text></View>
          <View style={styles.recapRow}><Text>Zálohy</Text><Text>{report.totalAdvances.toLocaleString("cs-CZ")} Kč</Text></View>
          <View style={styles.recapRow}><Text>Doplatek</Text><Text>{report.totalBalance.toLocaleString("cs-CZ")} Kč</Text></View>
        </View>

        <View style={styles.signatures}>
          <Text style={styles.signatureBlock}>Podpis zaměstnance</Text>
          <Text style={styles.signatureBlock}>Podpis zaměstnavatele</Text>
        </View>
      </ReportPdfPage>
    </Document>
  );
}
