// app/trip/[id].tsx
import { useEffect, useState } from "react";
import {
  SafeAreaView, ScrollView, View, Text, StyleSheet,
  ActivityIndicator, Alert, TouchableOpacity
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { API_BASE_URL as BASE_URL } from "../../lib/config";

type Trip = {
  id: string;
  title: string;
  destination: string;
  startDate?: string | null;
  endDate?: string | null;
  currency?: string;
  pricePerPerson?: number | null;
  createdAt: string;
  payload?: any;
};

type Activity = { id: string; title: string; date: string; location?: string };

export default function TripDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    let ok = true;
    (async () => {
      try {
        setLoading(true);
        const [tRes, aRes] = await Promise.all([
          fetch(`${BASE_URL}/api/trips/${id}?_t=${Date.now()}`, { cache: "no-store" }),
          fetch(`${BASE_URL}/api/trips/${id}/activities?from=today&to=+365d&_t=${Date.now()}`, { cache: "no-store" }),
        ]);
        if (!tRes.ok) throw new Error("Trip not found");
        const t: Trip = await tRes.json();
        const acts: Activity[] = aRes.ok ? await aRes.json() : [];
        if (!ok) return;
        setTrip(t);
        setActivities(Array.isArray(acts) ? acts : []);
      } catch (e: any) {
        if (!ok) return;
        Alert.alert("Error", e?.message || "Failed to load trip");
      } finally {
        if (ok) setLoading(false);
      }
    })();
    return () => { ok = false; };
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <ActivityIndicator />
          <Text style={{ marginTop: 8, color: "#666" }}>Loading trip…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!trip) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <Text style={{ fontWeight: "800", fontSize: 18 }}>Trip not found</Text>
          <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 12 }}>
            <Text style={{ color: "#2563eb", fontWeight: "700" }}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Text style={s.h1}>{trip.title}</Text>
        <Text style={s.muted}>{trip.destination}</Text>
        <Text style={s.mutedSmall}>
          {trip.startDate ? new Date(trip.startDate).toLocaleDateString() : "—"} —{" "}
          {trip.endDate ? new Date(trip.endDate).toLocaleDateString() : "—"}
        </Text>

        {/* Price */}
        {trip.pricePerPerson != null && (
          <View style={s.card}>
            <Text style={s.sectionTitle}>Price</Text>
            <Text style={s.price}>€{trip.pricePerPerson}</Text>
          </View>
        )}

        {/* Package payload summary (optional) */}
        {trip.payload && (
          <View style={s.card}>
            <Text style={s.sectionTitle}>Package Summary</Text>
            {trip.payload.flight && (
              <Text style={s.mutedSmall}>
                Flight • {trip.payload.flight.airline ?? "—"} •{" "}
                {trip.payload.flight.stops === 0 ? "Direct" : `${trip.payload.flight.stops} stop`}
              </Text>
            )}
            {trip.payload.hotel && (
              <Text style={s.mutedSmall}>
                Hotel • {trip.payload.hotel.name ?? "—"} • €{trip.payload.hotel.pricePerNight}/night
              </Text>
            )}
          </View>
        )}

        {/* Activities */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Activities</Text>
          {!activities.length ? (
            <Text style={s.muted}>No activities yet.</Text>
          ) : (
            activities.map((a) => (
              <View key={a.id} style={s.row}>
                <Text style={s.rowTitle}>{a.title}</Text>
                <Text style={s.rowMeta}>
                  {new Date(a.date).toLocaleString()}
                  {a.location ? ` • ${a.location}` : ""}
                </Text>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f6f7fb" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  h1: { fontSize: 22, fontWeight: "800", color: "#0f172a" },
  muted: { color: "#475569", marginTop: 4 },
  mutedSmall: { color: "#64748b", marginTop: 2, fontSize: 12 },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#eef0f4",
  },
  sectionTitle: { fontSize: 16, fontWeight: "900", marginBottom: 8, color: "#0f172a" },
  price: { fontSize: 20, fontWeight: "900", color: "#0f172a" },
  row: { paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: "#e5e7eb" },
  rowTitle: { fontWeight: "600" },
  rowMeta: { color: "#6b7280", marginTop: 2 },
});
