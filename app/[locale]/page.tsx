import SetupForm from "@/components/SetupForm";
import { useTranslations } from "next-intl";

export default function Home() {
  const t = useTranslations("Home");

  return (
    <div className="flex flex-col gap-8 items-center p-4 bg-base-100 selection:bg-primary selection:text-primary-content min-h-full">
      <div className="text-center space-y-6 z-10 max-w-2xl mx-auto">
        <h1 className="w-full flex justify-center gap-2 text-2xl tracking-tighter leading-none">
          {t("title")}
          <br />
          <span className="text-primary selection:text-base-content">{t("subtitle")}</span>
        </h1>
        <p className="text-lg md:text-xl text-base-content/70 font-medium max-w-lg mx-auto">{t("description")}</p>
      </div>

      <div className="w-full max-w-xl z-10">
        <SetupForm />
      </div>
    </div>
  );
}
