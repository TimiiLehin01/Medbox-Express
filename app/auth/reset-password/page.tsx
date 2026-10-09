"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
import { ShoppingBag, Loader2, CheckCircle2, ArrowLeft } from "lucide-react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "Could not reset your password.");
        return;
      }

      setDone(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const missingToken = !token;

  return (
    <Card className="w-full max-w-md shadow-xl border-none">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
          {done ? (
            <CheckCircle2 className="h-12 w-12 text-emerald-600" />
          ) : (
            <ShoppingBag className="h-12 w-12 text-blue-600" />
          )}
        </div>
        <CardTitle className="text-2xl font-bold">
          {done ? "Password updated" : "Set a new password"}
        </CardTitle>
        <CardDescription>
          {done
            ? "You can now sign in with your new password."
            : missingToken
              ? "This reset link is incomplete. Please request a new one."
              : "Choose a new password for your MedBox Express account."}
        </CardDescription>
      </CardHeader>

      {!done && !missingToken && (
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-100">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm new password</Label>
              <Input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={6}
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
                  Updating...
                </>
              ) : (
                "Update password"
              )}
            </Button>
          </form>
        </CardContent>
      )}

      <CardFooter className="flex-col gap-3 justify-center">
        {(missingToken || error.toLowerCase().includes("expired")) && !done && (
          <Link
            href="/auth/forgot-password"
            className="text-sm text-blue-600 font-medium hover:underline"
          >
            Request a new reset link
          </Link>
        )}
        <Link
          href="/auth/signin"
          className="flex items-center gap-1 text-sm text-blue-600 font-medium hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          {done ? "Go to sign in" : "Back to sign in"}
        </Link>
      </CardFooter>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
