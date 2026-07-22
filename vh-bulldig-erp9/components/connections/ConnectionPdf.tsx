import { Document, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import ReportPdfPage from "@/components/reports/pdf/ReportPdfPage";
import { formatMeters } from "@/lib/geo";
import type { Company, Connection, ConnectionPhoto, ConnectionPoint } from "@/types/database.types";

const METHOD_LABELS: Record<string, string> = {
  prubezne_gps: "Průběžné GPS měření trasy",
  body_a_b: "Měření mezi bodem A a bodem B",
  dve_adresy: "Měření mezi dvěma adresami",
};

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2, borderBottom: "0.5pt solid #eee" },
  label: { color: "#666" },
  sectionTitle: { fontSize: 10, fontWeight: 700, marginTop: 10, marginBottom: 4 },
  pointRow: { flexDirection: "row", paddingVertical: 2 },
  col: { flex: 1 },
  photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  photoBlock: { width: 150, marginBottom: 8 },
  photoImage: { width: 150, height: 110, objectFit: "cover", borderRadius: 4 },
  photoCaption: { fontSize: 7, color: "#666", marginTop: 2 },
});

interface Props {
  company: Company | null;
  connection: Connection;
  orderName: string;
  points: ConnectionPoint[];
  photos: ConnectionPhoto[];
}

export default function ConnectionPdf({ company, connection, orderName, points, photos }: Props) {
  return (
    <Document>
      <ReportPdfPage
        company={company}
        title="Dokumentace přípojky"
        subtitle={`${orderName} · ${new Date(connection.connection_date).toLocaleDateString("cs-CZ")}`}
      >
        <View style={styles.row}><Text style={styles.label}>Název přípojky</Text><Text>{connection.name}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Způsob měření</Text><Text>{METHOD_LABELS[connection.measurement_method]}</Text></View>
        <View style={styles.row}>
          <Text style={styles.label}>Naměřená délka</Text>
          <Text>{connection.measured_length_meters !== null ? formatMeters(connection.measured_length_meters) : "—"}</Text>
        </View>
        <View style={styles.row}><Text style={styles.label}>Autor záznamu</Text><Text>{connection.created_by_name ?? "—"}</Text></View>
        {connection.note && (
          <View style={styles.row}><Text style={styles.label}>Poznámka</Text><Text>{connection.note}</Text></View>
        )}

        <Text style={styles.sectionTitle}>GPS body ({points.length})</Text>
        {points.map((p, i) => (
          <View key={p.id} style={styles.pointRow}>
            <Text style={styles.col}>{p.label || `Bod ${i + 1}`}</Text>
            <Text style={styles.col}>{p.latitude.toFixed(6)}, {p.longitude.toFixed(6)}</Text>
            <Text style={styles.col}>{p.accuracy ? `±${Math.round(p.accuracy)} m` : "—"}</Text>
          </View>
        ))}

        <Text style={styles.sectionTitle} break>Fotografie ({photos.length})</Text>
        {photos.length === 0 ? (
          <Text>Žádné fotografie.</Text>
        ) : (
          <View style={styles.photoGrid}>
            {photos.map((p) => (
              <View key={p.id} style={styles.photoBlock} wrap={false}>
                {/* eslint-disable-next-line jsx-a11y/alt-text */}
                <Image src={p.photo_url} style={styles.photoImage} />
                <Text style={styles.photoCaption}>
                  {p.note || "Fotografie"} · {new Date(p.created_at).toLocaleDateString("cs-CZ")}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ReportPdfPage>
    </Document>
  );
}
