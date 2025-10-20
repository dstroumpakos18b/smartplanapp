// app/index.tsx
import { useEffect, useMemo, useState } from "react";
import {
  ScrollView, View, Text, TouchableOpacity, ActivityIndicator, StyleSheet
} from "react-native";
import { useRouter } from "expo-router";

// ------- Types -------
type Trip = {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  currency: string;
};

type Activity = { id: string; title: string; date: string; location?: string; };
type BudgetSummary = { planned: number; actual: number; currency: string; };

// ------- Helpers -------
const daysUntil = (iso: string) => {
  const today = new Date();
  const target = new Date(iso);
  const diff = target.getTime() - new Date(today.toDateString()).getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const formatRange = (s: string, e: string) =>
  `${new Date(s).toLocaleDateString()} — ${new Date(e).toLocaleDateString()}`;

const clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, n));

function tripProgress(startISO: string, endISO: string) {
  const now = new Date().getTime();
  const start = new Date(startISO).getTime();
  const end = new Date(endISO).getTime();
  if (now <= start) return 0;
  if (now >= end) return 100;
  return clamp(((now - start) / (end - start)) * 100);
}

// ------- Mock data (swap with real API) -------
async function fetchNextTrip(): Promise<Trip | null> {
  return {
    id: "TRIP123",
    title: "Japan Spring Trip",
    destination: "Tokyo",
    startDate: "2025-03-23T00:00:00Z",
    endDate: "2025-04-04T23:59:59Z",
    currency: "EUR",
  };
}
async function fetchUpcomingActivities(_: string): Promise<Activity[]> {
  return [
    { id: "A1", title: "Tokyo DisneySea", date: "2025-03-25T09:00:00", location: "Urayasu" },
    { id: "A2", title: "Shibuya Sky", date: "2025-03-26T18:00:00", location: "Shibuya" },
    { id: "A3", title: "Kyoto Day Trip", date: "2025-03-29T08:00:00", location: "Kyoto" },
  ];
}
async function fetchBudgetSummary(_: string): Promise<BudgetSummary> {
  return { planned: 1800, actual: 650, currency: "EUR" };
}

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [acts, setActs] = useState<Activity[]>([]);
  const [budget, setBudget] = useState<BudgetSummary | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const t = await fetchNextTrip();
      setTrip(t);
      if (t) {
        const [a, b] = await Promise.all([
          fetchUpcomingActivities(t.id),
          fetchBudgetSummary(t.id),
        ]);
        setActs(a);
        setBudget(b);
      }
      setLoading(false);
    })();
  }, []);

  const dday = useMemo(() => (trip ? daysUntil(trip.startDate) : null), [trip]);
  const progress = useMemo(
    () => (trip ? tripProgress(trip.startDate, trip.endDate) : 0),
    [trip]
  );

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8, color: "#666" }}>Loading dashboard…</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={s.wrap}>
      {/* Hero / Countdown */}
      <View style={s.hero}>
        <View>
          <Text style={s.heroTitle}>Travel Buddy</Text>
          <Text style={s.muted}>Compare packages & build smart trips.</Text>
        </View>
        {trip && (
          <View style={s.ddayPill}>
            <Text style={s.ddayText}>
              {dday! > 0 ? `D-${dday}` : dday === 0 ? "D-Day" : `Day ${Math.abs(dday!)}`}
            </Text>
          </View>
        )}
      </View>

      {/* Next Trip compact card */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Next Trip</Text>
        {trip ? (
          <>
            <Text style={s.tripTitle}>{trip.title}</Text>
            <Text style={s.muted}>{trip.destination}</Text>
            <Text style={s.muted}>{formatRange(trip.startDate, trip.endDate)}</Text>

            {/* Progress bar */}
            <View style={s.progressTrack}>
              <View style={[s.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={{ fontSize: 12, color: "#6b7280" }}>
              {progress.toFixed(0)}% timeline
            </Text>

            <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
              <Primary onPress={() => router.push(`/trip/${trip.id}`)} label="Open Trip" />
              <Ghost onPress={() => router.push("/explore")} label="Explore" />
            </View>
          </>
        ) : (
          <>
            <Text style={s.muted}>You have no upcoming trips.</Text>
            <Primary onPress={() => router.push("/trip/new")} label="Create a Trip" />
          </>
        )}
      </View>

      {/* Upcoming */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Upcoming (7 days)</Text>
        {trip && acts.length ? (
          acts.slice(0, 4).map((a) => (
            <View key={a.id} style={s.row}>
              <Text style={s.rowTitle}>{a.title}</Text>
              <Text style={s.rowMeta}>
                {new Date(a.date).toLocaleString()}
                {a.location ? ` • ${a.location}` : ""}
              </Text>
            </View>
          ))
        ) : (
          <Text style={s.muted}>Nothing scheduled.</Text>
        )}
        {trip && (
          <LinkBtn onPress={() => router.push(`/trip/${trip.id}`)} text="View full timeline →" />
        )}
      </View>

      {/* Budget */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Budget</Text>
        {trip && budget ? (
          <View style={s.statsRow}>
            <Stat label="Planned" value={`${budget.planned.toFixed(0)} ${budget.currency}`} />
            <Stat label="Actual" value={`${budget.actual.toFixed(0)} ${budget.currency}`} />
            <Stat
              label="Remaining"
              value={`${Math.max(budget.planned - budget.actual, 0).toFixed(0)} ${budget.currency}`}
            />
          </View>
        ) : (
          <Text style={s.muted}>No budget yet.</Text>
        )}
      </View>

      {/* Tip card */}
      <View style={s.tip}>
        <Text style={s.tipTitle}>Pro tip</Text>
        <Text style={s.tipText}>
          Forward booking emails to <Text style={{ fontWeight: "700" }}>trip+ID@smartplan.app</Text>{" "}
          to auto-add segments & stays (coming soon).
        </Text>
      </View>
    </ScrollView>
  );
}

// ---- Small components ----
const Primary = ({ label, onPress }: { label: string; onPress: () => void }) => (
  <TouchableOpacity style={s.primaryBtn} onPress={onPress}>
    <Text style={s.primaryBtnText}>{label}</Text>
  </TouchableOpacity>
);
const Ghost = ({ label, onPress }: { label: string; onPress: () => void }) => (
  <TouchableOpacity style={s.ghostBtn} onPress={onPress}>
    <Text style={s.ghostBtnText}>{label}</Text>
  </TouchableOpacity>
);
const LinkBtn = ({ text, onPress }: { text: string; onPress: () => void }) => (
  <TouchableOpacity onPress={onPress} style={{ marginTop: 8 }}>
    <Text style={{ color: "#2563eb", fontWeight: "600" }}>{text}</Text>
  </TouchableOpacity>
);
const Stat = ({ label, value }: { label: string; value: string }) => (
  <View style={{ alignItems: "center", flex: 1 }}>
    <Text style={{ fontSize: 12, color: "#6b7280" }}>{label}</Text>
    <Text style={{ fontSize: 18, fontWeight: "700" }}>{value}</Text>
  </View>
);

// ---- Styles ----
const s = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  wrap: { padding: 16, gap: 16 },
  hero: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  heroTitle: { fontSize: 20, fontWeight: "800" },
  card: {
    backgroundColor: "white", borderRadius: 16, padding: 16,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8 },
  tripTitle: { fontSize: 18, fontWeight: "700" },
  muted: { color: "#6b7280", marginTop: 2 },
  ddayPill: { paddingHorizontal: 10, paddingVertical: 4, backgroundColor: "#e5e7eb", borderRadius: 999 },
  ddayText: { fontWeight: "700", color: "#111827" },
  primaryBtn: { backgroundColor: "#2563eb", paddingVertical: 12, borderRadius: 12, flex: 1 },
  primaryBtnText: { color: "white", textAlign: "center", fontWeight: "700" },
  ghostBtn: {
    backgroundColor: "#eef2ff", paddingVertical: 12, borderRadius: 12, flex: 1,
    borderWidth: StyleSheet.hairlineWidth, borderColor: "#c7d2fe",
  },
  ghostBtnText: { color: "#1d4ed8", textAlign: "center", fontWeight: "700" },
  progressTrack: { height: 8, borderRadius: 999, backgroundColor: "#e5e7eb", marginTop: 12, overflow: "hidden" },
  progressFill: { height: 8, backgroundColor: "#2563eb" },
  row: { paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: "#e5e7eb" },
  rowTitle: { fontWeight: "600" },
  rowMeta: { color: "#6b7280", marginTop: 2 },
  statsRow: { flexDirection: "row", gap: 12, marginTop: 8 },
  tip: {
    backgroundColor: "#f0f9ff", borderColor: "#bae6fd", borderWidth: 1,
    padding: 14, borderRadius: 12,
  },
  tipTitle: { fontWeight: "700", marginBottom: 4, color: "#0ea5e9" },
  tipText: { color: "#0369a1" },
});
