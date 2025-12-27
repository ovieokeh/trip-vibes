"use client";

import { Vibe } from "@/lib/types";
import { ImageIcon } from "lucide-react";
import { useState } from "react";

interface VibeImageProps {
  vibe: Vibe;
  className?: string;
  style?: React.CSSProperties;
}

export default function VibeImage({ vibe, className = "", style = {} }: VibeImageProps) {
  // Priority:
  // 1. vibe.imageUrl (existing specific URL)
  // 2. vibe.photos[0].url (Google photos)
  // 3. Category placeholder

  const initialSrc = vibe.imageUrl || (vibe.photos && vibe.photos.length > 0 ? vibe.photos[0].url : "");
  const [src, setSrc] = useState(initialSrc);
  const [hasError, setHasError] = useState(false);

  const containerClasses = `relative flex items-center justify-center bg-base-200 overflow-hidden ${className}`;

  if (!src || hasError) {
    return (
      <div className={containerClasses} style={style}>
        <div className="flex flex-col items-center justify-center text-base-content/20 gap-1">
          <ImageIcon className="w-8 h-8" />
          <span className="text-[10px] font-medium uppercase tracking-wider opacity-70">
            {vibe.category || "Place"}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClasses} style={style}>
      <img
        src={src}
        alt={vibe.title}
        className="w-full h-full object-cover"
        onError={() => {
          setHasError(true);
        }}
      />
    </div>
  );
}
