import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Sparkles } from "lucide-react";

export default function Footer() {
  const t = useTranslations("Footer");
  const tl = useTranslations("Legal");
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full mt-auto relative">
      {/* Subtle wave separator */}
      <div className="h-px bg-gradient-to-r from-transparent via-base-300 to-transparent"></div>

      <div className="py-10 px-4 bg-base-100">
        <div className="container mx-auto max-w-2xl flex flex-col items-center gap-3 text-sm">
          {/* Brand tagline */}
          <div className="flex items-center gap-2 text-base-content font-semibold">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>{t("tagline")}</span>
          </div>

          <p className="text-base-content/50">{t("builtBy")}</p>

          {/* Legal links */}
          <div className="flex gap-6 mt-2">
            <Link href="/privacy" className="text-base-content/40 hover:text-primary transition-colors duration-200">
              {tl("privacy.title")}
            </Link>
            <Link href="/terms" className="text-base-content/40 hover:text-primary transition-colors duration-200">
              {tl("terms.title")}
            </Link>
          </div>

          <p className="mt-3 text-xs text-base-content/30">
            © {currentYear} {t("rights")}
          </p>
        </div>
      </div>
    </footer>
  );
}
