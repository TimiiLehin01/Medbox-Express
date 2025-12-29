// app/consumer/checkout/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatPrice } from "@/lib/utils";
import { MapPin, CreditCard, Loader2, Navigation } from "lucide-react";

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  prescriptionRequired: boolean;
  pharmacyId: string;
  pharmacyName: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [locationCaptured, setLocationCaptured] = useState(false);
  const [formData, setFormData] = useState({
    deliveryAddress: "",
    deliveryLatitude: null as number | null,
    deliveryLongitude: null as number | null,
    paymentMethod: "online",
    notes: "",
    prescriptionUrl: "",
  });

  useEffect(() => {
    // Get cart from localStorage or pass it from search page
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    } else {
      // If no cart, redirect back to search
      router.push("/consumer/search");
    }
  }, [router]);

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const deliveryFee = 500;
  const total = subtotal + deliveryFee;

  const hasPrescriptionItems = cart.some((item) => item.prescriptionRequired);

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
          deliveryLatitude: lat,
          deliveryLongitude: lng,
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
            deliveryAddress: address,
          }));
        } catch (error) {
          console.error("Failed to get address:", error);
        }

        setGettingLocation(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        alert(
          "Unable to get your location. Please enter manually or check browser permissions."
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

    if (!formData.deliveryLatitude || !formData.deliveryLongitude) {
      alert("Please capture your delivery location using GPS");
      return;
    }

    if (hasPrescriptionItems && !formData.prescriptionUrl) {
      alert("Please upload a prescription for prescription-required items");
      return;
    }

    setLoading(true);

    try {
      // Group items by pharmacy (in case cart has items from multiple pharmacies)
      const pharmacyGroups = cart.reduce((groups, item) => {
        if (!groups[item.pharmacyId]) {
          groups[item.pharmacyId] = [];
        }
        groups[item.pharmacyId].push(item);
        return groups;
      }, {} as Record<string, CartItem[]>);

      // Create an order for each pharmacy
      for (const [pharmacyId, items] of Object.entries(pharmacyGroups)) {
        const orderData = {
          pharmacyId,
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
          deliveryAddress: formData.deliveryAddress,
          deliveryLatitude: formData.deliveryLatitude,
          deliveryLongitude: formData.deliveryLongitude,
          paymentMethod: formData.paymentMethod,
          notes: formData.notes,
          prescriptionUrl: formData.prescriptionUrl || null,
          subtotal: items.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
          ),
          deliveryFee,
          total:
            items.reduce((sum, item) => sum + item.price * item.quantity, 0) +
            deliveryFee,
        };

        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orderData),
        });

        if (!res.ok) {
          throw new Error("Failed to create order");
        }
      }

      // Clear cart
      localStorage.removeItem("cart");

      // Show success and redirect
      alert("Order placed successfully! 🎉");
      router.push("/consumer/orders");
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Your cart is empty</p>
          <Button onClick={() => router.push("/consumer/search")}>
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold mb-6">Checkout</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Address */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Delivery Location
                </h2>
                <div className="space-y-4">
                  {/* GPS Location Button */}
                  <div>
                    <Button
                      type="button"
                      onClick={getCurrentLocation}
                      disabled={gettingLocation}
                      variant={locationCaptured ? "outline" : "default"}
                      className="w-full"
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
                          Use My Current Location
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-gray-500 mt-2">
                      We need your GPS location for accurate delivery
                    </p>
                  </div>

                  {/* Show coordinates if captured */}
                  {locationCaptured &&
                    formData.deliveryLatitude &&
                    formData.deliveryLongitude && (
                      <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-sm font-semibold text-green-900 mb-1">
                          📍 Location Captured
                        </p>
                        <p className="text-xs text-green-700">
                          Lat: {formData.deliveryLatitude.toFixed(6)}, Lng:{" "}
                          {formData.deliveryLongitude.toFixed(6)}
                        </p>
                      </div>
                    )}

                  {/* Address Input */}
                  <div>
                    <Label htmlFor="address">Delivery Address *</Label>
                    <Textarea
                      id="address"
                      required
                      value={formData.deliveryAddress}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          deliveryAddress: e.target.value,
                        })
                      }
                      placeholder="Enter your full delivery address (Street, Landmark, etc.)"
                      rows={3}
                    />
                  </div>

                  {/* Manual Coordinate Entry (Optional) */}
                  <details className="text-sm">
                    <summary className="cursor-pointer text-gray-600 hover:text-gray-900">
                      Enter coordinates manually (advanced)
                    </summary>
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div>
                        <Label htmlFor="lat">Latitude</Label>
                        <Input
                          id="lat"
                          type="number"
                          step="any"
                          placeholder="6.5244"
                          value={formData.deliveryLatitude || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              deliveryLatitude:
                                parseFloat(e.target.value) || null,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="lng">Longitude</Label>
                        <Input
                          id="lng"
                          type="number"
                          step="any"
                          placeholder="3.3792"
                          value={formData.deliveryLongitude || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              deliveryLongitude:
                                parseFloat(e.target.value) || null,
                            })
                          }
                        />
                      </div>
                    </div>
                  </details>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Payment Method
                </h2>
                <div className="space-y-3">
                  <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="payment"
                      value="online"
                      checked={formData.paymentMethod === "online"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          paymentMethod: e.target.value,
                        })
                      }
                      className="mr-3"
                    />
                    <span>Pay Online (Card/Transfer)</span>
                  </label>
                  <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="payment"
                      value="cash"
                      checked={formData.paymentMethod === "cash"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          paymentMethod: e.target.value,
                        })
                      }
                      className="mr-3"
                    />
                    <span>Cash on Delivery</span>
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Prescription Upload (if needed) */}
            {hasPrescriptionItems && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold mb-4">
                    Prescription Required
                  </h2>
                  <p className="text-sm text-gray-600 mb-4">
                    Some items in your cart require a prescription. Please
                    upload it.
                  </p>
                  <div>
                    <Label htmlFor="prescription">
                      Prescription Image URL *
                    </Label>
                    <Input
                      id="prescription"
                      type="url"
                      required
                      value={formData.prescriptionUrl}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          prescriptionUrl: e.target.value,
                        })
                      }
                      placeholder="https://example.com/prescription.jpg"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Additional Notes */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4">
                  Additional Notes (Optional)
                </h2>
                <Textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Any special instructions for delivery (e.g., gate code, landmarks)..."
                  rows={3}
                />
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-4">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4">Order Summary</h2>

                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                  {cart.map((item) => (
                    <div
                      key={item.productId}
                      className="flex justify-between text-sm border-b pb-2"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-gray-500 text-xs">
                          {item.pharmacyName}
                        </p>
                        <p className="text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-semibold">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-semibold">
                      {formatPrice(subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span className="font-semibold">
                      {formatPrice(deliveryFee)}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Total</span>
                    <span className="text-blue-600">{formatPrice(total)}</span>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading || !locationCaptured}
                  className="w-full mt-6"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Placing Order...
                    </>
                  ) : (
                    "Place Order"
                  )}
                </Button>

                {!locationCaptured && (
                  <p className="text-xs text-red-600 mt-2 text-center">
                    Please capture your GPS location first
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
