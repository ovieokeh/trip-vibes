"use client";

import { useMemo, useState, useRef } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange, DayPicker } from "react-day-picker";
import { clsx } from "clsx";
// import "react-day-picker/style.css"; // Removed to avoid conflict with Tailwind classes

interface DateRangePickerProps {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  onChange: (start: string, end: string) => void;
  className?: string;
}

export function DateRangePicker({ startDate, endDate, onChange, className }: DateRangePickerProps) {
  const modalRef = useRef<HTMLDialogElement>(null);

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
    <>
      <div className={clsx("relative grid gap-2", className)}>
        <button
          type="button"
          onClick={() => modalRef.current?.showModal()}
          className={clsx(
            "btn btn-outline w-full justify-start text-left font-normal text-lg h-12",
            !startDate && "text-base-content/50"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {displayText}
        </button>
      </div>

      <dialog ref={modalRef} className="modal modal-bottom sm:modal-middle">
        <div className="modal-box max-w-2xl p-0 overflow-hidden bg-base-100">
          <div className="p-4 bg-base-200/50 border-b border-base-200 flex justify-between items-center">
            <h3 className="font-bold text-lg">Select Dates</h3>
            <button type="button" className="btn btn-sm btn-circle btn-ghost" onClick={() => modalRef.current?.close()}>
              ✕
            </button>
          </div>

          <div className="p-4 flex justify-center bg-base-100">
            <DayPicker
              mode="range"
              defaultMonth={selectedRange?.from}
              selected={selectedRange}
              onSelect={handleSelect}
              numberOfMonths={2}
              showOutsideDays={false}
              classNames={{
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-8 sm:space-y-0",
                month: "space-y-4",
                caption: "flex justify-center pt-1 relative items-center",
                caption_label: "text-lg font-medium",
                nav: "space-x-1 flex items-center",
                button_previous:
                  "h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg hover:bg-base-200 absolute left-1",
                button_next:
                  "h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg hover:bg-base-200 absolute right-1",
                month_grid: "w-full border-collapse space-y-1",
                weekdays: "flex",
                weekday: "text-base-content/50 rounded-md w-10 font-normal text-[0.8rem]",
                week: "flex w-full mt-2",
                day: "h-10 w-10 text-center text-sm p-0 relative [&:has([aria-selected].range_end)]:rounded-r-md [&:has([aria-selected].outside)]:bg-base-200/50 [&:has([aria-selected])]:bg-base-200 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                day_button:
                  "h-10 w-10 p-0 font-normal aria-selected:opacity-100 hover:bg-primary/10 rounded-md transition-colors flex items-center justify-center cursor-pointer select-none bg-transparent border-none",
                range_end: "range_end",
                selected:
                  "!bg-primary !text-primary-content hover:!bg-primary hover:!text-primary-content focus:!bg-primary focus:!text-primary-content shadow-sm",
                today: "bg-base-content/10 text-base-content font-semibold",
                outside: "text-base-content/30 opacity-50",
                disabled: "text-base-content/30 opacity-50",
                range_middle: "!bg-base-200 !text-base-content !rounded-none hover:!bg-base-300",
                hidden: "invisible",
              }}
            />
          </div>

          <div className="p-4 border-t border-base-200 bg-base-100 flex justify-end">
            <button type="button" className="btn btn-primary" onClick={() => modalRef.current?.close()}>
              Done
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </>
  );
}
