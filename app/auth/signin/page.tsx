"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  ShoppingBag,
  Loader2,
  ShieldCheck,
  Stethoscope,
  Truck,
} from "lucide-react";

export default function SignInPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [demoRoles, setDemoRoles] = useState<string[]>([]);

  // Ask the server which demo accounts (if any) are enabled. Nothing about
  // the accounts lives in the browser.
  useEffect(() => {
    fetch("/api/auth/demo")
      .then((r) => r.json())
      .then((d) => setDemoRoles(d.enabled ? d.roles : []))
      .catch(() => setDemoRoles([]));
  }, []);

  // Shared post-login handling for the form and the demo buttons
  const finishLogin = (user: { name: string; role: string }) => {
    localStorage.setItem("user-name", user.name);
    localStorage.setItem("user-role", user.role);

    const redirectMap: Record<string, string> = {
      CONSUMER: "/consumer",
      PHARMACY: "/pharmacy",
      RIDER: "/rider",
      ADMIN: "/admin",
    };

    router.push(redirectMap[user.role] || "/");
  };

  const submitLogin = async (url: string, payload: Record<string, string>) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Invalid email or password");
        setLoading(false);
        return;
      }

      finishLogin(data.user);
    } catch {
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  const executeLogin = (email: string, password: string) =>
    submitLogin("/api/auth/signin", { email, password });

  const executeDemo = (role: string) =>
    submitLogin("/api/auth/demo", { role });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeLogin(formData.email, formData.password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-none">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <ShoppingBag className="h-12 w-12 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <CardDescription>
            Sign in to your MedBox Express account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-100">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs text-blue-600 font-medium hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-6">
          <div className="text-sm text-center text-gray-600">
            Don't have an account?{" "}
            <Link
              href="/auth/signup"
              className="text-blue-600 font-medium hover:underline"
            >
              Sign up
            </Link>
          </div>

          {/* --- PORTFOLIO DEMO SECTION (only when the server enables it) --- */}
          {demoRoles.length > 0 && (
            <div className="w-full pt-6 border-t border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center mb-4">
                Quick Demo Access
              </p>
              <div
                className="grid gap-2"
                style={{
                  gridTemplateColumns: `repeat(${demoRoles.length}, minmax(0, 1fr))`,
                }}
              >
                {demoRoles.includes("ADMIN") && (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => executeDemo("ADMIN")}
                    className="flex flex-col items-center justify-center p-2 rounded-lg border border-gray-100 bg-gray-50/50 hover:bg-blue-50 hover:border-blue-200 transition-all group disabled:opacity-50"
                  >
                    <ShieldCheck className="h-5 w-5 text-gray-400 group-hover:text-blue-600 mb-1" />
                    <span className="text-[10px] font-medium text-gray-600">
                      Admin
                    </span>
                  </button>
                )}
                {demoRoles.includes("PHARMACY") && (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => executeDemo("PHARMACY")}
                    className="flex flex-col items-center justify-center p-2 rounded-lg border border-gray-100 bg-gray-50/50 hover:bg-emerald-50 hover:border-emerald-200 transition-all group disabled:opacity-50"
                  >
                    <Stethoscope className="h-5 w-5 text-gray-400 group-hover:text-emerald-600 mb-1" />
                    <span className="text-[10px] font-medium text-gray-600">
                      Pharmacy
                    </span>
                  </button>
                )}
                {demoRoles.includes("CONSUMER") && (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => executeDemo("CONSUMER")}
                    className="flex flex-col items-center justify-center p-2 rounded-lg border border-gray-100 bg-gray-50/50 hover:bg-orange-50 hover:border-orange-200 transition-all group disabled:opacity-50"
                  >
                    <ShoppingBag className="h-5 w-5 text-gray-400 group-hover:text-orange-600 mb-1" />
                    <span className="text-[10px] font-medium text-gray-600">
                      Consumer
                    </span>
                  </button>
                )}
                {demoRoles.includes("RIDER") && (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => executeDemo("RIDER")}
                    className="flex flex-col items-center justify-center p-2 rounded-lg border border-gray-100 bg-gray-50/50 hover:bg-purple-50 hover:border-purple-200 transition-all group disabled:opacity-50"
                  >
                    <Truck className="h-5 w-5 text-gray-400 group-hover:text-purple-600 mb-1" />
                    <span className="text-[10px] font-medium text-gray-600">
                      Rider
                    </span>
                  </button>
                )}
              </div>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
