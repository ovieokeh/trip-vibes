import { useTranslations } from "next-intl";

export default function Footer() {
  const t = useTranslations("Footer");
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full py-8 px-4 mt-auto border-t border-base-200">
      <div className="container mx-auto max-w-2xl flex flex-col items-center gap-2 text-sm text-base-content/60">
        <p className="font-semibold text-base-content/80">{t("tagline")}</p>
        <p>{t("builtBy")}</p>
        <p>
          © {currentYear} {t("rights")}
        </p>
      </div>
    </footer>
  );
}
