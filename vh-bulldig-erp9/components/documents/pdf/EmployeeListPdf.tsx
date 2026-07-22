import { Document, View, Text, StyleSheet } from "@react-pdf/renderer";
import ReportPdfPage from "@/components/reports/pdf/ReportPdfPage";
import type { Company, Employee } from "@/types/database.types";

const STATUS_LABELS: Record<string, string> = {
  aktivni: "Aktivní",
  neaktivni: "Neaktivní",
  ukonceny: "Ukončený",
  pozastaveny: "Pozastavený",
};

const styles = StyleSheet.create({
  table: { marginTop: 4 },
  tableHeader: { flexDirection: "row", backgroundColor: "#f2f2f2", padding: 4, fontWeight: 700 },
  tableRow: { flexDirection: "row", padding: 4, borderBottom: "0.5pt solid #eee" },
  col: { flex: 1 },
  colWide: { flex: 2 },
});

export default function EmployeeListPdf({ company, employees }: { company: Company | null; employees: Employee[] }) {
  return (
    <Document>
      <ReportPdfPage company={company} title="Seznam zaměstnanců" subtitle={`Celkem: ${employees.length}`}>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colWide}>Jméno a příjmení</Text>
            <Text style={styles.colWide}>Pozice</Text>
            <Text style={styles.col}>Nástup</Text>
            <Text style={styles.col}>Stav</Text>
          </View>
          {employees.map((e) => (
            <View style={styles.tableRow} key={e.id} wrap={false}>
              <Text style={styles.colWide}>{e.first_name} {e.last_name}</Text>
              <Text style={styles.colWide}>{e.position}</Text>
              <Text style={styles.col}>{new Date(e.start_date).toLocaleDateString("cs-CZ")}</Text>
              <Text style={styles.col}>{STATUS_LABELS[e.status] ?? e.status}</Text>
            </View>
          ))}
        </View>
      </ReportPdfPage>
    </Document>
  );
}
