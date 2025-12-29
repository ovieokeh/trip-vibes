"use client";

import { DayPlan, Vibe, TripActivity } from "@/lib/types";
import { motion } from "framer-motion";
import { Star, Globe, Phone, MapPin } from "lucide-react";
import { useState } from "react";
import VibeImage from "./VibeImage";
import PhotoGalleryModal from "./PhotoGalleryModal";
import { useTranslations, useFormatter } from "next-intl";

import { estimateTravelTime } from "@/lib/geo";

function TransitIndicator({
  activity,
  onUpdate,
}: {
  activity: TripActivity;
  onUpdate?: (actId: string, updates: Partial<TripActivity>) => void;
}) {
  const t = useTranslations("ItineraryDay");
  const formatIntl = useFormatter();
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
        {activity.transitNote || t("gettingThere")}
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
            {formatIntl.number(details.durationMinutes)} min {t(`transit.${details.mode}` as any)}
          </span>
        </div>
        <ul
          tabIndex={0}
          className="dropdown-content z-[1] menu p-1 shadow bg-base-100 rounded-box w-32 border border-base-200"
        >
          <li>
            <a onClick={() => handleModeChange("walking")} className="text-xs py-1">
              {t("transit.walking")}
            </a>
          </li>
          <li>
            <a onClick={() => handleModeChange("transit")} className="text-xs py-1">
              {t("transit.transit")}
            </a>
          </li>
          <li>
            <a onClick={() => handleModeChange("driving")} className="text-xs py-1">
              {t("transit.driving")}
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default function ItineraryDay({
  day,
  onRemove,
  onAdd,
  onUpdate,
  onMoveActivity,
}: {
  day: DayPlan;
  onRemove?: (id: string) => void;
  onAdd?: (afterIndex?: number) => void;
  onUpdate?: (actId: string, updates: Partial<TripActivity>) => void;
  onMoveActivity?: (actId: string) => void;
}) {
  const t = useTranslations("ItineraryDay");
  const formatIntl = useFormatter();
  // Gallery modal state
  const [galleryState, setGalleryState] = useState<{
    isOpen: boolean;
    photos: { url?: string }[];
    initialIndex: number;
    title: string;
  }>({
    isOpen: false,
    photos: [],
    initialIndex: 0,
    title: "",
  });

  const openGallery = (photos: { url?: string }[], index: number, title: string) => {
    setGalleryState({ isOpen: true, photos, initialIndex: index, title });
  };

  const closeGallery = () => {
    setGalleryState((prev) => ({ ...prev, isOpen: false }));
  };

  // Get day name for opening hours lookup, e.g. "Monday"
  // Parse date securely to avoid timezone shifts (YYYY-MM-DD to local time)
  const [year, month, d] = day.date.split("-").map(Number);
  const dateObj = new Date(year, month - 1, d);

  const dayName = dateObj.toLocaleDateString("en-US", { weekday: "long" });
  const displayDayName = formatIntl.dateTime(dateObj, { weekday: "long" });
  const formattedDate = formatIntl.dateTime(dateObj, { month: "long", day: "numeric" });

  return (
    <>
      <PhotoGalleryModal
        isOpen={galleryState.isOpen}
        photos={galleryState.photos}
        initialIndex={galleryState.initialIndex}
        title={galleryState.title}
        onClose={closeGallery}
      />

      <div className="mb-8 pl-4 border-l-2 border-base-300 relative">
        <div className="absolute -left-[9px] top-2 w-4 h-4 rounded-full bg-primary ring-4 ring-base-100"></div>
        <h3 className="flex items-center gap-2 text-xl font-bold mb-4">
          {formattedDate}{" "}
          <span className="text-sm opacity-70 font-normal">
            {displayDayName}, {t("day")} {day.dayNumber}
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
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.15, duration: 0.4 }}
                  className="card bg-base-100 shadow-md hover:shadow-lg border border-base-200/50 mb-2 overflow-hidden transition-shadow duration-200"
                >
                  {/* Mobile: Horizontal carousel at top */}
                  {act.vibe.photos && act.vibe.photos.length > 0 ? (
                    <>
                      {/* Mobile Layout - Main Photo + Thumbnails Row */}
                      <div className="sm:hidden flex flex-col gap-1">
                        {/* Main large photo */}
                        <div
                          className="h-48 w-full cursor-pointer overflow-hidden"
                          onClick={() => openGallery(act.vibe.photos!, 0, act.vibe.title)}
                        >
                          <img
                            src={act.vibe.photos[0].url}
                            className="w-full h-full object-cover active:scale-95 transition-transform"
                            alt={act.vibe.title}
                          />
                        </div>

                        {/* Thumbnails row (max 4) */}
                        {act.vibe.photos.length > 1 && (
                          <div className="grid grid-cols-4 gap-1 h-14">
                            {act.vibe.photos.slice(1, 4).map((p, i) => {
                              const photoIndex = i + 1;
                              const isLast = i === 2;
                              const remaining = act.vibe.photos!.length - 4;

                              return (
                                <div
                                  key={i}
                                  className="relative cursor-pointer overflow-hidden"
                                  onClick={() => openGallery(act.vibe.photos!, photoIndex, act.vibe.title)}
                                >
                                  <img
                                    src={p.url}
                                    className="w-full h-full object-cover active:scale-95 transition-transform"
                                    alt={`${act.vibe.title} ${photoIndex + 1}`}
                                  />
                                  {isLast && remaining > 0 && (
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
                                      <span className="text-white text-xs font-bold">+{remaining}</span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Desktop Layout - Photo Grid */}
                      <div className="hidden sm:block">
                        <div
                          className={`grid gap-1 h-48 ${
                            act.vibe.photos.length === 1
                              ? "grid-cols-1"
                              : act.vibe.photos.length === 2
                              ? "grid-cols-2"
                              : act.vibe.photos.length === 3
                              ? "grid-cols-3"
                              : "grid-cols-4"
                          }`}
                        >
                          {act.vibe.photos.slice(0, 4).map((p, i) => (
                            <div
                              key={i}
                              className={`relative overflow-hidden cursor-pointer ${
                                act.vibe.photos!.length === 3 && i === 0 ? "row-span-1" : ""
                              }`}
                              onClick={() => openGallery(act.vibe.photos!, i, act.vibe.title)}
                            >
                              <img
                                src={p.url}
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                alt={`${act.vibe.title} ${i + 1}`}
                              />
                              {/* Show remaining count on last visible image */}
                              {i === 3 && act.vibe.photos!.length > 4 && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center pointer-events-none">
                                  <span className="text-white font-bold text-lg">+{act.vibe.photos!.length - 4}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <VibeImage vibe={act.vibe} className="h-40 sm:h-48 w-full" />
                  )}

                  <div className="card-body p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="badge badge-sm badge-neutral font-mono">{act.startTime}</span>
                          <span className="badge badge-sm badge-ghost uppercase tracking-wider text-[10px]">
                            {act.vibe.category}
                          </span>
                        </div>
                        <h4 className="font-bold text-base sm:text-lg leading-tight">{act.vibe.title}</h4>
                        <p className="text-sm text-base-content/70 mt-1 line-clamp-2">{act.note}</p>
                        {act.vibe.address && <p className="text-xs opacity-80 mt-1 truncate">{act.vibe.address}</p>}

                        <div className="flex flex-wrap items-center gap-3 mt-3">
                          {act.vibe.rating && (
                            <div className="flex items-center gap-1 text-xs font-bold bg-warning/10 text-warning px-2 py-1 rounded-full">
                              <Star className="w-3.5 h-3.5 fill-warning" />
                              <span>{formatIntl.number(act.vibe.rating)}</span>
                            </div>
                          )}

                          {hoursToday && (
                            <div
                              className={`text-xs px-2 py-1 rounded-full ${
                                hoursToday === "Closed" ? "bg-error/10 text-error" : "bg-success/10 text-success"
                              }`}
                            >
                              {hoursToday === "Closed" ? t("closed") : hoursToday}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="dropdown dropdown-end">
                        <div tabIndex={0} role="button" className="btn btn-sm btn-ghost btn-square">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
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
                          className="dropdown-content z-[1] menu p-2 shadow-lg bg-base-100 rounded-box w-40 text-sm border border-base-200"
                        >
                          <li>
                            <a onClick={() => onMoveActivity?.(act.id)}>{t("moveToDay")}</a>
                          </li>
                          <li>
                            <a onClick={() => onRemove?.(act.id)} className="text-error">
                              {t("remove")}
                            </a>
                          </li>
                        </ul>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-base-200">
                      {act.vibe.website && (
                        <a
                          href={act.vibe.website}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-sm btn-ghost gap-1.5 hover:bg-primary/10 hover:text-primary transition-colors"
                        >
                          <Globe className="w-4 h-4" />
                          {t("website")}
                        </a>
                      )}
                      {act.vibe.phone && (
                        <a
                          href={`tel:${act.vibe.phone}`}
                          className="btn btn-sm btn-ghost gap-1.5 hover:bg-primary/10 hover:text-primary transition-colors"
                        >
                          <Phone className="w-4 h-4" />
                          {t("call")}
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
                              className="btn btn-sm btn-ghost gap-1.5 hover:bg-primary/10 hover:text-primary transition-colors"
                            >
                              <MapPin className="w-4 h-4" />
                              {t("directions")}
                            </a>
                          );
                        })()}
                    </div>
                  </div>
                </motion.div>

                {/* Add Activity Button - appears after each item */}
                <button
                  className="w-full my-3 py-2 px-4 rounded-lg border-2 border-dashed border-base-300 text-base-content/50 text-sm font-medium hover:border-primary hover:text-primary hover:bg-primary/5 transition-all duration-200 flex items-center justify-center gap-2"
                  onClick={() => onAdd?.(index)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  {t("addActivity")}
                </button>
              </div>
            );
          })}

          {/* Empty day - show add button */}
          {day.activities.length === 0 && (
            <button
              className="w-full py-3 px-4 rounded-lg border-2 border-dashed border-base-300 text-base-content/50 text-sm font-medium hover:border-primary hover:text-primary hover:bg-primary/5 transition-all duration-200 flex items-center justify-center gap-2"
              onClick={() => onAdd?.()}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              {t("addFirstActivity")}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
