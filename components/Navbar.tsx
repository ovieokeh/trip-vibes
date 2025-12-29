"use client";

import { Link, usePathname, useRouter } from "@/i18n/routing";
import { Heart, User, Sparkles } from "lucide-react";
import { useStore } from "@/store/useStore";
import { useState } from "react";
import ConfirmModal from "./ConfirmModal";
import { AuthModal } from "./AuthModal";
import { useAuth } from "./AuthProvider";
import { useTranslations, useFormatter } from "next-intl";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Navbar({ savedCount = 0 }: { savedCount?: number }) {
  const t = useTranslations("Navbar");
  const tc = useTranslations("Confirmation.newTrip");
  const formatIntl = useFormatter();
  const reset = useStore((state) => state.reset);
  const router = useRouter();
  const { user, isAnonymous, credits, loading } = useAuth();

  const pathname = usePathname();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

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

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} onSuccess={() => setIsAuthOpen(false)} />

      <div className="navbar bg-base-100/80 backdrop-blur-md sticky top-0 z-50 px-6">
        <div className="flex-1">
          <Link href="/" className="btn btn-ghost text-xl font-bold tracking-tighter normal-case">
            TripVibes
          </Link>
        </div>
        <div className="flex-none flex items-center gap-2">
          {/* Credits Display */}
          {!loading && user && (
            <div className="flex items-center gap-1 text-sm px-2">
              <Sparkles className="w-4 h-4 text-warning" />
              <span className="font-medium">{credits}</span>
            </div>
          )}

          <LanguageSwitcher />

          <Link href="/saved" className="btn btn-ghost btn-circle relative" aria-label={t("saved")}>
            <Heart className={`w-5 h-5 ${savedCount > 0 ? "fill-error text-error" : ""}`} />
            {savedCount > 0 && (
              <span className="absolute top-0 right-0 badge badge-xs badge-neutral rounded-full w-4 h-4 p-0 flex items-center justify-center translate-x-1 translate-y-1">
                {formatIntl.number(savedCount)}
              </span>
            )}
          </Link>

          {/* Auth Button */}
          {!loading && isAnonymous ? (
            <button className="btn btn-outline btn-sm" onClick={() => setIsAuthOpen(true)}>
              {t("signIn")}
            </button>
          ) : !loading && user ? (
            <div className="dropdown dropdown-end">
              <label tabIndex={0} className="btn btn-ghost btn-circle avatar placeholder">
                <div className="bg-primary text-primary-content rounded-full w-8">
                  <span className="text-xs">{user.email?.[0]?.toUpperCase() || "U"}</span>
                </div>
              </label>
              <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52 mt-2">
                <li className="menu-title text-xs opacity-50 truncate px-2">{user.email || "Account"}</li>
                <li>
                  <button
                    onClick={async () => {
                      const { createClient } = await import("@/lib/supabase/client");
                      await createClient().auth.signOut();
                      router.push("/");
                    }}
                  >
                    {t("signOut")}
                  </button>
                </li>
              </ul>
            </div>
          ) : null}

          <button className="btn btn-primary btn-sm rounded-full" onClick={handleNewTrip} aria-label={t("newTrip")}>
            + {t("newTrip")}
          </button>
        </div>
      </div>
    </>
  );
}
