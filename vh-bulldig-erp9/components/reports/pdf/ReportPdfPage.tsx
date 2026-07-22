import { Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import type { Company } from "@/types/database.types";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 9, fontFamily: "Helvetica", color: "#1a1a1a" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  logo: { width: 48, height: 48, objectFit: "contain" },
  companyBlock: { textAlign: "right" },
  companyName: { fontSize: 11, fontWeight: 700 },
  companyMeta: { fontSize: 8, color: "#555" },
  title: { fontSize: 14, fontWeight: 700, marginBottom: 2 },
  subtitle: { fontSize: 9, color: "#555", marginBottom: 12 },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 32,
    right: 32,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: "#888",
    borderTop: "1pt solid #ddd",
    paddingTop: 6,
  },
  watermark: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: 260,
    transform: "translate(-130px, -130px)",
  },
});

const SIZE_WIDTH: Record<string, number> = { maly: 140, stredni: 220, velky: 320, automaticky: 240 };

interface Props {
  company: Company | null;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export default function ReportPdfPage({ company, title, subtitle, children }: Props) {
  const createdAt = new Date().toLocaleString("cs-CZ");

  return (
    <Page size="A4" style={styles.page} wrap>
      {company?.watermark_url && (
        <Image
          src={company.watermark_url}
          style={{
            ...styles.watermark,
            width: SIZE_WIDTH[company.watermark_size] ?? 240,
            opacity: (company.watermark_opacity ?? 12) / 100,
          }}
        />
      )}

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
          {company?.ico && <Text style={styles.companyMeta}>IČO: {company.ico}{company.dic ? ` · DIČ: ${company.dic}` : ""}</Text>}
        </View>
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      {children}

      <View style={styles.footer} fixed>
        <Text>Vytvořeno: {createdAt}</Text>
        <Text render={({ pageNumber, totalPages }) => `Strana ${pageNumber} / ${totalPages}`} />
      </View>
    </Page>
  );
}
