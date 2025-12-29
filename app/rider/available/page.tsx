"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/loading-spinner";
import { MapPin, Package, DollarSign } from "lucide-react";
import { formatPrice } from "@/lib/utils";

export default function AvailableDeliveriesPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);

  useEffect(() => {
    fetchAvailableOrders();
    const interval = setInterval(fetchAvailableOrders, 15000); // Refresh every 15 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchAvailableOrders = async () => {
    try {
      const response = await fetch("/api/orders/available");
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error("Failed to fetch available orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    setAccepting(orderId);
    try {
      const response = await fetch(`/api/orders/${orderId}/accept`, {
        method: "POST",
      });

      if (response.ok) {
        alert("Order accepted! You can now pick it up.");
        fetchAvailableOrders();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to accept order");
      }
    } catch (error) {
      console.error("Failed to accept order:", error);
      alert("Failed to accept order. Please try again.");
    } finally {
      setAccepting(null);
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
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Available Deliveries</h1>
        <Button onClick={fetchAvailableOrders} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">
              No available deliveries at the moment
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Check back in a few minutes
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {orders.map((order) => (
            <Card key={order.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-1">
                      Order #{order.id.slice(0, 8)}
                    </h3>
                    <Badge variant="default">Ready for Pickup</Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Delivery Fee</p>
                    <p className="text-xl font-bold text-green-600">
                      {formatPrice(order.deliveryFee)}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 mt-0.5 text-gray-600 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">Pickup</p>
                      <p className="text-gray-600">{order.pharmacy.name}</p>
                      <p className="text-gray-500 text-xs">
                        {order.pharmacy.address}
                      </p>
                      <p className="text-blue-600 text-xs mt-1">
                        {order.distanceToPharmacy.toFixed(1)} km away
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 mt-0.5 text-gray-600 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">Delivery</p>
                      <p className="text-gray-600">{order.consumer.name}</p>
                      <p className="text-gray-500 text-xs">
                        {order.deliveryAddress}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Package className="h-4 w-4 text-gray-600" />
                    <span>{order.items.length} item(s)</span>
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={() => handleAcceptOrder(order.id)}
                  disabled={accepting === order.id}
                >
                  {accepting === order.id ? "Accepting..." : "Accept Delivery"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
