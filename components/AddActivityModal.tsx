"use client";
import { Vibe } from "@/lib/types";
import { Star, MapPin } from "lucide-react";
import { motion } from "framer-motion";

interface AddActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (vibe: Vibe) => void;
  suggestions: Vibe[];
  isLoading: boolean;
  contextTime?: string; // Optional: show what time we are planning for
}

export default function AddActivityModal({ isOpen, onClose, onSelect, suggestions, isLoading }: AddActivityModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-base-100 rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 border-b border-base-200 flex justify-between items-center">
          <h2 className="text-xl font-bold">Add Activity</h2>
          <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 opacity-70">
              <span className="loading loading-spinner loading-md"></span>
              <span>Finding the best spots for you...</span>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="text-center py-12 opacity-70">
              <p>No more suggestions available for this time.</p>
            </div>
          ) : (
            suggestions.map((vibe) => (
              <div
                key={vibe.id}
                className="card card-side bg-base-100 border border-base-200 shadow-sm hover:shadow-md transition-shadow group"
              >
                <figure className="w-24 h-24 shrink-0 bg-base-300">
                  {vibe.imageUrl ? (
                    <img src={vibe.imageUrl} alt={vibe.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full text-base-content/20">
                      <MapPin />
                    </div>
                  )}
                </figure>
                <div className="card-body p-3 flex-row items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm leading-tight mb-1">{vibe.title}</h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs opacity-70 mb-1">
                      <span className="uppercase tracking-wider font-bold">{vibe.category}</span>
                      {vibe.rating && (
                        <span className="flex items-center gap-0.5">
                          <Star className="w-3 h-3 fill-warning text-warning" />
                          {vibe.rating}
                        </span>
                      )}
                    </div>
                    {vibe.distanceFromContext && vibe.distanceFromContext > 0 && (
                      <div className="text-[10px] flex items-center gap-1 opacity-70">
                        <MapPin className="w-3 h-3" />
                        <span>{vibe.distanceFromContext.toFixed(1)} km away</span>
                      </div>
                    )}
                  </div>
                  <button onClick={() => onSelect(vibe)} className="btn btn-sm btn-primary shrink-0">
                    Add
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
