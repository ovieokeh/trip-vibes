"use client";

import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { Itinerary, TripActivity, Vibe } from "@/lib/types";
import { getActivitySuggestionsAction, saveItineraryAction } from "@/lib/db-actions";
import ItineraryDay from "@/components/ItineraryDay";
import AlertModal from "@/components/AlertModal";
import AddActivityModal from "@/components/AddActivityModal";
import MoveActivityModal from "@/components/MoveActivityModal";
import { AnimatePresence } from "framer-motion";

// Import shared utilities - single source of truth for activity operations
import {
  isPlaceOpenAt,
  appendActivityToDay,
  moveActivityBetweenDays,
  swapActivityAlternative,
  recalculateTransitForActivities,
} from "@/lib/activity";

interface ItineraryEditorProps {
  initialItinerary: Itinerary;
  cityId: string; // Needed for suggestions
  isSavedMode?: boolean; // If true, we might show different save buttons or auto-save
}

export default function ItineraryEditor({ initialItinerary, cityId, isSavedMode = false }: ItineraryEditorProps) {
  const {
    watch,
    setValue,
    getValues,
    reset,
    formState: { isDirty },
  } = useForm<Itinerary>({
    defaultValues: initialItinerary,
  });

  const itinerary = watch();
  const [isSaving, setIsSaving] = useState(false);

  const [addModal, setAddModal] = useState<{
    isOpen: boolean;
    dayId: string | null;
    suggestions: Vibe[];
    isLoading: boolean;
  }>({
    isOpen: false,
    dayId: null,
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

  /**
   * Check if a vibe is open at a given date and time.
   * Uses the shared isPlaceOpenAt utility for consistent behavior with the engine.
   */
  const checkIsOpen = useCallback((vibe: Vibe, dateStr: string, startTime: string) => {
    const date = new Date(dateStr);
    return isPlaceOpenAt(vibe.openingHours, date, startTime);
  }, []);

  /**
   * Swap an activity with its alternative.
   * Uses shared swapActivityAlternative utility for consistent transit calculation.
   */
  const handleSwap = (dayId: string, activityId: string) => {
    let warningMessage = "";

    const newDays = itinerary.days.map((day) => {
      if (day.id !== dayId) return day;

      const activity = day.activities.find((a) => a.id === activityId);
      if (!activity?.alternative) return day;

      // Check if the alternative might be closed
      const isOpen = checkIsOpen(activity.alternative, day.date, activity.startTime);
      if (!isOpen) {
        warningMessage = `${activity.alternative.title} might be closed at ${activity.startTime} on this day.`;
      }

      // Use shared utility for swapping
      const updatedActivities = swapActivityAlternative(day, activityId);
      if (!updatedActivities) return day;

      return { ...day, activities: updatedActivities };
    });

    setValue("days", newDays, { shouldDirty: true });
    if (warningMessage) {
      setAlert({ isOpen: true, title: "Opening Hours Warning", message: warningMessage, type: "warning" });
    }
  };

  /**
   * Remove an activity from a day.
   * Uses shared recalculateTransitForActivities for consistent transit updates.
   */
  const handleRemove = (dayId: string, activityId: string) => {
    const newDays = itinerary.days.map((day) => {
      if (day.id !== dayId) return day;
      const filtered = day.activities.filter((act) => act.id !== activityId);
      // Recalculate transit after removal
      const updatedActivities = recalculateTransitForActivities(filtered);
      return { ...day, activities: updatedActivities };
    });
    setValue("days", newDays, { shouldDirty: true });
  };

  const handleActivityUpdate = (dayId: string, activityId: string, updates: Partial<TripActivity>) => {
    const newDays = itinerary.days.map((day) => {
      if (day.id !== dayId) return day;
      const newActivities = day.activities.map((act) => {
        if (act.id !== activityId) return act;
        return { ...act, ...updates };
      });
      return { ...day, activities: newActivities };
    });
    setValue("days", newDays, { shouldDirty: true });
  };

  const handleOpenAddModal = async (dayId: string) => {
    setAddModal({ isOpen: true, dayId, suggestions: [], isLoading: true });
    try {
      const suggestions = await getActivitySuggestionsAction(cityId, itinerary, dayId);
      setAddModal((prev) => ({ ...prev, suggestions, isLoading: false }));
    } catch (e) {
      console.error(e);
      setAddModal((prev) => ({ ...prev, isLoading: false }));
    }
  };

  /**
   * Add a new activity to a day.
   * Uses shared appendActivityToDay utility for:
   * - Correct time calculation with midnight rollover handling
   * - Consistent transit calculation with transitDetails
   */
  const handleAddActivity = async (vibe: Vibe) => {
    if (!addModal.dayId) return;
    const dayId = addModal.dayId;

    const newDays = itinerary.days.map((d) => {
      if (d.id !== dayId) return d;
      // Use shared utility - handles time calculation and transit
      const updatedActivities = appendActivityToDay(d, vibe);
      return { ...d, activities: updatedActivities };
    });

    setValue("days", newDays, { shouldDirty: true });
    setAddModal({ ...addModal, isOpen: false });
  };

  const [moveModal, setMoveModal] = useState<{
    isOpen: boolean;
    sourceDayId: string | null;
    activityId: string | null;
  }>({
    isOpen: false,
    sourceDayId: null,
    activityId: null,
  });

  const handleOpenMoveModal = (dayId: string, activityId: string) => {
    setMoveModal({ isOpen: true, sourceDayId: dayId, activityId });
  };

  /**
   * Move an activity from one day to another.
   * Uses shared moveActivityBetweenDays utility for:
   * - Recalculating transit for both source and target days
   * - Recalculating activity times based on target day
   * - Proper transitDetails population (not just transitNote)
   */
  const handleMoveActivity = (targetDayId: string) => {
    const { sourceDayId, activityId } = moveModal;
    if (!sourceDayId || !activityId) return;

    // Use shared utility - handles all transit and time recalculation
    const newDays = moveActivityBetweenDays(sourceDayId, targetDayId, activityId, itinerary.days);

    if (newDays) {
      setValue("days", newDays, { shouldDirty: true });
    }
    setMoveModal({ ...moveModal, isOpen: false });
  };

  const handleSave = async () => {
    setIsSaving(true);
    const currentItinerary = getValues();
    try {
      await saveItineraryAction(currentItinerary.id, currentItinerary.name, currentItinerary);
      reset(currentItinerary); // Clear dirty state
      setAlert({ isOpen: true, title: "Success", message: "Itinerary saved successfully!", type: "success" });
    } catch {
      setAlert({ isOpen: true, title: "Error", message: "Failed to save itinerary.", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <AlertModal
        isOpen={alert.isOpen}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        onClose={() => setAlert({ ...alert, isOpen: false })}
      />

      <AnimatePresence>
        {addModal.isOpen && (
          <AddActivityModal
            isOpen={addModal.isOpen}
            onClose={() => setAddModal({ ...addModal, isOpen: false })}
            onSelect={handleAddActivity}
            suggestions={addModal.suggestions}
            isLoading={addModal.isLoading}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {moveModal.isOpen && (
          <MoveActivityModal
            isOpen={moveModal.isOpen}
            onClose={() => setMoveModal({ ...moveModal, isOpen: false })}
            onMove={handleMoveActivity}
            days={itinerary.days}
            sourceDayId={moveModal.sourceDayId || ""}
          />
        )}
      </AnimatePresence>

      <div>
        {itinerary.days.map((day) => (
          <ItineraryDay
            key={day.id}
            day={day}
            onSwap={(actId) => handleSwap(day.id, actId)}
            onRemove={(actId) => handleRemove(day.id, actId)}
            onAdd={() => handleOpenAddModal(day.id)}
            onUpdate={(actId, updates) => handleActivityUpdate(day.id, actId, updates)}
            onMoveActivity={(actId) => handleOpenMoveModal(day.id, actId)}
          />
        ))}
      </div>

      {isSavedMode && isDirty && (
        <div className="flex justify-center mt-8 pb-8 fixed bottom-4 right-8">
          <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      )}
    </>
  );
}
