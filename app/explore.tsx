// app/explore.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { API_BASE_URL as BASE_URL } from "../lib/config";
import { getFlights, getHotels, FlightQuote, HotelQuote } from "../lib/api";

type Loc = { code: string; city: string; country: string };

type PackageItem = {
  id: string;
  title: string;
  flight: FlightQuote;
  hotels: HotelQuote[];
  totalPrice: number;
  meta: { departDate: string; returnDate?: string; adults: number };
};

function buildPackages(
  flight: FlightQuote,
  hotels: HotelQuote[],
  departDate: string,
  returnDate: string | undefined,
  adults: number
): PackageItem[] {
  return hotels.map((h) => ({
    id: `${flight.origin}_${flight.destination}_${h.id}`,
    title: `${h.name} + Flight ${flight.origin} → ${flight.destination}`,
    flight,
    hotels: [h],
    totalPrice: Math.round(h.pricePerNight + flight.price),
    meta: { departDate, returnDate, adults },
  }));
}

export default function Explore() {
  const router = useRouter();

  // Form state
  const [origin, setOrigin] = useState("ATH");
  const [destination, setDestination] = useState("MAD");
  const [departDate, setDepartDate] = useState("2025-03-23");
  const [returnDate, setReturnDate] = useState("2025-03-30");
  const [adults, setAdults] = useState(2);

  // Type-ahead state (debounced; no setState during render)
  const [focusField, setFocusField] = useState<"from" | "to" | null>(null);
  const [queryFrom, setQueryFrom] = useState(origin);
  const [queryTo, setQueryTo] = useState(destination);
  const [suggestions, setSuggestions] = useState<Loc[]>([]);
  const [fetchingSuggestions, setFetchingSuggestions] = useState(false);
  const debounceRef = useRef<number | null>(null);

  // Results
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---- Debounced suggestions (runs in an effect, not render!) ----
  useEffect(() => {
    const term = focusField === "from" ? queryFrom : focusField === "to" ? queryTo : "";
    if (!focusField || term.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      try {
        setFetchingSuggestions(true);
        const r = await fetch(`${BASE_URL}/api/locations?q=${encodeURIComponent(term)}`, {
          cache: "no-store",
        });
        const data = (await r.json()) as Loc[];
        setSuggestions(Array.isArray(data) ? data : []);
      } catch {
        setSuggestions([]);
      } finally {
        setFetchingSuggestions(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [focusField, queryFrom, queryTo]);

  // ---- Search ----
  const onSearch = useCallback(async () => {
    Keyboard.dismiss();
    setLoading(true);
    setError(null);
    setPackages([]);

    try {
      const [flight, hotels] = await Promise.all([
        getFlights({ origin, destination, departDate, returnDate, adults }),
        getHotels({ destination, checkIn: departDate, checkOut: returnDate, adults }),
      ]);

      setPackages(buildPackages(flight, hotels, departDate, returnDate, adults));
    } catch (e: any) {
      setError(e?.message || "Search failed");
      setPackages([]);
    } finally {
      setLoading(false);
    }
  }, [origin, destination, departDate, returnDate, adults]);

  // ---- UI helpers ----
  const showSuggestions = useMemo(
    () => !!focusField && (fetchingSuggestions || suggestions.length > 0),
    [focusField, fetchingSuggestions, suggestions.length]
  );

  const incAdults = () => setAdults((n) => Math.max(1, n + 1));
  const decAdults = () => setAdults((n) => Math.max(1, n - 1));

  const renderItem = ({ item }: { item: PackageItem }) => {
    const { departDate: d, returnDate: r, adults: a } = item.meta;
    return (
      <TouchableOpacity
        style={s.card}
        onPress={() =>
          router.push({ pathname: "/package/[id]", params: { id: item.id, pkg: JSON.stringify(item) } })
        }
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={s.title}>{item.title}</Text>
          <Text style={s.price}>€{item.totalPrice}</Text>
        </View>
        <Text style={s.muted}>
          {item.flight.origin} → {item.flight.destination}
        </Text>
        <Text style={s.mutedSmall}>
          {d} — {r || "—"} • {a} {a > 1 ? "adults" : "adult"}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.form}>
        <Text style={s.headline}>Build your Smart Plan</Text>

        {/* From */}
        <Text style={s.label}>From</Text>
        <TextInput
          style={s.input}
          value={queryFrom}
          onChangeText={(t) => setQueryFrom(t.toUpperCase())}
          onFocus={() => setFocusField("from")}
          onBlur={() => {
            setFocusField(null);
            if (queryFrom) setOrigin(queryFrom); // commit on blur
          }}
          placeholder="Origin (e.g., ATH)"
          autoCapitalize="characters"
        />

        {/* To */}
        <Text style={s.label}>To</Text>
        <TextInput
          style={s.input}
          value={queryTo}
          onChangeText={(t) => setQueryTo(t.toUpperCase())}
          onFocus={() => setFocusField("to")}
          onBlur={() => {
            setFocusField(null);
            if (queryTo) setDestination(queryTo); // commit on blur
          }}
          placeholder="Destination (e.g., MAD)"
          autoCapitalize="characters"
        />

        {/* Suggestions */}
        {showSuggestions && (
          <View style={s.suggestions}>
            {fetchingSuggestions ? (
              <Text style={s.mutedSmall}>Loading suggestions…</Text>
            ) : (
              suggestions.map((sug) => (
                <TouchableOpacity
                  key={`${sug.code}-${sug.city}`}
                  onPress={() => {
                    if (focusField === "from") {
                      setQueryFrom(sug.code);
                      setOrigin(sug.code);
                    } else if (focusField === "to") {
                      setQueryTo(sug.code);
                      setDestination(sug.code);
                    }
                    setFocusField(null);
                    setSuggestions([]);
                  }}
                  style={s.suggestionItem}
                >
                  <Text style={s.suggestionText}>
                    {sug.city} ({sug.code}) — {sug.country}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* Dates */}
        <Text style={s.label}>Depart</Text>
        <TextInput style={s.input} value={departDate} onChangeText={setDepartDate} placeholder="YYYY-MM-DD" />
        <Text style={s.label}>Return</Text>
        <TextInput style={s.input} value={returnDate} onChangeText={setReturnDate} placeholder="YYYY-MM-DD" />

        {/* Adults */}
        <Text style={s.label}>Adults</Text>
        <View style={s.row}>
          <TouchableOpacity onPress={decAdults} style={[s.btnSm, s.btnGhost]}>
            <Ionicons name="remove-outline" size={18} />
          </TouchableOpacity>
          <Text style={{ paddingHorizontal: 12, fontWeight: "700" }}>{adults}</Text>
          <TouchableOpacity onPress={incAdults} style={[s.btnSm, s.btnGhost]}>
            <Ionicons name="add-outline" size={18} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={onSearch} style={[s.btn, s.btnPrimary]}>
          <Text style={[s.btnText, s.btnPrimaryText]}>Search</Text>
        </TouchableOpacity>
      </View>

      {/* Results */}
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator />
          <Text style={{ marginTop: 8, color: "#666" }}>Searching…</Text>
        </View>
      ) : error ? (
        <View style={s.center}>
          <Text style={{ fontWeight: "800", fontSize: 18, marginBottom: 8 }}>Something went wrong</Text>
          <Text style={{ color: "#6b7280", marginBottom: 12 }}>{error}</Text>
          <TouchableOpacity onPress={onSearch} style={[s.btn, s.btnPrimary]}>
            <Text style={[s.btnText, s.btnPrimaryText]}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : packages.length > 0 ? (
        <FlatList
          contentContainerStyle={{ padding: 16, gap: 12 }}
          data={packages}
          keyExtractor={(t) => t.id}
          renderItem={renderItem}
        />
      ) : (
        <View style={s.center}>
          <Text style={{ fontWeight: "800", fontSize: 16 }}>No results yet — try searching above.</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f6f7fb" },
  form: { padding: 16, borderBottomWidth: 1, borderColor: "#e5e7eb" },
  headline: { fontSize: 18, fontWeight: "800", color: "#0f172a", marginBottom: 8 },

  label: { fontWeight: "700", marginTop: 8, marginBottom: 6, color: "#0f172a" },
  input: {
    height: 42,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    backgroundColor: "#f3f4f6",
  },

  suggestions: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    marginTop: 6,
  },
  suggestionItem: { paddingVertical: 8, paddingHorizontal: 12 },
  suggestionText: { color: "#0f172a" },

  row: { flexDirection: "row", alignItems: "center" },

  btn: {
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    marginTop: 12,
  },
  btnText: { fontWeight: "800" },
  btnPrimary: { backgroundColor: "#0f172a", borderColor: "#0f172a" },
  btnPrimaryText: { color: "white" },

  btnSm: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "white",
  },
  btnGhost: {},

  card: {
    backgroundColor: "white",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 12,
  },
  title: { fontWeight: "700", color: "#0f172a", flex: 1, paddingRight: 8 },
  price: { fontWeight: "800", color: "#0f172a" },
  muted: { color: "#475569" },
  mutedSmall: { color: "#64748b", fontSize: 12 },

  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});
