"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useTranslations } from "next-intl";
import { User, Mail, Sparkles, Trash2, AlertTriangle, ChevronRight, Bookmark } from "lucide-react";
import { getVibeDecksAction, deleteVibeDeckAction, VibeDeck } from "@/lib/db-actions";
import { deleteAccountAction } from "@/lib/auth-actions";
import { useRouter } from "@/i18n/routing";
import ConfirmModal from "@/components/ConfirmModal";
import AlertModal from "@/components/AlertModal";

export default function AccountPage() {
  const t = useTranslations("Account");
  const ta = useTranslations("Auth");
  const { user, credits, loading: authLoading } = useAuth();
  const router = useRouter();

  const [decks, setDecks] = useState<VibeDeck[]>([]);
  const [loadingDecks, setLoadingDecks] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorModal, setErrorModal] = useState<{ isOpen: boolean; title: string; message: string }>({
    isOpen: false,
    title: "",
    message: "",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
      return;
    }

    if (user) {
      getVibeDecksAction().then((data) => {
        setDecks(data);
        setLoadingDecks(false);
      });
    }
  }, [user, authLoading, router]);

  const handleDeleteDeck = async (id: string) => {
    try {
      await deleteVibeDeckAction(id);
      setDecks(decks.filter((d) => d.id !== id));
    } catch (error) {
      console.error("Failed to delete deck:", error);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setIsDeleteModalOpen(false);
    try {
      const result = await deleteAccountAction();
      if (result.success) {
        window.location.href = "/"; // Forced reload to clear all state
      } else {
        setErrorModal({
          isOpen: true,
          title: t("errorDeleting"),
          message: result.error || "Unknown error",
        });
      }
    } catch (error: any) {
      setErrorModal({
        isOpen: true,
        title: t("errorDeleting"),
        message: error.message || "Unknown error",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 space-y-10">
      <header>
        <h1 className="text-3xl font-bold tracking-tight mb-2">{t("title")}</h1>
        <p className="text-base-content/60">{t("profile")}</p>
      </header>

      {/* User Info Card */}
      <section className="card bg-base-100 border border-base-200 shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
          <div className="w-20 h-20 bg-primary text-primary-content rounded-2xl flex items-center justify-center text-3xl font-bold">
            {user.email?.[0].toUpperCase() || "U"}
          </div>
          <div className="space-y-4 flex-1 w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-base-200/50 rounded-xl">
                <Mail className="w-5 h-5 text-primary opacity-70" />
                <div className="overflow-hidden">
                  <p className="text-xs opacity-50 uppercase tracking-wider font-bold">{t("email")}</p>
                  <p className="font-medium truncate">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-base-200/50 rounded-xl">
                <Sparkles className="w-5 h-5 text-warning" />
                <div>
                  <p className="text-xs opacity-50 uppercase tracking-wider font-bold">{t("credits")}</p>
                  <p className="font-bold text-lg">{credits}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Saved Vibes Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Bookmark className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">{t("savedVibes")}</h2>
        </div>

        {loadingDecks ? (
          <div className="flex justify-center p-8">
            <span className="loading loading-spinner loading-md opacity-40"></span>
          </div>
        ) : decks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {decks.map((deck) => (
              <div
                key={deck.id}
                className="card bg-base-200/30 border border-base-200 hover:border-primary/30 transition-all p-4 flex flex-row items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-base">{deck.name}</h3>
                    <p className="text-xs opacity-50">{deck.likedVibes.length} vibes</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteDeck(deck.id)}
                  className="btn btn-ghost btn-sm btn-circle text-error opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Delete Deck"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center bg-base-200/20 rounded-2xl border border-dashed border-base-300">
            <p className="text-base-content/50">{t("noVibes")}</p>
          </div>
        )}
      </section>

      {/* Danger Zone */}
      <section className="pt-8 border-t border-base-200 space-y-4">
        <div className="flex items-center gap-2 text-error">
          <AlertTriangle className="w-5 h-5" />
          <h2 className="text-xl font-bold">{t("dangerZone")}</h2>
        </div>

        <div className="card bg-error/5 border border-error/10 p-6 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          <div className="space-y-1 max-w-xl">
            <h3 className="font-bold text-lg">{t("deleteAccount")}</h3>
            <p className="text-sm opacity-70 leading-relaxed">{t("deleteDescription")}</p>
          </div>
          <button
            className="btn btn-error btn-outline"
            onClick={() => setIsDeleteModalOpen(true)}
            disabled={isDeleting}
          >
            {isDeleting ? <span className="loading loading-spinner loading-sm"></span> : t("deleteAccount")}
          </button>
        </div>
      </section>

      {/* Deletion Confirmation */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title={t("confirmDeleteTitle")}
        message={t("confirmDeleteMessage")}
        type="danger"
        confirmText={t("deleteAccount")}
        onConfirm={handleDeleteAccount}
        onCancel={() => setIsDeleteModalOpen(false)}
      />

      <AlertModal
        isOpen={errorModal.isOpen}
        title={errorModal.title}
        message={errorModal.message}
        type="error"
        onClose={() => setErrorModal({ ...errorModal, isOpen: false })}
      />
    </div>
  );
}
