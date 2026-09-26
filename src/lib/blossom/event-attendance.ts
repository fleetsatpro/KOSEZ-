export function eventStartEpoch(event: { date: string; time: string }): number {
  const value = Date.parse(event.date + "T" + event.time + ":00+04:00");
  if (!Number.isFinite(value)) throw new Error("invalid-event-start");
  return value;
}
