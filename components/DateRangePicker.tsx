"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange, DayPicker } from "react-day-picker";
import { clsx } from "clsx";
import "react-day-picker/style.css";

interface DateRangePickerProps {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  onChange: (start: string, end: string) => void;
  className?: string;
}

export function DateRangePicker({ startDate, endDate, onChange, className }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);

  const selectedRange: DateRange | undefined = useMemo(() => {
    if (!startDate) return undefined;
    return {
      from: new Date(startDate),
      to: endDate ? new Date(endDate) : undefined,
    };
  }, [startDate, endDate]);

  const handleSelect = (range: DateRange | undefined) => {
    if (!range?.from) {
      onChange("", "");
    } else {
      // Adjust for timezone issues by using generic YYYY-MM-DD formatting
      const formatStr = (d: Date) => format(d, "yyyy-MM-dd");
      onChange(formatStr(range.from), range.to ? formatStr(range.to) : "");
    }
  };

  const displayText = useMemo(() => {
    if (!startDate) return "Pick a date range";
    if (!endDate) return format(new Date(startDate), "MMM d, yyyy");
    return `${format(new Date(startDate), "MMM d, yyyy")} - ${format(new Date(endDate), "MMM d, yyyy")}`;
  }, [startDate, endDate]);

  return (
    <div className={clsx("relative grid gap-2", className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={clsx(
          "btn btn-outline w-full justify-start text-left font-normal text-lg h-12",
          !startDate && "text-base-content/50"
        )}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {displayText}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-2 w-auto p-0 z-20 bg-base-100 rounded-box border border-base-300 shadow-xl overflow-hidden">
            <DayPicker
              mode="range"
              defaultMonth={selectedRange?.from}
              selected={selectedRange}
              onSelect={handleSelect}
              numberOfMonths={2}
              styles={{
                root: {},
                months: { display: "flex", gap: "1rem" },
                caption: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem" },
              }}
              classNames={{
                root: "p-3",
                month: "space-y-4",
                caption: "flex justify-center pt-1 relative items-center",
                caption_label: "text-sm font-medium",
                nav: "space-x-1 flex items-center",
                nav_button: "btn btn-sm btn-ghost btn-square p-0 opacity-50 hover:opacity-100",
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                table: "w-full border-collapse space-y-1",
                head_row: "flex",
                head_cell: "text-base-content/50 rounded-md w-9 font-normal text-[0.8rem]",
                row: "flex w-full mt-2",
                cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-primary/5 [&:has([aria-selected].day-outside)]:bg-primary/50 [&:has([aria-selected])]:first:rounded-l-md [&:has([aria-selected])]:last:rounded-r-md focus-within:relative focus-within:z-20",
                day: "btn btn-sm btn-ghost h-9 w-9 p-0 font-normal aria-selected:opacity-100",
                day_range_end: "day-range-end",
                day_selected:
                  "bg-primary text-primary-content hover:bg-primary hover:text-primary-content focus:bg-primary focus:text-primary-content",
                day_today: "bg-base-content/5 text-base-content",
                day_outside: "text-base-content/50 opacity-50 bg-inherit",
                day_disabled: "text-base-content/50 opacity-50",
                day_range_middle: "aria-selected:bg-primary/10 aria-selected:text-primary",
                day_hidden: "invisible",
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}
