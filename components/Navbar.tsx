"use client";

import { Link, usePathname, useRouter } from "@/i18n/routing";
import { Heart } from "lucide-react";
import { useStore } from "@/store/useStore";
import { useState } from "react";
import ConfirmModal from "./ConfirmModal";
import { useTranslations } from "next-intl";

export default function Navbar({ savedCount = 0 }: { savedCount?: number }) {
  const t = useTranslations("Navbar");
  const tc = useTranslations("Confirmation.newTrip");
  const reset = useStore((state) => state.reset);
  const router = useRouter();

  const pathname = usePathname();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleNewTrip = () => {
    if (pathname === "/itinerary") {
      setIsConfirmOpen(true);
    } else {
      reset();
      router.push("/");
    }
  };

  return (
    <>
      <ConfirmModal
        isOpen={isConfirmOpen}
        title={tc("title")}
        message={tc("message")}
        confirmText={tc("confirm")}
        type="warning"
        onConfirm={() => {
          setIsConfirmOpen(false);
          reset();
          router.push("/");
        }}
        onCancel={() => setIsConfirmOpen(false)}
      />
      <div className="navbar bg-base-100/80 backdrop-blur-md sticky top-0 z-50 px-6">
        <div className="flex-1">
          <Link href="/" className="btn btn-ghost text-xl font-bold tracking-tighter normal-case">
            TripVibes
          </Link>
        </div>
        <div className="flex-none flex items-center gap-2">
          <Link href="/saved" className="btn btn-ghost btn-circle relative" aria-label={t("saved")}>
            <Heart className={`w-5 h-5 ${savedCount > 0 ? "fill-error text-error" : ""}`} />
            {savedCount > 0 && (
              <span className="absolute top-0 right-0 badge badge-xs badge-neutral rounded-full w-4 h-4 p-0 flex items-center justify-center translate-x-1 translate-y-1">
                {savedCount}
              </span>
            )}
          </Link>
          <button className="btn btn-primary btn-sm rounded-full" onClick={handleNewTrip} aria-label={t("newTrip")}>
            + {t("newTrip")}
          </button>
        </div>
      </div>
    </>
  );
}
