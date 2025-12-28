export function formatDateRange(startDateStr: string, endDateStr: string, locale: string = "en"): string {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  const startMonth = start.toLocaleDateString(locale, { month: "short" });
  const startDay = start.getDate();
  const endMonth = end.toLocaleDateString(locale, { month: "short" });
  const endDay = end.getDate();

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay}-${endDay}`;
  }
  return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
}

export function generateDefaultTripName(
  city: string,
  startDateStr: string,
  endDateStr: string,
  locale: string = "en"
): string {
  if (!startDateStr || !endDateStr) return city; // Simplified to just city name if dates missing
  return `${city} • ${formatDateRange(startDateStr, endDateStr, locale)}`;
}
