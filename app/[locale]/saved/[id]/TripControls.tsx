"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { renameItineraryAction, deleteItineraryAction } from "@/lib/db-actions";
import { MoreVertical, Pencil, Trash2, X, Check, FileDown, Calendar } from "lucide-react";
import { Itinerary } from "@/lib/types";
import { generateItineraryPDF } from "@/lib/export/pdf";
import { generateCalendarFile } from "@/lib/export/calendar";
import { useTranslations, useLocale } from "next-intl";

import ConfirmModal from "@/components/ConfirmModal";

interface TripControlsProps {
  id: string;
  initialName: string;
  itinerary: Itinerary;
  cityName: string;
}

export default function TripControls({ id, initialName, itinerary, cityName }: TripControlsProps) {
  const t = useTranslations("TripControls");
  const ta = useTranslations("ItineraryActions");
  const tc = useTranslations("Confirmation.deleteTrip");
  const tp = useTranslations("PDF");
  const locale = useLocale();
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
  };

  const confirmDelete = async () => {
    setLoading(true);
    try {
      await deleteItineraryAction(id);
      router.push("/saved");
    } catch {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      await generateItineraryPDF(itinerary, cityName, locale, {
        day: tp("day"),
        generatedBy: tp("generatedBy"),
        page: tp("page"),
        of: tp("of"),
        viewMap: tp("viewMap"),
        call: tp("call"),
      });
    } catch (error) {
      console.error("Failed to generate PDF:", error);
    }
  };

  const handleSyncCalendar = () => {
    try {
      generateCalendarFile(itinerary, cityName);
    } catch (error) {
      console.error("Failed to generate calendar file:", error);
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
                  <Pencil className="w-4 h-4" /> {t("rename")}
                </button>
              </li>
              <li>
                <button onClick={handleDownloadPDF}>
                  <FileDown className="w-4 h-4" /> {ta("downloadPDF")}
                </button>
              </li>
              <li>
                <button onClick={handleSyncCalendar}>
                  <Calendar className="w-4 h-4" /> {ta("syncCalendar")}
                </button>
              </li>
              <div className="divider my-1"></div>
              <li>
                <button className="text-error" onClick={handleDeleteClick}>
                  <Trash2 className="w-4 h-4" /> {t("delete")}
                </button>
              </li>
            </ul>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title={tc("title")}
        message={tc("message")}
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        type="danger"
        confirmText={loading ? tc("deleting") : tc("confirm")}
      />
    </>
  );
}
