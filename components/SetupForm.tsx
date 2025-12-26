"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import { getCities } from "@/lib/db-actions";
import { SmartCitySelect } from "./SmartCitySelect";
import { DateRangePicker } from "./DateRangePicker";

export default function SetupForm() {
  const router = useRouter();

  // Get state and actions from store
  const {
    cityId,
    startDate: storeStart,
    endDate: storeEnd,
    budget: storeBudget,
    setCity,
    setDates,
    setBudget,
  } = useStore();

  const [dbCities, setDbCities] = useState<any[]>([]);

  // Initialize local state from store values (persistence)
  const [selectedCity, setSelectedCity] = useState(cityId);
  const [startDate, setStartDate] = useState(storeStart);
  const [endDate, setEndDate] = useState(storeEnd);
  const [budget, setBudgetState] = useState<"low" | "medium" | "high">(storeBudget || "medium");

  useEffect(() => {
    async function fetchCities() {
      const data = await getCities();
      console.log("Fetched cities:", data);
      setDbCities(data);

      // Only default to first city if NO city is selected (and not in store)
      // But actually, we want to respect the empty state if user hasn't chosen one.
      // So we don't force select the first one unless we really want to.
      // The previous code did: if (data.length > 0) setSelectedCity(data[0].id) inside useEffect.
      // This would override store state if we are not careful.
      // Let's only do it if !selectedCity.
      if (data.length > 0 && !selectedCity) {
        // Optionally pre-select first city, or just leave empty.
        // Let's leave it empty to force user choice or "Smart Select" placeholder.
      }
    }
    fetchCities();
  }, []); // Run once on mount

  // Sync state if store updates (e.g. reset) - optional but good practice
  useEffect(() => {
    if (cityId) setSelectedCity(cityId);
    if (storeStart) setStartDate(storeStart);
    if (storeEnd) setEndDate(storeEnd);
    if (storeBudget) setBudgetState(storeBudget);
  }, [cityId, storeStart, storeEnd, storeBudget]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCity) {
      alert("Please select a city");
      return;
    }
    if (!startDate || !endDate) {
      alert("Please select dates");
      return;
    }

    setCity(selectedCity);
    setDates(startDate, endDate);
    setBudget(budget);
    router.push("/vibes");
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full max-w-md mx-auto">
      <div className="form-control w-full">
        <label className="label">
          <span className="label-text font-semibold">Where are you going?</span>
        </label>
        <SmartCitySelect cities={dbCities} selectedCityId={selectedCity} onSelect={setSelectedCity} />
      </div>

      <div className="form-control w-full">
        <label className="label">
          <span className="label-text font-semibold">When?</span>
        </label>
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onChange={(start, end) => {
            setStartDate(start);
            setEndDate(end);
          }}
        />
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text font-semibold">Budget Vibe</span>
        </label>
        <div className="flex gap-2">
          {["low", "medium", "high"].map((b) => (
            <button
              key={b}
              type="button"
              className={`btn flex-1 ${budget === b ? "btn-neutral" : "btn-outline"}`}
              onClick={() => setBudgetState(b as any)}
            >
              {b === "low" ? "$" : b === "medium" ? "$$" : "$$$"}
            </button>
          ))}
        </div>
      </div>

      <button type="submit" className="btn btn-primary w-full mt-4 text-lg">
        Start Vibe Check
      </button>
    </form>
  );
}
