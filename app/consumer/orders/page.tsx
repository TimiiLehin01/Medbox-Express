"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/loading-spinner";
import { Package, Search } from "lucide-react";
import { formatPrice, formatDate } from "@/lib/utils";
import Link from "next/link";

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const fetchOrders = async () => {
    try {
      let url = "/api/orders";
      if (filter !== "all") {
        url += `?status=${filter}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, any> = {
      PENDING: "secondary",
      ACCEPTED: "default",
      READY: "default",
      PICKED: "default",
      DELIVERED: "success",
      CANCELLED: "destructive",
    };
    return colors[status] || "secondary";
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
      <h1 className="text-3xl font-bold mb-6">My Orders</h1>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {["all", "PENDING", "ACCEPTED", "READY", "PICKED", "DELIVERED"].map(
          (status) => (
            <Button
              key={status}
              variant={filter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(status)}
            >
              {status === "all" ? "All Orders" : status}
            </Button>
          )
        )}
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No orders found</p>
            <Button asChild>
              <Link href="/consumer/search">Start Shopping</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-lg">
                        Order #{order.id.slice(0, 8)}
                      </span>
                      <Badge variant={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </div>

                    <div className="space-y-1 text-sm text-gray-600 mb-3">
                      <p>
                        <strong>Pharmacy:</strong> {order.pharmacy.name}
                      </p>
                      <p>
                        <strong>Date:</strong> {formatDate(order.createdAt)}
                      </p>
                      <p>
                        <strong>Items:</strong> {order.items.length} product(s)
                      </p>
                      <p>
                        <strong>Delivery:</strong> {order.deliveryAddress}
                      </p>
                    </div>

                    {order.rider && (
                      <div className="text-sm text-gray-600">
                        <p>
                          <strong>Rider:</strong> {order.rider.user.name}
                        </p>
                        <p>
                          <strong>Phone:</strong> {order.rider.user.phone}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="md:text-right">
                    <p className="text-2xl font-bold text-blue-600 mb-3">
                      {formatPrice(order.total)}
                    </p>
                    <Button asChild className="w-full md:w-auto">
                      <Link href={`/consumer/orders/${order.id}`}>
                        View Details
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
