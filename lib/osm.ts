import { calculateDistance } from "@/lib/utils";

export interface NearbyPlace {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string | null;
  openingHours: string | null;
  distance: number;
}

interface OverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

function buildAddress(tags: Record<string, string>) {
  if (tags["addr:full"]) return tags["addr:full"];
  const line1 = [tags["addr:housenumber"], tags["addr:street"]]
    .filter(Boolean)
    .join(" ");
  return [
    line1,
    tags["addr:suburb"],
    tags["addr:city"] || tags["addr:town"],
    tags["addr:state"],
  ]
    .filter(Boolean)
    .join(", ");
}

/** Turns an Overpass API response into a distance-sorted list of places. */
export function parseOverpass(
  elements: OverpassElement[],
  origin: { latitude: number; longitude: number },
): NearbyPlace[] {
  const places: NearbyPlace[] = [];

  for (const el of elements) {
    const latitude = el.lat ?? el.center?.lat;
    const longitude = el.lon ?? el.center?.lon;
    if (latitude === undefined || longitude === undefined) continue;

    const tags = el.tags ?? {};
    places.push({
      id: `osm-${el.type}-${el.id}`,
      name: tags.name || tags.brand || "Pharmacy",
      address: buildAddress(tags),
      latitude,
      longitude,
      phone: tags.phone || tags["contact:phone"] || null,
      openingHours: tags.opening_hours || null,
      distance: calculateDistance(
        origin.latitude,
        origin.longitude,
        latitude,
        longitude,
      ),
    });
  }

  return places.sort((a, b) => a.distance - b.distance);
}

export function buildOverpassQuery(lat: number, lng: number, radiusMeters: number) {
  const around = `(around:${Math.round(radiusMeters)},${lat},${lng})`;
  return `[out:json][timeout:10];(node["amenity"="pharmacy"]${around};way["amenity"="pharmacy"]${around};);out center tags;`;
}
