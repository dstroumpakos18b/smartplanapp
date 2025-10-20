// lib/api.ts
// Base URL for the API. Prefer an environment-provided value (Expo/React Native
// exposes vars that start with EXPO_PUBLIC_ to the app), otherwise fall back
// to the local development IP.
export const BASE = (process.env.EXPO_PUBLIC_API_BASE as string) || "http://192.168.0.150:8787";

export async function fetchCheapFlights({
  origin,
  destination,
  departDate,
  returnDate,
  adults = 2,
}: {
  origin: string;
  destination: string;
  departDate: string; // YYYY-MM-DD
  returnDate: string; // YYYY-MM-DD
  adults?: number;
}) {
  const url = `${BASE}/api/flights?origin=${encodeURIComponent(
    origin
  )}&destination=${encodeURIComponent(
    destination
  )}&departDate=${encodeURIComponent(
    departDate
  )}&returnDate=${encodeURIComponent(returnDate)}&adults=${adults}`;

  const r = await fetch(url);
  if (!r.ok) throw new Error(`Flights fetch failed (${r.status})`);
  return (await r.json()) as any[]; // FlightOption[]
}

export async function searchLocations(q: string) {
  if (!q || q.trim().length < 2) return [];
  const r = await fetch(`${BASE}/api/locations?q=${encodeURIComponent(q.trim())}`);
  if (!r.ok) throw new Error("Locations fetch failed");
  return (await r.json()) as Array<{
    type: "CITY" | "AIRPORT";
    iataCode: string;
    name: string;
    cityName?: string;
    countryCode?: string;
    countryName?: string;
  }>;
}



export async function fetchHotels({
  destination,
  departDate,
  returnDate,
  adults = 2,
}: {
  destination: string;
  departDate: string;
  returnDate: string;
  adults?: number;
}) {
  const url = `${BASE}/api/hotels?destination=${encodeURIComponent(
    destination
  )}&checkIn=${encodeURIComponent(departDate)}&checkOut=${encodeURIComponent(
    returnDate
  )}&adults=${adults}`;

  const r = await fetch(url);
  if (!r.ok) throw new Error(`Hotels fetch failed (${r.status})`);
  return (await r.json()) as any[]; // HotelQuote[]
}

// --- Compatibility exports for the app's expected API surface ---
export type FlightQuote = any;
export type HotelQuote = any;

export async function getFlights(opts: any) {
  const res = await fetchCheapFlights(opts);
  return res;
}

export async function getHotels(opts: any) {
  const res = await fetchHotels(opts);
  return res;
}
