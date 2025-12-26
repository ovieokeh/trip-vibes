"use client";

import { useState, useCallback } from "react";
import { Itinerary, TripActivity, Vibe } from "@/lib/types";
import { getActivitySuggestionsAction, saveItineraryAction, getFallbackImageAction } from "@/lib/db-actions";
import { getTransitNote } from "@/lib/geo";
import ItineraryDay from "@/components/ItineraryDay";
import AlertModal from "@/components/AlertModal";
import AddActivityModal from "@/components/AddActivityModal";
import { useRouter } from "next/navigation";

interface ItineraryEditorProps {
  initialItinerary: Itinerary;
  cityId: string; // Needed for suggestions
  isSavedMode?: boolean; // If true, we might show different save buttons or auto-save
}

export default function ItineraryEditor({ initialItinerary, cityId, isSavedMode = false }: ItineraryEditorProps) {
  const router = useRouter();
  const [itinerary, setItinerary] = useState<Itinerary>(initialItinerary);
  const [isSaving, setIsSaving] = useState(false);

  // Track if dirty? For now, we just save on explicit action or maybe auto-save (let's stick to explicit "Save Changes" for saved trips for clarity, or just rely on the existing "Save Trip" flow for the generated one).
  // Actually, for the saved page, users expect edits to persist. Let's add a save button if changes were made?
  // Or simpler: Just a manual "Save Changes" button at the bottom.

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

  const checkIsOpen = useCallback((vibe: Vibe, dateStr: string, startTime: string) => {
    if (!vibe.openingHours?.periods) return true;
    const date = new Date(dateStr);
    const dayIndex = date.getDay();
    const startInt = parseInt(startTime.replace(":", ""));

    const periods = vibe.openingHours.periods;
    return periods.some((period: any) => {
      if (period.open.day !== dayIndex) return false;
      const openTime = parseInt(period.open.time);
      if (!period.close) return true;
      if (period.close.day !== period.open.day) return startInt >= openTime;
      const closeTime = parseInt(period.close.time);
      return startInt >= openTime && startInt < closeTime;
    });
  }, []);

  const handleSwap = (dayId: string, activityId: string) => {
    let warningMessage = "";
    const newDays = itinerary.days.map((day) => {
      if (day.id !== dayId) return day;

      const activityIndex = day.activities.findIndex((a) => a.id === activityId);
      if (activityIndex === -1) return day;

      const act = day.activities[activityIndex];
      if (!act.alternative) return day;

      const oldVibe = act.vibe;
      const newVibe = act.alternative;

      const isOpen = checkIsOpen(newVibe, day.date, act.startTime);
      if (!isOpen) {
        warningMessage = `${newVibe.title} might be closed at ${act.startTime} on this day.`;
      }

      const newActivity = {
        ...act,
        vibe: newVibe,
        alternative: oldVibe,
        note: newVibe.description,
      };

      if (activityIndex > 0) {
        const prevAct = day.activities[activityIndex - 1];
        if (prevAct.vibe.lat && prevAct.vibe.lng && newVibe.lat && newVibe.lng) {
          newActivity.transitNote = getTransitNote(prevAct.vibe.lat, prevAct.vibe.lng, newVibe.lat, newVibe.lng);
        }
      }

      const updatedActivities = [...day.activities];
      updatedActivities[activityIndex] = newActivity;

      if (activityIndex < updatedActivities.length - 1) {
        const nextAct = updatedActivities[activityIndex + 1];
        if (newVibe.lat && newVibe.lng && nextAct.vibe.lat && nextAct.vibe.lng) {
          const newTransit = getTransitNote(newVibe.lat, newVibe.lng, nextAct.vibe.lat, nextAct.vibe.lng);
          updatedActivities[activityIndex + 1] = { ...nextAct, transitNote: newTransit };
        }
      }

      return { ...day, activities: updatedActivities };
    });

    setItinerary({ ...itinerary, days: newDays });
    if (warningMessage) {
      setAlert({ isOpen: true, title: "Opening Hours Warning", message: warningMessage, type: "warning" });
    }
  };

  const handleRemove = (dayId: string, activityId: string) => {
    const newDays = itinerary.days.map((day) => {
      if (day.id !== dayId) return day;
      const filtered = day.activities.filter((act) => act.id !== activityId);
      return { ...day, activities: filtered };
    });
    setItinerary({ ...itinerary, days: newDays });
  };

  const handleActivityUpdate = (dayId: string, activityId: string, updates: any) => {
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

  const handleAddActivity = async (vibe: Vibe) => {
    if (!addModal.dayId) return;
    const dayId = addModal.dayId;
    const day = itinerary.days.find((d) => d.id === dayId);
    let startTime = "12:00";
    let endTime = "13:30";

    if (day && day.activities.length > 0) {
      const lastAct = day.activities[day.activities.length - 1];
      const [h, m] = lastAct.endTime.split(":").map(Number);
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

    const newActivity: TripActivity = {
      id: crypto.randomUUID(),
      vibe: vibe,
      startTime,
      endTime,
      note: vibe.description,
      isAlternative: false,
      transitNote: "",
    };

    if (day && day.activities.length > 0) {
      const lastAct = day.activities[day.activities.length - 1];
      if (lastAct.vibe.lat && lastAct.vibe.lng && vibe.lat && vibe.lng) {
        newActivity.transitNote = getTransitNote(lastAct.vibe.lat, lastAct.vibe.lng, vibe.lat, vibe.lng);
      }
    } else {
      newActivity.transitNote = "Start of day";
    }

    const newDays = itinerary.days.map((d) => {
      if (d.id !== dayId) return d;
      return { ...d, activities: [...d.activities, newActivity] };
    });

    setItinerary({ ...itinerary, days: newDays });
    setAddModal({ ...addModal, isOpen: false });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveItineraryAction(itinerary.id, itinerary.name, itinerary);
      setAlert({ isOpen: true, title: "Success", message: "Itinerary saved successfully!", type: "success" });
    } catch (e) {
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

      <AddActivityModal
        isOpen={addModal.isOpen}
        onClose={() => setAddModal({ ...addModal, isOpen: false })}
        onSelect={handleAddActivity}
        suggestions={addModal.suggestions}
        isLoading={addModal.isLoading}
      />

      <div>
        {itinerary.days.map((day) => (
          <ItineraryDay
            key={day.id}
            day={day}
            onSwap={(actId) => handleSwap(day.id, actId)}
            onRemove={(actId) => handleRemove(day.id, actId)}
            onAdd={() => handleOpenAddModal(day.id)}
            onUpdate={(actId, updates) => handleActivityUpdate(day.id, actId, updates)}
          />
        ))}
      </div>

      {isSavedMode && (
        <div className="flex justify-center mt-8 pb-8">
          <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      )}
    </>
  );
}
