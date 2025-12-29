import { Link } from "@/i18n/routing";
import { getItineraryByIdAction, getCityById } from "@/lib/db-actions";
import { ChevronLeft } from "lucide-react";
import TripControls from "./TripControls";
import ItineraryEditor from "@/components/ItineraryEditor";
import ItineraryActions from "@/components/ItineraryActions";
import { Metadata } from "next";
import { getTranslations, getFormatter } from "next-intl/server";

type Props = {
  params: Promise<{ id: string; locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, locale } = await params;
  const itinerary = await getItineraryByIdAction(id);
  const t = await getTranslations({ locale, namespace: "SavedTrips" });

  if (!itinerary) {
    return {
      title: t("notFound"),
    };
  }

  const city = await getCityById(itinerary.cityId);
  const cityName = city?.name || "Unknown City";
  const title = itinerary.name || t("metadata.title", { city: cityName });
  const description = t("metadata.description", { city: cityName });

  const startDate = itinerary.startDate
    ? new Date(itinerary.startDate).toLocaleDateString(locale, { month: "short", day: "numeric" })
    : "";

  // Try to find a photo reference from the first activity
  const firstActivityWithImage = itinerary.days.find((day) =>
    day.activities.length > 0 ? day.activities[0].vibe?.photos?.[0] : null
  );
  const firstImage = firstActivityWithImage?.activities[0].vibe?.photos?.[0].url;

  let ogImageUrl = "";
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Check if we have a Google Photo Ref in the URL
  let photoRef = "";
  if (firstImage && firstImage.includes("ref=")) {
    try {
      const urlObj = new URL(firstImage, "http://localhost"); // ensure valid URL parsing
      photoRef = urlObj.searchParams.get("ref") || "";
    } catch (e) {
      // ignore parsing error
    }
  }

  console.log({
    photoRef,
    firstImage,
    itineraryDays: itinerary.days[0].activities[0],
  });

  // Construct the Dynamic OG Image URL
  const searchParams = new URLSearchParams();
  searchParams.set("title", title);
  searchParams.set("city", cityName);
  if (startDate) searchParams.set("date", startDate);
  if (photoRef) searchParams.set("ref", photoRef);

  ogImageUrl = `${baseUrl}/api/og?${searchParams.toString()}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      url: `${baseUrl}/saved/${id}`,
      siteName: "TripVibes",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function SavedTripDetailsPage({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id, locale } = await params;
  const itinerary = await getItineraryByIdAction(id);
  const city = await getCityById(itinerary?.cityId || "");
  const cityName = city?.name || itinerary?.cityId || "Unknown City";

  const t = await getTranslations("SavedTrips");
  const format = await getFormatter();

  if (!itinerary) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <h2 className="text-2xl font-bold">{t("notFound")}</h2>
        <Link href="/saved" className="btn btn-primary">
          {t("backToSaved")}
        </Link>
      </div>
    );
  }

  // Format dates
  const startDate = itinerary.startDate
    ? format.dateTime(new Date(itinerary.startDate), { month: "short", day: "numeric" })
    : "";
  const endDate = itinerary.endDate
    ? format.dateTime(new Date(itinerary.endDate), { month: "short", day: "numeric" })
    : "";
  const dateRange = startDate && endDate ? `${startDate} - ${endDate}` : "";

  return (
    <div className="max-w-xl mx-auto pb-12 px-4">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/saved" className="btn btn-ghost btn-circle btn-sm">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-sm font-bold opacity-70 uppercase tracking-widest">{t("savedTripHeader")}</h1>
        </div>
        <TripControls
          id={id}
          initialName={itinerary.name || `${cityName} Trip`}
          itinerary={itinerary}
          cityName={cityName}
        />
      </div>

      <div className="text-center mb-8">
        <h2 className="text-3xl  mb-1">{itinerary.name || t("metadata.title", { city: cityName })}</h2>
        <p className="opacity-70 font-medium">
          {cityName}
          {dateRange ? ` • ${dateRange}` : ""}
        </p>
      </div>

      <ItineraryEditor initialItinerary={itinerary} cityId={itinerary.cityId} isSavedMode={true} />

      <div className="mt-8 pb-8">
        <ItineraryActions itinerary={itinerary} cityName={cityName} />
      </div>
    </div>
  );
}
