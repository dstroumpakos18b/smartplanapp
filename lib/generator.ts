// lib/generator.ts
import { buildPrice, isGoodCheapFlight } from "./pricing";
import { fetchCheapFlights, fetchHotels } from "./api";

export type SearchInput = {
  origin: string;
  destination: string;
  departDate: string;
  returnDate: string;
  adults: number;
};

function nightsBetween(a: string, b: string) {
  return Math.max(1, Math.round((+new Date(b) - +new Date(a)) / 86400000));
}

export async function generatePackages(input: SearchInput) {
  const nights = nightsBetween(input.departDate, input.returnDate);

  let flightsRaw: any = [];
  try {
    flightsRaw = await fetchCheapFlights(input);
  } catch {}
  const flights = Array.isArray(flightsRaw)
    ? flightsRaw.filter(typeof isGoodCheapFlight === "function" ? isGoodCheapFlight : () => true)
    : [];

  if (!flights.length) return [];

  let hotels: any[] = [];
  try {
    hotels = await fetchHotels({
      destination: input.destination,
      departDate: input.departDate,
      returnDate: input.returnDate,
      adults: input.adults,
    });
    if (!Array.isArray(hotels)) hotels = [];
  } catch {}

  const variants = [
    { key: "value", title: "Value Plan", adj: 0.95, pick: (hs: any[]) => [hs[1] ?? hs[0]].filter(Boolean) },
    { key: "balanced", title: "Balanced Plan", adj: 1.0, pick: (hs: any[]) => [hs[0], hs[1]].filter(Boolean) },
    { key: "premium", title: "Premium Plan", adj: 1.25, pick: (hs: any[]) => [hs[2] ?? hs[0], hs[0]].filter(Boolean) },
  ] as const;

  return variants.map((v, i) => {
    const flight = flights[Math.min(i, flights.length - 1)];
    const hotelOptions = v
      .pick(hotels)
      .map((h) => ({ ...h, pricePerNight: Math.round((h?.pricePerNight ?? 70) * v.adj), nights }));

    const reprHotel = hotelOptions[0] ?? { pricePerNight: 70, nights, refundable: true, rating: 4.2 };
    const pricing = buildPrice(flight, reprHotel, { marginPct: 0.08, fees: 15 });

    return {
      id: `${input.destination}-${v.key}-${input.departDate}`,
      title: `${input.destination} — ${v.title}`,
      destination: input.destination,
      nights,
      highlights:
        v.key === "premium"
          ? ["Central hotel", "Top attractions", "Signature experience"]
          : v.key === "balanced"
          ? ["Good location", "Must-see sights", "Free afternoon"]
          : ["Smart location", "Budget food tips", "Transit friendly"],
      pricing,
      flight,
      hotels: hotelOptions,
      meta: { origin: input.origin, departDate: input.departDate, returnDate: input.returnDate },
    };
  });
}
