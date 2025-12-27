"use client";

import { DayPlan, Vibe, TripActivity } from "@/lib/types";
import { motion } from "framer-motion";
import { Star, Globe, Phone, MapPin } from "lucide-react";
import { useState } from "react";
import VibeImage from "./VibeImage";

import { estimateTravelTime } from "@/lib/geo";

function TransitIndicator({
  activity,
  onUpdate,
}: {
  activity: TripActivity;
  onUpdate?: (actId: string, updates: Partial<TripActivity>) => void;
}) {
  const details = activity.transitDetails;

  // If no details, fallback to string parsing or static
  if (!details) {
    return (
      <span className="text-[10px] text-primary font-bold uppercase tracking-widest opacity-80 flex items-center gap-1">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-3 w-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
        {activity.transitNote || "Getting there"}
      </span>
    );
  }

  const handleModeChange = (mode: "walking" | "driving" | "transit") => {
    const newDuration = estimateTravelTime(details.distanceKm, mode);
    const newDetails = { ...details, mode, durationMinutes: newDuration };
    // Update both detail object and the legacy string for safety
    onUpdate?.(activity.id, {
      transitDetails: newDetails,
      transitNote: `${newDuration} min ${mode}`,
    });
  };

  const getIcon = (mode: string) => {
    switch (mode) {
      case "walking":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3 w-3"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M13 14l-4.5-9" />
            <path d="M8 14l-3-5" />
            <path d="M9 18l3 5" />
            <path d="M14 18l-3 5" />
            <circle cx="12" cy="5" r="2" />
          </svg>
        );
      case "driving":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3 w-3"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12v4.5a2 2 0 0 0 2 2h1" />
            <circle cx="5" cy="19" r="2" />
            <circle cx="19" cy="19" r="2" />
            <path d="M2 12h3" />
            <path d="M2 12h1" />
          </svg>
        );
      case "transit":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3 w-3"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="14" height="16" x="5" y="4" rx="2" />
            <path d="M9 18v2" />
            <path d="M15 18v2" />
            <path d="M2 8h20" />
            <path d="M5 14h.01" />
            <path d="M19 14h.01" />
            <path d="M10 2h4" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="dropdown dropdown-hover dropdown-right dropdown-end">
        <div
          tabIndex={0}
          role="button"
          className="btn btn-xs btn-ghost gap-1 h-auto min-h-0 py-0.5 px-1 font-normal opacity-80 hover:opacity-100"
        >
          {getIcon(details.mode)}
          <span className="text-[10px] font-bold uppercase tracking-widest">
            {details.durationMinutes} min {details.mode}
          </span>
        </div>
        <ul
          tabIndex={0}
          className="dropdown-content z-[1] menu p-1 shadow bg-base-100 rounded-box w-32 border border-base-200"
        >
          <li>
            <a onClick={() => handleModeChange("walking")} className="text-xs py-1">
              Walking
            </a>
          </li>
          <li>
            <a onClick={() => handleModeChange("transit")} className="text-xs py-1">
              Transit
            </a>
          </li>
          <li>
            <a onClick={() => handleModeChange("driving")} className="text-xs py-1">
              Driving
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default function ItineraryDay({
  day,
  onSwap,
  onRemove,
  onAdd,
  onUpdate,
  onMoveActivity,
}: {
  day: DayPlan;
  onSwap?: (id: string) => void;
  onRemove?: (id: string) => void;
  onAdd?: () => void;
  onUpdate?: (actId: string, updates: Partial<TripActivity>) => void;
  onMoveActivity?: (actId: string) => void;
}) {
  console.log("Rendering ItineraryDay for day:", day);
  // Get day name for opening hours lookup, e.g. "Monday"
  // Parse date securely to avoid timezone shifts (YYYY-MM-DD to local time)
  const [year, month, d] = day.date.split("-").map(Number);
  const dateObj = new Date(year, month - 1, d);

  const dayName = dateObj.toLocaleDateString("en-US", { weekday: "long" });
  const formattedDate = dateObj.toLocaleDateString("en-US", { month: "long", day: "numeric" });

  return (
    <div className="mb-8 pl-4 border-l-2 border-base-300 relative">
      <div className="absolute -left-[9px] top-2 w-4 h-4 rounded-full bg-primary ring-4 ring-base-100"></div>
      <h3 className="flex items-center gap-2 text-xl font-bold mb-4">
        {formattedDate}{" "}
        <span className="text-sm opacity-70 font-normal">
          {dayName}, Day {day.dayNumber}
        </span>
      </h3>

      <div className="flex flex-col gap-0">
        {day.activities.map((act, index) => {
          // Find opening hours for this day
          const hoursToday = act.vibe.openingHours?.weekday_text?.find((t) => t.startsWith(dayName))?.split(": ")[1];

          return (
            <div key={act.id}>
              {(act.transitNote || act.transitDetails) && index > 0 && (
                <div className="flex items-center gap-2 py-4 ml-6 border-l border-dashed border-base-300">
                  <div className="w-2 h-2 rounded-full bg-accent -ml-[4.5px]"></div>
                  <TransitIndicator activity={act} onUpdate={onUpdate} />
                </div>
              )}

              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="card bg-base-100 shadow-sm border border-base-200 mb-2 overflow-hidden"
              >
                <div className="flex flex-col sm:flex-row">
                  {/* Photo Section */}
                  {act.vibe.photos && act.vibe.photos.length > 0 ? (
                    <div className="h-40 sm:h-auto sm:w-40 shrink-0 overflow-x-auto carousel carousel-center bg-base-300 space-x-0 relative scrollbar-hide">
                      {act.vibe.photos.map((p, i) => (
                        <div key={i} className="carousel-item w-40 h-full">
                          <img src={p.url} className="w-full h-full object-cover" alt={act.vibe.title} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <VibeImage vibe={act.vibe} className="h-40 sm:h-auto sm:w-40" />
                  )}

                  <div className="card-body p-3 flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="badge badge-sm badge-neutral">{act.startTime}</span>
                          <span className="text-[10px] uppercase tracking-wider font-bold opacity-70">
                            {act.vibe.category}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm sm:text-base leading-tight">{act.vibe.title}</h4>
                        <p className="text-xs sm:text-sm text-base-content/80 mt-1 line-clamp-2">{act.note}</p>
                        {act.vibe.address && (
                          <p className="text-xs opacity-70 mt-0.5 truncate max-w-[200px]">{act.vibe.address}</p>
                        )}

                        <div className="flex flex-wrap items-center gap-3 mt-2">
                          {act.vibe.rating && (
                            <div className="flex items-center gap-1 text-xs font-bold bg-base-200 px-1.5 py-0.5 rounded">
                              <Star className="w-3 h-3 fill-warning text-warning" />
                              <span>{act.vibe.rating}</span>
                            </div>
                          )}

                          {hoursToday && (
                            <div className="text-[10px] border border-base-300 px-1.5 py-0.5 rounded opacity-70">
                              {hoursToday === "Closed" ? (
                                <span className="text-error">Closed</span>
                              ) : (
                                <span>{hoursToday}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="dropdown dropdown-end">
                        <div tabIndex={0} role="button" className="btn btn-xs btn-ghost btn-square">
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
                        </div>
                        <ul
                          tabIndex={0}
                          className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-32 text-xs"
                        >
                          <li>
                            <a onClick={() => onMoveActivity?.(act.id)} className="">
                              Move to Day...
                            </a>
                          </li>
                          <li>
                            <a onClick={() => onRemove?.(act.id)} className="text-error">
                              Remove
                            </a>
                          </li>
                        </ul>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-dashed border-base-200">
                      {act.vibe.website && (
                        <a
                          href={act.vibe.website}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-xs btn-ghost gap-1 opacity-70 hover:opacity-100 px-1 h-6 min-h-0"
                        >
                          <Globe className="w-3 h-3" />
                          Website
                        </a>
                      )}
                      {act.vibe.phone && (
                        <a
                          href={`tel:${act.vibe.phone}`}
                          className="btn btn-xs btn-ghost gap-1 opacity-70 hover:opacity-100 px-1 h-6 min-h-0"
                        >
                          <Phone className="w-3 h-3" />
                          Call
                        </a>
                      )}
                      {act.vibe.lat &&
                        act.vibe.lng &&
                        (() => {
                          const prevAct = index > 0 ? day.activities[index - 1] : null;
                          const hasOrigin = prevAct?.vibe.lat && prevAct?.vibe.lng;
                          const originParam = hasOrigin ? `&origin=${prevAct.vibe.lat},${prevAct.vibe.lng}` : "";
                          return (
                            <a
                              href={`https://www.google.com/maps/dir/?api=1${originParam}&destination=${act.vibe.lat},${act.vibe.lng}`}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-xs btn-ghost gap-1 opacity-70 hover:opacity-100 px-1 h-6 min-h-0"
                            >
                              <MapPin className="w-3 h-3" />
                              Directions
                            </a>
                          );
                        })()}
                    </div>

                    {act.alternative && (
                      <div className="mt-2 pt-2 border-t border-dashed border-base-300">
                        <details className="group">
                          <summary className="text-[10px] font-bold uppercase cursor-pointer list-none flex items-center gap-1 opacity-70 hover:opacity-100 transition-opacity">
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

                          <div className="mt-2 bg-base-200 p-2 rounded flex gap-3 items-center">
                            {act.alternative.imageUrl && (
                              <VibeImage vibe={act.alternative} className="w-12 h-12 rounded shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-xs truncate">{act.alternative.title}</div>
                              <div className="text-[10px] opacity-70 truncate">{act.alternative.category}</div>
                              {act.alternative.rating && (
                                <div className="flex items-center gap-0.5 text-[10px]">
                                  <Star className="w-2.5 h-2.5 fill-warning text-warning" />
                                  <span>{act.alternative.rating}</span>
                                </div>
                              )}
                            </div>
                            <button className="btn btn-xs btn-primary" onClick={() => onSwap?.(act.id)}>
                              Swap
                            </button>
                          </div>
                        </details>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>

      <button className="btn btn-dash w-full" onClick={() => onAdd?.()}>
        + Add Activity
      </button>
    </div>
  );
}
