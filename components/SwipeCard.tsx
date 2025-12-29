"use client";

import { motion, PanInfo, useMotionValue, useTransform } from "framer-motion";
import { Vibe } from "@/lib/types";
import { Heart, X } from "lucide-react";

interface SwipeCardProps {
  vibe: Vibe;
  onSwipe: (direction: "left" | "right") => void;
  style?: React.CSSProperties;
  isTop?: boolean; // Whether this is the top card (for showing overlays)
}

export default function SwipeCard({ vibe, onSwipe, style, isTop = true }: SwipeCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  // Overlay opacities tied to drag direction
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0]);

  const variants = {
    initial: { scale: 0.95, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: (direction: "left" | "right") => ({
      x: direction === "right" ? 400 : -400,
      opacity: 0,
      scale: 0.8,
      rotate: direction === "right" ? 20 : -20,
      transition: { duration: 0.35 },
    }),
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x > 100) {
      onSwipe("right");
    } else if (info.offset.x < -100) {
      onSwipe("left");
    }
  };

  return (
    <motion.div
      style={{ x, rotate, opacity, ...style }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      className="absolute w-full max-w-sm h-[60vh] bg-base-100 rounded-3xl shadow-2xl overflow-hidden cursor-grab active:cursor-grabbing touch-none border border-base-200"
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3, ease: "easeOut" }}
      whileTap={{ cursor: "grabbing" }}
    >
      {/* Like Overlay */}
      {isTop && (
        <motion.div
          className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
          style={{ opacity: likeOpacity }}
        >
          <div className="absolute top-6 left-6 rotate-[-15deg]">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl border-4 border-success bg-success/20 backdrop-blur-sm">
              <Heart className="w-8 h-8 text-success fill-success" />
              <span className="text-2xl font-black text-success tracking-tight">LIKE</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Nope Overlay */}
      {isTop && (
        <motion.div
          className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
          style={{ opacity: nopeOpacity }}
        >
          <div className="absolute top-6 right-6 rotate-[15deg]">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl border-4 border-error bg-error/20 backdrop-blur-sm">
              <X className="w-8 h-8 text-error" />
              <span className="text-2xl font-black text-error tracking-tight">NOPE</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Card image */}
      <div
        className="h-4/6 md:h-3/4 w-full bg-cover bg-center relative"
        style={{ backgroundImage: `url(${vibe.imageUrl})` }}
      >
        {/* Subtle direction glow */}
        {isTop && (
          <>
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent to-success/30 pointer-events-none"
              style={{ opacity: likeOpacity }}
            />
            <motion.div
              className="absolute inset-0 bg-gradient-to-l from-transparent to-error/30 pointer-events-none"
              style={{ opacity: nopeOpacity }}
            />
          </>
        )}

        <div className="w-full h-full bg-gradient-to-t from-black/70 via-black/20 to-transparent p-6 flex flex-col justify-end relative z-10">
          <div className="flex flex-wrap gap-1">
            {vibe.tags.map((tag) => (
              <span
                key={tag}
                className="badge badge-sm bg-white/20 backdrop-blur-sm text-white border-white/30 font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Card content */}
      <div className="p-5 h-2/6 md:h-1/4 bg-base-100">
        <h2 className="text-xl font-bold mb-1 text-base-content">{vibe.title}</h2>
        <p className="text-sm text-base-content/60 line-clamp-2 leading-relaxed">{vibe.description}</p>
      </div>
    </motion.div>
  );
}
