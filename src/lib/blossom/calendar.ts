export type CalendarSession = {
  id: string;
  title: string;
  startsAt: string;
  durationMinutes: number;
  teacherName: string;
  learnerName: string;
};

function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function utcBasic(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error("invalid-calendar-date");
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function foldLine(line: string): string[] {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return [line];

  const parts: string[] = [];
  let current = "";
  let currentBytes = 0;
  for (const char of line) {
    const size = new TextEncoder().encode(char).length;
    if (current && currentBytes + size > 75) {
      parts.push(current);
      current = " " + char;
      currentBytes = 1 + size;
    } else {
      current += char;
      currentBytes += size;
    }
  }
  if (current) parts.push(current);
  return parts;
}

export function teacherSessionToIcs(
  session: CalendarSession,
  stamp = new Date().toISOString(),
): string {
  const start = new Date(session.startsAt);
  if (Number.isNaN(start.getTime())) throw new Error("invalid-calendar-date");
  const end = new Date(start.getTime() + session.durationMinutes * 60_000);

  const lines = [
    "BEGIN:VCALENDAR",
    "PRODID:-//KOSEZ//BLOSSOM//FR",
    "VERSION:2.0",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${session.id}@kosez.app`,
    `DTSTAMP:${utcBasic(stamp)}`,
    `DTSTART:${utcBasic(start.toISOString())}`,
    `DTEND:${utcBasic(end.toISOString())}`,
    "STATUS:CONFIRMED",
    `SUMMARY:${escapeText(session.title)}`,
    `DESCRIPTION:${escapeText("Séance K’Osez · " + session.teacherName + " · " + session.learnerName)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lines.flatMap(foldLine).join("\r\n") + "\r\n";
}

export function calendarFilename(sessionTitle: string): string {
  const safe = sessionTitle
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9À-ÿ]+/gi, "-")
    .replace(/^-+|-+$/g, "");
  return (safe || "kosez-seance") + ".ics";
}
