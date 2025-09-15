import { buildPrice } from "./pricing";
import { dummyFlight, dummyHotel } from "./mocks";

export const PACKAGES = [
  {
    id: "p1",
    title: "Tokyo Discovery",
    destination: "Japan",
    nights: 7,
    pricing: buildPrice(dummyFlight, { ...dummyHotel, nights: 7 }),
    rating: 4.7,
    agency: "Travel Buddy AI",
    // ...
  },
];
