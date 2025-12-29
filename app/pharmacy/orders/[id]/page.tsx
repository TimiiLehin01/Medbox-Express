// app/pharmacy/orders/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/loading-spinner";
import { formatPrice } from "@/lib/utils";
import { ArrowLeft, Package, MapPin, Phone, User } from "lucide-react";

export default function PharmacyOrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchOrderDetails();
  }, []);

  const fetchOrderDetails = async () => {
    try {
      const res = await fetch(`/api/orders/${params.id}`);
      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || "Failed to load order");
        setOrder(null);
      } else {
        setOrder(data);
        setError(null);
      }
    } catch (error) {
      console.error("Failed to fetch order:", error);
      setError("Failed to load order");
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOrder = async () => {
    setUpdating(true);
    try {
      const response = await fetch(`/api/orders/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACCEPTED" }),
      });

      if (!response.ok) {
        throw new Error("Failed to accept order");
      }

      await fetchOrderDetails();
    } catch (error) {
      console.error("Error accepting order:", error);
      alert("Failed to accept order. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  const handleMarkReady = async () => {
    setUpdating(true);
    try {
      const response = await fetch(`/api/orders/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "READY" }),
      });

      if (!response.ok) {
        throw new Error("Failed to mark order as ready");
      }

      await fetchOrderDetails();
    } catch (error) {
      console.error("Error marking order ready:", error);
      alert("Failed to mark order as ready. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">{error || "Order not found"}</p>
          <Button onClick={() => router.push("/pharmacy/orders")}>
            Back to Orders
          </Button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "secondary";
      case "ACCEPTED":
        return "default";
      case "READY":
        return "default";
      case "PICKED":
        return "default";
      case "DELIVERED":
        return "default";
      case "CANCELLED":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/pharmacy/orders")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Orders
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              Order #{order.id?.slice(0, 8) || "Unknown"}
            </h1>
            <p className="text-gray-600 mt-1">
              Placed on {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
          <Badge
            variant={getStatusColor(order.status)}
            className="text-lg px-4 py-2"
          >
            {order.status}
          </Badge>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Order Items
              </h2>
              <div className="space-y-4">
                {order.items?.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex gap-4 border-b pb-4 last:border-b-0"
                  >
                    <div className="w-20 h-20 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                      {item.product?.imageUrl ? (
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className="w-20 h-20 object-cover rounded"
                        />
                      ) : (
                        <Package className="h-8 w-8 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">
                        {item.product?.name || "Product"}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Qty: {item.quantity}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatPrice(item.price)} × {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Customer Info */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <User className="h-5 w-5 mr-2" />
                Customer Information
              </h2>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="font-semibold">
                    {order.consumer?.name || "Unknown"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {order.consumer?.phone || "N/A"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {order.deliveryAddress}
                  </span>
                </div>
              </div>

              {order.notes && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm font-semibold mb-1">Delivery Notes:</p>
                  <p className="text-sm text-gray-600">{order.notes}</p>
                </div>
              )}

              {order.prescriptionUrl && (
                <div className="mt-4 pt-4 border-t">
                  <Badge variant="default" className="mb-2">
                    Prescription Uploaded
                  </Badge>
                  <a
                    href={order.prescriptionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline block"
                  >
                    View Prescription
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          {(order.status === "PENDING" || order.status === "ACCEPTED") && (
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4">Actions</h2>
                <div className="space-y-2">
                  {order.status === "PENDING" && (
                    <Button
                      onClick={handleAcceptOrder}
                      disabled={updating}
                      className="w-full"
                      size="lg"
                    >
                      {updating ? "Accepting..." : "Accept Order"}
                    </Button>
                  )}
                  {order.status === "ACCEPTED" && (
                    <Button
                      onClick={handleMarkReady}
                      disabled={updating}
                      className="w-full"
                      size="lg"
                    >
                      {updating ? "Updating..." : "Mark Ready for Pickup"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Order Summary */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">
                    {formatPrice(order.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Delivery Fee</span>
                  <span className="font-semibold">
                    {formatPrice(order.deliveryFee)}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-3 border-t">
                  <span>Total</span>
                  <span className="text-green-600">
                    {formatPrice(order.total)}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Payment Method</span>
                  <span className="font-semibold capitalize">
                    {order.paymentMethod}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Payment Status</span>
                  <Badge
                    variant={
                      order.paymentStatus === "PAID" ? "default" : "secondary"
                    }
                  >
                    {order.paymentStatus}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
