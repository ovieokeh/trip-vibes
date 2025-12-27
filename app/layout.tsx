import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

import { getSavedItinerariesAction } from "@/lib/db-actions";

export const dynamic = "force-dynamic";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: {
    template: "%s | TripVibes",
    default: "TripVibes - Curated Travel Itineraries",
  },
  description: "Convert aesthetic preferences into a geographically optimized itinerary.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  openGraph: {
    siteName: "TripVibes",
    locale: "en_US",
    type: "website",
    title: "TripVibes - Curated Travel Itineraries",
    description: "Convert aesthetic preferences into a geographically optimized itinerary.",
  },
  twitter: {
    card: "summary_large_image",
    title: "TripVibes - Curated Travel Itineraries",
    description: "Convert aesthetic preferences into a geographically optimized itinerary.",
    creator: "@tripvibes",
  },
  icons: {
    icon: "/favicon.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const saved = await getSavedItinerariesAction();

  return (
    <html lang="en" data-theme="autumn">
      <body className="font-sans antialiased min-h-screen flex flex-col bg-base-100 text-base-content">
        <Navbar savedCount={saved.length} />
        <main className="container mx-auto max-w-2xl md:px-4 py-8 flex-grow">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
