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

      <div className="flex flex-col gap-0">
        {day.activities.map((act, index) => (
          <div key={act.id}>
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card bg-base-100 shadow-sm border border-base-200 mb-2 overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row">
                <div
                  className="h-24 sm:h-auto sm:w-28 bg-cover bg-center shrink-0"
                  style={{ backgroundImage: `url(${act.vibe.imageUrl})` }}
                ></div>
                <div className="card-body p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="badge badge-sm badge-neutral">{act.startTime}</span>
                        <span className="text-[10px] uppercase tracking-wider font-bold opacity-40">
                          {act.vibe.category}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm sm:text-base leading-tight">{act.vibe.title}</h4>
                    </div>
                    <button className="btn btn-xs btn-ghost btn-square">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"
                        />
                      </svg>
                    </button>
                  </div>
                  <p className="text-xs mt-1 text-base-content/80 line-clamp-2">{act.note}</p>

                  {act.alternative && (
                    <div className="mt-2 pt-2 border-t border-dashed border-base-300">
                      <details className="group">
                        <summary className="text-[10px] font-bold uppercase cursor-pointer list-none flex items-center gap-1 opacity-50 hover:opacity-100 transition-opacity">
                          <span>See Alternative</span>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3 w-3 group-open:rotate-180 transition-transform"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        </summary>
                        <div className="mt-1 text-[11px] bg-base-200 p-2 rounded italic">{act.alternative.note}</div>
                      </details>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {act.transitNote && index < day.activities.length - 1 && (
              <div className="flex items-center gap-2 py-4 ml-6 border-l border-dashed border-base-300">
                <div className="w-2 h-2 rounded-full bg-base-300 -ml-[4.5px]"></div>
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-30 flex items-center gap-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  {act.transitNote}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
