import assert from "node:assert/strict";
import test from "node:test";
import { calendarFilename, teacherSessionToIcs } from "./calendar.ts";

const session = {
  id: "session-123",
  title: "Parler, café & marché",
  startsAt: "2026-09-27T08:00:00.000Z",
  durationMinutes: 45,
  teacherName: "Amina",
  learnerName: "Griffin",
};

test("iCalendar export contains a persistent UID and UTC start/end", () => {
  const value = teacherSessionToIcs(session, "2026-09-26T10:00:00.000Z");
  assert.match(value, /BEGIN:VCALENDAR\r\n/);
  assert.match(value, /UID:session-123@kosez\.app/);
  assert.match(value, /DTSTART:20260927T080000Z/);
  assert.match(value, /DTEND:20260927T084500Z/);
  assert.match(value, /END:VCALENDAR\r\n$/);
});

test("iCalendar text escapes RFC text delimiters", () => {
  const value = teacherSessionToIcs(
    { ...session, title: "A, B; C\\D" },
    "2026-09-26T10:00:00.000Z",
  );
  assert.match(value, /SUMMARY:A\\, B\\; C\\\\D/);
});

test("calendar filenames remain safe and deterministic", () => {
  assert.equal(calendarFilename("  Parler café / marché  "), "parler-café-marché.ics");
  assert.equal(calendarFilename("!!!"), "kosez-seance.ics");
});
