import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  Keyboard,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { generatePackages } from "../lib/generator";
import { searchLocations } from "../lib/api";

export default function ExploreScreen() {
  const router = useRouter();

  const [origin, setOrigin] = React.useState("ATH");
  const [destination, setDestination] = React.useState("MAD");
  const [departDate, setDepartDate] = React.useState("2025-11-01");
  const [returnDate, setReturnDate] = React.useState("2025-11-10");
  const [adults, setAdults] = React.useState("2");

  const [showDepartPicker, setShowDepartPicker] = React.useState(false);
  const [showReturnPicker, setShowReturnPicker] = React.useState(false);

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [results, setResults] = React.useState<any[]>([]);

  function onPickDate(kind: "depart" | "return", date: Date) {
    const iso = date.toISOString().slice(0, 10);
    if (kind === "depart") setDepartDate(iso);
    else setReturnDate(iso);
  }

  async function onSearch() {
    setError(null);
    setResults([]);
    Keyboard.dismiss();

    const o = origin.trim().toUpperCase();
    const d = destination.trim().toUpperCase();
    if (o.length !== 3 || d.length !== 3) {
      setError("Pick airports from the list (IATA codes, e.g., ATH → MAD).");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(departDate) || !/^\d{4}-\d{2}-\d{2}$/.test(returnDate)) {
      setError("Dates must be YYYY-MM-DD.");
      return;
    }

    setLoading(true);
    try {
      const pkgs = await generatePackages({
        origin: o,
        destination: d,
        departDate,
        returnDate,
        adults: Number(adults) || 1,
      });
      setResults(pkgs);
      if (pkgs.length === 0) setError("No suggestions. Try different dates or another destination.");
    } catch (e: any) {
      console.log("Search error:", e);
      setError(e?.message || "Search failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.h1}>Build your Smart Plan</Text>

      {/* Search form */}
      <View style={[styles.card, { position: "relative", zIndex: 1 }]}>
        <Row zIndex={30}>
          <AutocompleteInput
            label="From"
            value={origin}
            onPick={(code) => setOrigin(code.toUpperCase())}
          />
          <AutocompleteInput
            label="To"
            value={destination}
            onPick={(code) => setDestination(code.toUpperCase())}
          />
        </Row>

        <Row>
          <DateField
            label="Depart"
            value={departDate}
            open={() => setShowDepartPicker(true)}
          />
          <DateField
            label="Return"
            value={returnDate}
            open={() => setShowReturnPicker(true)}
          />
        </Row>

        {/* Native pickers */}
        {showDepartPicker && (
          <DateTimePicker
            value={new Date(departDate)}
            mode="date"
            display={Platform.OS === "ios" ? "inline" : "default"}
            onChange={(_, d) => {
              setShowDepartPicker(false);
              if (d) onPickDate("depart", d);
            }}
          />
        )}
        {showReturnPicker && (
          <DateTimePicker
            value={new Date(returnDate)}
            mode="date"
            display={Platform.OS === "ios" ? "inline" : "default"}
            onChange={(_, d) => {
              setShowReturnPicker(false);
              if (d) onPickDate("return", d);
            }}
          />
        )}

        <Row>
          <Field label="Adults">
            <Input
              value={adults}
              onChangeText={setAdults}
              keyboardType="number-pad"
              maxLength={2}
            />
          </Field>
          <View style={{ flex: 1 }} />
        </Row>

        <TouchableOpacity style={styles.searchBtn} onPress={onSearch} disabled={loading}>
          {loading ? <ActivityIndicator /> : <Text style={styles.searchBtnText}>Search</Text>}
        </TouchableOpacity>

        {error && <Text style={styles.error}>{error}</Text>}
      </View>

      {/* Results */}
      {results.map((pkg) => (
        <View key={pkg.id} style={styles.resultCard}>
          <Text style={styles.resultTitle}>{pkg.title}</Text>
          <Text style={styles.resultSub}>
            {pkg.nights} nights · {pkg.destination}
          </Text>

          <View style={styles.rowBetween}>
            <Text style={styles.resultPrice}>€{pkg.pricing?.totalPerPerson ?? "—"}</Text>
            <TouchableOpacity
              style={styles.viewBtn}
              onPress={() =>
                router.push({
                  pathname: "/package/[id]",
                  params: { id: pkg.id, pkg: JSON.stringify(pkg) },
                })
              }
            >
              <Text style={styles.viewBtnText}>View</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

/* ---------- Autocomplete Input ---------- */
function AutocompleteInput({
  label,
  value,
  onPick,
}: {
  label: string;
  value: string;
  onPick: (iata: string) => void;
}) {
  const [q, setQ] = React.useState("");
  const [items, setItems] = React.useState<any[]>([]);
  const [open, setOpen] = React.useState(false);
  const timer = React.useRef<any>(null);

  async function run(query: string) {
    try {
      const list = await searchLocations(query);
      const airportsFirst = [...list].sort((a, b) =>
        a.type === b.type ? 0 : a.type === "AIRPORT" ? -1 : 1
      );
      setItems(airportsFirst);
      setOpen(true);
    } catch (e) {
      setOpen(false);
      setItems([]);
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={q || value}
        onChangeText={(t) => {
          setQ(t);
          if (timer.current) clearTimeout(timer.current);
          if (t.trim().length >= 2) {
            timer.current = setTimeout(() => run(t), 250);
          } else {
            setOpen(false);
            setItems([]);
          }
        }}
        autoCapitalize="none"
        placeholder="Type country / city / airport"
        placeholderTextColor="#94a3b8"
        style={styles.input}
      />

      {open && items.length > 0 && (
        <View style={styles.dropdown}>
          <ScrollView style={{ maxHeight: 240 }}>
            {items.map((it, idx) => {
              const code = it.iataCode || "";
              const subtitle =
                (it.type === "AIRPORT" ? "Airport · " : "City · ") +
                [it.cityName, it.countryName || it.countryCode].filter(Boolean).join(", ");
              return (
                <TouchableOpacity
                  key={`${code}-${it.type}-${idx}`}
                  style={styles.option}
                  onPress={() => {
                    setOpen(false);
                    setItems([]);
                    setQ(code);
                    onPick(code);
                  }}
                >
                  <Text style={styles.optionTitle}>
                    {code ? `${code} — ${it.name}` : it.name}
                  </Text>
                  <Text style={styles.optionSub}>{subtitle}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

/* ---------- Small UI helpers ---------- */
function Row({ children, zIndex = 10 }: { children: React.ReactNode; zIndex?: number }) {
  return <View style={{ flexDirection: "row", gap: 12, zIndex }}>{children}</View>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}
function Input(props: any) {
  return <TextInput {...props} style={[styles.input, props.style]} placeholderTextColor="#94a3b8" />;
}
function DateField({ label, value, open }: { label: string; value: string; open: () => void }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity onPress={open} activeOpacity={0.8}>
        <View style={[styles.input, { justifyContent: "center" }]}>
          <Text style={{ color: "#0f172a", fontWeight: "700" }}>{value}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

/* ---------- styles ---------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6f7fb" },
  h1: { fontSize: 22, fontWeight: "900", color: "#0f172a", marginBottom: 12 },

  card: { backgroundColor: "white", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#eef0f4", marginBottom: 16 },
  label: { fontWeight: "800", color: "#0f172a", marginBottom: 6 },
  input: { backgroundColor: "#f1f5f9", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, color: "#0f172a" },

  dropdown: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 72,
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    zIndex: 50,
  },
  option: { paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  optionTitle: { fontWeight: "800", color: "#0f172a" },
  optionSub: { color: "#64748b", fontSize: 12, marginTop: 2 },

  searchBtn: { marginTop: 12, backgroundColor: "#0f172a", paddingVertical: 14, borderRadius: 14, alignItems: "center" },
  searchBtnText: { color: "white", fontWeight: "800" },
  error: { color: "#ef4444", marginTop: 10 },

  resultCard: { backgroundColor: "white", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#eef0f4", marginBottom: 12 },
  resultTitle: { fontSize: 16, fontWeight: "900", color: "#0f172a" },
  resultSub: { color: "#64748b", marginTop: 2 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12 },
  resultPrice: { fontSize: 18, fontWeight: "900", color: "#0f172a" },
  viewBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, backgroundColor: "#0f172a" },
  viewBtnText: { color: "white", fontWeight: "800" },
});
