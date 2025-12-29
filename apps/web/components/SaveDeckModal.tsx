"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/store/useStore";
import { saveVibeDeckAction, VibeDeck } from "@/lib/db-actions";
import { useTranslations } from "next-intl";
import { useAuth } from "./AuthProvider";

interface SaveDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (deck: VibeDeck) => void;
  onSkip: () => void;
  onNeedsAuth: () => void; // Called when auth is needed - parent handles auth modal
  autoSave?: boolean; // If true, save immediately on mount (after auth completes)
}

export function SaveDeckModal({ isOpen, onClose, onSaved, onSkip, onNeedsAuth, autoSave = false }: SaveDeckModalProps) {
  const t = useTranslations("SaveDeck");
  const { likedVibes, vibeProfile } = useStore();
  const { isSynced, loading: authLoading } = useAuth();
  const [name, setName] = useState(() => generateDefaultName(vibeProfile, t));
  const [saving, setSaving] = useState(false);

  // Auto-save if requested (after auth completes)
  useEffect(() => {
    if (autoSave && isOpen && isSynced && !saving && name.trim()) {
      handleSaveInternal();
    }
  }, [autoSave, isOpen, isSynced]);

  const handleSaveInternal = async () => {
    setSaving(true);
    try {
      const deck = await saveVibeDeckAction(name.trim(), likedVibes, vibeProfile);
      onSaved(deck);
    } catch (error) {
      console.error("Failed to save deck:", error);
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return;

    // If user is not synced to DB, notify parent to show auth
    if (!isSynced) {
      onNeedsAuth();
      return;
    }

    await handleSaveInternal();
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-xl mb-4">{t("title")}</h3>

        <p className="text-base-content/70 mb-4">{t("description")}</p>

        <div className="form-control mb-4">
          <label className="label">
            <span className="label-text">{t("deckName")}</span>
          </label>
          <input
            type="text"
            className="input input-bordered w-full"
            placeholder={t("placeholder")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={saving}
          />
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {Object.entries(vibeProfile.weights)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([trait]) => (
              <span key={trait} className="badge badge-primary capitalize">
                {trait}
              </span>
            ))}
        </div>

        <div className="modal-action">
          <button className="btn btn-ghost" onClick={onSkip} disabled={saving}>
            {t("skip")}
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || authLoading || !name.trim()}>
            {saving ? <span className="loading loading-spinner loading-sm"></span> : t("saveAndContinue")}
          </button>
        </div>
      </div>
      <div className="modal-backdrop bg-black/50" onClick={onClose}></div>
    </div>
  );
}

function generateDefaultName(profile: { weights: Record<string, number> }, t: any): string {
  const traits = Object.entries(profile.weights)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2)
    .map(([trait]) => trait);

  if (traits.length === 0) return t("defaultName");

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  if (traits.length === 1) {
    return `${capitalize(traits[0])} ${t("explorer")}`;
  }

  return `${capitalize(traits[0])} & ${capitalize(traits[1])}`;
}
