import { getSql } from "@/lib/db";
import { BlossomForbiddenError } from "./domain.server";

export type EvidenceClass = "action" | "artifact" | "observation" | "plan";

export type EvidenceTimelineItem = {
  id: string;
  at: string;
  kind: "activity" | "submission" | "feedback" | "pronlab" | "homework" | "tandem" | "event" | "booking" | "challenge";
  evidenceClass: EvidenceClass;
  title: string;
  summary: string;
  sourceId: string | null;
  route: string | null;
  metadata: Record<string, string | number | boolean | null>;
};

export function pronlabEvidenceProjection(input: {
  score: number;
  seconds: number;
  assessment: unknown;
}) {
  const assessment = typeof input.assessment === "string" ? input.assessment : null;
  const verified = assessment === "phonetic-provider" && Number.isFinite(input.score) && input.score > 0;
  return {
    verifiedScore: verified ? Number(input.score) : null,
    summary: assessment === "capture-only"
      ? `Capture de ${Math.max(0, Number(input.seconds) || 0)} s · aucune note acoustique affirmée.`
      : assessment === "transcript"
        ? `Transcription de ${Math.max(0, Number(input.seconds) || 0)} s · aucune note phonétique affirmée.`
        : verified
          ? `Observation phonétique ${Number(input.score)}/100 · source vérifiée déclarée.`
          : `Prise enregistrée · aucune note phonétique vérifiée disponible.`,
  };
}

function activityDescriptor(type: string) {
  switch (type) {
    case "MISSION_COMPLETED": return { title: "Mission accomplie", summary: "Une mission réellement clôturée.", evidenceClass: "action" as const, route: "/mission" };
    case "REAL_WORLD_BONUS": return { title: "Geste terrain", summary: "Une action réelle enregistrée.", evidenceClass: "action" as const, route: "/mission" };
    case "SPEAK_COMPLETED": return { title: "Prise de parole", summary: "Une session OSEZ clôturée avec ses métadonnées.", evidenceClass: "observation" as const, route: "/osez" };
    case "PRONLAB_MASTERY": return { title: "Observation Pron’Lab", summary: "Un item Pron’Lab a franchi le seuil calculé.", evidenceClass: "observation" as const, route: "/pronlab" };
    case "PRONLAB_COMPLETED": return { title: "Set Pron’Lab terminé", summary: "Le set a été parcouru; aucune note de performance n’est inventée.", evidenceClass: "action" as const, route: "/pronlab" };
    case "TANDEM_COMPLETED": return { title: "Tandem clôturé", summary: "Un échange tandem a été enregistré avec une réflexion personnelle.", evidenceClass: "action" as const, route: "/tandem" };
    case "GRAMMAR_COMPLETED": return { title: "Grammaire terminée", summary: "Une preuve d’atelier a été enregistrée.", evidenceClass: "artifact" as const, route: "/learn/labs" };
    case "LISTENING_COMPLETED": return { title: "Écoute terminée", summary: "Une preuve d’atelier a été enregistrée.", evidenceClass: "artifact" as const, route: "/learn/labs" };
    case "WRITING_COMPLETED": return { title: "Écriture terminée", summary: "Une preuve d’atelier a été enregistrée.", evidenceClass: "artifact" as const, route: "/learn/labs" };
    case "REVIEW_COMPLETED": return { title: "Révision terminée", summary: "Une preuve de récupération a été enregistrée.", evidenceClass: "artifact" as const, route: "/learn/review" };
    case "LIBRARY_COMPLETED": return { title: "Lecture terminée", summary: "La lecture a été enregistrée après la fin du texte.", evidenceClass: "artifact" as const, route: "/library" };
    case "HOMEWORK_COMPLETED": return { title: "Devoir terminé", summary: "Le devoir a été marqué fait par l’apprenant.", evidenceClass: "artifact" as const, route: "/moi" };
    case "LESSON_COMPLETED": return { title: "Leçon terminée", summary: "Une activité de curriculum a produit une trace.", evidenceClass: "action" as const, route: "/learn" };
    case "DIAGNOSTIC_COMPLETED": return { title: "Diagnostic terminé", summary: "Un repère d’apprentissage a été enregistré.", evidenceClass: "observation" as const, route: "/learn/labs" };
    case "CLASS_ATTENDED": return { title: "Présence en classe", summary: "Une présence a été enregistrée.", evidenceClass: "action" as const, route: "/explore" };
    case "EVENT_ATTENDED": return { title: "Événement fréquenté", summary: "Une présence à un événement a été enregistrée.", evidenceClass: "action" as const, route: "/explore" };
    case "IMMERSION_ATTENDED": return { title: "Immersion enregistrée", summary: "Une immersion a été enregistrée.", evidenceClass: "action" as const, route: "/immersion" };
    default: return { title: type, summary: "Activité enregistrée par K’Osez.", evidenceClass: "action" as const, route: null };
  }
}

async function assertEvidenceAccess(actorUserId: string, learnerUserId: string) {
  if (actorUserId === learnerUserId) return;
  const sql = await getSql();
  const admin = await sql.query(
    "select 1 from blossom_platform_admin where user_id = $1 and status = 'active' limit 1",
    [actorUserId],
  );
  if (admin[0]) return;
  const allowed = await sql.query(
    "select 1 from blossom_teacher_link where teacher_user_id = $1 and learner_user_id = $2 and status = 'active' union all select 1 from blossom_guardian_link where guardian_user_id = $1 and learner_user_id = $2 and status = 'active' union all select 1 from blossom_organization_member staff join blossom_organization_member learner on learner.organization_id = staff.organization_id and learner.user_id = $2 and learner.status = 'active' and learner.role = 'learner' where staff.user_id = $1 and staff.status = 'active' and staff.role in ('owner','admin','teacher') limit 1",
    [actorUserId, learnerUserId],
  );
  if (!allowed[0]) throw new BlossomForbiddenError("Vous n'avez pas accès aux preuves de cet apprenant.");
}

export async function getEvidenceTimeline(
  actorUserId: string,
  learnerUserId = actorUserId,
  limit = 60,
): Promise<EvidenceTimelineItem[]> {
  await assertEvidenceAccess(actorUserId, learnerUserId);
  const sql = await getSql();
  const bounded = Math.min(120, Math.max(1, Math.round(limit)));
  const [activities, submissions, feedback, pronlab, homework, tandem, attendance, events, bookings, challenges] = await Promise.all([
    sql.query("select id, event_type, source_id, note, payload, occurred_at from blossom_activity_event where user_id = $1 order by occurred_at desc limit " + bounded, [learnerUserId]),
    sql.query("select id, task_id, kind, content, created_at from blossom_learning_submission where user_id = $1 order by created_at desc limit " + Math.min(40, bounded), [learnerUserId]),
    sql.query("select id, submission_id, teacher_user_id, body, created_at, updated_at from blossom_learning_feedback where learner_user_id = $1 order by updated_at desc limit " + Math.min(30, bounded), [learnerUserId]),
    sql.query("select id, item_id, score, seconds, metadata, created_at from blossom_pronlab_attempt where user_id = $1 order by created_at desc limit " + Math.min(40, bounded), [learnerUserId]),
    sql.query("select id, title, body, status, updated_at from blossom_homework where learner_user_id = $1 order by updated_at desc limit " + Math.min(30, bounded), [learnerUserId]),
    sql.query("select id, user_id, partner_user_id, status, started_at, ended_at from blossom_tandem_session where (user_id = $1 or partner_user_id = $1) order by started_at desc limit " + Math.min(30, bounded), [learnerUserId]),
    sql.query("select event_id, recorded_by_user_id, note, recorded_at from blossom_event_attendance where user_id = $1 order by recorded_at desc limit " + Math.min(30, bounded), [learnerUserId]),
    sql.query("select event_id, status, seat_no, updated_at from blossom_event_registration where user_id = $1 order by updated_at desc limit " + Math.min(30, bounded), [learnerUserId]),
    sql.query("select id, catalogue_item_id, status, payment_status, provider_reference, updated_at from blossom_booking_request where user_id = $1 order by updated_at desc limit " + Math.min(30, bounded), [learnerUserId]),
    sql.query("select challenge_id, completed_at from blossom_challenge_completion where user_id = $1 order by completed_at desc limit " + Math.min(30, bounded), [learnerUserId]),
  ]);

  const items: EvidenceTimelineItem[] = [];
  for (const row of activities) {
    const desc = activityDescriptor(String(row.event_type));
    const payload = row.payload && typeof row.payload === "object" ? (row.payload as Record<string, unknown>) : {};
    const metadata = payload.metadata && typeof payload.metadata === "object" ? (payload.metadata as Record<string, unknown>) : {};
    items.push({
      id: "activity:" + String(row.id),
      at: new Date(String(row.occurred_at)).toISOString(),
      kind: "activity",
      evidenceClass: desc.evidenceClass,
      title: desc.title,
      summary: row.note ? String(row.note) : desc.summary,
      sourceId: row.source_id ? String(row.source_id) : null,
      route: desc.route,
      metadata: { activityType: String(row.event_type), ...Object.fromEntries(Object.entries(metadata).filter(([,v]) => v === null || typeof v === "string" || typeof v === "number" || typeof v === "boolean")) },
    });
  }
  for (const row of submissions) {
    items.push({
      id: "submission:" + String(row.id),
      at: new Date(String(row.created_at)).toISOString(),
      kind: "submission",
      evidenceClass: "artifact",
      title: "Preuve " + String(row.kind),
      summary: String(row.content).slice(0, 180),
      sourceId: String(row.task_id),
      route: String(row.kind) === "review" ? "/learn/review" : "/learn/labs",
      metadata: { taskId: String(row.task_id), kind: String(row.kind) },
    });
  }
  for (const row of feedback) {
    items.push({
      id: "feedback:" + String(row.id),
      at: new Date(String(row.updated_at ?? row.created_at)).toISOString(),
      kind: "feedback",
      evidenceClass: "artifact",
      title: "Retour enseignant",
      summary: String(row.body).slice(0, 220),
      sourceId: String(row.submission_id),
      route: "/moi",
      metadata: {
        submissionId: String(row.submission_id),
        teacherUserId: String(row.teacher_user_id),
      },
    });
  }

  for (const row of pronlab) {
    const metadata = row.metadata && typeof row.metadata === "object" ? (row.metadata as Record<string, unknown>) : {};
    const projection = pronlabEvidenceProjection({
      score: Number(row.score ?? 0),
      seconds: Number(row.seconds ?? 0),
      assessment: metadata.assessment,
    });
    items.push({
      id: "pronlab:" + String(row.id),
      at: new Date(String(row.created_at)).toISOString(),
      kind: "pronlab",
      evidenceClass: "observation",
      title: projection.verifiedScore === null ? "Prise Pron’Lab" : "Observation Pron’Lab",
      summary: projection.summary,
      sourceId: String(row.item_id),
      route: "/pronlab",
      metadata: {
        itemId: String(row.item_id),
        score: projection.verifiedScore,
        seconds: Math.max(0, Number(row.seconds ?? 0)),
        assessment: typeof metadata.assessment === "string" ? metadata.assessment : null,
      },
    });
  }
  for (const row of homework) {
    items.push({
      id: "homework:" + String(row.id),
      at: new Date(String(row.updated_at)).toISOString(),
      kind: "homework",
      evidenceClass: "artifact",
      title: String(row.title),
      summary: String(row.status) === "done" ? "Devoir marqué terminé par l’apprenant." : "Devoir envoyé et encore ouvert.",
      sourceId: String(row.id),
      route: "/moi",
      metadata: { status: String(row.status) },
    });
  }
  for (const row of tandem) {
    const status = String(row.status);
    const partner = String(row.user_id) === learnerUserId ? String(row.partner_user_id) : String(row.user_id);
    items.push({
      id: "tandem:" + String(row.id),
      at: new Date(String(row.ended_at ?? row.started_at)).toISOString(),
      kind: "tandem",
      evidenceClass: status === "completed" ? "action" : "plan",
      title: status === "completed" ? "Tandem clôturé" : "Tandem " + status,
      summary: status === "completed" ? "Session tandem durablement clôturée." : "Session tandem enregistrée côté serveur.",
      sourceId: partner,
      route: "/tandem",
      metadata: { status, partnerUserId: partner },
    });
  }
  for (const row of attendance) {
    items.push({
      id: "attendance:" + String(row.event_id),
      at: new Date(String(row.recorded_at)).toISOString(),
      kind: "event",
      evidenceClass: "action",
      title: "Présence confirmée",
      summary: "Présence enregistrée par un opérateur K’Osez autorisé.",
      sourceId: String(row.event_id),
      route: "/explore",
      metadata: {
        eventId: String(row.event_id),
        recordedBy: String(row.recorded_by_user_id),
        note: row.note ? String(row.note) : null,
      },
    });
  }

  for (const row of events) {
    items.push({
      id: "event:" + String(row.event_id) + ":" + String(row.updated_at),
      at: new Date(String(row.updated_at)).toISOString(),
      kind: "event",
      evidenceClass: row.status === "joined" ? "plan" : "action",
      title: row.status === "joined" ? "Inscription à un événement" : "État d'inscription modifié",
      summary: row.status === "joined" ? "Inscription enregistrée; elle ne vaut pas preuve d’assistance." : "Inscription " + String(row.status) + ".",
      sourceId: String(row.event_id),
      route: "/explore",
      metadata: { eventId: String(row.event_id), status: String(row.status), seatNo: row.seat_no == null ? null : Number(row.seat_no) },
    });
  }
  for (const row of bookings) {
    items.push({
      id: "booking:" + String(row.id),
      at: new Date(String(row.updated_at)).toISOString(),
      kind: "booking",
      evidenceClass: "plan",
      title: "Réservation catalogue",
      summary: "État réservation · " + String(row.status) + " · paiement · " + String(row.payment_status) + ".",
      sourceId: String(row.catalogue_item_id),
      route: "/explore",
      metadata: { bookingId: String(row.id), status: String(row.status), paymentStatus: String(row.payment_status), providerReference: row.provider_reference ? String(row.provider_reference) : null },
    });
  }
  for (const row of challenges) {
    items.push({
      id: "challenge:" + String(row.challenge_id),
      at: new Date(String(row.completed_at)).toISOString(),
      kind: "challenge",
      evidenceClass: "action",
      title: "Défi d’immersion terminé",
      summary: "Un geste d’immersion a été enregistré.",
      sourceId: String(row.challenge_id),
      route: "/immersion",
      metadata: { challengeId: String(row.challenge_id) },
    });
  }
  return items.sort((a,b) => b.at.localeCompare(a.at)).slice(0, bounded);
}
