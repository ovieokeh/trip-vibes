import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "TripVibes - Curated Travel Itineraries",
  description: "Convert aesthetic preferences into a geographically optimized itinerary.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="lofi">
      <body className="font-sans antialiased min-h-screen bg-base-100 text-base-content pb-24">
        <Navbar />
        <main className="container mx-auto max-w-2xl px-4 py-8">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
