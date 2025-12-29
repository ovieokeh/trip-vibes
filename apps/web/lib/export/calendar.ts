import { Itinerary, TripActivity } from "@/lib/types";

/**
 * Convert a date string and time string to UTC formatted for ICS (YYYYMMDDTHHMMSSZ)
 * Assumes the date is in ISO format (YYYY-MM-DD) and time is in HH:MM format
 */
function toICSDateTime(dateStr: string, timeStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hours, minutes] = timeStr.split(":").map(Number);

  // Format for ICS (local time without Z suffix - indicates local timezone)
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${year}${pad(month)}${pad(day)}T${pad(hours)}${pad(minutes)}00`;
}

/**
 * Escape special characters for ICS format
 */
function escapeICS(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

/**
 * Generate a unique ID for calendar events
 */
function generateUID(activityId: string, dateStr: string): string {
  return `${activityId}-${dateStr}@tripvibes.app`;
}

/**
 * Create an ICS event from a trip activity
 */
function createEvent(activity: TripActivity, dateStr: string, tripName: string): string {
  const dtStart = toICSDateTime(dateStr, activity.startTime);
  const dtEnd = toICSDateTime(dateStr, activity.endTime);
  const uid = generateUID(activity.id, dateStr);
  const now = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  let description = activity.vibe.description || "";
  if (activity.transitNote) {
    description = `Transit: ${activity.transitNote}\n\n${description}`;
  }
  if (activity.vibe.website) {
    description += `\n\nWebsite: ${activity.vibe.website}`;
  }

  let location = activity.vibe.address || "";
  // Add coordinates for map linking
  const hasCoords = activity.vibe.lat && activity.vibe.lng;

  const lines: string[] = [
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeICS(activity.vibe.title)}`,
  ];

  if (description) {
    lines.push(`DESCRIPTION:${escapeICS(description)}`);
  }

  if (location) {
    lines.push(`LOCATION:${escapeICS(location)}`);
  }

  if (hasCoords) {
    lines.push(`GEO:${activity.vibe.lat};${activity.vibe.lng}`);
  }

  lines.push(`CATEGORIES:${escapeICS(tripName)},TripVibes`);
  lines.push("END:VEVENT");

  return lines.join("\r\n");
}

/**
 * Generate an ICS calendar file for the itinerary
 */
export function generateCalendarFile(itinerary: Itinerary, cityName: string): void {
  const tripName = itinerary.name || `Trip to ${cityName}`;
  const now = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  const events: string[] = [];

  for (const day of itinerary.days) {
    for (const activity of day.activities) {
      events.push(createEvent(activity, day.date, tripName));
    }
  }

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//TripVibes//TripVibes Itinerary//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeICS(tripName)}`,
    `X-WR-CALDESC:${escapeICS(`Your TripVibes itinerary for ${cityName}`)}`,
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");

  // Create and download file
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${tripName.replace(/[^a-zA-Z0-9]/g, "_")}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
