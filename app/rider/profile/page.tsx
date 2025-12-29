"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { LoadingSpinner } from "@/components/loading-spinner";
import { Loader2 } from "lucide-react";

export default function RiderProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    transportType: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/riders/profile");
      const data = await response.json();
      setProfile(data);
      setFormData({
        transportType: data.transportType || "",
      });
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    try {
      await fetch("/api/riders/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to update profile:", error);
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
      <h1 className="text-3xl font-bold mb-6">Rider Profile</h1>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {success && (
              <div className="bg-green-50 text-green-600 p-3 rounded-md text-sm">
                Profile updated successfully!
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={profile?.user?.name || ""} disabled />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={profile?.user?.email || ""} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={profile?.user?.phone || ""} disabled />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="transportType">Transport Type *</Label>
              <Select
                id="transportType"
                value={formData.transportType}
                onChange={(e) =>
                  setFormData({ ...formData, transportType: e.target.value })
                }
                required
              >
                <option value="">Select transport type</option>
                <option value="Motorcycle">Motorcycle</option>
                <option value="Bicycle">Bicycle</option>
                <option value="Car">Car</option>
                <option value="Scooter">Scooter</option>
              </Select>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Account Status:</strong> {profile?.user?.status}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Verification Status:</strong>{" "}
                {profile?.verified ? "Verified ✓" : "Pending Review"}
              </p>
            </div>

            <Button type="submit" disabled={saving} className="w-full">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
