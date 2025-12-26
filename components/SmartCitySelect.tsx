"use client";

import { useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Command } from "cmdk";
import { clsx } from "clsx";

interface City {
  id: string;
  name: string;
  country: string;
}

interface SmartCitySelectProps {
  cities: City[];
  selectedCityId: string;
  onSelect: (cityId: string) => void;
  disabled?: boolean;
}

export function SmartCitySelect({ cities, selectedCityId, onSelect, disabled }: SmartCitySelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedCity = useMemo(() => cities.find((city) => city.id === selectedCityId), [cities, selectedCityId]);

  const filteredCities = useMemo(() => {
    if (!search) return cities;
    return cities.filter(
      (city) =>
        city.name.toLowerCase().includes(search.toLowerCase()) ||
        city.country.toLowerCase().includes(search.toLowerCase())
    );
  }, [cities, search]);

  return (
    <div className="relative w-full group">
      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        className={clsx(
          "btn btn-outline w-full justify-between font-normal text-lg h-12",
          !selectedCity && "text-base-content/50"
        )}
        disabled={disabled}
      >
        {selectedCity ? `${selectedCity.name}, ${selectedCity.country}` : "Select a city..."}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-2 w-full z-20 p-1 bg-base-100 rounded-box border border-base-300 shadow-xl overflow-hidden">
            <Command label="Search cities" shouldFilter={false}>
              <div className="flex items-center border-b border-base-200 px-3">
                {/* Search Icon */}
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-base-content/50"
                  placeholder="Search city..."
                  autoFocus
                />
              </div>

              <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden p-1">
                <Command.Empty className="py-6 text-center text-sm text-base-content/50">No city found.</Command.Empty>

                {filteredCities.map((city) => (
                  <Command.Item
                    key={city.id}
                    value={city.id}
                    onSelect={() => {
                      onSelect(city.id);
                      setOpen(false);
                      setSearch("");
                    }}
                    className={clsx(
                      "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2.5 text-sm outline-none hover:bg-base-200 data-[selected=true]:bg-base-200 data-[selected=true]:text-base-content",
                      selectedCityId === city.id && "bg-base-200"
                    )}
                  >
                    <Check className={clsx("mr-2 h-4 w-4", selectedCityId === city.id ? "opacity-100" : "opacity-0")} />
                    <span className="flex flex-col">
                      <span className="font-medium">{city.name}</span>
                      <span className="text-xs text-base-content/60">{city.country}</span>
                    </span>
                  </Command.Item>
                ))}
              </Command.List>
            </Command>
          </div>
        </>
      )}
    </div>
  );
}
