"use client";

import Link from "next/link";
import { RefreshCcw } from "lucide-react";
import { useStore } from "@/store/useStore";

export default function Navbar() {
  const reset = useStore((state) => state.reset);

  return (
    <div className="navbar bg-base-100/80 backdrop-blur-md sticky top-0 z-50 px-6">
      <div className="flex-1">
        <Link href="/" className="btn btn-ghost text-xl font-bold tracking-tighter normal-case">
          TripVibes
        </Link>
      </div>
      <div className="flex-none">
        <button
          className="btn btn-ghost btn-circle"
          onClick={() => {
            if (confirm("Reset your trip planning?")) {
              reset();
              window.location.href = "/";
            }
          }}
          aria-label="Reset Trip"
        >
          <RefreshCcw className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
