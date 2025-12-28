"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/routing";
import { useStore } from "@/store/useStore";
import { saveItineraryAction, getActivitySuggestionsAction } from "@/lib/db-actions";
import { Itinerary, TripActivity, Vibe } from "@/lib/types";
import ItineraryDay from "@/components/ItineraryDay";
import AlertModal from "@/components/AlertModal";
import AddActivityModal from "@/components/AddActivityModal";
import LoadingScreen from "@/components/LoadingScreen";
import ItineraryActions from "@/components/ItineraryActions";
import { getTransitNote } from "@/lib/geo";
import { useTranslations } from "next-intl";

// Note: Metadata cannot be exported from a "use client" component.
// Since this page relies on client-side state (Zustand) for the unsaved itinerary,
// we cannot generate server-side metadata for the specific city here.
// The saved page (app/saved/[id]) handles the shareable metadata.

export default function ItineraryPage() {
  const t = useTranslations("Itinerary");
  const router = useRouter();
  const prefs = useStore();
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Add Activity Modal State
  const [addModal, setAddModal] = useState<{
    isOpen: boolean;
    dayId: string | null;
    afterIndex: number | null; // Insert after this index, null = append to end
    suggestions: Vibe[];
    isLoading: boolean;
  }>({
    isOpen: false,
    dayId: null,
    afterIndex: null,
    suggestions: [],
    isLoading: false,
  });

  const [alert, setAlert] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "error" | "warning" | "success" | "info";
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });

  // Loading State
  const [loadingMessage, setLoadingMessage] = useState("Initializing The Architect...");
  const [currentStep, setCurrentStep] = useState("init");

  useEffect(() => {
    // Basic protection to ensure we have a city selected
    if (!prefs.cityId) {
      router.push("/");
      return;
    }

    // Generate Itinerary using Streaming API
    async function generate() {
      try {
        const encodedPrefs = encodeURIComponent(JSON.stringify(prefs));
        const response = await fetch(`/api/itinerary/stream?prefs=${encodedPrefs}`);

        if (!response.ok) throw new Error("Generation failed");
        if (!response.body) throw new Error("No response body");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");

          // Keep the last part in the buffer as it might be incomplete
          buffer = parts.pop() || "";

          for (const part of parts) {
            if (part.startsWith("data: ")) {
              try {
                const event = JSON.parse(part.slice(6));

                if (event.type === "progress") {
                  setLoadingMessage(event.message);
                  if (event.step) setCurrentStep(event.step);
                } else if (event.type === "result") {
                  setItinerary(event.data);
                  // Reset forceRefresh after successful generation
                  // Defer to next tick to avoid triggering re-render during current render
                  setTimeout(() => prefs.setForceRefresh(false), 0);
                } else if (event.type === "error") {
                  setAlert({
                    isOpen: true,
                    title: t("errors.generation"),
                    message: event.message,
                    type: "error",
                  });
                }
              } catch (_e) {
                console.error("Error parsing stream chunk", _e);
              }
            }
          }
        }
      } catch (error) {
        console.error("Failed to generate itinerary:", error);
        setAlert({
          isOpen: true,
          title: t("errors.generationFailed"),
          message: t("errors.generationFailedMessage"),
          type: "error",
        });
      }
    }

    // Only run if we don't have an itinerary yet
    if (!itinerary) {
      generate();
    }
  }, [prefs, router, itinerary, t]); // Added itinerary to deps to prevent re-run if set

  if (!itinerary) {
    return <LoadingScreen message={loadingMessage} step={currentStep} />;
  }

  // Minimal client-side check (simplified compared to server)
  const checkIsOpen = (vibe: Vibe, dateStr: string, startTime: string) => {
    if (!vibe.openingHours?.periods) return true;
    const date = new Date(dateStr);
    const dayIndex = date.getDay();
    const startInt = parseInt(startTime.replace(":", ""));

    // Check if there is ANY period open today covering start time
    // This is a simplified check
    const periods = vibe.openingHours.periods;
    const isOpen = periods.some((period) => {
      if (period.open.day !== dayIndex) return false;
      const openTime = parseInt(period.open.time);

      if (!period.close) return true; // 24h?
      if (period.close.day !== period.open.day) return startInt >= openTime; // Closes next day

      const closeTime = parseInt(period.close.time);
      return startInt >= openTime && startInt < closeTime;
    });

    return isOpen;
  };

  const handleRemove = (dayId: string, activityId: string) => {
    if (!itinerary) return;
    const newDays = itinerary.days.map((day) => {
      if (day.id !== dayId) return day;

      // Remove and recalc transit for the one after?
      // Simplified: Just remove. If there is a gap, transit notes might be slightly off (from prev-prev),
      // but usually the next one's transit note was "from the deleted one".
      // Ideally we should update the transit note of the activity that FOLLOWED the deleted one.

      const filtered = day.activities.filter((act) => act.id !== activityId);

      // TODO: Recalc transit for gaps? Leaving as is for minimal scope,
      // but if we remove item i, item i+1's transit note should be from i-1.

      return {
        ...day,
        activities: filtered,
      };
    });
    setItinerary({ ...itinerary, days: newDays });
  };

  const handleOpenAddModal = async (dayId: string, afterIndex?: number) => {
    // Open modal immediately with loading state
    setAddModal({
      isOpen: true,
      dayId,
      afterIndex: afterIndex ?? null,
      suggestions: [],
      isLoading: true,
    });

    if (!itinerary) return;

    // Fetch suggestions
    try {
      const suggestions = await getActivitySuggestionsAction(prefs.cityId, itinerary, dayId);
      setAddModal((prev) => ({
        ...prev,
        suggestions,
        isLoading: false,
      }));
    } catch (e) {
      console.error(e);
      setAddModal((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleAddActivity = async (vibe: Vibe) => {
    if (!itinerary || !addModal.dayId) return;

    const dayId = addModal.dayId;
    const afterIndex = addModal.afterIndex;
    const day = itinerary.days.find((d) => d.id === dayId);
    if (!day) return;

    // Determine reference activity for time calculation
    const refIndex = afterIndex !== null ? afterIndex : day.activities.length - 1;
    const refActivity = refIndex >= 0 ? day.activities[refIndex] : null;

    // Calculate start/end times based on reference activity
    let startTime = "12:00";
    let endTime = "13:30";

    if (refActivity) {
      const [h, m] = refActivity.endTime.split(":").map(Number);
      let newH = h + 1;
      let newM = m + 30;
      if (newM >= 60) {
        newH++;
        newM -= 60;
      }
      startTime = `${newH.toString().padStart(2, "0")}:${newM.toString().padStart(2, "0")}`;

      let endH = newH + 1;
      let endM = newM + 30;
      if (endM >= 60) {
        endH++;
        endM -= 60;
      }
      endTime = `${endH.toString().padStart(2, "0")}:${endM.toString().padStart(2, "0")}`;
    }

    // Create Activity
    const newActivity: TripActivity = {
      id: crypto.randomUUID(),
      vibe: vibe,
      startTime,
      endTime,
      note: vibe.description,
      transitNote: "",
    };

    // Calculate transit from previous
    if (refActivity && refActivity.vibe.lat && refActivity.vibe.lng && vibe.lat && vibe.lng) {
      newActivity.transitNote = getTransitNote(refActivity.vibe.lat, refActivity.vibe.lng, vibe.lat, vibe.lng);
    } else if (refIndex < 0) {
      newActivity.transitNote = "Start of day";
    }

    const newDays = itinerary.days.map((d) => {
      if (d.id !== dayId) return d;

      // Insert at the correct position
      const insertIndex = afterIndex !== null ? afterIndex + 1 : d.activities.length;
      const newActivities = [...d.activities.slice(0, insertIndex), newActivity, ...d.activities.slice(insertIndex)];

      return {
        ...d,
        activities: newActivities,
      };
    });

    setItinerary({ ...itinerary, days: newDays });
    setAddModal({ ...addModal, isOpen: false });
  };

  const handleActivityUpdate = (dayId: string, activityId: string, updates: Partial<TripActivity>) => {
    if (!itinerary) return;

    const newDays = itinerary.days.map((day) => {
      if (day.id !== dayId) return day;

      const newActivities = day.activities.map((act) => {
        if (act.id !== activityId) return act;
        return { ...act, ...updates };
      });

      return { ...day, activities: newActivities };
    });

    setItinerary({ ...itinerary, days: newDays });
  };

  return (
    <div className="max-w-xl mx-auto px-4">
      <AlertModal
        isOpen={alert.isOpen}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        onClose={() => setAlert({ ...alert, isOpen: false })}
      />

      <AddActivityModal
        isOpen={addModal.isOpen}
        onClose={() => setAddModal({ ...addModal, isOpen: false })}
        onSelect={handleAddActivity}
        suggestions={addModal.suggestions}
        isLoading={addModal.isLoading}
      />

      <div className="text-center mb-8">
        <h1 className="text-3xl mb-2">{t("title")}</h1>
        <p className="text-base-content/70">{t("budgetOptimized", { budget: prefs.budget })}</p>
      </div>

      <div>
        {itinerary.days.map((day) => (
          <ItineraryDay
            key={day.id}
            day={day}
            onRemove={(actId) => handleRemove(day.id, actId)}
            onAdd={(afterIndex) => handleOpenAddModal(day.id, afterIndex)}
            onUpdate={(actId, updates) => handleActivityUpdate(day.id, actId, updates)}
          />
        ))}
      </div>

      <div className="divider my-8">{t("endOfTrip")}</div>

      <ItineraryActions itinerary={itinerary} cityName={prefs.cityId} />

      <div className="flex justify-center gap-4 pb-8 mt-6">
        <button
          className="btn btn-primary"
          disabled={isSaving}
          onClick={async () => {
            if (!itinerary) return;
            setIsSaving(true);
            try {
              // Persist the current state of the itinerary including edits
              await saveItineraryAction(itinerary.id, itinerary.name, itinerary);
              router.push(`/saved/${itinerary.id}`);
            } catch (e) {
              setAlert({
                isOpen: true,
                title: t("errors.saveFailed"),
                message: t("errors.saveFailedMessage"),
                type: "error",
              });
              setIsSaving(false);
            }
          }}
        >
          {isSaving ? t("saving") : t("saveTrip")}
        </button>

        <button
          className="btn btn-outline"
          onClick={() => {
            prefs.reset();
            router.push("/");
          }}
        >
          {t("startNewTrip")}
        </button>
      </div>
    </div>
  );
}
