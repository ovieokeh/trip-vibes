"use client";

import { useState } from "react";
import { FileDown, Calendar } from "lucide-react";
import { Itinerary } from "@/lib/types";
import { generateItineraryPDF } from "@/lib/export/pdf";
import { generateCalendarFile } from "@/lib/export/calendar";
import { useTranslations, useLocale } from "next-intl";

interface ItineraryActionsProps {
  itinerary: Itinerary;
  cityName: string;
  onRefresh?: () => void;
}

export default function ItineraryActions({ itinerary, cityName, onRefresh }: ItineraryActionsProps) {
  const t = useTranslations("ItineraryActions");
  const tp = useTranslations("PDF");
  const locale = useLocale();
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingCalendar, setIsExportingCalendar] = useState(false);

  const handleDownloadPDF = async () => {
    setIsExportingPDF(true);
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
    <div className="flex flex-col gap-4">
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

      {onRefresh && (
        <div className="flex justify-center">
          <button
            onClick={onRefresh}
            className="btn btn-link btn-xs text-base-content/50 hover:text-primary no-underline"
          >
            {t("freshResults")}
          </button>
        </div>
      )}
    </div>
  );
}
