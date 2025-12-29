// components/map/location-picker.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MapPin, Loader2 } from "lucide-react";

interface LocationPickerProps {
  onLocationSelect: (lat: number, lng: number, address: string) => void;
  defaultLat?: number;
  defaultLng?: number;
  defaultAddress?: string;
}

export function LocationPicker({
  onLocationSelect,
  defaultLat,
  defaultLng,
  defaultAddress,
}: LocationPickerProps) {
  const [loading, setLoading] = useState(false);
  const [latitude, setLatitude] = useState(defaultLat?.toString() || "");
  const [longitude, setLongitude] = useState(defaultLng?.toString() || "");
  const [address, setAddress] = useState(defaultAddress || "");

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setLatitude(lat.toString());
        setLongitude(lng.toString());

        // Reverse geocode to get address
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
          );
          const data = await response.json();
          const addr = data.display_name || `${lat}, ${lng}`;
          setAddress(addr);
        } catch (error) {
          console.error("Failed to get address:", error);
          setAddress(`${lat}, ${lng}`);
        }

        setLoading(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        alert("Unable to retrieve your location");
        setLoading(false);
      }
    );
  };

  const handleSave = () => {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      alert("Please enter valid coordinates");
      return;
    }

    if (!address.trim()) {
      alert("Please enter an address");
      return;
    }

    onLocationSelect(lat, lng, address);
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Get Current Location
            </label>
            <Button
              onClick={getCurrentLocation}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Getting location...
                </>
              ) : (
                <>
                  <MapPin className="mr-2 h-4 w-4" />
                  Use My Current Location
                </>
              )}
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">
                Or enter manually
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Latitude</label>
              <Input
                type="number"
                step="any"
                placeholder="6.5244"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Longitude
              </label>
              <Input
                type="number"
                step="any"
                placeholder="3.3792"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Address</label>
            <Input
              placeholder="Enter your address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <Button onClick={handleSave} className="w-full">
            Save Location
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
