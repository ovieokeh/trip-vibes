"use client";

import { useState } from "react";
import { FileDown, Calendar } from "lucide-react";
import { Itinerary } from "@/lib/types";
import { generateItineraryPDF } from "@/lib/export/pdf";
import { generateCalendarFile } from "@/lib/export/calendar";
import { useTranslations } from "next-intl";

interface ItineraryActionsProps {
  itinerary: Itinerary;
  cityName: string;
}

export default function ItineraryActions({ itinerary, cityName }: ItineraryActionsProps) {
  const t = useTranslations("ItineraryActions");
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingCalendar, setIsExportingCalendar] = useState(false);

  const handleDownloadPDF = async () => {
    setIsExportingPDF(true);
    try {
      await generateItineraryPDF(itinerary, cityName);
    } catch (error) {
      console.error("Failed to generate PDF:", error);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleSyncCalendar = () => {
    setIsExportingCalendar(true);
    try {
      generateCalendarFile(itinerary, cityName);
    } catch (error) {
      console.error("Failed to generate calendar file:", error);
    } finally {
      setIsExportingCalendar(false);
    }
  };

  return (
    <div className="flex gap-3 flex-wrap justify-center">
      <button onClick={handleDownloadPDF} disabled={isExportingPDF} className="btn btn-outline btn-sm gap-2">
        <FileDown className="w-4 h-4" />
        {isExportingPDF ? t("generating") : t("downloadPDF")}
      </button>

      <button onClick={handleSyncCalendar} disabled={isExportingCalendar} className="btn btn-outline btn-sm gap-2">
        <Calendar className="w-4 h-4" />
        {isExportingCalendar ? t("exporting") : t("syncCalendar")}
      </button>
    </div>
  );
}
