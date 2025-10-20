import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
    Alert,
    Button,
    Image,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { API_BASE_URL as BASE_URL } from "../../lib/config"; // adjust relative path
import { buildPrice } from "../../lib/pricing";

export default function PackageDetails() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const raw = Array.isArray(params.pkg) ? params.pkg[0] : params.pkg;

  const initialPkg: any = useMemo(() => {
    try {
      if (raw) return JSON.parse(String(raw));
    } catch {
      // fallthrough
    }
    return null;
  }, [raw]);

  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  // pricing / package data (derived from parsed initialPkg)
  const flight = initialPkg?.flight ?? null;
  const hotels: any[] = useMemo(() => (Array.isArray(initialPkg?.hotels) ? initialPkg!.hotels! : []), [initialPkg]);
  const nights: number = initialPkg?.nights ?? 1;

  // Hooks (always declared in same order)
  const [selectedHotelIndex, setSelectedHotelIndex] = useState(0);
  const currentHotel = useMemo(() => hotels[selectedHotelIndex] ?? { pricePerNight: 0, nights }, [hotels, selectedHotelIndex, nights]);

  const livePricing = useMemo(
    () => buildPrice(flight, { ...currentHotel, nights }, { marginPct: 0.08, fees: 15 }),
    [flight, currentHotel, nights]
  );

  // ---- Add Activity Modal ----
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [dateISO, setDateISO] = useState("");
  const [location, setLocation] = useState("");
  const [durationM, setDurationM] = useState("");

  async function saveActivity() {
    try {
      const res = await fetch(`${BASE_URL}/api/trips/${id}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          date: dateISO,
          location,
          durationM: durationM ? Number(durationM) : undefined,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || res.statusText);
      }
      setShowModal(false);
      setTitle("");
      setDateISO("");
      setLocation("");
      setDurationM("");
      Alert.alert("Success", "Activity added!");
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to add activity");
    }
  }

  // ---- Save Trip ----
  const [saving, setSaving] = useState(false);

  async function saveCurrentAsTrip() {
    try {
      setSaving(true);

      // Optional health check for clearer errors during dev
      const health = await fetch(`${BASE_URL}/health`).catch(() => null);
      if (!health || (health.status && !health.ok)) {
        throw new Error(`API not reachable at ${BASE_URL}`);
      }

      const title = initialPkg?.title ?? "Saved Trip";
      const destination = initialPkg?.destination ?? "Destination";
      const startDate = initialPkg?.dates?.start ?? null;
      const endDate = initialPkg?.dates?.end ?? null;
      const pricePerPerson = livePricing?.totalPerPerson ?? null;

      const payload = { flight, hotel: currentHotel, nights, pkg: initialPkg };

      const res = await fetch(`${BASE_URL}/api/trips`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          destination,
          startDate,
          endDate,
          currency: "EUR",
          pricePerPerson,
          payload,
        }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || res.statusText || "Failed to save");

      Alert.alert("Saved", "Trip saved to My Trips", [
        { text: "Open My Trips", onPress: () => router.push("/trips") },
        { text: "OK" },
      ]);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to save trip");
    } finally {
      setSaving(false);
    }
  }

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

        {/* Info Card */}
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
                <Text key={h} style={styles.tag}>
                  {h}
                </Text>
              ))}
            </View>
          </>
        )}

        {/* Price breakdown */}
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
            </View>
          </>
        )}

        {/* Hotel selector */}
        {hotels.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Choose hotel</Text>
            {hotels.map((h, idx) => {
              const active = idx === selectedHotelIndex;
              return (
                <TouchableOpacity
                  key={h.id ?? idx}
                  onPress={() => setSelectedHotelIndex(idx)}
                  activeOpacity={0.8}
                  style={[styles.block, active && styles.blockActive]}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Text style={styles.rowLabel}>{h.name ?? "Hotel"}</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Text style={styles.rowValue}>€{h.pricePerNight}/night</Text>
                      {active && <Ionicons name="checkmark-circle" size={20} color="#16a34a" />}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </>
        )}

        {/* CTAs */}
        <View style={[styles.ctaRow, { marginTop: 4 }]}>
          <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={() => router.back()}>
            <Text style={[styles.btnText, styles.btnGhostText]}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.btnPrimary, saving && { opacity: 0.6 }]}
            onPress={saveCurrentAsTrip}
            disabled={saving}
          >
            <Text style={[styles.btnText, styles.btnPrimaryText]}>
              {saving ? "Saving…" : "Save Trip"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.ctaRow, { marginTop: 10 }]}>
          <TouchableOpacity
            style={[styles.btn, styles.btnPrimary]}
            onPress={() => setShowModal(true)}
          >
            <Text style={[styles.btnText, styles.btnPrimaryText]}>Add Activity</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* Add Activity Modal */}
      <Modal visible={showModal} animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={{ padding: 20, flex: 1, justifyContent: "center", gap: 12 }}>
          <Text style={{ fontWeight: "800", fontSize: 18, marginBottom: 8 }}>Add Activity</Text>
          <TextInput
            placeholder="Title"
            value={title}
            onChangeText={setTitle}
            style={styles.input}
          />
          <TextInput
            placeholder="Date (ISO: 2025-03-27T10:00:00)"
            value={dateISO}
            onChangeText={setDateISO}
            style={styles.input}
          />
          <TextInput
            placeholder="Location (optional)"
            value={location}
            onChangeText={setLocation}
            style={styles.input}
          />
          <TextInput
            placeholder="Duration minutes (optional)"
            value={durationM}
            onChangeText={setDurationM}
            keyboardType="numeric"
            style={styles.input}
          />
          <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
            <Button title="Cancel" onPress={() => setShowModal(false)} />
            <Button title="Save" onPress={saveActivity} />
          </View>
        </View>
      </Modal>
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
  input: { backgroundColor: "#f3f4f6", padding: 12, borderRadius: 10 },
  error: { textAlign: "center", color: "#ef4444" },
  backBtn: { alignSelf: "center", marginTop: 20 },
  backBtnText: { color: "#2563eb", fontWeight: "800" },
});
