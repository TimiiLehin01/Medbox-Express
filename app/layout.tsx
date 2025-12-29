import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import QuickProfileSwitcher from "@/components/QuickProfileSwitcher";
import "leaflet/dist/leaflet.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MedBox Express - Fast Medicine Delivery",
  description:
    "Order medications from verified pharmacies and get them delivered fast",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
        <QuickProfileSwitcher /> {/* ← ADD THIS */}
      </body>
    </html>
  );
}
