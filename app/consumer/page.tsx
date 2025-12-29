"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatsCard } from "@/components/stats-card";
import { EnhancedCard } from "@/components/enhanced-card";
import { AnimatedNumber } from "@/components/animated-number";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/loading-spinner";
import {
  Search,
  ShoppingCart,
  Package,
  MapPin,
  Clock,
  TrendingUp,
  Star,
} from "lucide-react";
import { formatPrice, formatDate } from "@/lib/utils";

export default function EnhancedConsumerDashboard() {
  const [userName, setUserName] = useState("");
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get user info from cookies or localStorage
    const storedUserName = localStorage.getItem("user-name") || "User";
    setUserName(storedUserName);

    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/orders");
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    totalOrders: orders.length,
    activeOrders: orders.filter(
      (o) => !["DELIVERED", "CANCELLED"].includes(o.status)
    ).length,
    completedOrders: orders.filter((o) => o.status === "DELIVERED").length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Welcome Header with Gradient */}
        <div className="mb-8 relative overflow-hidden rounded-3xl p-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-2xl">
          <div className="relative z-10">
            <h1 className="text-4xl font-bold mb-2 animate-fadeInUp">
              Welcome back, {userName}! 👋
            </h1>
            <p className="text-blue-100 text-lg">
              Ready to order your medications?
            </p>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-10 rounded-full -ml-24 -mb-24"></div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatsCard
            title="Total Orders"
            value={<AnimatedNumber value={stats.totalOrders} />}
            icon={Package}
            trend={{ value: 12, isPositive: true }}
          />
          <StatsCard
            title="Active Orders"
            value={<AnimatedNumber value={stats.activeOrders} />}
            icon={Clock}
          />
          <StatsCard
            title="Completed"
            value={<AnimatedNumber value={stats.completedOrders} />}
            icon={TrendingUp}
            trend={{ value: 8, isPositive: true }}
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <Link href="/consumer/search">
            <EnhancedCard className="group cursor-pointer bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <div className="flex items-center justify-between mb-4">
                <Search className="h-10 w-10 group-hover:scale-110 transition-transform" />
                <span className="text-4xl">🔍</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Search Medicine</h3>
              <p className="text-blue-100">Find what you need instantly</p>
            </EnhancedCard>
          </Link>

          <Link href="/consumer/pharmacies">
            <EnhancedCard className="group cursor-pointer bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <div className="flex items-center justify-between mb-4">
                <MapPin className="h-10 w-10 group-hover:scale-110 transition-transform" />
                <span className="text-4xl">🏪</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Nearby Pharmacies</h3>
              <p className="text-purple-100">Browse local stores</p>
            </EnhancedCard>
          </Link>

          <Link href="/consumer/orders">
            <EnhancedCard className="group cursor-pointer bg-gradient-to-br from-pink-500 to-pink-600 text-white">
              <div className="flex items-center justify-between mb-4">
                <Package className="h-10 w-10 group-hover:scale-110 transition-transform" />
                <span className="text-4xl">📦</span>
              </div>
              <h3 className="text-xl font-bold mb-2">My Orders</h3>
              <p className="text-pink-100">Track your deliveries</p>
            </EnhancedCard>
          </Link>
        </div>

        {/* Recent Orders */}
        <EnhancedCard>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Recent Orders</h2>
            <Link
              href="/consumer/orders"
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              View All →
            </Link>
          </div>

          {loading ? (
            <div className="py-12">
              <LoadingSpinner />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="h-12 w-12 text-gray-400" />
              </div>
              <p className="text-gray-600 mb-4 text-lg">No orders yet</p>
              <Link href="/consumer/search">
                <button className="btn-primary">Start Shopping</button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.slice(0, 5).map((order, index) => (
                <div
                  key={order.id}
                  className="flex flex-col md:flex-row items-start md:items-center justify-between p-5 border-2 border-gray-100 rounded-xl hover:border-blue-200 hover:bg-blue-50 transition-all duration-300 group"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-start gap-4 flex-1 mb-4 md:mb-0">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg group-hover:scale-110 transition-transform">
                      {order.id.slice(0, 2).toUpperCase()}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-lg text-gray-900">
                          Order #{order.id.slice(0, 8)}
                        </span>
                        <Badge
                          variant={
                            order.status === "DELIVERED"
                              ? "success"
                              : order.status === "PENDING"
                              ? "secondary"
                              : "default"
                          }
                          className="animate-pulse-subtle"
                        >
                          {order.status}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {order.pharmacy.name}
                        </p>
                        <p className="text-sm text-gray-500 flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">
                        {formatPrice(order.total)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {order.items.length} items
                      </p>
                    </div>
                    <Link href={`/consumer/orders/${order.id}`}>
                      <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all transform hover:scale-105">
                        View
                      </button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </EnhancedCard>
      </div>
    </div>
  );
}
