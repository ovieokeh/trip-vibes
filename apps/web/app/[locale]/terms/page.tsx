import { useTranslations } from "next-intl";

export default function TermsPage() {
  const t = useTranslations("Legal.terms");

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">{t("title")}</h1>
      <p className="text-sm text-base-content/50 mb-8">{t("lastUpdated")}</p>

      <div className="prose prose-sm md:prose-base dark:prose-invert">
        <p>{t("content")}</p>

        <h2 className="text-xl font-bold mt-8 mb-4">1. Acceptance of Terms</h2>
        <p>
          By accessing or using TripVibes, you agree to be bound by these Terms of Service. If you do not agree to these
          terms, please do not use the application.
        </p>

        <h2 className="text-xl font-bold mt-8 mb-4">2. Use License</h2>
        <p>
          TripVibes grants you a personal, non-exclusive, non-transferable license to use the application for personal,
          non-commercial purposes.
        </p>

        <h2 className="text-xl font-bold mt-8 mb-4">3. Itinerary Accuracy</h2>
        <p>
          While we strive for accuracy, travel itineraries are generated using AI and third-party data. TripVibes is not
          responsible for errors, venue closures, or changes in transit conditions. Always verify details locally.
        </p>

        <h2 className="text-xl font-bold mt-8 mb-4">4. Account Responsibility</h2>
        <p>
          If you create an account, you are responsible for maintaining the confidentiality of your credentials and for
          all activities that occur under your account.
        </p>
      </div>
    </div>
  );
}
