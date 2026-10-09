import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(price);
}

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

/**
 * Turns "8:00am", "21:00pm", "08:00", "8am" or "12:00 AM" into minutes after
 * midnight. Returns null if it cannot be read. A 24-hour value such as
 * "21:00pm" is trusted over its suffix.
 */
export function parseClockToMinutes(value: string | null | undefined) {
  if (!value) return null;
  const match = value
    .trim()
    .toLowerCase()
    .match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?$/);
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const suffix = match[3]?.[0]; // "a" or "p"

  if (hours > 23 || minutes > 59) return null;
  if (suffix && hours <= 12) {
    if (suffix === "p" && hours < 12) hours += 12;
    if (suffix === "a" && hours === 12) hours = 0;
  }
  return hours * 60 + minutes;
}

/** Current minutes after midnight in Nigeria, whatever the viewer's timezone. */
function minutesNowInLagos(now: Date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Lagos",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return hour * 60 + minute;
}

/**
 * Is a pharmacy open right now? Returns null when the hours are missing or
 * unreadable, so the UI can hide the badge instead of showing a wrong one.
 * Handles overnight hours such as 20:00 to 06:00.
 */
export function isOpenNow(
  openTime: string | null | undefined,
  closeTime: string | null | undefined,
  now: Date = new Date(),
): boolean | null {
  const open = parseClockToMinutes(openTime);
  const close = parseClockToMinutes(closeTime);
  if (open === null || close === null) return null;

  const current = minutesNowInLagos(now);
  if (open <= close) return current >= open && current <= close;
  return current >= open || current <= close;
}

/** "08:00" or "8:00am" to "8:00 AM" for display. Falls back to the raw text. */
export function formatClock(value: string | null | undefined) {
  const minutes = parseClockToMinutes(value);
  if (minutes === null) return value ?? "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}
