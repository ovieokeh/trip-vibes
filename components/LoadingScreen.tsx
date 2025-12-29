import { Loader2, MapPin, Search, Clock, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

interface LoadingScreenProps {
  message: string;
  step?: string;
}

export default function LoadingScreen({ message, step }: LoadingScreenProps) {
  const t = useTranslations("Loading");

  // Determine icon based on step (language agnostic)
  let Icon = Loader2;
  switch (step) {
    case "init":
      Icon = MapPin;
      break;
    case "engine":
      Icon = Search;
      break;
    case "enrich":
      Icon = Sparkles;
      break;
    case "finalize":
      Icon = Clock;
      break;
  }

  // Calculate progress index
  const steps = ["init", "engine", "enrich", "finalize", "done"];
  const currentStepIdx = steps.indexOf(step || "init");

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 p-8 max-w-lg mx-auto text-center">
      <div className="relative">
        <div className="absolute inset-0 animate-pulse opacity-30 rounded-full bg-primary blur-2xl scale-150"></div>
        <div className="relative bg-base-100 p-6 rounded-full shadow-2xl border border-base-200 animate-float">
          <Icon className="w-12 h-12 text-primary" />
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-2xl font-bold text-base-content">{t("buildingTrip")}</h2>
        <p className="text-lg font-medium text-base-content/60 min-h-[3rem] transition-all duration-500">{message}</p>
      </div>

      <div className="flex gap-2 mt-4 justify-center">
        {/* Visual progress indicators */}
        {[0, 1, 2, 3].map((idx) => (
          <div
            key={idx}
            className={`h-2 rounded-full transition-all duration-500 ${
              idx <= currentStepIdx ? "w-12 bg-primary" : "w-2 bg-base-300"
            }`}
          />
        ))}
      </div>

      <div className="text-xs opacity-80 font-mono uppercase tracking-widest mt-2">
        {t("step", { current: Math.max(1, currentStepIdx + 1), total: 4 })}
      </div>
    </div>
  );
}
