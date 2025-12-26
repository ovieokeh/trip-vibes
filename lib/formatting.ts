export function formatDateRange(startDateStr: string, endDateStr: string): string {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  const startMonth = start.toLocaleDateString("en-US", { month: "short" });
  const startDay = start.getDate();
  const endMonth = end.toLocaleDateString("en-US", { month: "short" });
  const endDay = end.getDate();

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay}-${endDay}`;
  }
  return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
}

export function generateDefaultTripName(city: string, startDateStr: string, endDateStr: string): string {
  if (!startDateStr || !endDateStr) return `${city} Trip`;
  return `${city} • ${formatDateRange(startDateStr, endDateStr)}`;
}
