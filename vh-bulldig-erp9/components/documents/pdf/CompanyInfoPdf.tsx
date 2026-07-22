import { Document, View, Text, StyleSheet } from "@react-pdf/renderer";
import ReportPdfPage from "@/components/reports/pdf/ReportPdfPage";
import type { Company } from "@/types/database.types";

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3, borderBottom: "0.5pt solid #eee" },
  label: { color: "#666" },
});

export default function CompanyInfoPdf({ company }: { company: Company | null }) {
  return (
    <Document>
      <ReportPdfPage company={company} title="Firemní údaje" subtitle={company?.name ?? "—"}>
        <View style={styles.row}><Text style={styles.label}>Název společnosti</Text><Text>{company?.name ?? "—"}</Text></View>
        {company?.slogan && <View style={styles.row}><Text style={styles.label}>Slogan</Text><Text>{company.slogan}</Text></View>}
        <View style={styles.row}><Text style={styles.label}>IČO</Text><Text>{company?.ico ?? "—"}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Plátce DPH</Text><Text>{company?.is_vat_payer ? "Ano" : "Ne"}</Text></View>
        {company?.is_vat_payer && <View style={styles.row}><Text style={styles.label}>DIČ</Text><Text>{company?.dic ?? "—"}</Text></View>}
        <View style={styles.row}><Text style={styles.label}>Telefon</Text><Text>{company?.phone ?? "—"}</Text></View>
        <View style={styles.row}><Text style={styles.label}>E-mail</Text><Text>{company?.email ?? "—"}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Web</Text><Text>{company?.web ?? "—"}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Bankovní účet</Text><Text>{company?.bank_account ?? "—"}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Jednatel společnosti</Text><Text>{company?.jednatel ?? "—"}</Text></View>
        <View style={styles.row}>
          <Text style={styles.label}>Adresa</Text>
          <Text>{[company?.street, company?.city, company?.zip, company?.country].filter(Boolean).join(", ") || "—"}</Text>
        </View>
      </ReportPdfPage>
    </Document>
  );
}
