"use client";

import { useState, useEffect } from "react";
import { VibeDeck, getVibeDecksAction, deleteVibeDeckAction } from "@/lib/db-actions";
import { useTranslations } from "next-intl";

interface DeckSelectorProps {
  onSelect: (deck: VibeDeck) => void;
  onSwipeFresh: () => void;
}

export function DeckSelector({ onSelect, onSwipeFresh }: DeckSelectorProps) {
  const t = useTranslations("DeckSelector");
  const [decks, setDecks] = useState<VibeDeck[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadDecks();
  }, []);

  const loadDecks = async () => {
    setLoading(true);
    const data = await getVibeDecksAction();
    setDecks(data);
    setLoading(false);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(id);
    await deleteVibeDeckAction(id);
    setDecks((prev) => prev.filter((d) => d.id !== id));
    setDeletingId(null);
  };

  const getTopTraits = (profile: VibeDeck["vibeProfile"]) => {
    return Object.entries(profile.weights)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([trait]) => trait);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (decks.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-base-content/60 mb-4">{t("empty")}</p>
        <button className="btn btn-primary" onClick={onSwipeFresh}>
          {t("startSwiping")}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-center mb-4">{t("title")}</h3>

      <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
        {decks.map((deck) => (
          <div
            key={deck.id}
            className="card bg-base-200 hover:bg-base-300 transition-colors cursor-pointer"
            onClick={() => onSelect(deck)}
          >
            <div className="card-body p-4">
              <div className="flex items-center justify-between">
                <h4 className="card-title text-base">{deck.name}</h4>
                <button
                  className="btn btn-ghost btn-xs btn-square text-error hover:bg-error/20"
                  onClick={(e) => handleDelete(deck.id, e)}
                  disabled={deletingId === deck.id}
                >
                  {deletingId === deck.id ? (
                    <span className="loading loading-spinner loading-xs"></span>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  )}
                </button>
              </div>

              <div className="flex flex-wrap gap-1 mt-2">
                {getTopTraits(deck.vibeProfile).map((trait) => (
                  <span key={trait} className="badge badge-primary badge-sm capitalize">
                    {trait}
                  </span>
                ))}
              </div>

              <div className="text-xs text-base-content/50 mt-2">
                {deck.likedVibes.length} {t("vibes")} • {t("created")}{" "}
                {deck.createdAt ? new Date(deck.createdAt).toLocaleDateString() : t("recently")}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="divider">{t("or")}</div>

      <button className="btn btn-outline btn-block" onClick={onSwipeFresh}>
        {t("startFresh")}
      </button>
    </div>
  );
}
