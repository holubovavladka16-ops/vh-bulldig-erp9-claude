import { Document, View, Text, StyleSheet } from "@react-pdf/renderer";
import ReportPdfPage from "@/components/reports/pdf/ReportPdfPage";
import { CHECK_RESULT_LABELS } from "@/components/paper-form-checks/CheckResultBadge";
import type { Company, PaperFormCheck } from "@/types/database.types";
import type { ComparisonResult } from "@/lib/paperFormComparison";

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3, borderBottom: "0.5pt solid #eee" },
  label: { color: "#666" },
  sectionTitle: { fontSize: 10, fontWeight: 700, marginTop: 10, marginBottom: 4 },
  dayBlock: { marginBottom: 6, borderBottom: "0.5pt solid #eee", paddingBottom: 4 },
  fieldRow: { flexDirection: "row", justifyContent: "space-between", fontSize: 7 },
});

const FIELD_LABELS: Record<string, string> = {
  zakazka: "Zakázka", od: "Od", do: "Do", hodin: "Celkem hodin",
  vykop: "Ruční výkop bm", pruraz: "Průrazy ks", zaloha: "Záloha Kč", dny: "Celkem pracovních dnů",
};

const RESULT_TEXT: Record<string, string> = {
  shoda: "Data se shodují", neshoda: "Data se neshodují", chybi: "Údaj chybí", nelze_precist: "Nelze přečíst",
};

interface Props {
  company: Company | null;
  check: PaperFormCheck;
  formNumber: string;
  employeeName: string;
  reviewerName: string;
  comparison: ComparisonResult;
}

export default function CheckProtocolPdf({ company, check, formNumber, employeeName, reviewerName, comparison }: Props) {
  return (
    <Document>
      <ReportPdfPage
        company={company}
        title="Protokol o kontrole papírového formuláře"
        subtitle={`${formNumber} · ${employeeName} · ${check.month}/${check.year}`}
      >
        <View style={styles.row}><Text style={styles.label}>Datum kontroly</Text><Text>{new Date(check.created_at).toLocaleString("cs-CZ")}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Kontrolující</Text><Text>{reviewerName}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Celkový výsledek</Text><Text>{CHECK_RESULT_LABELS[comparison.overallResult]}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Podpis zaměstnance</Text><Text>{comparison.signatures.zamestnanec}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Podpis vedoucího</Text><Text>{comparison.signatures.vedouci}</Text></View>
        {check.reviewer_note && <View style={styles.row}><Text style={styles.label}>Poznámka</Text><Text>{check.reviewer_note}</Text></View>}

        <Text style={styles.sectionTitle}>Měsíční souhrny</Text>
        {comparison.summary.map((f) => (
          <View style={styles.row} key={f.field}>
            <Text style={styles.label}>{FIELD_LABELS[f.field]}</Text>
            <Text>Papír: {f.paperValue} · ERP: {f.erpValue} · {RESULT_TEXT[f.result]}</Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Porovnání po dnech</Text>
        {comparison.days.map((d) => (
          <View key={d.day} style={styles.dayBlock} wrap={false}>
            <Text style={{ fontWeight: 700, fontSize: 8 }}>Den {d.day}</Text>
            {d.fields.map((f) => (
              <View key={f.field} style={styles.fieldRow}>
                <Text>{FIELD_LABELS[f.field]}</Text>
                <Text>Papír: {f.paperValue} · ERP: {f.erpValue} · {RESULT_TEXT[f.result]}</Text>
              </View>
            ))}
          </View>
        ))}
      </ReportPdfPage>
    </Document>
  );
}
