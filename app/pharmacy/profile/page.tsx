"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/loading-spinner";
import { Loader2, MapPin, Navigation, Store } from "lucide-react";

export default function PharmacyProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [locationCaptured, setLocationCaptured] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    latitude: null as number | null,
    longitude: null as number | null,
    openTime: "",
    closeTime: "",
    deliveryRadius: 10,
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/pharmacies/profile");
      const data = await response.json();
      setProfile(data);

      const hasCoordinates = data.latitude && data.longitude;
      setLocationCaptured(hasCoordinates);

      setFormData({
        name: data.name || "",
        address: data.address || "",
        latitude: data.latitude || null,
        longitude: data.longitude || null,
        openTime: data.openTime || "",
        closeTime: data.closeTime || "",
        deliveryRadius: data.deliveryRadius || 10,
      });
    } catch (error) {
      console.error("Failed to fetch profile:", error);
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
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setFormData((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
        }));

        setLocationCaptured(true);

        // Reverse geocode to get address
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
          );
          const data = await response.json();
          const address = data.display_name || `${lat}, ${lng}`;

          setFormData((prev) => ({
            ...prev,
            address: address,
          }));
        } catch (error) {
          console.error("Failed to get address:", error);
        }

        setGettingLocation(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        alert(
          "Unable to get your location. Please check browser permissions or enter manually."
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.latitude || !formData.longitude) {
      alert("Please capture your pharmacy's GPS location");
      return;
    }

    setSaving(true);
    setSuccess(false);

    try {
      const response = await fetch("/api/pharmacies/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        alert("Failed to update profile");
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
      alert("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Store className="h-8 w-8" />
          Pharmacy Profile
        </h1>
        <p className="text-gray-600 mt-2">
          Update your pharmacy information and location
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {success && (
              <div className="bg-green-50 text-green-600 p-4 rounded-md text-sm border border-green-200">
                ✓ Profile updated successfully!
              </div>
            )}

            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">
                Basic Information
              </h3>

              <div className="space-y-2">
                <Label htmlFor="name">Pharmacy Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., MedPlus Pharmacy"
                  required
                />
              </div>
            </div>

            {/* Location Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">
                Location & Address
              </h3>

              {/* GPS Location Button */}
              <div>
                <Button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={gettingLocation}
                  variant={locationCaptured ? "outline" : "default"}
                  className="w-full"
                  size="lg"
                >
                  {gettingLocation ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Getting your location...
                    </>
                  ) : locationCaptured ? (
                    <>
                      <Navigation className="mr-2 h-4 w-4" />
                      Location Captured ✓
                    </>
                  ) : (
                    <>
                      <MapPin className="mr-2 h-4 w-4" />
                      Capture Pharmacy Location
                    </>
                  )}
                </Button>
                <p className="text-xs text-gray-500 mt-2">
                  This helps riders find your pharmacy and customers see
                  accurate delivery distances
                </p>
              </div>

              {/* Location Indicator */}
              {locationCaptured && formData.latitude && formData.longitude && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm font-semibold text-green-900 mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    GPS Location Captured
                  </p>
                  <p className="text-xs text-green-700 font-mono">
                    Lat: {formData.latitude.toFixed(6)}, Lng:{" "}
                    {formData.longitude.toFixed(6)}
                  </p>
                  <a
                    href={`https://www.google.com/maps?q=${formData.latitude},${formData.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                  >
                    View on Google Maps →
                  </a>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="address">Full Address *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="Street address, area, city"
                  required
                />
                <p className="text-xs text-gray-500">
                  This will be shown to customers
                </p>
              </div>

              {/* Manual Coordinate Entry */}
              <details className="text-sm">
                <summary className="cursor-pointer text-gray-600 hover:text-gray-900 mb-2">
                  Enter GPS coordinates manually (advanced)
                </summary>
                <div className="grid md:grid-cols-2 gap-4 mt-3">
                  <div className="space-y-2">
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input
                      id="latitude"
                      type="number"
                      step="any"
                      placeholder="6.5244"
                      value={formData.latitude || ""}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || null;
                        setFormData({ ...formData, latitude: val });
                        setLocationCaptured(
                          val !== null && formData.longitude !== null
                        );
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input
                      id="longitude"
                      type="number"
                      step="any"
                      placeholder="3.3792"
                      value={formData.longitude || ""}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || null;
                        setFormData({ ...formData, longitude: val });
                        setLocationCaptured(
                          formData.latitude !== null && val !== null
                        );
                      }}
                    />
                  </div>
                </div>
              </details>
            </div>

            {/* Operating Hours */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">
                Operating Hours
              </h3>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="openTime">Opening Time</Label>
                  <Input
                    id="openTime"
                    type="time"
                    value={formData.openTime}
                    onChange={(e) =>
                      setFormData({ ...formData, openTime: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="closeTime">Closing Time</Label>
                  <Input
                    id="closeTime"
                    type="time"
                    value={formData.closeTime}
                    onChange={(e) =>
                      setFormData({ ...formData, closeTime: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Delivery Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">
                Delivery Settings
              </h3>

              <div className="space-y-2">
                <Label htmlFor="deliveryRadius">Delivery Radius (km)</Label>
                <Input
                  id="deliveryRadius"
                  type="number"
                  step="0.5"
                  min="1"
                  max="50"
                  value={formData.deliveryRadius}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      deliveryRadius: parseFloat(e.target.value),
                    })
                  }
                />
                <p className="text-xs text-gray-500">
                  Maximum distance you can deliver within (1-50 km)
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <Button
                type="submit"
                disabled={saving || !locationCaptured}
                className="w-full"
                size="lg"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  "Save Profile"
                )}
              </Button>

              {!locationCaptured && (
                <p className="text-xs text-red-600 mt-2 text-center">
                  Please capture your GPS location before saving
                </p>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Verification Status */}
      {profile && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Account Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Verification Status</span>
              <span
                className={`text-sm font-semibold ${
                  profile.verified ? "text-green-600" : "text-orange-600"
                }`}
              >
                {profile.verified ? "✓ Verified" : "Pending Verification"}
              </span>
            </div>
            {!profile.verified && (
              <p className="text-xs text-gray-500 mt-2">
                Your pharmacy is pending admin verification. You'll be able to
                receive orders once verified.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
