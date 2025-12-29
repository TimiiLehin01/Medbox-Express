// components/map/delivery-map.tsx
"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface DeliveryMapProps {
  pickupLat: number;
  pickupLng: number;
  pickupLabel: string;
  deliveryLat: number;
  deliveryLng: number;
  deliveryLabel: string;
  riderLat?: number;
  riderLng?: number;
  height?: string;
}

export function DeliveryMap({
  pickupLat,
  pickupLng,
  pickupLabel,
  deliveryLat,
  deliveryLng,
  deliveryLabel,
  riderLat,
  riderLng,
  height = "400px",
}: DeliveryMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map
    const map = L.map(mapRef.current).setView([pickupLat, pickupLng], 13);

    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    // Custom icons
    const pickupIcon = L.divIcon({
      html: `<div style="background: #3b82f6; color: white; padding: 8px; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">P</div>`,
      className: "",
      iconSize: [40, 40],
      iconAnchor: [20, 40],
    });

    const deliveryIcon = L.divIcon({
      html: `<div style="background: #10b981; color: white; padding: 8px; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">D</div>`,
      className: "",
      iconSize: [40, 40],
      iconAnchor: [20, 40],
    });

    const riderIcon = L.divIcon({
      html: `<div style="background: #f59e0b; color: white; padding: 8px; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">R</div>`,
      className: "",
      iconSize: [40, 40],
      iconAnchor: [20, 40],
    });

    // Add markers
    const pickupMarker = L.marker([pickupLat, pickupLng], { icon: pickupIcon })
      .addTo(map)
      .bindPopup(`<b>Pickup:</b><br/>${pickupLabel}`);

    const deliveryMarker = L.marker([deliveryLat, deliveryLng], {
      icon: deliveryIcon,
    })
      .addTo(map)
      .bindPopup(`<b>Delivery:</b><br/>${deliveryLabel}`);

    let riderMarker: L.Marker | null = null;
    if (riderLat && riderLng) {
      riderMarker = L.marker([riderLat, riderLng], { icon: riderIcon })
        .addTo(map)
        .bindPopup("<b>Rider Location</b>");
    }

    // Draw route line
    const routeLine = L.polyline(
      [
        [pickupLat, pickupLng],
        [deliveryLat, deliveryLng],
      ],
      {
        color: "#3b82f6",
        weight: 4,
        opacity: 0.7,
        dashArray: "10, 10",
      }
    ).addTo(map);

    // Fit map to show all markers
    const bounds = L.latLngBounds([
      [pickupLat, pickupLng],
      [deliveryLat, deliveryLng],
    ]);

    if (riderLat && riderLng) {
      bounds.extend([riderLat, riderLng]);
    }

    map.fitBounds(bounds, { padding: [50, 50] });

    mapInstanceRef.current = map;

    // Cleanup
    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [pickupLat, pickupLng, deliveryLat, deliveryLng, riderLat, riderLng]);

  return (
    <div>
      <div
        ref={mapRef}
        style={{ height, width: "100%", borderRadius: "8px" }}
      />
      <div className="mt-2 flex gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-blue-500"></div>
          <span>Pickup</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-green-500"></div>
          <span>Delivery</span>
        </div>
        {riderLat && riderLng && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-orange-500"></div>
            <span>Rider</span>
          </div>
        )}
      </div>
    </div>
  );
}
