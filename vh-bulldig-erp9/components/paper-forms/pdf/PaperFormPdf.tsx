import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import { MONTH_NAMES, buildDayRows } from "@/lib/paperForm";
import type { Company, PaperForm } from "@/types/database.types";

const styles = StyleSheet.create({
  page: { padding: 28, fontSize: 7.5, fontFamily: "Helvetica", color: "#1a1a1a", backgroundColor: "#ffffff" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
  logo: { width: 40, height: 40, objectFit: "contain" },
  companyBlock: { textAlign: "right" },
  companyName: { fontSize: 9, fontWeight: 700 },
  companyMeta: { fontSize: 6.5, color: "#555" },
  qr: { width: 46, height: 46 },
  title: { fontSize: 13, fontWeight: 700, textAlign: "center", marginVertical: 6, color: "#8a6d1f" },
  idRow: { flexDirection: "row", justifyContent: "space-between", fontSize: 7, color: "#555", marginBottom: 8 },
  employeeSection: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 8, borderBottom: "1pt solid #C9A24B", paddingBottom: 6 },
  field: { width: "31%" },
  fieldLabel: { fontSize: 6, color: "#777" },
  fieldValue: { fontSize: 8, borderBottom: "0.5pt solid #999", minHeight: 12 },
  table: { borderTop: "0.75pt solid #333", borderLeft: "0.75pt solid #333" },
  tableHeaderRow: { flexDirection: "row", backgroundColor: "#F4EEDD" },
  tableHeaderCell: {
    fontSize: 6,
    fontWeight: 700,
    padding: 2,
    borderRight: "0.75pt solid #333",
    borderBottom: "0.75pt solid #333",
    textAlign: "center",
  },
  tableRow: { flexDirection: "row" },
  tableCell: {
    fontSize: 6.5,
    padding: 2,
    borderRight: "0.75pt solid #333",
    borderBottom: "0.75pt solid #333",
    textAlign: "center",
    minHeight: 12,
  },
  colDen: { width: "5%" },
  colDatum: { width: "9%" },
  colZakazka: { width: "17%" },
  colOd: { width: "7%" },
  colDo: { width: "7%" },
  colHodin: { width: "9%" },
  colVykop: { width: "10%" },
  colPruraz: { width: "8%" },
  colZaloha: { width: "10%" },
  colPodpis: { width: "18%" },
  summary: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8, borderTop: "1pt solid #C9A24B", paddingTop: 6 },
  summaryItem: { fontSize: 7 },
  signatures: { flexDirection: "row", justifyContent: "space-between", marginTop: 24 },
  signatureBlock: { width: "45%", borderTop: "0.75pt solid #333", paddingTop: 3, textAlign: "center", fontSize: 6.5 },
  dateLine: { flexDirection: "row", justifyContent: "space-between", marginTop: 16, fontSize: 6.5 },
});

interface Props {
  company: Company | null;
  forms: (PaperForm & { qrDataUrl: string })[];
  employeeInfoByFormId?: Record<
    string,
    { firstName: string; lastName: string; position: string; employmentTypeName: string; internalNumber: string }
  >;
}

export default function PaperFormPdf({ company, forms, employeeInfoByFormId }: Props) {
  return (
    <Document>
      {forms.map((form) => {
        const rows = buildDayRows(form.month, form.year);
        const emp = employeeInfoByFormId?.[form.id];

        return (
          <Page key={form.id} size="A4" style={styles.page}>
            <View style={styles.header}>
              {company?.logo_url ? (
                // eslint-disable-next-line jsx-a11y/alt-text
                <Image src={company.logo_url} style={styles.logo} />
              ) : (
                <View />
              )}
              <View style={styles.companyBlock}>
                <Text style={styles.companyName}>{company?.name ?? "VH Bulldig ERP 9"}</Text>
                {company?.street && <Text style={styles.companyMeta}>{company.street}, {company.city} {company.zip}</Text>}
                {company?.ico && <Text style={styles.companyMeta}>IČO: {company.ico}</Text>}
              </View>
            </View>

            <Text style={styles.title}>Měsíční pracovní výkaz</Text>

            <View style={styles.idRow}>
              <Text>ID formuláře: {form.form_number}</Text>
              <Text>{MONTH_NAMES[form.month - 1]} {form.year}</Text>
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image src={form.qrDataUrl} style={styles.qr} />
            </View>

            <View style={styles.employeeSection}>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Jméno a příjmení</Text>
                <Text style={styles.fieldValue}>{emp ? `${emp.firstName} ${emp.lastName}` : ""}</Text>
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Pracovní pozice</Text>
                <Text style={styles.fieldValue}>{emp?.position ?? ""}</Text>
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Datum narození</Text>
                <Text style={styles.fieldValue}></Text>
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Pracovní poměr</Text>
                <Text style={styles.fieldValue}>{emp?.employmentTypeName ?? ""}</Text>
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Číslo zaměstnance / interní označení</Text>
                <Text style={styles.fieldValue}>{emp?.internalNumber ?? ""}</Text>
              </View>
            </View>

            <View style={styles.table}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.tableHeaderCell, styles.colDen]}>Den</Text>
                <Text style={[styles.tableHeaderCell, styles.colDatum]}>Datum</Text>
                <Text style={[styles.tableHeaderCell, styles.colZakazka]}>Zakázka</Text>
                <Text style={[styles.tableHeaderCell, styles.colOd]}>Od</Text>
                <Text style={[styles.tableHeaderCell, styles.colDo]}>Do</Text>
                <Text style={[styles.tableHeaderCell, styles.colHodin]}>Celkem hodin</Text>
                <Text style={[styles.tableHeaderCell, styles.colVykop]}>Ruční výkop bm</Text>
                <Text style={[styles.tableHeaderCell, styles.colPruraz]}>Průrazy ks</Text>
                <Text style={[styles.tableHeaderCell, styles.colZaloha]}>Záloha Kč</Text>
                <Text style={[styles.tableHeaderCell, styles.colPodpis]}>Podpis</Text>
              </View>
              {rows.map((r) => (
                <View style={styles.tableRow} key={r.day}>
                  <Text style={[styles.tableCell, styles.colDen]}>{r.day}</Text>
                  <Text style={[styles.tableCell, styles.colDatum]}>{r.date}</Text>
                  <Text style={[styles.tableCell, styles.colZakazka]}></Text>
                  <Text style={[styles.tableCell, styles.colOd]}></Text>
                  <Text style={[styles.tableCell, styles.colDo]}></Text>
                  <Text style={[styles.tableCell, styles.colHodin]}></Text>
                  <Text style={[styles.tableCell, styles.colVykop]}></Text>
                  <Text style={[styles.tableCell, styles.colPruraz]}></Text>
                  <Text style={[styles.tableCell, styles.colZaloha]}></Text>
                  <Text style={[styles.tableCell, styles.colPodpis]}></Text>
                </View>
              ))}
            </View>

            <View style={styles.summary}>
              <Text style={styles.summaryItem}>Celkem pracovních dnů: ______</Text>
              <Text style={styles.summaryItem}>Celkem hodin: ______</Text>
              <Text style={styles.summaryItem}>Celkem ruční výkop bm: ______</Text>
              <Text style={styles.summaryItem}>Celkem průrazy ks: ______</Text>
              <Text style={styles.summaryItem}>Celkem zálohy Kč: ______</Text>
            </View>

            <View style={styles.signatures}>
              <Text style={styles.signatureBlock}>Podpis zaměstnance</Text>
              <Text style={styles.signatureBlock}>Podpis vedoucího / zaměstnavatele</Text>
            </View>
            <View style={styles.dateLine}>
              <Text>Datum odevzdání: ______________</Text>
              <Text>Datum kontroly: ______________</Text>
            </View>
          </Page>
        );
      })}
    </Document>
  );
}
