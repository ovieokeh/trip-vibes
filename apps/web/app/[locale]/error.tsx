"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle } from "lucide-react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("Errors.runtime");

  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-20 h-20 bg-error/10 rounded-full flex items-center justify-center mb-6">
        <AlertCircle className="w-10 h-10 text-error" />
      </div>
      <h1 className="text-4xl font-bold mb-4">{t("title")}</h1>
      <p className="text-xl text-base-content/70 mb-8 max-w-md">{t("description")}</p>
      <div className="flex gap-4">
        <button onClick={() => reset()} className="btn btn-primary">
          {t("tryAgain")}
        </button>
        <button onClick={() => (window.location.href = "/")} className="btn btn-ghost">
          Go Home
        </button>
      </div>
    </div>
  );
}
