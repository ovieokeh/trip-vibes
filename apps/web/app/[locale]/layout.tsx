import type { Metadata, Viewport } from "next";
import "../globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/components/AuthProvider";

import { getSavedItinerariesAction } from "@/lib/db-actions";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";

// export const dynamic = "force-dynamic";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: {
    template: "%s | TripVibes",
    default: "TripVibes – AI-Powered Travel Itineraries Based on Your Vibe",
  },
  description:
    "Swipe through aesthetic cards to build your ideal trip. TripVibes creates smart, location-aware itineraries personalized to your taste and travel style.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  openGraph: {
    siteName: "TripVibes",
    locale: "en_US",
    type: "website",
    title: "TripVibes – AI-Powered Travel Itineraries Based on Your Vibe",
    description:
      "Swipe through aesthetic cards to build your ideal trip. TripVibes creates smart, location-aware itineraries personalized to your taste and travel style.",
  },
  twitter: {
    card: "summary_large_image",
    title: "TripVibes – AI-Powered Travel Itineraries Based on Your Vibe",
    description:
      "Swipe through aesthetic cards to build your ideal trip. TripVibes creates smart, location-aware itineraries personalized to your taste and travel style.",
    creator: "@tripvibes",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className="font-sans antialiased min-h-screen flex flex-col bg-base-100 text-base-content">
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            <Navbar />
            <main className="container mx-auto max-w-2xl md:px-4 py-8 flex-grow">{children}</main>
            <Footer />
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
