"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/loading-spinner";
import {
  MapPin,
  Search,
  Clock,
  Package,
  Navigation,
  Phone,
  Filter,
  Store,
  Map,
  List,
  Loader2,
} from "lucide-react";

interface Pharmacy {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  verified: boolean;
  openTime: string | null;
  closeTime: string | null;
  deliveryRadius: number;
  user: {
    phone: string;
  };
  products: any[];
  distance?: number;
}

export default function NearbyPharmaciesPage() {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [filteredPharmacies, setFilteredPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [sortBy, setSortBy] = useState<"distance" | "name">("distance");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(true);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  // Load Leaflet dynamically on client side only
  useEffect(() => {
    const loadLeaflet = async () => {
      if (typeof window !== "undefined") {
        const L = (await import("leaflet")).default;
        // await import("leaflet/dist/leaflet.css");
        if (!document.querySelector('link[href*="leaflet.css"]')) {
          const link = document.createElement("link");
          link.rel = "stylesheet";
          link.href = "https://unpkg.com/leaflet@1.7.1/dist/leaflet.css";
          document.head.appendChild(link);
        }

        // Fix marker icons
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
          iconUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
          shadowUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
        });

        setLeafletLoaded(true);
      }
    };

    loadLeaflet();
  }, []);

  useEffect(() => {
    fetchPharmacies();
  }, []);

  useEffect(() => {
    filterPharmacies();
  }, [searchQuery, pharmacies, sortBy, showVerifiedOnly]);

  useEffect(() => {
    if (viewMode === "map" && filteredPharmacies.length > 0 && leafletLoaded) {
      initializeMap();
    }
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [viewMode, filteredPharmacies, userLocation, leafletLoaded]);

  const fetchPharmacies = async () => {
    try {
      const res = await fetch("/api/pharmacies/nearby");
      const data = await res.json();
      setPharmacies(data);
      setFilteredPharmacies(data);
    } catch (error) {
      console.error("Failed to fetch pharmacies:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setUserLocation(location);
        calculateDistances(location);
        setGettingLocation(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        alert(
          "Unable to get your location. Please enable location permissions."
        );
        setGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const initializeMap = async () => {
    if (!mapRef.current || mapInstanceRef.current || !leafletLoaded) return;

    // Import Leaflet dynamically
    const L = (await import("leaflet")).default;

    const center = userLocation
      ? [userLocation.latitude, userLocation.longitude]
      : filteredPharmacies.length > 0
      ? [filteredPharmacies[0].latitude, filteredPharmacies[0].longitude]
      : [7.0936, 4.8354]; // Ondo Town default

    const map = L.map(mapRef.current).setView(center as [number, number], 12);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    // Add user location marker if available
    if (userLocation) {
      const userIcon = L.divIcon({
        html: `<div style="background: #3b82f6; color: white; padding: 8px; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">📍</div>`,
        className: "",
        iconSize: [40, 40],
        iconAnchor: [20, 40],
      });

      L.marker([userLocation.latitude, userLocation.longitude], {
        icon: userIcon,
      })
        .addTo(map)
        .bindPopup("<b>Your Location</b>");
    }

    // Add pharmacy markers
    filteredPharmacies.forEach((pharmacy) => {
      const isOpen = isPharmacyOpen(pharmacy.openTime, pharmacy.closeTime);
      const color = pharmacy.verified ? "#10b981" : "#6b7280";

      const pharmacyIcon = L.divIcon({
        html: `<div style="background: ${color}; color: white; padding: 8px; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">🏥</div>`,
        className: "",
        iconSize: [40, 40],
        iconAnchor: [20, 40],
      });

      const marker = L.marker([pharmacy.latitude, pharmacy.longitude], {
        icon: pharmacyIcon,
      }).addTo(map);

      const popupContent = `
        <div style="min-width: 200px;">
          <h3 style="font-weight: bold; margin-bottom: 8px;">${
            pharmacy.name
          }</h3>
          ${
            pharmacy.verified
              ? '<span style="background: #10b981; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">✓ Verified</span>'
              : '<span style="background: #6b7280; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">Unverified</span>'
          }
          <p style="margin-top: 8px; font-size: 14px; color: #666;">${
            pharmacy.address
          }</p>
          ${
            pharmacy.distance
              ? `<p style="color: #3b82f6; font-weight: 600; margin-top: 4px;">${pharmacy.distance.toFixed(
                  1
                )} km away</p>`
              : ""
          }
          ${
            isOpen !== null
              ? `<p style="margin-top: 4px; font-size: 14px;">${
                  isOpen ? "🟢 Open" : "🔴 Closed"
                }</p>`
              : ""
          }
          <p style="margin-top: 4px; font-size: 14px;">${
            pharmacy.products?.length || 0
          } products</p>
          <a href="/consumer/search?pharmacy=${
            pharmacy.id
          }" style="display: inline-block; margin-top: 8px; background: #3b82f6; color: white; padding: 6px 12px; border-radius: 6px; text-decoration: none; font-size: 14px;">View Products</a>
        </div>
      `;

      marker.bindPopup(popupContent);
    });

    // Fit bounds to show all markers
    if (filteredPharmacies.length > 0) {
      const bounds = L.latLngBounds(
        filteredPharmacies.map(
          (p) => [p.latitude, p.longitude] as [number, number]
        )
      );
      if (userLocation) {
        bounds.extend([userLocation.latitude, userLocation.longitude]);
      }
      map.fitBounds(bounds, { padding: [50, 50] });
    }

    mapInstanceRef.current = map;
  };

  const calculateDistances = (location: {
    latitude: number;
    longitude: number;
  }) => {
    const pharmaciesWithDistance = pharmacies.map((pharmacy) => ({
      ...pharmacy,
      distance: calculateDistance(
        location.latitude,
        location.longitude,
        pharmacy.latitude,
        pharmacy.longitude
      ),
    }));

    pharmaciesWithDistance.sort(
      (a, b) => (a.distance || 0) - (b.distance || 0)
    );
    setPharmacies(pharmaciesWithDistance);
    setFilteredPharmacies(
      pharmaciesWithDistance.filter((p) =>
        showVerifiedOnly ? p.verified : true
      )
    );
  };

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371;
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
  };

  const toRad = (degrees: number): number => {
    return degrees * (Math.PI / 180);
  };

  const filterPharmacies = () => {
    let filtered = [...pharmacies];

    if (showVerifiedOnly) {
      filtered = filtered.filter((p) => p.verified);
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (pharmacy) =>
          pharmacy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          pharmacy.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (sortBy === "name") {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "distance" && userLocation) {
      filtered.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }

    setFilteredPharmacies(filtered);
  };

  const isPharmacyOpen = (
    openTime: string | null,
    closeTime: string | null
  ) => {
    if (!openTime || !closeTime) return null;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const [openHour, openMin] = openTime.split(":").map(Number);
    const [closeHour, closeMin] = closeTime.split(":").map(Number);

    const openMinutes = openHour * 60 + openMin;
    const closeMinutes = closeHour * 60 + closeMin;

    return currentTime >= openMinutes && currentTime <= closeMinutes;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Nearby Pharmacies</h1>
        <p className="text-gray-600">
          Find {showVerifiedOnly ? "verified " : ""}pharmacies{" "}
          {userLocation ? "near you" : "in your area"}
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search by name or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Location Button */}
          <Button
            onClick={getCurrentLocation}
            disabled={gettingLocation}
            variant={userLocation ? "default" : "outline"}
          >
            {gettingLocation ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Getting...
              </>
            ) : userLocation ? (
              <>
                <Navigation className="h-4 w-4 mr-2" />
                Location Set
              </>
            ) : (
              <>
                <MapPin className="h-4 w-4 mr-2" />
                Use My Location
              </>
            )}
          </Button>
        </div>

        {/* Filters and View Toggle */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-600" />
            <span className="text-sm text-gray-600">Sort:</span>
            <Button
              variant={sortBy === "distance" ? "default" : "ghost"}
              size="sm"
              onClick={() => setSortBy("distance")}
              disabled={!userLocation}
            >
              Distance
            </Button>
            <Button
              variant={sortBy === "name" ? "default" : "ghost"}
              size="sm"
              onClick={() => setSortBy("name")}
            >
              Name
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={showVerifiedOnly}
                onChange={(e) => setShowVerifiedOnly(e.target.checked)}
                className="rounded"
              />
              Verified only
            </label>
          </div>

          <div className="ml-auto flex gap-2">
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4 mr-2" />
              List
            </Button>
            <Button
              variant={viewMode === "map" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("map")}
            >
              <Map className="h-4 w-4 mr-2" />
              Map
            </Button>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Found <strong>{filteredPharmacies.length}</strong>{" "}
          {filteredPharmacies.length === 1 ? "pharmacy" : "pharmacies"}
          {userLocation && " near you"}
        </p>
      </div>

      {/* Map View */}
      {viewMode === "map" && (
        <div
          ref={mapRef}
          className="w-full h-[600px] rounded-lg shadow-lg mb-6"
        />
      )}

      {/* List View */}
      {viewMode === "list" && (
        <>
          {filteredPharmacies.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Store className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No pharmacies found
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery
                    ? "Try adjusting your search"
                    : showVerifiedOnly
                    ? "No verified pharmacies available. Try unchecking 'Verified only'"
                    : "No pharmacies available in your area"}
                </p>
                {searchQuery && (
                  <Button onClick={() => setSearchQuery("")} variant="outline">
                    Clear Search
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPharmacies.map((pharmacy) => {
                const isOpen = isPharmacyOpen(
                  pharmacy.openTime,
                  pharmacy.closeTime
                );

                return (
                  <Card
                    key={pharmacy.id}
                    className="hover:shadow-lg transition-shadow"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg mb-1">
                            {pharmacy.name}
                          </h3>
                          <Badge
                            variant={
                              pharmacy.verified ? "default" : "secondary"
                            }
                            className="text-xs"
                          >
                            {pharmacy.verified ? "✓ Verified" : "Unverified"}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 mb-3">
                        <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-600">
                          {pharmacy.address}
                        </p>
                      </div>

                      {pharmacy.distance !== undefined && (
                        <div className="flex items-center gap-2 mb-3">
                          <Navigation className="h-4 w-4 text-blue-600" />
                          <p className="text-sm font-semibold text-blue-600">
                            {pharmacy.distance.toFixed(1)} km away
                          </p>
                        </div>
                      )}

                      {pharmacy.openTime && pharmacy.closeTime && (
                        <div className="flex items-center gap-2 mb-3">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-gray-600">
                              {pharmacy.openTime} - {pharmacy.closeTime}
                            </p>
                            {isOpen !== null && (
                              <Badge
                                variant={isOpen ? "default" : "secondary"}
                                className="text-xs"
                              >
                                {isOpen ? "Open" : "Closed"}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2 mb-4">
                        <Package className="h-4 w-4 text-gray-500" />
                        <p className="text-sm text-gray-600">
                          {pharmacy.products?.length || 0} products available
                        </p>
                      </div>

                      {pharmacy.user?.phone && (
                        <a
                          href={`tel:${pharmacy.user.phone}`}
                          className="flex items-center gap-2 text-sm text-blue-600 hover:underline mb-4"
                        >
                          <Phone className="h-4 w-4" />
                          {pharmacy.user.phone}
                        </a>
                      )}

                      <div className="flex gap-2">
                        <Link
                          href={`/consumer/search?pharmacy=${pharmacy.id}`}
                          className="flex-1"
                        >
                          <Button className="w-full" size="sm">
                            View Products
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            window.open(
                              `https://www.google.com/maps/dir/?api=1&destination=${pharmacy.latitude},${pharmacy.longitude}`,
                              "_blank"
                            )
                          }
                        >
                          <Navigation className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
