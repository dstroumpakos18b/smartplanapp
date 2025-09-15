// lib/api.ts
export const BASE = "http://192.168.0.151:8787"; // ← your PC IP on Wi-Fi

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
