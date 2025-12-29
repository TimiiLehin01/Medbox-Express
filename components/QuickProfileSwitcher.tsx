"use client";

import { useState, useEffect } from "react";
import { Users, X, Loader2 } from "lucide-react";

interface Profile {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function QuickProfileSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch available profiles when modal opens
  useEffect(() => {
    if (isOpen && profiles.length === 0) {
      fetchProfiles();
    }
  }, [isOpen]);

  const fetchProfiles = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/dev/get-profiles");
      if (res.ok) {
        const data = await res.json();
        setProfiles(data.profiles);
      } else {
        setError("Failed to fetch profiles");
      }
    } catch (err) {
      setError("Error loading profiles");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const switchProfile = async (profile: Profile) => {
    setSwitching(true);
    try {
      const res = await fetch("/api/dev/switch-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: profile.email }),
      });

      if (res.ok) {
        // Redirect based on role
        const dashboardPaths: Record<string, string> = {
          ADMIN: "/admin",
          PHARMACY: "/pharmacy",
          RIDER: "/rider",
          CONSUMER: "/consumer",
        };
        window.location.href = dashboardPaths[profile.role] || "/";
      } else {
        const data = await res.json();
        alert(data.error || "Failed to switch profile");
      }
    } catch (error) {
      alert("Error switching profile");
      console.error(error);
    } finally {
      setSwitching(false);
    }
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      ADMIN: "bg-purple-600",
      PHARMACY: "bg-blue-600",
      RIDER: "bg-green-600",
      CONSUMER: "bg-orange-600",
    };
    return colors[role] || "bg-gray-600";
  };

  // Show if in development OR if NEXT_PUBLIC_ENABLE_DEMO_MODE is true
  const isDemoMode = process.env.NEXT_PUBLIC_ENABLE_DEMO_MODE === "true";
  const isDevelopment = process.env.NODE_ENV === "development";

  if (!isDevelopment && !isDemoMode) {
    return null;
  }

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110"
        title="Quick Profile Switcher (Demo Mode)"
      >
        <Users className="h-6 w-6" />
      </button>

      {/* Switcher Panel */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b">
              <div>
                <h2 className="text-2xl font-bold">Switch Account</h2>
                <p className="text-sm text-gray-600">
                  Select any registered user to switch to
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  <span className="ml-3 text-gray-600">
                    Loading profiles...
                  </span>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <p className="text-red-600 mb-4">{error}</p>
                  <button
                    onClick={fetchProfiles}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Retry
                  </button>
                </div>
              ) : profiles.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">No profiles found in database</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Create some user accounts first
                  </p>
                </div>
              ) : (
                <>
                  {/* Group by Role */}
                  {["ADMIN", "PHARMACY", "RIDER", "CONSUMER"].map((role) => {
                    const roleProfiles = profiles.filter(
                      (p) => p.role === role
                    );
                    if (roleProfiles.length === 0) return null;

                    return (
                      <div key={role} className="mb-6">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                          {role} ({roleProfiles.length})
                        </h3>
                        <div className="space-y-2">
                          {roleProfiles.map((profile) => (
                            <button
                              key={profile.id}
                              onClick={() => switchProfile(profile)}
                              disabled={switching}
                              className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 border-2 border-gray-100 hover:border-blue-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <div
                                className={`w-12 h-12 ${getRoleColor(
                                  profile.role
                                )} rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0`}
                              >
                                {profile.name?.[0]?.toUpperCase() ||
                                  profile.email[0].toUpperCase()}
                              </div>
                              <div className="flex-1 text-left">
                                <p className="font-semibold">
                                  {profile.name || "Unnamed User"}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {profile.email}
                                </p>
                              </div>
                              <div className="text-2xl">→</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            <div className="p-4 bg-blue-50 border-t">
              <p className="text-xs text-blue-800 text-center">
                💡 All registered users from your database • Demo Mode
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
