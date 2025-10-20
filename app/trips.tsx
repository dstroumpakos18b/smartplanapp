// app/trips.tsx
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { API_BASE_URL as BASE_URL } from "../lib/config";

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

const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString() : "—";

const thumbFor = (t: Trip) =>
  `https://picsum.photos/seed/${encodeURIComponent(t.id || "trip")}/600/360`;

export default function Trips() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [error, setError] = useState<string | null>(null);

  /** Load all trips */
  const load = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const res = await fetch(`${BASE_URL}/api/trips?_t=${Date.now()}`, {
        cache: "no-store",
      });
      const raw = await res.json().catch(() => []);
      const list: Trip[] = Array.isArray(raw)
        ? raw
        : Array.isArray((raw as any)?.data)
        ? (raw as any).data
        : [];
      console.log(
        "[Trips] GET /api/trips",
        res.status,
        "items:",
        list.length
      );
      setTrips(list);
    } catch (e: any) {
      console.error("[Trips] load error", e?.message);
      setError(e?.message || "Could not load trips");
      setTrips([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /** Delete with optimistic UI + robust POST fallback */
  const removeTrip = useCallback(async (id: string) => {
    console.log("[Trips] delete tapped", id);

    // optimistic update: remove immediately
    let previous: Trip[] = [];
    setTrips((prev: Trip[]) => {
      previous = prev;
      return prev.filter((t: Trip) => t.id !== id);
    });

    try {
      const res = await fetch(
        `${BASE_URL}/api/trips/delete?_t=${Date.now()}`,
        {
          method: "POST",
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        }
      );

      let body: any = null;
      try {
        body = await res.json();
      } catch {
        body = null;
      }

      console.log("[Trips] POST /api/trips/delete ->", res.status, body);

      // If server failed for a reason other than "not_found", restore UI
      if (!res.ok || (body && typeof body === "object" && body.removed !== 1)) {
        if (!body?.error || body.error !== "not_found") {
          setTrips(previous);
          throw new Error(body?.error || `HTTP ${res.status}`);
        }
      }
    } catch (err: any) {
      console.error("[Trips] delete error", err?.message);
      Alert.alert("Delete failed", err?.message || "Unknown error");
    }
  }, []);

  const confirmDelete = (id: string) => {
    Alert.alert("Remove trip", "Delete this trip?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => removeTrip(id) },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <ActivityIndicator />
          <Text style={{ marginTop: 8, color: "#666" }}>Loading…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      {/* Top status bar to verify we see items */}
      <View style={s.statusBar}>
        <Text style={s.statusText}>Trips fetched: {trips.length}</Text>
        <TouchableOpacity onPress={load} style={[s.btnSmall, s.btnPrimary]}>
          <Text style={[s.btnSmallText, s.btnPrimaryText]}>Reload</Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={s.center}>
          <Text style={{ fontWeight: "800", fontSize: 18, marginBottom: 8 }}>
            Something went wrong
          </Text>
          <Text style={{ color: "#6b7280", marginBottom: 12 }}>{error}</Text>
          <TouchableOpacity onPress={load} style={[s.btn, s.btnPrimary]}>
            <Text style={[s.btnText, s.btnPrimaryText]}>Reload</Text>
          </TouchableOpacity>
        </View>
      ) : !trips.length ? (
        <View style={s.center}>
          <Text style={{ fontWeight: "800", fontSize: 18 }}>
            No saved trips yet
          </Text>
          <TouchableOpacity
            onPress={load}
            style={[s.btn, s.btnPrimary, { marginTop: 16 }]}
          >
            <Text style={[s.btnText, s.btnPrimaryText]}>Reload</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList<Trip>
          contentContainerStyle={{ padding: 16, gap: 12 }}
          data={trips}
          keyExtractor={(t: Trip) => t.id}
          renderItem={({ item }: { item: Trip }) => (
            <View style={s.card}>
              <Image source={{ uri: thumbFor(item) }} style={s.thumb} />
              <View style={{ padding: 12, gap: 4 }}>
                <Text style={s.title} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={s.muted}>{item.destination || "Destination"}</Text>
                <Text style={s.mutedSmall}>
                  {fmtDate(item.startDate)} — {fmtDate(item.endDate)}
                </Text>
                <View style={s.row}>
                  <TouchableOpacity
  style={[s.btn, s.btnGhost]}
  onPress={() =>
    router.push({ pathname: "/trips/[id]", params: { id: item.id } })
  }
>
  <Text style={[s.btnText, s.btnGhostText]}>Open</Text>
</TouchableOpacity>
                  <TouchableOpacity
                    style={[s.btn, s.btnDanger]}
                    onPress={() => confirmDelete(item.id)}
                  >
                    <Text style={[s.btnText, s.btnDangerText]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f6f7fb" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  statusBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  statusText: { color: "#0f172a", fontWeight: "700" },

  card: {
    backgroundColor: "white",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#eef0f4",
  },
  thumb: { width: "100%", height: 150, backgroundColor: "#e5e7eb" },
  row: { flexDirection: "row", gap: 10, marginTop: 10 },

  title: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  muted: { color: "#475569" },
  mutedSmall: { color: "#64748b", fontSize: 12 },

  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  btnText: { fontWeight: "800" },
  btnPrimary: { backgroundColor: "#0f172a", borderColor: "#0f172a" },
  btnPrimaryText: { color: "white" },
  btnGhost: { backgroundColor: "white", borderColor: "#e5e7eb" },
  btnGhostText: { color: "#0f172a" },
  btnDanger: { backgroundColor: "#fee2e2", borderColor: "#fecaca" },
  btnDangerText: { color: "#b91c1c" },

  btnSmall: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  btnSmallText: { fontWeight: "800", fontSize: 12 },
});
