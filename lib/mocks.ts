import { FlightOption, HotelQuote } from "./pricing";

export const dummyFlight: FlightOption = {
  provider: "airline",
  price: 400, // EUR
  currency: "EUR",
  segments: [{ from: "ATH", to: "NRT", depart: "2025-09-20T08:00Z", arrive: "2025-09-20T20:00Z", carrier: "Aegean" }],
  stops: 1,
  durationMinutes: 780,  // 13h
  layoversMinutes: [120],
};

export const dummyHotel: HotelQuote = {
  pricePerNight: 80,
  nights: 6,
  refundable: true,
  rating: 4.2,
};
