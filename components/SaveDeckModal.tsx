"use client";

import { useState } from "react";
import { useStore } from "@/store/useStore";
import { saveVibeDeckAction, VibeDeck } from "@/lib/db-actions";

interface SaveDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (deck: VibeDeck) => void;
  onSkip: () => void;
}

export function SaveDeckModal({ isOpen, onClose, onSaved, onSkip }: SaveDeckModalProps) {
  const { likedVibes, vibeProfile } = useStore();
  const [name, setName] = useState(() => generateDefaultName(vibeProfile));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const deck = await saveVibeDeckAction(name.trim(), likedVibes, vibeProfile);
      onSaved(deck);
    } catch (error) {
      console.error("Failed to save deck:", error);
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-xl mb-4">💾 Save Your Vibes?</h3>

        <p className="text-base-content/70 mb-4">
          Save this vibe profile to use for future trips without swiping again.
        </p>

        <div className="form-control mb-4">
          <label className="label">
            <span className="label-text">Deck Name</span>
          </label>
          <input
            type="text"
            className="input input-bordered w-full"
            placeholder="My Travel Vibe"
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
            Skip
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || !name.trim()}>
            {saving ? <span className="loading loading-spinner loading-sm"></span> : "Save & Continue"}
          </button>
        </div>
      </div>
      <div className="modal-backdrop bg-black/50" onClick={onClose}></div>
    </div>
  );
}

function generateDefaultName(profile: { weights: Record<string, number> }): string {
  const traits = Object.entries(profile.weights)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2)
    .map(([trait]) => trait);

  if (traits.length === 0) return "My Vibe Deck";

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  if (traits.length === 1) {
    return `${capitalize(traits[0])} Explorer`;
  }

  return `${capitalize(traits[0])} & ${capitalize(traits[1])}`;
}
