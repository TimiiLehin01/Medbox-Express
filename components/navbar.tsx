"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { ShoppingBag, User, LogOut, Menu } from "lucide-react";
import { useState, useEffect } from "react";

export function Navbar() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch current user from server (this reads the cookies)
    fetchCurrentUser();
  }, []); // Runs on mount and whenever the component re-renders after navigation

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch("/api/auth/me");

      if (response.ok) {
        const data = await response.json();
        setUserName(data.name || data.email);
        setUserRole(data.role);
        setIsAuthenticated(true);

        // Optional: Update localStorage for consistency
        localStorage.setItem("user-name", data.name || data.email);
        localStorage.setItem("user-role", data.role);
      } else {
        // Not authenticated
        setIsAuthenticated(false);
        setUserName("");
        setUserRole("");

        // Clear localStorage
        localStorage.removeItem("user-name");
        localStorage.removeItem("user-role");
      }
    } catch (error) {
      console.error("Failed to fetch current user:", error);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    // Clear auth data
    localStorage.removeItem("user-name");
    localStorage.removeItem("user-role");

    // Clear cookies by calling signout endpoint
    fetch("/api/auth/signout", { method: "POST" })
      .then(() => {
        setIsAuthenticated(false);
        setUserName("");
        setUserRole("");
        router.push("/");
      })
      .catch((error) => {
        console.error("Signout error:", error);
        // Still redirect even if there's an error
        router.push("/");
      });
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link href="/" className="flex items-center space-x-2">
            <ShoppingBag className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">
              MedBox Express
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {loading ? (
              <span className="text-sm text-gray-400">Loading...</span>
            ) : isAuthenticated ? (
              <>
                <span className="text-sm text-gray-600">
                  Welcome, {userName}
                </span>
                <Link href={`/${userRole.toLowerCase()}`}>
                  <Button variant="ghost" size="sm">
                    <User className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth/signin">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="sm">Get Started</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2">
            {isAuthenticated ? (
              <>
                <Link
                  href={`/${userRole.toLowerCase()}`}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleSignOut}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/signin"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
