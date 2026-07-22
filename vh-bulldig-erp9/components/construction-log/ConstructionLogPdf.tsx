import { Document, View, Text, StyleSheet } from "@react-pdf/renderer";
import ReportPdfPage from "@/components/reports/pdf/ReportPdfPage";
import type { Company, ConstructionLogEntry } from "@/types/database.types";

const styles = StyleSheet.create({
  entry: { marginBottom: 10, borderBottom: "0.5pt solid #ddd", paddingBottom: 8 },
  entryHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  entryDate: { fontSize: 10, fontWeight: 700 },
  row: { flexDirection: "row", marginBottom: 2 },
  label: { width: 90, color: "#666" },
  value: { flex: 1 },
});

interface Props {
  company: Company | null;
  orderName: string;
  dateFrom: string;
  dateTo: string;
  entries: ConstructionLogEntry[];
  workerNamesByEntryId: Record<string, string>;
}

export default function ConstructionLogPdf({ company, orderName, dateFrom, dateTo, entries, workerNamesByEntryId }: Props) {
  return (
    <Document>
      <ReportPdfPage
        company={company}
        title="Stavební deník"
        subtitle={`${orderName} · Období: ${dateFrom || "—"} – ${dateTo || "—"}`}
      >
        {entries.length === 0 ? (
          <Text>Žádné záznamy v tomto období.</Text>
        ) : (
          entries.map((entry) => (
            <View key={entry.id} style={styles.entry} wrap={false}>
              <View style={styles.entryHeader}>
                <Text style={styles.entryDate}>{new Date(entry.log_date).toLocaleDateString("cs-CZ")}</Text>
                <Text>{entry.worker_count} dělníků</Text>
              </View>
              <View style={styles.row}><Text style={styles.label}>Počasí</Text><Text style={styles.value}>{entry.weather || "—"}</Text></View>
              <View style={styles.row}><Text style={styles.label}>Technika</Text><Text style={styles.value}>{entry.equipment || "—"}</Text></View>
              <View style={styles.row}><Text style={styles.label}>Dělníci</Text><Text style={styles.value}>{workerNamesByEntryId[entry.id] || "—"}</Text></View>
              <View style={styles.row}><Text style={styles.label}>Denní činnost</Text><Text style={styles.value}>{entry.daily_activity || "—"}</Text></View>
              <View style={styles.row}><Text style={styles.label}>Popis prací</Text><Text style={styles.value}>{entry.description || "—"}</Text></View>
            </View>
          ))
        )}
      </ReportPdfPage>
    </Document>
  );
}
