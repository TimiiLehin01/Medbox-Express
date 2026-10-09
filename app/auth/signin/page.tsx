"use client";

import { useState } from "react";
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

  // Reusable login logic for both form and demo buttons
  const executeLogin = async (email: string, password: string) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Invalid email or password");
        setLoading(false);
        return;
      }

      localStorage.setItem("user-name", data.user.name);
      localStorage.setItem("user-role", data.user.role);

      const redirectMap: Record<string, string> = {
        CONSUMER: "/consumer",
        PHARMACY: "/pharmacy",
        RIDER: "/rider",
        ADMIN: "/admin",
      };

      router.push(redirectMap[data.user.role] || "/");
    } catch (error) {
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  };

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
              <Label htmlFor="password">Password</Label>
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

          {/* --- PORTFOLIO DEMO SECTION --- */}
          <div className="w-full pt-6 border-t border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center mb-4">
              Quick Demo Access
            </p>
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() =>
                  executeLogin("admin@medbox.com", "MedboxDemo123!")
                }
                className="flex flex-col items-center justify-center p-2 rounded-lg border border-gray-100 bg-gray-50/50 hover:bg-blue-50 hover:border-blue-200 transition-all group"
              >
                <ShieldCheck className="h-5 w-5 text-gray-400 group-hover:text-blue-600 mb-1" />
                <span className="text-[10px] font-medium text-gray-600">
                  Admin
                </span>
              </button>

              <button
                onClick={() =>
                  executeLogin("miraclebaba07@gmail.com", "Miracle123")
                }
                className="flex flex-col items-center justify-center p-2 rounded-lg border border-gray-100 bg-gray-50/50 hover:bg-emerald-50 hover:border-emerald-200 transition-all group"
              >
                <Stethoscope className="h-5 w-5 text-gray-400 group-hover:text-emerald-600 mb-1" />
                <span className="text-[10px] font-medium text-gray-600">
                  Pharmacy
                </span>
              </button>
              <button
                onClick={() =>
                  executeLogin("obadiahv2@gmail.com", "Obadiah123")
                }
                className="flex flex-col items-center justify-center p-2 rounded-lg border border-gray-100 bg-gray-50/50 hover:bg-orange-50 hover:border-orange-200 transition-all group"
              >
                <ShoppingBag className="h-5 w-5 text-gray-400 group-hover:text-orange-600 mb-1" />
                <span className="text-[10px] font-medium text-gray-600">
                  Consumer
                </span>
              </button>
              <button
                onClick={() =>
                  executeLogin("rider@medbox.com", "MedboxDemo123!")
                }
                className="flex flex-col items-center justify-center p-2 rounded-lg border border-gray-100 bg-gray-50/50 hover:bg-purple-50 hover:border-purple-200 transition-all group"
              >
                <Truck className="h-5 w-5 text-gray-400 group-hover:text-purple-600 mb-1" />
                <span className="text-[10px] font-medium text-gray-600">
                  Rider
                </span>
              </button>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
