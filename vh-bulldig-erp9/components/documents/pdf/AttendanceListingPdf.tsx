import { Document, View, Text, StyleSheet } from "@react-pdf/renderer";
import ReportPdfPage from "@/components/reports/pdf/ReportPdfPage";
import { ATTENDANCE_STATUS_LABELS } from "@/lib/attendance";
import type { AttendanceRecord, Company } from "@/types/database.types";

const styles = StyleSheet.create({
  table: { marginTop: 4 },
  tableHeader: { flexDirection: "row", backgroundColor: "#f2f2f2", padding: 4, fontWeight: 700 },
  tableRow: { flexDirection: "row", padding: 4, borderBottom: "0.5pt solid #eee" },
  col: { flex: 1 },
  colWide: { flex: 2 },
  note: { fontSize: 7, color: "#888", marginTop: 6 },
});

interface Props {
  company: Company | null;
  title: string;
  subtitle: string;
  records: AttendanceRecord[];
  employeeNameById: Record<string, string>;
  orderNameById: Record<string, string>;
  showEmployeeColumn: boolean;
}

export default function AttendanceListingPdf({
  company,
  title,
  subtitle,
  records,
  employeeNameById,
  orderNameById,
  showEmployeeColumn,
}: Props) {
  return (
    <Document>
      <ReportPdfPage company={company} title={title} subtitle={subtitle}>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.col}>Datum</Text>
            {showEmployeeColumn && <Text style={styles.colWide}>Zaměstnanec</Text>}
            <Text style={styles.colWide}>Zakázka</Text>
            <Text style={styles.col}>Přítomnost</Text>
            <Text style={styles.col}>Výdělek</Text>
            <Text style={styles.col}>Stav</Text>
          </View>
          {records.map((r) => (
            <View style={styles.tableRow} key={r.id} wrap={false}>
              <Text style={styles.col}>{new Date(r.record_date).toLocaleDateString("cs-CZ")}</Text>
              {showEmployeeColumn && <Text style={styles.colWide}>{employeeNameById[r.employee_id] ?? "—"}</Text>}
              <Text style={styles.colWide}>{orderNameById[r.order_id] ?? "—"}</Text>
              <Text style={styles.col}>{r.work_start ?? "—"}–{r.work_end ?? "—"}</Text>
              <Text style={styles.col}>{r.total_earnings.toLocaleString("cs-CZ")} Kč</Text>
              <Text style={styles.col}>{ATTENDANCE_STATUS_LABELS[r.status]}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.note}>
          Evidence přítomnosti (čas od–do) slouží pouze jako záznam docházky a sama o sobě nevytváří mzdu.
        </Text>
      </ReportPdfPage>
    </Document>
  );
}
