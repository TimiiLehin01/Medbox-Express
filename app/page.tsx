"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ShoppingBag,
  Clock,
  MapPin,
  Shield,
  Star,
  TrendingUp,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 to-indigo-700 text-white py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                Your Medicine,{" "}
                <span className="text-yellow-300">Delivered Fast</span>
              </h1>
              <p className="text-xl mb-8 text-blue-100">
                Order prescription and over-the-counter medications from
                verified pharmacies near you. Get them delivered to your
                doorstep within hours.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  asChild
                  className="bg-white text-blue-600 hover:bg-gray-100"
                >
                  <Link href="/auth/signup">Get Started</Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="border-white text-white hover:bg-white hover:text-blue-600"
                >
                  <Link href="/auth/signin">Sign In</Link>
                </Button>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-400 rounded-full blur-3xl opacity-50"></div>
                <ShoppingBag className="relative h-80 w-80 mx-auto text-white opacity-20" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4">
            Why Choose MedBox Express?
          </h2>
          <p className="text-xl text-gray-600 text-center mb-12">
            Fast, reliable, and secure medicine delivery service
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="pt-6">
                <Clock className="h-12 w-12 text-blue-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Fast Delivery</h3>
                <p className="text-gray-600">
                  Get your medications delivered within 2-3 hours. Emergency
                  orders prioritized.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <Shield className="h-12 w-12 text-green-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  Verified Pharmacies
                </h3>
                <p className="text-gray-600">
                  All pharmacies are licensed and verified. Your health is our
                  priority.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <MapPin className="h-12 w-12 text-red-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  Real-Time Tracking
                </h3>
                <p className="text-gray-600">
                  Track your order and delivery rider in real-time on the map.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: "1",
                title: "Search Medicine",
                desc: "Find the medication you need",
              },
              {
                step: "2",
                title: "Select Pharmacy",
                desc: "Choose from nearby pharmacies",
              },
              {
                step: "3",
                title: "Place Order",
                desc: "Add to cart and checkout",
              },
              {
                step: "4",
                title: "Get Delivered",
                desc: "Receive at your doorstep",
              },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Join Section */}
      <section className="py-20 px-4 bg-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-4">For Pharmacies</h3>
                <p className="mb-6 text-blue-100">
                  Expand your reach and increase sales. Connect with customers
                  who need your products.
                </p>
                <Button
                  size="lg"
                  asChild
                  className="bg-white text-blue-600 hover:bg-gray-100"
                >
                  <Link href="/auth/signup">Register Your Pharmacy</Link>
                </Button>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-600 to-green-700 text-white">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-4">For Riders</h3>
                <p className="mb-6 text-green-100">
                  Earn money on your schedule. Flexible delivery jobs available
                  now.
                </p>
                <Button
                  size="lg"
                  asChild
                  className="bg-white text-green-600 hover:bg-gray-100"
                >
                  <Link href="/auth/signup">Become a Rider</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <ShoppingBag className="h-12 w-12 mx-auto mb-4" />
          <p className="text-gray-400 mb-4">
            © 2025 MedBox Express. All rights reserved.
          </p>
          <div className="flex justify-center gap-6 text-sm text-gray-400">
            <Link href="#" className="hover:text-white">
              Privacy Policy
            </Link>
            <Link href="#" className="hover:text-white">
              Terms of Service
            </Link>
            <Link href="#" className="hover:text-white">
              Contact Us
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
