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

/** K’Osez event clock: Saint-Pierre, La Réunion (UTC+04:00). */
export const KOSEZ_EVENT_UTC_OFFSET = "+04:00";

export function parseKosezEventDate(date: string, time: string): Date {
  const value = new Date(date + "T" + time + ":00" + KOSEZ_EVENT_UTC_OFFSET);
  if (Number.isNaN(value.getTime())) throw new Error("invalid-kosez-event-date");
  return value;
}
