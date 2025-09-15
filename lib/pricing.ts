// -------------------- Types --------------------
export type FlightSegment = {
  from: string;
  to: string;
  depart: string; // ISO
  arrive: string; // ISO
  carrier: string; // IATA (e.g., "A3", "TK")
};

export type FlightOption = {
  provider: "airline" | "meta";
  airline: string;            // e.g., "Aegean"
  fareBrand?: string;         // e.g., "Economy Light"
  price: number;              // EUR
  currency: "EUR";
  segments: FlightSegment[];
  stops: number;
  durationMinutes: number;
  layoversMinutes: number[];
  baggage: { carryOn: boolean; checkedKg?: number; pieces?: number };
  extras?: string[];
};

export type HotelQuote = {
  id?: string;
  name?: string;
  stars?: number;             // 1..5
  rating: number;             // 1..5 (guest score)
  board?: "RO" | "BB" | "HB" | "AI";
  refundable: boolean;
  pricePerNight: number;      // EUR, taxes-included
  nights: number;
  area?: string;
  amenities?: string[];
};

export type PriceBreakdown = {
  flights: number;
  hotel: number;
  transfers?: number;
  activities?: number;
  fees?: number;
};

export type PricedPackage = {
  totalPerPerson: number;
  breakdown: PriceBreakdown;
  verifiedAt: string; // ISO timestamp
  notes?: string[];
};

// -------------------- Quality Rules --------------------
export function isGoodCheapFlight(f: FlightOption): boolean {
  if (!f) return false;
  if (typeof f.price !== "number" || Number.isNaN(f.price)) return false;
  if (f.stops > 1) return false;
  const maxDuration = 16 * 60; // 16 hours
  if (f.durationMinutes > maxDuration) return false;
  if (Array.isArray(f.layoversMinutes) && f.layoversMinutes.length) {
    if (f.layoversMinutes.some((m) => m < 70 || m > 300)) return false;
  }
  return true;
}

// Pick the “best” by price, then duration
export function pickBestFlight(candidates: FlightOption[]): FlightOption | null {
  const arr = Array.isArray(candidates) ? candidates : [];
  const filtered = arr.filter(isGoodCheapFlight);
  if (!filtered.length) return null;
  return filtered.sort(
    (a, b) => a.price - b.price || a.durationMinutes - b.durationMinutes
  )[0];
}

// -------------------- Pricing Engine --------------------
export function buildPrice(
  flight: FlightOption,
  hotel: HotelQuote,
  opts?: { transfers?: number; activities?: number; marginPct?: number; fees?: number }
): PricedPackage {
  const transfers = sanitizeNumber(opts?.transfers, 0);
  const activities = sanitizeNumber(opts?.activities, 0);
  const fees = sanitizeNumber(opts?.fees, 0);

  const hotelNights = sanitizeNumber(hotel?.nights, 1);
  const hotelPpn = sanitizeNumber(hotel?.pricePerNight, 70);
  const hotelTotal = Math.round(hotelPpn * hotelNights);

  const flightPrice = sanitizeNumber(flight?.price, 0);

  const subtotal = flightPrice + hotelTotal + transfers + activities + fees;
  const marginPct = typeof opts?.marginPct === "number" ? opts!.marginPct! : 0.08;
  const margin = Math.round(subtotal * marginPct);

  const totalPerPerson = Math.max(0, Math.round(subtotal + margin));

  return {
    totalPerPerson,
    breakdown: {
      flights: flightPrice,
      hotel: hotelTotal,
      transfers: transfers || undefined,
      activities: activities || undefined,
      fees: fees || undefined,
    },
    verifiedAt: new Date().toISOString(),
    notes: ["AI package priced with quality flight constraints"],
  };
}

// -------------------- Helpers --------------------
function sanitizeNumber(val: any, fallback: number): number {
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
}

