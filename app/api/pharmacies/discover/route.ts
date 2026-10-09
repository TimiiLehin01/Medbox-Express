export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  buildOverpassQuery,
  parseOverpass,
  type NearbyPlace,
} from "@/lib/osm";

// Pharmacies that exist on OpenStreetMap near a point but are NOT on MedBox.
// They are shown for information only: they cannot be ordered from.

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const cache = new Map<string, { at: number; places: NearbyPlace[] }>();

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = Number(searchParams.get("latitude"));
  const lng = Number(searchParams.get("longitude"));
  const radiusKm = Math.min(Math.max(Number(searchParams.get("radius")) || 5, 1), 10);

  if (
    !searchParams.get("latitude") ||
    !searchParams.get("longitude") ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    Math.abs(lat) > 90 ||
    Math.abs(lng) > 180
  ) {
    return NextResponse.json({ error: "Invalid location" }, { status: 400 });
  }

  // Round to ~1 km so nearby visitors share one cached lookup.
  const key = `${lat.toFixed(2)},${lng.toFixed(2)},${radiusKm}`;
  let places: NearbyPlace[] | null = null;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) places = hit.places;

  if (!places) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 9000);
      const res = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "MedBoxExpress/1.0 (portfolio project)",
        },
        body: new URLSearchParams({
          data: buildOverpassQuery(lat, lng, radiusKm * 1000),
        }).toString(),
        signal: controller.signal,
        cache: "no-store",
      }).finally(() => clearTimeout(timer));

      if (!res.ok) throw new Error(`Overpass responded ${res.status}`);

      const json = await res.json();
      places = parseOverpass(json.elements ?? [], {
        latitude: lat,
        longitude: lng,
      });
      cache.set(key, { at: Date.now(), places });
    } catch (error) {
      // This section is a bonus; never break the page because of it.
      console.error("Nearby pharmacy lookup failed:", error);
      return NextResponse.json({ pharmacies: [], unavailable: true });
    }
  }

  // Hide anything that is already a MedBox pharmacy (same name).
  const medbox = await prisma.pharmacy.findMany({ select: { name: true } });
  const taken = new Set(medbox.map((p) => p.name.trim().toLowerCase()));

  return NextResponse.json({
    pharmacies: places
      .filter((p) => !taken.has(p.name.trim().toLowerCase()))
      .slice(0, 12),
    unavailable: false,
  });
}
