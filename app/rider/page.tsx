"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/loading-spinner";
import {
  Package,
  DollarSign,
  MapPin,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { formatPrice, formatDate } from "@/lib/utils";

export default function RiderDashboard() {
  const [userName, setUserName] = useState("");
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalEarnings: 0,
    completedDeliveries: 0,
    activeDeliveries: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get user info from localStorage
    const storedUserName = localStorage.getItem("user-name") || "Rider";
    setUserName(storedUserName);

    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [profileRes, ordersRes, earningsRes] = await Promise.all([
        fetch("/api/riders/profile"),
        fetch("/api/orders"),
        fetch("/api/riders/earnings"),
      ]);

      const profileData = await profileRes.json();
      const ordersData = await ordersRes.json();
      const earningsData = await earningsRes.json();

      setProfile(profileData);
      setOrders(ordersData);

      // Use earnings data from the API
      setStats({
        totalEarnings: earningsData.totalEarnings || 0,
        completedDeliveries: earningsData.deliveredOrders || 0,
        activeDeliveries: earningsData.activeOrders || 0,
      });
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailability = async () => {
    try {
      const newStatus =
        profile.availability === "AVAILABLE" ? "OFFLINE" : "AVAILABLE";
      await fetch("/api/riders/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ availability: newStatus }),
      });
      fetchDashboardData();
    } catch (error) {
      console.error("Failed to update availability:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!profile?.verified) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <Card className="border-yellow-500">
          <CardContent className="pt-6">
            <AlertCircle className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-center mb-2">
              Account Pending Verification
            </h2>
            <p className="text-center text-gray-600 mb-4">
              Your rider account is being reviewed. You'll receive an email once
              verified.
            </p>
            <div className="text-center">
              <Link href="/rider/profile">
                <Button>Complete Profile</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome, {userName}!
          </h1>
          <p className="text-gray-600">Manage your deliveries and earnings</p>
        </div>
        <Button
          onClick={handleToggleAvailability}
          variant={profile.availability === "AVAILABLE" ? "default" : "outline"}
          size="lg"
        >
          {profile.availability === "AVAILABLE" ? "Go Offline" : "Go Online"}
        </Button>
      </div>

      {/* Status Badge */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`h-3 w-3 rounded-full ${
                  profile.availability === "AVAILABLE"
                    ? "bg-green-500"
                    : profile.availability === "BUSY"
                    ? "bg-yellow-500"
                    : "bg-gray-500"
                }`}
              />
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="text-lg font-semibold">{profile.availability}</p>
              </div>
            </div>
            <Link href="/rider/available">
              <Button variant="outline">
                <MapPin className="h-4 w-4 mr-2" />
                Find Deliveries
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Earnings</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatPrice(stats.totalEarnings)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  From completed deliveries
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold">
                  {stats.completedDeliveries}
                </p>
                <p className="text-xs text-gray-500 mt-1">Total deliveries</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold">{stats.activeDeliveries}</p>
                <p className="text-xs text-gray-500 mt-1">In progress</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Deliveries */}
      <Card>
        <CardHeader>
          <CardTitle>My Deliveries</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No active deliveries</p>
              <Link href="/rider/available">
                <Button className="mt-4" variant="outline">
                  <MapPin className="h-4 w-4 mr-2" />
                  Find Available Deliveries
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">
                        Order #{order.id.slice(0, 8)}
                      </span>
                      <Badge
                        variant={
                          order.status === "PICKED"
                            ? "default"
                            : order.status === "DELIVERED"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {order.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      {order.pharmacy.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">
                      {formatPrice(order.deliveryFee)}
                    </p>
                    {order.status === "DELIVERED" && (
                      <p className="text-xs text-green-600">✓ Earned</p>
                    )}
                    <Link href={`/rider/deliveries/${order.id}`}>
                      <Button variant="ghost" size="sm" className="mt-1">
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
