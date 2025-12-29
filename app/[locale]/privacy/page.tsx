import { useTranslations } from "next-intl";

export default function PrivacyPage() {
  const t = useTranslations("Legal.privacy");

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">{t("title")}</h1>
      <p className="text-sm text-base-content/50 mb-8">{t("lastUpdated")}</p>

      <div className="prose prose-sm md:prose-base dark:prose-invert">
        <p>{t("content")}</p>

        <h2 className="text-xl font-bold mt-8 mb-4">1. Information We Collect</h2>
        <p>
          TripVibes collects minimal data to provide our service. This includes: - Anonymous usage statistics - Vibe
          preferences (stored in your browser or account if created) - Email address (only if you create an account)
        </p>

        <h2 className="text-xl font-bold mt-8 mb-4">2. How We Use Your Information</h2>
        <p>
          We use your information to: - Generate travel itineraries - Save your preferences for future use - Communicate
          critical updates regarding your account
        </p>

        <h2 className="text-xl font-bold mt-8 mb-4">3. Data Sharing</h2>
        <p>
          We do not sell your personal data. We only share data with third-party services (like Supabase or Foursquare)
          as necessary to provide the core functionality of TripVibes.
        </p>
      </div>
    </div>
  );
}
