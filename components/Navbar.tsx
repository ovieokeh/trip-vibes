"use client";

import { Link, usePathname, useRouter } from "@/i18n/routing";
import { Heart, User, Sparkles, UserCircle, Menu, X } from "lucide-react";
import { useStore } from "@/store/useStore";
import { useState, useEffect } from "react";
import ConfirmModal from "./ConfirmModal";
import { AuthModal } from "./AuthModal";
import { useAuth } from "./AuthProvider";
import { useTranslations, useFormatter } from "next-intl";
import LanguageSwitcher from "./LanguageSwitcher";
import CreditsExplainerModal from "./CreditsExplainerModal";

export default function Navbar() {
  const t = useTranslations("Navbar");
  const tc = useTranslations("Confirmation.newTrip");
  const formatIntl = useFormatter();
  const reset = useStore((state) => state.reset);
  const router = useRouter();
  const { user, isAnonymous, credits, loading, isSynced } = useAuth();
  const pathname = usePathname();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCreditsOpen, setIsCreditsOpen] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  // Fetch saved count on client
  useEffect(() => {
    if (isSynced || !isAnonymous) {
      import("@/lib/db-actions").then((mod) => {
        mod.getSavedItinerariesAction().then((saved) => {
          setSavedCount(saved.length);
        });
      });
    }
  }, [isSynced, isAnonymous]);

  const handleNewTrip = () => {
    if (pathname === "/itinerary") {
      setIsConfirmOpen(true);
    } else {
      reset();
      router.push("/");
    }
  };

  // --- Sub-components to avoid duplication ---

  const CreditsDisplay = ({ className = "" }: { className?: string }) =>
    !loading &&
    user && (
      <button
        onClick={() => setIsCreditsOpen(true)}
        className={`flex items-center gap-1 text-xs sm:text-sm px-1 sm:px-2 hover:bg-base-200 rounded-lg transition-colors py-1 ${className}`}
      >
        <Sparkles className="w-3.5 h-3.5 sm:w-4 h-4 text-warning" />
        <span className="font-medium">{credits}</span>
      </button>
    );

  const NewTripButton = ({ className = "" }: { className?: string }) => (
    <button
      className={`btn btn-primary btn-sm rounded-full sm:px-4 ${className}`}
      onClick={handleNewTrip}
      aria-label={t("newTrip")}
    >
      <span className="text-lg leading-none">+</span>
      <span className="hidden sm:inline ml-1">{t("newTrip")}</span>
    </button>
  );

  const SavedVibesButton = ({ className = "" }: { className?: string }) => (
    <Link
      href="/saved"
      className={`btn btn-ghost btn-circle btn-sm sm:btn-md relative ${className}`}
      aria-label={t("saved")}
    >
      <Heart className={`w-4 h-4 sm:w-5 h-5 ${savedCount > 0 ? "fill-error text-error" : ""}`} />
      {savedCount > 0 && (
        <span className="absolute top-0 right-0 badge badge-xs badge-neutral rounded-full w-3 h-3 sm:w-4 sm:h-4 p-0 flex items-center justify-center translate-x-1 translate-y-1 text-[8px] sm:text-[10px]">
          {formatIntl.number(savedCount)}
        </span>
      )}
    </Link>
  );

  const AuthSection = ({ isMobile = false }: { isMobile?: boolean }) => {
    if (loading) return null;

    if (isAnonymous) {
      return (
        <button
          className="btn btn-outline btn-sm gap-2 w-full md:w-auto"
          onClick={() => {
            if (document.activeElement instanceof HTMLElement) {
              document.activeElement.blur();
            }
            setIsAuthOpen(true);
          }}
        >
          <UserCircle className="w-4 h-4" />
          <span>{t("signIn")}</span>
        </button>
      );
    }

    if (user) {
      if (isMobile) {
        return (
          <div className="flex flex-col gap-2 w-full">
            <div className="flex items-center gap-2 px-1 py-2 opacity-70">
              <UserCircle className="w-4 h-4" />
              <span className="text-sm font-medium truncate">{user.email}</span>
            </div>
            <button
              className="btn btn-outline btn-sm w-full"
              onClick={async () => {
                const { createClient } = await import("@/lib/supabase/client");
                await createClient().auth.signOut();
                router.push("/");
              }}
            >
              {t("signOut")}
            </button>
          </div>
        );
      }

      return (
        <div className="dropdown dropdown-end w-full md:w-auto">
          <label
            tabIndex={0}
            className="btn btn-ghost btn-circle avatar placeholder btn-sm sm:btn-md focus:bg-base-200"
          >
            <div className="flex items-center justify-center bg-primary text-primary-content rounded-full w-7 sm:w-8">
              <span className="text-[10px] sm:text-xs">{user.email?.[0]?.toUpperCase() || "U"}</span>
            </div>
          </label>
          <ul
            tabIndex={0}
            className="dropdown-content menu p-2 shadow-2xl bg-base-100 rounded-box w-52 mt-4 border border-base-200 z-[101]"
          >
            <li className="menu-title text-xs opacity-50 truncate px-2 mb-1">{user.email || "Account"}</li>
            <li>
              <button
                className="active:bg-primary active:text-primary-content"
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
      );
    }

    return null;
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

      <CreditsExplainerModal isOpen={isCreditsOpen} onClose={() => setIsCreditsOpen(false)} />

      <div className="navbar bg-base-100/80 backdrop-blur-md sticky top-0 z-50 px-4 sm:px-6 border-b border-base-200/50">
        <div className="flex-1">
          <Link
            href="/"
            className="btn btn-ghost text-lg sm:text-xl font-bold tracking-tighter normal-case px-2 sm:px-4 hover:bg-transparent"
          >
            TripVibes
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-2">
          <CreditsDisplay />
          <LanguageSwitcher />
          <SavedVibesButton />
          <AuthSection />
          <NewTripButton />
        </div>

        {/* Mobile Navigation */}
        <div className="flex md:hidden items-center gap-1">
          <CreditsDisplay />
          <div className="dropdown dropdown-end">
            <label tabIndex={0} role="button" className="btn btn-ghost btn-circle btn-sm">
              <Menu className="w-5 h-5" />
            </label>
            <ul
              tabIndex={0}
              className="dropdown-content menu p-4 shadow-2xl bg-base-100 rounded-2xl w-64 mt-4 border border-base-200 z-[102] gap-4"
            >
              <li className="menu-title text-xs opacity-50 uppercase tracking-widest px-2">{t("menu") || "Menu"}</li>

              <li className="p-0">
                <div className="flex flex-col gap-3 p-0 bg-transparent hover:bg-transparent active:bg-transparent">
                  <div className="flex items-center justify-between w-full px-2">
                    <span className="text-sm font-medium">{t("language") || "Language"}</span>
                    <LanguageSwitcher />
                  </div>

                  <Link
                    href="/saved"
                    className="flex items-center justify-between w-full py-2 px-3 bg-base-200/50 rounded-xl hover:bg-base-200 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4" />
                      <span className="text-sm">{t("saved")}</span>
                    </div>
                    {savedCount > 0 && <span className="badge badge-sm badge-primary font-bold">{savedCount}</span>}
                  </Link>

                  <div className="divider my-0 opacity-50"></div>

                  <div className="px-2">
                    <AuthSection isMobile={true} />
                  </div>

                  <div className="px-2">
                    <NewTripButton className="w-full h-11" />
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
