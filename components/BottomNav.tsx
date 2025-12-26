"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Map, Heart } from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="dock dock-sm fixed bottom-4 left-4 right-4 z-50 rounded-box border border-base-content/10 bg-base-100/90 shadow-lg backdrop-blur mx-auto max-w-sm">
      <Link href="/" className={`${pathname === "/" ? "active" : ""}`}>
        <Compass className="h-6 w-6" />
        <span className="btm-nav-label text-xs mt-1">New Trip</span>
      </Link>

      <Link href="/saved" className={`${pathname.startsWith("/saved") ? "active" : ""}`}>
        <Heart className="h-6 w-6" />
        <span className="btm-nav-label text-xs mt-1">Saved</span>
      </Link>
    </div>
  );
}
