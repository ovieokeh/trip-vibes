"use client";

import { DayPlan } from "@/lib/types";
import { motion } from "framer-motion";

export default function ItineraryDay({ day }: { day: DayPlan }) {
  return (
    <div className="mb-8 pl-4 border-l-2 border-base-300 relative">
      <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary ring-4 ring-base-100"></div>
      <h3 className="text-xl font-bold mb-4">
        {day.date} <span className="text-sm opacity-50 font-normal ml-2">Day {day.dayNumber}</span>
      </h3>

      <div className="flex flex-col gap-4">
        {day.activities.map((act, index) => (
          <motion.div
            key={act.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card bg-base-100 shadow-sm border border-base-200"
          >
            <div className="flex flex-col sm:flex-row">
              <div
                className="h-32 sm:h-auto sm:w-32 bg-cover bg-center shrink-0"
                style={{ backgroundImage: `url(${act.vibe.imageUrl})` }}
              ></div>
              <div className="card-body p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="badge badge-sm badge-ghost mb-1">
                      {act.startTime} - {act.endTime}
                    </div>
                    <h4 className="card-title text-base sm:text-lg">{act.vibe.title}</h4>
                    <p className="text-xs sm:text-sm opacity-70">
                      {act.vibe.neighborhood} • {act.vibe.category}
                    </p>
                  </div>
                  {/* Dummy Book Button */}
                  <button className="btn btn-xs btn-primary btn-outline">Book</button>
                </div>
                <p className="text-sm mt-2 italic text-base-content/60">{act.note}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
