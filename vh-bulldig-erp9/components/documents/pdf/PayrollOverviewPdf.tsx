import { Document, View, Text, StyleSheet } from "@react-pdf/renderer";
import ReportPdfPage from "@/components/reports/pdf/ReportPdfPage";
import type { Company } from "@/types/database.types";
import type { EmployeePayrollSummary } from "@/lib/payroll";

const styles = StyleSheet.create({
  table: { marginTop: 4 },
  tableHeader: { flexDirection: "row", backgroundColor: "#f2f2f2", padding: 4, fontWeight: 700 },
  tableRow: { flexDirection: "row", padding: 4, borderBottom: "0.5pt solid #eee" },
  col: { flex: 1 },
  colWide: { flex: 2 },
  totalsRow: { flexDirection: "row", padding: 4, borderTop: "1pt solid #333", fontWeight: 700 },
});

interface Props {
  company: Company | null;
  dateFrom: string;
  dateTo: string;
  summaries: EmployeePayrollSummary[];
}

export default function PayrollOverviewPdf({ company, dateFrom, dateTo, summaries }: Props) {
  const totalEarnings = summaries.reduce((s, x) => s + x.totalEarnings, 0);
  const totalAdvances = summaries.reduce((s, x) => s + x.totalAdvances, 0);
  const totalBalance = summaries.reduce((s, x) => s + x.balanceDue, 0);

  return (
    <Document>
      <ReportPdfPage company={company} title="Kompletní mzdový přehled" subtitle={`Období: ${dateFrom || "—"} – ${dateTo || "—"}`}>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colWide}>Zaměstnanec</Text>
            <Text style={styles.col}>Dny</Text>
            <Text style={styles.col}>Výdělek</Text>
            <Text style={styles.col}>Zálohy</Text>
            <Text style={styles.col}>Doplatek</Text>
          </View>
          {summaries.map((s) => (
            <View style={styles.tableRow} key={s.employee.id} wrap={false}>
              <Text style={styles.colWide}>{s.employee.first_name} {s.employee.last_name}</Text>
              <Text style={styles.col}>{s.workDays}</Text>
              <Text style={styles.col}>{s.totalEarnings.toLocaleString("cs-CZ")} Kč</Text>
              <Text style={styles.col}>{s.totalAdvances.toLocaleString("cs-CZ")} Kč</Text>
              <Text style={styles.col}>{s.balanceDue.toLocaleString("cs-CZ")} Kč</Text>
            </View>
          ))}
          <View style={styles.totalsRow}>
            <Text style={styles.colWide}>Celkem</Text>
            <Text style={styles.col} />
            <Text style={styles.col}>{totalEarnings.toLocaleString("cs-CZ")} Kč</Text>
            <Text style={styles.col}>{totalAdvances.toLocaleString("cs-CZ")} Kč</Text>
            <Text style={styles.col}>{totalBalance.toLocaleString("cs-CZ")} Kč</Text>
          </View>
        </View>
      </ReportPdfPage>
    </Document>
  );
}
