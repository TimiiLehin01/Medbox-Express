"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatsCard } from "@/components/stats-card";
import { EnhancedCard } from "@/components/enhanced-card";
import { AnimatedNumber } from "@/components/animated-number";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/loading-spinner";
import {
  Package,
  ShoppingBag,
  DollarSign,
  Clock,
  Plus,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { formatPrice, formatDate } from "@/lib/utils";

export default function EnhancedPharmacyDashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    completedOrders: 0,
  });
  const [orders, setOrders] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [ordersRes, profileRes] = await Promise.all([
        fetch("/api/orders"),
        fetch("/api/pharmacies/profile"),
      ]);

      if (!profileRes.ok) {
        throw new Error("Failed to fetch profile");
      }

      const ordersData = await ordersRes.json();
      const profileData = await profileRes.json();

      console.log("Profile data:", profileData);

      setOrders(ordersData);
      setProfile(profileData);

      const pending = ordersData.filter(
        (o: any) => o.status === "PENDING"
      ).length;
      const completed = ordersData.filter(
        (o: any) => o.status === "DELIVERED"
      ).length;
      const revenue = ordersData
        .filter((o: any) => o.status === "DELIVERED")
        .reduce((sum: number, o: any) => sum + o.total, 0);

      setStats({
        totalProducts: profileData.products?.length || 0,
        pendingOrders: pending,
        completedOrders: completed,
        totalRevenue: revenue,
      });
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    setUpdatingOrderId(orderId);
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "ACCEPTED" }),
      });

      if (!response.ok) {
        throw new Error("Failed to accept order");
      }

      // Refresh dashboard data
      await fetchDashboardData();
    } catch (error) {
      console.error("Error accepting order:", error);
      alert("Failed to accept order. Please try again.");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleMarkReady = async (orderId: string) => {
    setUpdatingOrderId(orderId);
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "READY" }),
      });

      if (!response.ok) {
        throw new Error("Failed to mark order as ready");
      }

      // Refresh dashboard data
      await fetchDashboardData();
    } catch (error) {
      console.error("Error marking order ready:", error);
      alert("Failed to mark order as ready. Please try again.");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Check if pharmacy is verified
  if (profile && profile.verified === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-50 flex items-center justify-center p-4">
        <EnhancedCard className="max-w-2xl w-full border-4 border-yellow-400">
          <div className="text-center">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="h-12 w-12 text-yellow-600" />
            </div>
            <h2 className="text-3xl font-bold mb-4 text-gray-900">
              Account Pending Verification
            </h2>
            <p className="text-gray-600 mb-6 text-lg">
              Your pharmacy is being reviewed by our admin team. You'll receive
              an email once verified.
            </p>
            <Link href="/pharmacy/profile">
              <button className="btn-primary">Complete Profile</button>
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 text-sm text-gray-500 underline"
            >
              Refresh Status
            </button>
          </div>
        </EnhancedCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8 relative overflow-hidden rounded-3xl p-8 bg-gradient-to-r from-green-600 to-blue-600 text-white shadow-2xl">
          <div className="relative z-10 flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                {profile?.name || "Your Pharmacy"} 🏪
              </h1>
              <p className="text-green-100 text-lg">
                Manage your inventory and orders efficiently
              </p>
            </div>
            <Link href="/pharmacy/products/new">
              <button className="bg-white text-green-600 px-6 py-3 rounded-xl font-bold hover:shadow-2xl transition-all transform hover:scale-105 flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add Product
              </button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Products"
            value={<AnimatedNumber value={stats.totalProducts} />}
            icon={Package}
          />
          <StatsCard
            title="Pending Orders"
            value={<AnimatedNumber value={stats.pendingOrders} />}
            icon={Clock}
          />
          <StatsCard
            title="Completed Orders"
            value={<AnimatedNumber value={stats.completedOrders} />}
            icon={ShoppingBag}
            trend={{ value: 15, isPositive: true }}
          />
          <StatsCard
            title="Total Revenue"
            value={formatPrice(stats.totalRevenue)}
            icon={DollarSign}
            trend={{ value: 23, isPositive: true }}
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link href="/pharmacy/products">
            <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition cursor-pointer">
              <Package className="h-8 w-8 text-green-600 mb-3" />
              <h3 className="font-bold text-lg mb-1">Manage Products</h3>
              <p className="text-sm text-gray-600">
                View and edit your inventory
              </p>
            </div>
          </Link>
          <Link href="/pharmacy/products/new">
            <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition cursor-pointer">
              <Plus className="h-8 w-8 text-blue-600 mb-3" />
              <h3 className="font-bold text-lg mb-1">Add New Product</h3>
              <p className="text-sm text-gray-600">
                Add medicines to your store
              </p>
            </div>
          </Link>
          <Link href="/pharmacy/orders">
            <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition cursor-pointer">
              <ShoppingBag className="h-8 w-8 text-purple-600 mb-3" />
              <h3 className="font-bold text-lg mb-1">View All Orders</h3>
              <p className="text-sm text-gray-600">Manage customer orders</p>
            </div>
          </Link>
        </div>

        {/* Recent Orders */}
        <EnhancedCard>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Recent Orders</h2>
            <Link
              href="/pharmacy/orders"
              className="text-green-600 hover:text-green-700 font-semibold"
            >
              View All →
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="h-12 w-12 text-gray-400" />
              </div>
              <p className="text-gray-600 text-lg">No orders yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.slice(0, 10).map((order, index) => (
                <div
                  key={order.id}
                  className="flex flex-col md:flex-row items-start md:items-center justify-between p-5 border-2 border-gray-100 rounded-xl hover:border-green-200 hover:bg-green-50 transition-all duration-300"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex-1 mb-4 md:mb-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-lg font-bold text-gray-900">
                        Order #{order.id.slice(0, 8)}
                      </span>
                      <Badge
                        variant={
                          order.status === "PENDING"
                            ? "secondary"
                            : order.status === "DELIVERED"
                            ? "success"
                            : "default"
                        }
                      >
                        {order.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      {order.consumer.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDate(order.createdAt)}
                    </p>
                    <p className="text-lg font-bold text-green-600 mt-1">
                      {formatPrice(order.total)}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {order.status === "PENDING" && (
                      <button
                        onClick={() => handleAcceptOrder(order.id)}
                        disabled={updatingOrderId === order.id}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {updatingOrderId === order.id
                          ? "Accepting..."
                          : "Accept"}
                      </button>
                    )}
                    {order.status === "ACCEPTED" && (
                      <button
                        onClick={() => handleMarkReady(order.id)}
                        disabled={updatingOrderId === order.id}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {updatingOrderId === order.id
                          ? "Updating..."
                          : "Mark Ready"}
                      </button>
                    )}
                    <Link href={`/pharmacy/orders/${order.id}`}>
                      <button className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 transition">
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
