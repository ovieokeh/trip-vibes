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

export default function SetupForm() {
  const t = useTranslations("SetupForm");
  const router = useRouter();
  const [showDeckModal, setShowDeckModal] = useState(false);
  const [hasDecks, setHasDecks] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<any | null>(null);

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
      setPendingFormData(data);
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
      <div className="card w-full bg-base-100/50 backdrop-blur-sm">
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
              render={({ field }) => (
                <div className="join w-full grid grid-cols-3">
                  {(["low", "medium", "high"] as const).map((b) => (
                    <input
                      key={b}
                      className="join-item btn btn-outline btn-sm font-bold border-base-300 data-[checked=true]:btn-active data-[checked=true]:btn-primary"
                      type="radio"
                      name="budget"
                      aria-label={b === "low" ? "$" : b === "medium" ? "$$" : "$$$"}
                      data-checked={field.value === b}
                      checked={field.value === b}
                      onChange={() => field.onChange(b)}
                    />
                  ))}
                </div>
              )}
            />
          </div>

          <button type="submit" className="btn btn-primary btn-lg w-full mt-2 tracking-tight text-xl shadow-sm">
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
