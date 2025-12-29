"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useTranslations } from "next-intl";

interface PhotoGalleryModalProps {
  isOpen: boolean;
  photos: { url?: string }[];
  initialIndex?: number;
  title?: string;
  onClose: () => void;
}

export default function PhotoGalleryModal({
  isOpen,
  photos,
  initialIndex = 0,
  title,
  onClose,
}: PhotoGalleryModalProps) {
  const t = useTranslations("Common");
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // Reset to initial index when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
    }
  }, [isOpen, initialIndex]);

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  }, [photos.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  }, [photos.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowRight":
          goNext();
          break;
        case "ArrowLeft":
          goPrev();
          break;
        case "Escape":
          onClose();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, goNext, goPrev, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!photos.length) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={onClose}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 btn btn-circle btn-ghost text-white hover:bg-white/20"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Title */}
          {title && (
            <div className="absolute top-4 left-4 z-10 text-white">
              <h3 className="font-bold text-lg">{title}</h3>
              <p className="text-sm opacity-70">
                {currentIndex + 1} / {photos.length}
              </p>
            </div>
          )}

          {/* Main image */}
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="relative max-w-[90vw] max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={photos[currentIndex].url}
              alt={`${t("photo")} ${currentIndex + 1}`}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
          </motion.div>

          {/* Navigation arrows */}
          {photos.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goPrev();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 btn btn-circle btn-ghost text-white hover:bg-white/20"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goNext();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 btn btn-circle btn-ghost text-white hover:bg-white/20"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </>
          )}

          {/* Thumbnail strip */}
          {photos.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 p-2 bg-black/50 rounded-lg max-w-[90vw] overflow-x-auto scrollbar-hide">
              {photos.map((photo, i) => (
                <button
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(i);
                  }}
                  className={`shrink-0 w-16 h-12 rounded overflow-hidden transition-all ${
                    i === currentIndex ? "ring-2 ring-white scale-105" : "opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={photo.url} alt={`${t("thumbnail")} ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
