"use client";

import { motion, PanInfo, useMotionValue, useTransform } from "framer-motion";
import { Vibe } from "@/lib/types";

interface SwipeCardProps {
  vibe: Vibe;
  onSwipe: (direction: "left" | "right") => void;
  style?: React.CSSProperties;
}

export default function SwipeCard({ vibe, onSwipe, style }: SwipeCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  const variants = {
    initial: { scale: 0.9, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: (direction: "left" | "right") => ({
      x: direction === "right" ? 500 : -500,
      opacity: 0,
      scale: 0.5,
      rotate: direction === "right" ? 45 : -45,
      transition: { duration: 0.4 },
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
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      className="absolute w-full max-w-sm h-[60vh] bg-base-100 rounded-3xl shadow-2xl overflow-hidden cursor-grab active:cursor-grabbing touch-none border border-base-200"
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3 }}
    >
      <div className="h-4/6 md:h-3/4 w-full bg-cover bg-center" style={{ backgroundImage: `url(${vibe.imageUrl})` }}>
        <div className="w-full h-full bg-gradient-to-t from-black/60 to-transparent p-6 flex flex-col justify-end">
          {vibe.tags.map((tag) => (
            <span key={tag} className="badge badge-outline text-white/90 mb-1 mr-1">
              {tag}
            </span>
          ))}
        </div>
      </div>
      <div className="p-6 h-2/6 md:h-1/4">
        <h2 className="text-2xl font-bold mb-1">{vibe.title}</h2>
        <p className="text-sm text-base-content/70 line-clamp-3 leading-snug">{vibe.description}</p>
      </div>
    </motion.div>
  );
}
