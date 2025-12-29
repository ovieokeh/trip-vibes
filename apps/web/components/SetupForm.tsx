"use client";
import { useState, useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "@/i18n/routing";
import { useStore } from "@/store/useStore";
import { SmartCitySelect } from "./SmartCitySelect";
import { DateRangePicker } from "./DateRangePicker";
import { DeckSelector } from "./DeckSelector";
import { getVibeDecksAction, VibeDeck } from "@/lib/db-actions";
import { useTranslations } from "next-intl";
import { Coins, Wallet, Gem, Sparkles } from "lucide-react";

export default function SetupForm() {
  const t = useTranslations("SetupForm");
  const router = useRouter();
  const [showDeckModal, setShowDeckModal] = useState(false);
  const [hasDecks, setHasDecks] = useState(false);

  const setupSchema = useMemo(
    () =>
      z.object({
        cityId: z.string().min(1, t("errors.cityRequired")),
        startDate: z.string().min(1, t("errors.startDateRequired")),
        endDate: z.string().min(1, t("errors.endDateRequired")),
        budget: z.enum(["low", "medium", "high"]),
      }),
    [t]
  );

  type SetupFormData = z.infer<typeof setupSchema>;

  const {
    cityId: storeCityId,
    startDate: storeStart,
    endDate: storeEnd,
    budget: storeBudget,
    setCity,
    setDates,
    setBudget,
    loadFromDeck,
    setActiveDeck,
    clearVibes,
  } = useStore();

  // Check if user has any saved decks
  useEffect(() => {
    getVibeDecksAction().then((decks) => {
      setHasDecks(decks.length > 0);
    });
  }, []);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SetupFormData>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      cityId: storeCityId || "",
      startDate: storeStart || "",
      endDate: storeEnd || "",
      budget: storeBudget || "medium",
    },
  });

  const onSubmit = (data: SetupFormData) => {
    setCity(data.cityId);
    setDates(data.startDate, data.endDate);
    setBudget(data.budget);

    // If user has saved decks, show selector; otherwise go straight to vibes
    if (hasDecks) {
      setShowDeckModal(true);
    } else {
      clearVibes();
      router.push("/vibes");
    }
  };

  const handleDeckSelect = (deck: VibeDeck) => {
    loadFromDeck(deck.likedVibes, deck.vibeProfile);
    setActiveDeck(deck.id);
    setShowDeckModal(false);
    router.push("/itinerary");
  };

  const handleSwipeFresh = () => {
    clearVibes();
    setShowDeckModal(false);
    router.push("/vibes");
  };

  return (
    <>
      <div className="card w-full border border-base-200/50">
        <form onSubmit={handleSubmit(onSubmit)} className="card-body gap-5">
          <div className="form-control w-full">
            <label className="label pt-0">
              <span className="label-text font-bold uppercase tracking-wider text-xs opacity-80">
                {t("labels.destination")}
              </span>
            </label>
            <Controller
              name="cityId"
              control={control}
              render={({ field }) => <SmartCitySelect selectedCityId={field.value} onSelect={field.onChange} />}
            />
            {errors.cityId && <span className="text-error text-xs font-bold mt-1.5">{errors.cityId.message}</span>}
          </div>

          <div className="form-control w-full">
            <label className="label pt-0">
              <span className="label-text font-bold uppercase tracking-wider text-xs opacity-80">
                {t("labels.dates")}
              </span>
            </label>
            <Controller
              name="startDate"
              control={control}
              render={({ field: startField }) => (
                <Controller
                  name="endDate"
                  control={control}
                  render={({ field: endField }) => (
                    <DateRangePicker
                      startDate={startField.value}
                      endDate={endField.value}
                      onChange={(start, end) => {
                        startField.onChange(start);
                        endField.onChange(end);
                      }}
                    />
                  )}
                />
              )}
            />
            {(errors.startDate || errors.endDate) && (
              <span className="text-error text-xs font-bold mt-1.5">
                {errors.startDate?.message || errors.endDate?.message}
              </span>
            )}
          </div>

          <div className="form-control">
            <label className="label pt-0">
              <span className="label-text font-bold uppercase tracking-wider text-xs opacity-80">
                {t("labels.budget")}
              </span>
            </label>
            <Controller
              name="budget"
              control={control}
              render={({ field }) => {
                const budgetOptions = [
                  { value: "low" as const, label: "$", icon: Coins, desc: "Budget" },
                  { value: "medium" as const, label: "$$", icon: Wallet, desc: "Balanced" },
                  { value: "high" as const, label: "$$$", icon: Gem, desc: "Premium" },
                ];
                return (
                  <div className="grid grid-cols-3 gap-2">
                    {budgetOptions.map((opt) => {
                      const isSelected = field.value === opt.value;
                      const Icon = opt.icon;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => field.onChange(opt.value)}
                          className={`relative flex flex-col items-center gap-1 py-3 px-2 rounded-xl border-2 transition-all duration-200 ${
                            isSelected
                              ? "border-primary bg-primary/10 shadow-md scale-[1.02]"
                              : "border-base-300 bg-base-100 hover:border-primary/50 hover:bg-base-200/50"
                          }`}
                        >
                          <Icon
                            className={`w-5 h-5 transition-colors ${
                              isSelected ? "text-primary" : "text-base-content/50"
                            }`}
                          />
                          <span
                            className={`text-lg font-bold transition-colors ${
                              isSelected ? "text-primary" : "text-base-content"
                            }`}
                          >
                            {opt.label}
                          </span>
                          <span
                            className={`text-[10px] uppercase tracking-wider transition-colors ${
                              isSelected ? "text-primary/80" : "text-base-content/40"
                            }`}
                          >
                            {opt.desc}
                          </span>
                          {isSelected && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center animate-scale-in">
                              <Sparkles className="w-2.5 h-2.5 text-primary-content" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              }}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg w-full mt-4 tracking-tight text-xl shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
          >
            {hasDecks ? t("buttons.continue") : t("buttons.start")}
          </button>
        </form>
      </div>

      {/* Deck Selector Modal */}
      {showDeckModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md">
            <button
              className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
              onClick={() => setShowDeckModal(false)}
            >
              ✕
            </button>
            <DeckSelector onSelect={handleDeckSelect} onSwipeFresh={handleSwipeFresh} />
          </div>
          <div className="modal-backdrop bg-black/50" onClick={() => setShowDeckModal(false)}></div>
        </div>
      )}
    </>
  );
}
