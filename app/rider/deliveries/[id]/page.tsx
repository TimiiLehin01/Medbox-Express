"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/loading-spinner";
import { MapPin, Phone, Package, CheckCircle, Navigation } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { DeliveryMap } from "@/components/map/delivery-map";

export default function RiderDeliveryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchOrder();
    // Refresh order every 30 seconds for real-time updates
    const interval = setInterval(fetchOrder, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/orders/${params.id}`);
      const data = await response.json();
      setOrder(data);
    } catch (error) {
      console.error("Failed to fetch order:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePickup = async () => {
    setUpdating(true);
    try {
      await fetch(`/api/orders/${params.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PICKED" }),
      });
      fetchOrder();
    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelivered = async () => {
    if (!confirm("Confirm that this order has been delivered?")) return;

    setUpdating(true);
    try {
      await fetch(`/api/orders/${params.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "DELIVERED" }),
      });

      // Update rider availability
      await fetch("/api/riders/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ availability: "AVAILABLE" }),
      });

      alert("Delivery completed! Great job!");
      router.push("/rider");
    } catch (error) {
      console.error("Failed to complete delivery:", error);
    } finally {
      setUpdating(false);
    }
  };

  const openGoogleMaps = (lat: number, lng: number, label: string) => {
    // Open in Google Maps app or web
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
    window.open(url, "_blank");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600">Order not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Delivery Details</h1>
        <div className="flex items-center gap-2">
          <span className="text-gray-600">Order #{order.id.slice(0, 8)}</span>
          <Badge
            variant={order.status === "DELIVERED" ? "default" : "secondary"}
          >
            {order.status}
          </Badge>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mb-6 space-y-2">
        {order.status === "READY" && (
          <Button
            className="w-full"
            size="lg"
            onClick={handlePickup}
            disabled={updating}
          >
            <Package className="mr-2 h-5 w-5" />
            Mark as Picked Up
          </Button>
        )}
        {order.status === "PICKED" && (
          <Button
            className="w-full"
            size="lg"
            onClick={handleDelivered}
            disabled={updating}
          >
            <CheckCircle className="mr-2 h-5 w-5" />
            Mark as Delivered
          </Button>
        )}
      </div>

      {/* Route Map */}
      {order.pharmacy.latitude &&
      order.pharmacy.longitude &&
      order.deliveryLatitude &&
      order.deliveryLongitude ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5" />
              Route Map
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DeliveryMap
              pickupLat={order.pharmacy.latitude}
              pickupLng={order.pharmacy.longitude}
              pickupLabel={order.pharmacy.name}
              deliveryLat={order.deliveryLatitude}
              deliveryLng={order.deliveryLongitude}
              deliveryLabel={order.deliveryAddress}
              height="400px"
            />
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>Distance:</strong>{" "}
                {calculateDistance(
                  order.pharmacy.latitude,
                  order.pharmacy.longitude,
                  order.deliveryLatitude,
                  order.deliveryLongitude
                ).toFixed(2)}{" "}
                km
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-6">
          <CardContent className="py-8 text-center">
            <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-600">Location data not available</p>
            <p className="text-sm text-gray-500">
              GPS coordinates needed for map
            </p>
          </CardContent>
        </Card>
      )}

      {/* Pickup Location */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Pickup Location</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="font-semibold text-lg">{order.pharmacy.name}</p>
            <p className="text-sm text-gray-600">{order.pharmacy.address}</p>
            {order.pharmacy.latitude && order.pharmacy.longitude && (
              <p className="text-xs text-gray-500 mt-1">
                {order.pharmacy.latitude.toFixed(6)},{" "}
                {order.pharmacy.longitude.toFixed(6)}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-gray-600" />
            <a
              href={`tel:${order.pharmacy.user.phone}`}
              className="text-blue-600 hover:underline"
            >
              {order.pharmacy.user.phone}
            </a>
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={() =>
              openGoogleMaps(
                order.pharmacy.latitude,
                order.pharmacy.longitude,
                order.pharmacy.name
              )
            }
            disabled={!order.pharmacy.latitude || !order.pharmacy.longitude}
          >
            <MapPin className="mr-2 h-4 w-4" />
            Navigate to Pharmacy
          </Button>
        </CardContent>
      </Card>

      {/* Delivery Location */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Delivery Location</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="font-semibold text-lg">{order.consumer.name}</p>
            <p className="text-sm text-gray-600">{order.deliveryAddress}</p>
            {order.deliveryLatitude && order.deliveryLongitude && (
              <p className="text-xs text-gray-500 mt-1">
                {order.deliveryLatitude.toFixed(6)},{" "}
                {order.deliveryLongitude.toFixed(6)}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-gray-600" />
            <a
              href={`tel:${order.consumer.phone}`}
              className="text-blue-600 hover:underline"
            >
              {order.consumer.phone}
            </a>
          </div>
          {order.notes && (
            <div className="p-3 bg-yellow-50 rounded-lg">
              <p className="text-sm font-semibold text-yellow-900">
                Delivery Notes:
              </p>
              <p className="text-sm text-yellow-800">{order.notes}</p>
            </div>
          )}
          <Button
            variant="outline"
            className="w-full"
            onClick={() =>
              openGoogleMaps(
                order.deliveryLatitude,
                order.deliveryLongitude,
                order.consumer.name
              )
            }
            disabled={!order.deliveryLatitude || !order.deliveryLongitude}
          >
            <MapPin className="mr-2 h-4 w-4" />
            Navigate to Customer
          </Button>
        </CardContent>
      </Card>

      {/* Order Items */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Order Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {order.items.map((item: any) => (
              <div
                key={item.id}
                className="flex justify-between items-start text-sm border-b pb-2 last:border-b-0"
              >
                <div className="flex gap-3">
                  {item.product.imageUrl && (
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                  )}
                  <div>
                    <p className="font-semibold">{item.product.name}</p>
                    <p className="text-gray-600">Qty: {item.quantity}</p>
                  </div>
                </div>
                <span className="font-semibold">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Delivery Fee</span>
              <span>{formatPrice(order.deliveryFee)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Earnings */}
      <Card>
        <CardHeader>
          <CardTitle>Your Earnings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Delivery Fee</span>
            <span className="text-3xl font-bold text-green-600">
              {formatPrice(order.deliveryFee)}
            </span>
          </div>
          {order.paymentMethod === "cash" && order.status !== "DELIVERED" && (
            <div className="mt-4 p-3 bg-orange-50 rounded-lg">
              <p className="text-sm font-semibold text-orange-900">
                Cash Payment
              </p>
              <p className="text-sm text-orange-800">
                Collect {formatPrice(order.total)} from customer on delivery
              </p>
            </div>
          )}
          {order.status === "DELIVERED" && (
            <p className="text-sm text-green-600 mt-2">
              ✓ Payment will be processed within 24 hours
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Helper function to calculate distance
function calculateDistance(
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

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}
