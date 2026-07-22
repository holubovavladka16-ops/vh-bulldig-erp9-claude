import { Document, View, Text, StyleSheet } from "@react-pdf/renderer";
import ReportPdfPage from "@/components/reports/pdf/ReportPdfPage";
import { htmlToPdfElements } from "@/lib/htmlToPdfElements";
import type { Company, DocumentV2 } from "@/types/database.types";

const styles = StyleSheet.create({
  meta: { fontSize: 8, color: "#666", marginBottom: 8 },
});

export default function DocumentPdf({ company, doc }: { company: Company | null; doc: DocumentV2 }) {
  const elements = htmlToPdfElements(doc.content);

  return (
    <Document>
      <ReportPdfPage
        company={company}
        title={doc.title}
        subtitle={`${doc.document_number} · verze ${doc.version_number} · vytvořeno ${new Date(doc.created_at).toLocaleDateString("cs-CZ")}`}
      >
        <View>
          <Text style={styles.meta}>
            {doc.effective_date && `Účinnost od: ${new Date(doc.effective_date).toLocaleDateString("cs-CZ")}  `}
            {doc.expiry_date && `Platnost do: ${new Date(doc.expiry_date).toLocaleDateString("cs-CZ")}`}
          </Text>
          {elements}
        </View>
      </ReportPdfPage>
    </Document>
  );
}
