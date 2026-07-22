import { Document, Page, View, Text, Image, Link, StyleSheet } from "@react-pdf/renderer";
import type { Company, GpsPhoto } from "@/types/database.types";
import { mapyCzUrl, googleMapsUrl, googleStreetViewUrl } from "@/lib/mapLinks";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 9, fontFamily: "Helvetica", color: "#1a1a1a" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  logo: { width: 44, height: 44, objectFit: "contain" },
  companyBlock: { textAlign: "right" },
  companyName: { fontSize: 10, fontWeight: 700 },
  companyMeta: { fontSize: 7, color: "#555" },
  title: { fontSize: 13, fontWeight: 700, marginBottom: 2 },
  docNumber: { fontSize: 8, color: "#666", marginBottom: 10 },
  photo: { width: "100%", height: 320, objectFit: "contain", marginBottom: 10, borderRadius: 4 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2, borderBottom: "0.5pt solid #eee" },
  label: { color: "#666" },
  linksSection: { marginTop: 10, flexDirection: "row", gap: 12 },
  linkText: { color: "#1a73e8", textDecoration: "underline", fontSize: 8 },
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
    width: 240,
    transform: "translate(-120px, -120px)",
  },
});

const SIZE_WIDTH: Record<string, number> = { maly: 140, stredni: 220, velky: 320, automaticky: 240 };

interface Props {
  company: Company | null;
  orderNameById: Record<string, string>;
  photos: GpsPhoto[];
  documentNumberPrefix?: string;
}

export default function GpsPhotoDocumentationPdf({ company, orderNameById, photos, documentNumberPrefix = "GPS" }: Props) {
  const createdAt = new Date().toLocaleString("cs-CZ");
  const total = photos.length;

  return (
    <Document>
      {photos.map((photo, index) => {
        const hasCoords = photo.latitude !== null && photo.longitude !== null;
        const dayName = new Date(photo.taken_at).toLocaleDateString("cs-CZ", { weekday: "long" });
        return (
          <Page key={photo.id} size="A4" style={styles.page} wrap={false}>
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
              </View>
            </View>

            <Text style={styles.title}>GPS fotodoklad – stavební dokumentace</Text>
            <Text style={styles.docNumber}>
              Číslo dokumentu: {documentNumberPrefix}-{photo.id.slice(0, 8).toUpperCase()} · Datum dokumentu: {createdAt}
            </Text>

            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={photo.photo_url} style={styles.photo} />

            <View style={styles.row}><Text style={styles.label}>Den</Text><Text>{dayName}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Datum</Text><Text>{new Date(photo.taken_at).toLocaleDateString("cs-CZ")}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Čas pořízení</Text><Text>{new Date(photo.taken_at).toLocaleTimeString("cs-CZ")}</Text></View>
            <View style={styles.row}>
              <Text style={styles.label}>GPS souřadnice</Text>
              <Text>{hasCoords ? `${photo.latitude!.toFixed(6)}, ${photo.longitude!.toFixed(6)}` : "—"}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Přesnost GPS</Text>
              <Text>{photo.accuracy ? `±${Math.round(photo.accuracy)} m` : "—"}</Text>
            </View>
            <View style={styles.row}><Text style={styles.label}>Adresa</Text><Text>{photo.address ?? "—"}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Zakázka</Text><Text>{orderNameById[photo.order_id] ?? "—"}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Autor</Text><Text>{photo.author_name ?? "—"}</Text></View>
            {photo.note && <View style={styles.row}><Text style={styles.label}>Poznámka</Text><Text>{photo.note}</Text></View>}

            {hasCoords && (
              <View style={styles.linksSection}>
                <Link src={mapyCzUrl(photo.latitude!, photo.longitude!)} style={styles.linkText}>Otevřít v Mapy.cz</Link>
                <Link src={googleMapsUrl(photo.latitude!, photo.longitude!)} style={styles.linkText}>Otevřít v Google Maps</Link>
                <Link src={googleStreetViewUrl(photo.latitude!, photo.longitude!)} style={styles.linkText}>Otevřít v Google Street View</Link>
              </View>
            )}

            <View style={styles.footer} fixed>
              <Text>Vytvořeno: {createdAt}</Text>
              <Text>Strana {index + 1} z {total}</Text>
            </View>
          </Page>
        );
      })}
    </Document>
  );
}
