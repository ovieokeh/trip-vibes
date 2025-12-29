import SetupForm from "@/components/SetupForm";
import { useTranslations } from "next-intl";
import { Plane, MapPin, Compass, Camera } from "lucide-react";

export const revalidate = 3600; // 1 hour

export default function Home() {
  const t = useTranslations("Home");

  return (
    <div className="flex flex-col gap-8 items-center p-4 bg-base-100 selection:bg-primary selection:text-primary-content min-h-full relative overflow-hidden">
      {/* Decorative floating travel icons */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <Plane className="absolute top-16 left-[10%] w-6 h-6 text-primary/10 animate-float stagger-1 animate-on-load animate-fade-in-up" />
        <MapPin className="absolute top-32 right-[15%] w-5 h-5 text-accent/10 animate-float stagger-2 animate-on-load animate-fade-in-up" />
        <Compass className="absolute bottom-40 left-[8%] w-7 h-7 text-secondary/10 animate-float stagger-3 animate-on-load animate-fade-in-up" />
        <Camera className="absolute bottom-32 right-[12%] w-5 h-5 text-primary/10 animate-float stagger-4 animate-on-load animate-fade-in-up" />
      </div>

      {/* Hero Content */}
      <div className="text-center space-y-4 z-10 max-w-2xl mx-auto pt-8 md:pt-12">
        <h1 className="animate-on-load animate-fade-in-up">
          <span className="block text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-base-content">
            {t("title")}
          </span>
          <span className="block text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-primary mt-1">
            {t("subtitle")}
          </span>
        </h1>
        <p className="text-lg md:text-xl text-base-content/60 font-medium max-w-md mx-auto animate-on-load animate-fade-in-up stagger-2">
          {t("description")}
        </p>
      </div>

      {/* Form Card */}
      <div className="w-full max-w-xl z-10 animate-on-load animate-fade-in-up stagger-3">
        <SetupForm />
      </div>
    </div>
  );
}
