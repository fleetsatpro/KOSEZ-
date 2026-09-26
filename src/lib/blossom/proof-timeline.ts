import type { ActivityEvent } from "./engine";

export type ProofTimelineItem = {
  id: string;
  kind: "mission" | "speech" | "pronunciation" | "tandem" | "learn" | "library" | "event" | "immersion" | "homework" | "other";
  label: string;
  detail: string | null;
  sourceId: string | null;
  href: string;
  occurredAt: string;
};

function activityRoute(type: ActivityEvent["type"], sourceId: string | null): { kind: ProofTimelineItem["kind"]; label: string; href: string } | null {
  switch (type) {
    case "MISSION_COMPLETED": return { kind: "mission", label: "Mission terminée", href: "/mission" };
    case "SPEAK_COMPLETED": return { kind: "speech", label: "Prise de parole", href: sourceId ? `/osez/${D}{encodeURIComponent(sourceId)}` : "/osez" };
    case "PRONLAB_MASTERY": return { kind: "pronunciation", label: "Maîtrise Pron’Lab", href: "/pronlab" };
    case "PRONLAB_COMPLETED": return { kind: "pronunciation", label: "Set Pron’Lab complété", href: "/pronlab" };
    case "TANDEM_COMPLETED": return { kind: "tandem", label: "Session tandem", href: "/tandem" };
    case "GRAMMAR_COMPLETED": return { kind: "learn", label: "Grammaire pratiquée", href: "/learn/labs" };
    case "LISTENING_COMPLETED": return { kind: "learn", label: "Écoute pratiquée", href: "/learn/labs" };
    case "WRITING_COMPLETED": return { kind: "learn", label: "Écriture pratiquée", href: "/learn/labs" };
    case "REVIEW_COMPLETED": return { kind: "learn", label: "Révision terminée", href: "/learn/review" };
    case "LIBRARY_COMPLETED": return { kind: "library", label: "Lecture enregistrée", href: sourceId ? `/library/${D}{encodeURIComponent(sourceId)}` : "/library" };
    case "HOMEWORK_COMPLETED": return { kind: "homework", label: "Devoir terminé", href: "/moi" };
    case "EVENT_ATTENDED": return { kind: "event", label: "Présence enregistrée", href: "/explore" };
    case "IMMERSION_ATTENDED": return { kind: "immersion", label: "Immersion enregistrée", href: "/immersion" };
    case "HOMEWORK_ASSIGNED": return { kind: "homework", label: "Devoir reçu", href: "/moi" };
    case "LESSON_COMPLETED":
    case "DIAGNOSTIC_COMPLETED": return { kind: "learn", label: "Parcours travaillé", href: "/learn" };
    case "CURRICULUM_EVIDENCE_RECORDED": return null;
    default: return { kind: "other", label: type.replaceAll("_", " ").toLowerCase(), href: "/moi" };
  }
}

export function proofFromActivity(event: ActivityEvent): ProofTimelineItem | null {
  const route = activityRoute(event.type, event.sourceId);
  if (!route) return null;
  return { id: `activity:${event.id}`, ...route, detail: event.note ?? null, sourceId: event.sourceId ?? null, occurredAt: event.createdAt };
}

export function proofFromSubmission(input: { id: string; kind: "grammar" | "listening" | "writing" | "review"; taskId: string; createdAt: string }): ProofTimelineItem {
  return { id: `submission:${D}{input.id}`, kind: "learn", label: input.kind === "grammar" ? "Trace de grammaire" : input.kind === "listening" ? "Trace d’écoute" : input.kind === "writing" ? "Trace d’écriture" : "Trace de révision", detail: input.taskId, sourceId: input.taskId, href: input.kind === "review" ? "/learn/review" : "/learn/labs", occurredAt: input.createdAt };
}