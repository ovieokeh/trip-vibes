"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { renameItineraryAction, deleteItineraryAction } from "@/lib/db-actions";
import { MoreVertical, Pencil, Trash2, X, Check } from "lucide-react";

import ConfirmModal from "@/components/ConfirmModal";

export default function TripControls({ id, initialName }: { id: string; initialName: string }) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const router = useRouter();

  const handleRename = async () => {
    if (!name.trim()) return;
    setLoading(true);
    await renameItineraryAction(id, name);
    setIsEditing(false);
    setLoading(false);
    router.refresh();
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
    // document.activeElement instanceof HTMLElement && document.activeElement.blur(); // Close dropdown
  };

  const confirmDelete = async () => {
    setLoading(true);
    try {
      await deleteItineraryAction(id);
      router.push("/saved");
    } catch {
      setLoading(false);
      setShowDeleteConfirm(false);
      alert("Failed to delete trip");
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {isEditing ? (
          <div className="flex items-center gap-1 join">
            <input
              type="text"
              className="input input-bordered join-item w-40 sm:w-64"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              autoFocus
            />
            <button className="btn btn-sm btn-success join-item" onClick={handleRename} disabled={loading}>
              <Check className="w-4 h-4" />
            </button>
            <button
              className="btn btn-sm btn-ghost join-item"
              onClick={() => {
                setIsEditing(false);
                setName(initialName);
              }}
              disabled={loading}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-circle btn-sm">
              <MoreVertical className="w-5 h-5" />
            </div>
            <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
              <li>
                <button onClick={() => setIsEditing(true)}>
                  <Pencil className="w-4 h-4" /> Rename Trip
                </button>
              </li>
              <li>
                <button className="text-error" onClick={handleDeleteClick}>
                  <Trash2 className="w-4 h-4" /> Delete Trip
                </button>
              </li>
            </ul>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Delete Trip"
        message="Are you sure you want to delete this trip? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        type="danger"
        confirmText={loading ? "Deleting..." : "Delete"}
      />
    </>
  );
}
