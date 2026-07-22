import { Document, View, Text, StyleSheet } from "@react-pdf/renderer";
import ReportPdfPage from "@/components/reports/pdf/ReportPdfPage";
import type { Company, Employee, PaymentMethod } from "@/types/database.types";

const PAYMENT_LABELS: Record<PaymentMethod, string> = { hotove: "Hotově", bankovni_ucet: "Bankovní účet" };

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3, borderBottom: "0.5pt solid #eee" },
  label: { color: "#666" },
  sectionTitle: { fontSize: 10, fontWeight: 700, marginTop: 10, marginBottom: 4 },
});

function fmt(d: string | null) {
  return d ? new Date(d).toLocaleDateString("cs-CZ") : "—";
}

interface Props {
  company: Company | null;
  employee: Employee;
  employmentTypeName: string;
}

export default function EmployeeCardPdf({ company, employee, employmentTypeName }: Props) {
  return (
    <Document>
      <ReportPdfPage company={company} title="Karta zaměstnance" subtitle={`${employee.first_name} ${employee.last_name}`}>
        <Text style={styles.sectionTitle}>Osobní údaje</Text>
        <View style={styles.row}><Text style={styles.label}>Jméno a příjmení</Text><Text>{employee.first_name} {employee.last_name}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Datum narození</Text><Text>{fmt(employee.birth_date)}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Adresa</Text><Text>{employee.address ?? "—"}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Telefon</Text><Text>{employee.phone ?? "—"}</Text></View>
        <View style={styles.row}><Text style={styles.label}>E-mail</Text><Text>{employee.email ?? "—"}</Text></View>

        <Text style={styles.sectionTitle}>Pracovní údaje</Text>
        <View style={styles.row}><Text style={styles.label}>Pracovní pozice</Text><Text>{employee.position}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Datum nástupu</Text><Text>{fmt(employee.start_date)}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Pracovní poměr</Text><Text>{employmentTypeName}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Způsob platby</Text><Text>{PAYMENT_LABELS[employee.payment_method]}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Stav zaměstnance</Text><Text>{employee.status}</Text></View>
      </ReportPdfPage>
    </Document>
  );
}
