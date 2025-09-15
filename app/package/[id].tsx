import React from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { buildPrice } from "../../lib/pricing"; // <-- pricing engine

export default function PackageDetails() {
  const router = useRouter();
  const params = useLocalSearchParams(); // id, pkg

  // Parse pkg param
  const raw = Array.isArray(params.pkg) ? params.pkg[0] : params.pkg;
  let initialPkg: any = null;
  try {
    if (raw) initialPkg = JSON.parse(raw);
  } catch {
    initialPkg = null;
  }

  if (!initialPkg) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={{ padding: 20 }}>
          <Text style={styles.error}>Package not found.</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  // ---- Live pricing state (selected hotel) ----
  const [selectedHotelIndex, setSelectedHotelIndex] = React.useState(0);
  const flight = initialPkg.flight; // single recommended flight
  const hotels: any[] = Array.isArray(initialPkg.hotels) ? initialPkg.hotels : [];
  const nights: number = initialPkg.nights ?? 1;

  // compute price for current hotel
  const currentHotel = hotels[selectedHotelIndex] ?? { pricePerNight: 0, nights };
  const livePricing = React.useMemo(
    () => buildPrice(flight, { ...currentHotel, nights }, { marginPct: 0.08, fees: 15 }),
    [flight, currentHotel, nights]
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={22} color="#0f172a" />
          </TouchableOpacity>
          <Text style={styles.h1}>{initialPkg.title}</Text>
        </View>

        {/* Hero */}
        <Image
          source={{ uri: `https://picsum.photos/800/400?random=${id ?? "0"}` }}
          style={styles.hero}
        />

        {/* Info (shows LIVE price) */}
        <View style={styles.infoCard}>
          <View style={styles.rowBetween}>
            <Text style={styles.price}>€{livePricing.totalPerPerson}</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="sparkles-outline" size={16} color="#0f172a" />
              <Text style={styles.aiText}>AI-generated</Text>
            </View>
          </View>
          <Text style={styles.sub}>
            per person · {nights} nights · {initialPkg.destination}
          </Text>
          <Text style={styles.verified}>
            Verified {new Date(livePricing.verifiedAt).toLocaleString()}
          </Text>
        </View>

        {/* Highlights */}
        {Array.isArray(initialPkg.highlights) && initialPkg.highlights.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Highlights</Text>
            <View style={styles.tagsWrap}>
              {initialPkg.highlights.map((h: string) => (
                <Text key={h} style={styles.tag}>{h}</Text>
              ))}
            </View>
          </>
        )}

        {/* Price breakdown (LIVE) */}
        <Text style={styles.sectionTitle}>Price breakdown</Text>
        <View style={styles.block}>
          {"flights" in livePricing.breakdown && (
            <Row label="Flights" value={livePricing.breakdown.flights} />
          )}
          {"hotel" in livePricing.breakdown && (
            <Row label={`Hotel (${nights} nights)`} value={livePricing.breakdown.hotel} />
          )}
          {livePricing.breakdown.transfers != null && (
            <Row label="Transfers" value={livePricing.breakdown.transfers!} />
          )}
          {livePricing.breakdown.activities != null && (
            <Row label="Activities" value={livePricing.breakdown.activities!} />
          )}
          {livePricing.breakdown.fees != null && (
            <Row label="Fees" value={livePricing.breakdown.fees!} />
          )}
        </View>

        {/* Recommended flight */}
        {flight && (
          <>
            <Text style={styles.sectionTitle}>Recommended flight</Text>
            <View style={styles.block}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={styles.rowLabel}>{flight.airline}</Text>
                <Text style={styles.rowValue}>€{flight.price}</Text>
              </View>
              <Text style={styles.muted}>
                {flight.stops === 0 ? "Direct" : `${flight.stops} stop`} ·{" "}
                {Math.round(flight.durationMinutes / 60)}h
              </Text>
              {!!flight.fareBrand && <Text style={styles.muted}>Fare: {flight.fareBrand}</Text>}
              <View style={{ flexDirection: "row", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                <Badge text={flight.baggage.carryOn ? "Carry-on ✓" : "No carry-on"} />
                <Badge
                  text={
                    flight.baggage.checkedKg ? `Checked bag ${flight.baggage.checkedKg}kg` : "No checked bag"
                  }
                />
                {Array.isArray(flight.extras) &&
                  flight.extras.map((e: string) => <Badge key={e} text={e} />)}
              </View>
            </View>
          </>
        )}

        {/* Hotel selector (tap to re-price) */}
        {hotels.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Choose hotel (live re-price)</Text>
            {hotels.map((h, idx) => {
              const active = idx === selectedHotelIndex;
              return (
                <TouchableOpacity
                  key={h.id ?? h.name ?? idx}
                  onPress={() => setSelectedHotelIndex(idx)}
                  activeOpacity={0.8}
                  style={[styles.block, active && styles.blockActive]}
                >
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={styles.rowLabel}>
                      {h.name ?? "Hotel"} {h.stars ? `• ${"★".repeat(h.stars)}` : ""}
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Text style={styles.rowValue}>€{h.pricePerNight}/night</Text>
                      {active && <Ionicons name="checkmark-circle" size={20} color="#16a34a" />}
                    </View>
                  </View>
                  <Text style={styles.muted}>
                    {h.area ? `${h.area} · ` : ""}
                    {h.board ?? "RO"} · {h.refundable ? "Refundable" : "Non-ref"}
                  </Text>
                  {Array.isArray(h.amenities) && (
                    <View style={{ flexDirection: "row", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                      {h.amenities.map((a: string) => <Badge key={a} text={a} />)}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </>
        )}

        {/* CTAs */}
        <View style={styles.ctaRow}>
          <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={() => router.back()}>
            <Text style={[styles.btnText, styles.btnGhostText]}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.btnPrimary]}>
            <Text style={[styles.btnText, styles.btnPrimaryText]}>Request Booking</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.rowBetween}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>€{value}</Text>
    </View>
  );
}

function Badge({ text }: { text: string }) {
  return (
    <View
      style={{
        backgroundColor: "#eef2ff",
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        marginRight: 6,
        marginBottom: 6,
      }}
    >
      <Text style={{ color: "#3730a3", fontWeight: "800", fontSize: 12 }}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f6f7fb" },
  scroll: { padding: 16 },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  iconBtn: { marginRight: 8, padding: 6 },
  h1: { fontSize: 22, fontWeight: "800", color: "#0f172a", flex: 1 },
  hero: { width: "100%", height: 200, borderRadius: 16, marginBottom: 16 },
  infoCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#eef0f4",
    marginBottom: 20,
  },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  price: { fontSize: 20, fontWeight: "900", color: "#0f172a" },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  aiText: { fontWeight: "800", color: "#0f172a" },
  sub: { color: "#475569", marginTop: 6 },
  verified: { color: "#64748b", marginTop: 2, fontSize: 12, fontWeight: "700" },
  sectionTitle: { fontSize: 16, fontWeight: "900", marginBottom: 8, marginTop: 10, color: "#0f172a" },
  tagsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  tag: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    fontSize: 13,
    fontWeight: "700",
    color: "#0f172a",
  },
  block: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#eef0f4",
    marginBottom: 12,
  },
  blockActive: {
    borderColor: "#0f172a",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  rowLabel: { color: "#0f172a", fontWeight: "700" },
  rowValue: { color: "#0f172a", fontWeight: "900" },
  muted: { color: "#64748b", marginTop: 2 },
  ctaRow: { flexDirection: "row", gap: 12 },
  btn: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: "center", borderWidth: 1 },
  btnText: { fontWeight: "800" },
  btnGhost: { backgroundColor: "white", borderColor: "#e5e7eb" },
  btnGhostText: { color: "#0f172a" },
  btnPrimary: { backgroundColor: "#0f172a", borderColor: "#0f172a" },
  btnPrimaryText: { color: "white" },
  error: { textAlign: "center", color: "#ef4444" },
  backBtn: { alignSelf: "center", marginTop: 20 },
  backBtnText: { color: "#2563eb", fontWeight: "800" },
});
