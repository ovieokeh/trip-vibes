import { useEffect, useState } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { Command } from "cmdk";
import { clsx } from "clsx";
import { searchCitiesAction, getCityById } from "@/lib/db-actions";
import { useTranslations } from "next-intl";

import { useDebounce } from "@/hooks/use-debounce";

interface City {
  id: string;
  name: string;
  country: string;
}

interface SmartCitySelectProps {
  selectedCityId: string;
  onSelect: (cityId: string) => void;
  disabled?: boolean;
}

export function SmartCitySelect({ selectedCityId, onSelect, disabled }: SmartCitySelectProps) {
  const t = useTranslations("CitySelect");
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [results, setResults] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // To show the selected name even if not in search results
  const [selectedCityData, setSelectedCityData] = useState<City | null>(null);

  // 1. Fetch details of selected city if we have an ID but no data (or mismatch)
  useEffect(() => {
    let active = true;
    async function fetchSelected() {
      if (!selectedCityId) {
        if (active) setSelectedCityData(null);
        return;
      }

      // If we already have the data locally in results, use it
      const inResults = results.find((c) => c.id === selectedCityId);
      if (inResults) {
        if (active) setSelectedCityData(inResults);
        return;
      }

      // Otherwise fetch from server
      try {
        const city = await getCityById(selectedCityId);
        if (active && city) setSelectedCityData(city);
      } catch (err) {
        console.error("Failed to fetch selected city", err);
      }
    }
    fetchSelected();
    return () => {
      active = false;
    };
  }, [selectedCityId, results]);

  // 2. Search Effect with Race Condition Protection
  useEffect(() => {
    let active = true;
    const query = debouncedSearch.trim();

    async function performSearch() {
      if (!query || query.length < 2) {
        if (active) {
          setResults([]);
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      try {
        const data = await searchCitiesAction(query);
        if (active) {
          setResults(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    performSearch();

    return () => {
      active = false;
      // We can't really "abort" the server action easily without AbortController support in server actions
      // (which is tricky), but we can ignore the result.
    };
  }, [debouncedSearch]);

  return (
    <div className="relative w-full group">
      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        className={clsx(
          "btn btn-outline border-base-300 w-full justify-between font-normal text-lg h-12 bg-base-100 hover:bg-base-100 hover:border-base-content/30 text-base-content",
          !selectedCityData && "text-base-content/40",
          disabled && "btn-disabled"
        )}
        disabled={disabled}
      >
        <span className="truncate">
          {selectedCityData ? `${selectedCityData.name}, ${selectedCityData.country}` : t("selectCity")}
        </span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-40" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-2 w-full z-20 p-1 bg-base-100 rounded-box border-2 border-base-200 shadow-xl overflow-hidden">
            <Command label="Search cities" shouldFilter={false}>
              <div className="flex items-center border-b border-base-200 px-3">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex h-11 w-full rounded-md bg-transparent py-3 text-base outline-none placeholder:text-base-content/40"
                  placeholder={t("searchPlaceholder")}
                  autoFocus
                />
                {isLoading && <Loader2 className="h-4 w-4 animate-spin opacity-40" />}
              </div>

              <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden p-1">
                {!isLoading && results.length === 0 && (
                  <Command.Empty className="py-6 text-center text-sm text-base-content/40 font-medium">
                    {search.length < 2 ? t("typeToSearch") : t("noCity")}
                  </Command.Empty>
                )}

                {results.map((city) => (
                  <Command.Item
                    key={city.id}
                    value={city.id}
                    onSelect={() => {
                      onSelect(city.id);
                      setOpen(false);
                      setSearch("");
                    }}
                    className={clsx(
                      "relative flex cursor-pointer select-none items-center rounded-btn px-3 py-3 text-sm outline-none transition-colors hover:bg-base-200 data-[selected=true]:bg-base-200 data-[selected=true]:text-base-content",
                      selectedCityId === city.id && "bg-base-200 font-medium"
                    )}
                  >
                    <Check className={clsx("mr-2 h-4 w-4", selectedCityId === city.id ? "opacity-100" : "opacity-0")} />
                    <span className="flex flex-col">
                      <span className="font-bold">{city.name}</span>
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
