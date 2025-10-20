// lib/config.ts
// Provide a single, environment-configurable API base for the app.
import { BASE } from "./api";

export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE as string) || BASE;
