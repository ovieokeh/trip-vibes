import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  const t = useTranslations("Errors.notFound");

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-20 h-20 bg-base-200 rounded-full flex items-center justify-center mb-6">
        <FileQuestion className="w-10 h-10 text-base-content/50" />
      </div>
      <h1 className="text-4xl font-bold mb-4">{t("title")}</h1>
      <p className="text-xl text-base-content/70 mb-8 max-w-md">{t("description")}</p>
      <Link href="/" className="btn btn-primary">
        {t("backHome")}
      </Link>
    </div>
  );
}
