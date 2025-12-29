"use client";
import { Vibe } from "@/lib/types";
import { Star, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import VibeImage from "./VibeImage";
import { useTranslations } from "next-intl";

interface AddActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (vibe: Vibe) => void;
  suggestions: Vibe[];
  isLoading: boolean;
  contextTime?: string; // Optional: show what time we are planning for
}

export default function AddActivityModal({ isOpen, onClose, onSelect, suggestions, isLoading }: AddActivityModalProps) {
  const t = useTranslations("AddActivity");

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
        className="bg-base-100 rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-base-200 flex justify-between items-center">
          <h2 className="text-xl font-bold">{t("title")}</h2>
          <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 opacity-70">
              <span className="loading loading-spinner loading-md"></span>
              <span>{t("searching")}</span>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="text-center py-12 opacity-70">
              <p>{t("noSuggestions")}</p>
            </div>
          ) : (
            suggestions.map((vibe) => (
              <div
                key={vibe.id}
                className="card card-side bg-base-100 border border-base-200 shadow-sm hover:shadow-md transition-shadow group h-32"
              >
                <figure className="w-32 shrink-0 relative h-full flex items-center justify-center overflow-hidden">
                  <VibeImage vibe={vibe} className="w-full h-full" />

                  {/* Price Level - Only show if valid integer > 0 */}
                  {vibe.priceLevel !== undefined && Math.floor(vibe.priceLevel) > 0 && (
                    <div className="absolute bottom-1 right-1 bg-black/30 text-white text-[10px] px-1.5 py-0.5 rounded backdrop-blur-sm shadow-sm h-4 w-fit">
                      {"$".repeat(Math.min(4, Math.max(1, Math.floor(vibe.priceLevel))))}
                    </div>
                  )}
                </figure>
                <div className="card-body p-3 flex flex-row items-start gap-3 h-full overflow-hidden">
                  <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-sm leading-tight line-clamp-1" title={vibe.title}>
                          {vibe.title}
                        </h3>
                        {vibe.rating && (
                          <div className="flex items-center gap-0.5 text-xs font-medium shrink-0 bg-base-200 px-1 rounded">
                            <Star className="w-3 h-3 fill-warning text-warning" />
                            {vibe.rating}
                          </div>
                        )}
                      </div>

                      <div className="text-xs text-base-content/70 mt-1 line-clamp-1">
                        {vibe.neighborhood || vibe.category}
                      </div>

                      <p className="text-xs text-base-content/60 mt-1 line-clamp-2 leading-relaxed">
                        {vibe.description || vibe.address || t("noDescription")}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 mt-auto pt-2">
                      {vibe.tags && vibe.tags.length > 0 && (
                        <div className="flex gap-1 overflow-hidden">
                          {vibe.tags.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="badge badge-xs badge-ghost text-[10px] whitespace-nowrap px-1 border-base-300"
                            >
                              {tag}
                            </span>
                          ))}
                          {vibe.tags.length > 2 && (
                            <span className="text-[10px] opacity-50">+{vibe.tags.length - 2}</span>
                          )}
                        </div>
                      )}

                      {vibe.distanceFromContext !== undefined && vibe.distanceFromContext > 0 && (
                        <div className="text-[10px] flex items-center gap-1 opacity-60 ml-auto shrink-0">
                          <MapPin className="w-3 h-3" />
                          <span>{vibe.distanceFromContext.toFixed(1)} km</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => onSelect(vibe)}
                    className="btn btn-sm btn-primary shrink-0 self-center"
                    aria-label={`Add ${vibe.title}`}
                  >
                    {t("add")}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
