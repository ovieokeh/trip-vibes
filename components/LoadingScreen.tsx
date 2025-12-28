import { Loader2, MapPin, Search, Clock, Sparkles } from "lucide-react";

interface LoadingScreenProps {
  message: string;
  step?: string;
}

export default function LoadingScreen({ message, step }: LoadingScreenProps) {
  // Determine icon based on message content (simple heuristic)
  let Icon = Loader2;
  if (message.includes("Scouting") || message.includes("Search")) Icon = Search;
  if (message.includes("Verifying") || message.includes("hours")) Icon = Clock;
  if (message.includes("Crafting") || message.includes("AI")) Icon = Sparkles;
  if (message.includes("vibes")) Icon = MapPin;

  // Calculate progress index
  const steps = ["init", "engine", "enrich", "finalize", "done"];
  const currentStepIdx = steps.indexOf(step || "init");

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 p-8 max-w-lg mx-auto text-center">
      <div className="relative">
        <div className="absolute inset-0 animate-ping opacity-20 rounded-full bg-primary blur-xl"></div>
        <div className="relative bg-base-100 p-6 rounded-full shadow-2xl border border-base-200">
          <Icon className="w-12 h-12 text-primary animate-spin" />
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl  bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Building Your Trip
        </h2>
        <p className="text-lg font-medium opacity-80 min-h-[3rem] transition-all duration-300">{message}</p>
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
        Step {Math.max(1, currentStepIdx + 1)} of 4
      </div>
    </div>
  );
}
