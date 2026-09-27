import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatLongDate(isoDay: string) {
  const date = new Date(`${isoDay}T12:00:00`);
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

export function formatShortDate(isoDay: string) {
  const date = new Date(`${isoDay}T12:00:00`);
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}

export function todayLabel(now = new Date()) {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(now);
}


/** K’Osez centre event clock: Saint-Pierre, La Réunion (UTC+04:00). */
export const KOSEZ_EVENT_UTC_OFFSET = "+04:00";

export function parseKosezEventDate(date: string, time: string): Date {
  const value = new Date(`${date}T${time}:00${KOSEZ_EVENT_UTC_OFFSET}`);
  if (Number.isNaN(value.getTime())) throw new Error("invalid-kosez-event-date");
  return value;
}

export function kosezEventDayFromToday(daysAhead = 0, now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Indian/Reunion",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);
  if (![year, month, day].every(Number.isFinite)) {
    throw new Error("invalid-kosez-event-day");
  }
  return new Date(Date.UTC(year, month - 1, day + daysAhead))
    .toISOString()
    .slice(0, 10);
}
