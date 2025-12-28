"use client";

import { DayPlan } from "@/lib/types";
import { motion } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";

interface MoveActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMove: (targetDayId: string) => void;
  days: DayPlan[];
  sourceDayId: string;
}

export default function MoveActivityModal({ isOpen, onClose, onMove, days, sourceDayId }: MoveActivityModalProps) {
  const t = useTranslations("MoveActivity");
  const td = useTranslations("ItineraryDay");
  const locale = useLocale();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-base-100 w-full max-w-sm p-0 overflow-hidden shadow-2xl rounded-xl ring-1 ring-white/10 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-base-200 bg-base-200/50 flex justify-between items-start">
          <div>
            <h3 className="font-bold text-lg">{t("title")}</h3>
            <p className="text-sm opacity-70 mt-1">{t("description")}</p>
          </div>
          <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost">
            ✕
          </button>
        </div>

        <div className="p-2 max-h-[60vh] overflow-y-auto">
          <ul className="menu bg-base-100 w-full p-0 gap-1">
            {days.map((day) => {
              const isCurrent = day.id === sourceDayId;
              // Parse date for display
              const [y, m, d] = day.date.split("-").map(Number);
              const dateObj = new Date(y, m - 1, d);
              const displayDate = dateObj.toLocaleDateString(locale, {
                weekday: "short",
                month: "short",
                day: "numeric",
              });

              return (
                <li key={day.id}>
                  <button
                    onClick={() => {
                      if (!isCurrent) {
                        onMove(day.id);
                        onClose();
                      }
                    }}
                    disabled={isCurrent}
                    className={`flex justify-between items-center py-3 px-4 rounded-xl transition-all ${
                      isCurrent
                        ? "bg-base-200 opacity-50 cursor-not-allowed"
                        : "hover:bg-primary/10 hover:text-primary active:scale-[0.98]"
                    }`}
                  >
                    <span className="font-medium">
                      {td("day")} {day.dayNumber}
                    </span>
                    <span className="text-sm opacity-70">{displayDate}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="p-4 border-t border-base-200 flex justify-end bg-base-200/30">
          <button className="btn btn-ghost" onClick={onClose}>
            {t("cancel")}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
