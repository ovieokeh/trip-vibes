"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { renameItineraryAction, deleteItineraryAction } from "@/lib/db-actions";
import { MoreVertical, Pencil, Trash2, X, Check } from "lucide-react";

export default function TripControls({ id, initialName }: { id: string; initialName: string }) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRename = async () => {
    if (!name.trim()) return;
    setLoading(true);
    await renameItineraryAction(id, name);
    setIsEditing(false);
    setLoading(false);
    router.refresh();
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this trip?")) {
      setLoading(true);
      await deleteItineraryAction(id);
      router.push("/saved");
      router.refresh();
    }
  };

  return (
    <div className="flex items-center gap-2">
      {isEditing ? (
        <div className="flex items-center gap-1 join">
          <input
            type="text"
            className="input input-sm input-bordered join-item w-40 sm:w-64"
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
              <button className="text-error" onClick={handleDelete}>
                <Trash2 className="w-4 h-4" /> Delete Trip
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
