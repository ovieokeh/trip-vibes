"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import { getCities } from "@/lib/db-actions";

export default function SetupForm() {
  const router = useRouter();
  const { setCity, setDates, setBudget } = useStore();

  const [dbCities, setDbCities] = useState<any[]>([]);
  const [selectedCity, setSelectedCity] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [budget, setBudgetState] = useState<"low" | "medium" | "high">("medium");

  useEffect(() => {
    async function fetchCities() {
      const data = await getCities();
      setDbCities(data);
      if (data.length > 0) {
        setSelectedCity(data[0].id);
      }
    }
    fetchCities();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
        <select
          className="select select-bordered w-full text-lg"
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
          disabled={dbCities.length === 0}
        >
          {dbCities.map((city) => (
            <option key={city.id} value={city.id}>
              {city.name}, {city.country}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-4">
        <div className="form-control w-1/2">
          <label className="label">
            <span className="label-text font-semibold">Start Date</span>
          </label>
          <input
            type="date"
            required
            className="input input-bordered w-full"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="form-control w-1/2">
          <label className="label">
            <span className="label-text font-semibold">End Date</span>
          </label>
          <input
            type="date"
            required
            className="input input-bordered w-full"
            value={endDate}
            min={startDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
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
