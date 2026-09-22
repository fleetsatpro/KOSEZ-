export type SyncJsonValue =
  | null
  | boolean
  | number
  | string
  | SyncJsonValue[]
  | { [key: string]: SyncJsonValue };

export type SyncJsonObject = { [key: string]: SyncJsonValue };

export type SyncOperation =
  | "profile.upsert"
  | "activity.append"
  | "mission.save"
  | "pronlab.attempt"
  | "vocabulary.upsert"
  | "event.register"
  | "challenge.complete"
  | "tandem.status"
  | "tandem.report"
  | "learning.submission"
  | "booking.request"
  | "waitlist.request"
  | "analytics.record"
  | "teacher.note"
  | "teacher.homework"
  | "homework.complete";

export type SyncMutation = {
  mutationId: string;
  deviceId: string;
  ownerUserId?: string;
  operation: SyncOperation;
  entityId: string;
  expectedRevision?: number;
  payload: SyncJsonObject;
  createdAt: string;
};

export type SyncResult =
  | {
      mutationId: string;
      status: "applied" | "duplicate";
      revision?: number;
    }
  | {
      mutationId: string;
      status: "conflict";
      currentRevision: number;
      currentSessionJson: string;
    }
  | {
      mutationId: string;
      status: "busy";
    }
  | {
      mutationId: string;
      status: "rejected";
      errorCode: string;
    };

export type BackendActivity = {
  id: string;
  idempotencyKey: string | null;
  eventType: string;
  sourceId: string | null;
  payload: SyncJsonObject;
  occurredAt: string;
};

export type BackendMission = {
  session: SyncJsonValue;
  revision: number;
  updatedAt: string;
};

export type BackendPronlabAttempt = {
  id: string;
  itemId: string;
  score: number;
  seconds: number;
  tip: string | null;
  metadata: SyncJsonObject;
  createdAt: string;
};

export type BackendSubmission = {
  id: string;
  taskId: string;
  kind: "grammar" | "listening" | "writing" | "review";
  content: string;
  checks: string[];
  result: SyncJsonObject;
  createdAt: string;
  updatedAt: string;
};

export type BackendVocabulary = {
  word: string;
  gloss: string;
  metadata: SyncJsonObject;
  firstSavedAt: string;
  updatedAt: string;
};

export type BackendHomework = {
  id: string;
  authorUserId: string;
  learnerUserId: string;
  title: string;
  body: string;
  status: "draft" | "sent" | "done";
  createdAt: string;
  updatedAt: string;
};

export type BackendTeacherNote = {
  id: string;
  teacherUserId: string;
  learnerUserId: string;
  tags: string[];
  note: string;
  createdAt: string;
};

export type BackendState = {
  plan: "centre" | "digital" | "premium";
  profile: {
    userId: string;
    displayName: string | null;
    targetLanguage: string;
    level: string | null;
    timezone: string | null;
    preferences: SyncJsonObject;
    createdAt: string;
    updatedAt: string;
  } | null;
  activity: BackendActivity[];
  missionSessions: Record<string, BackendMission>;
  pronlabAttempts: BackendPronlabAttempt[];
  vocabulary: BackendVocabulary[];
  learningSubmissions: BackendSubmission[];
  eventRegistrations: Record<string, "joined" | "waitlist" | "cancelled">;
  eventRegistrationCounts: Record<string, number>;
  completedChallenges: string[];
  tandemStatus: Record<string, "suggested" | "pending" | "accepted" | "blocked" | "paused">;
  bookingCatalogueIds: string[];
  bookingStatuses: Record<string, "requested" | "confirmed">;
  waitlistIds: string[];
  homework: BackendHomework[];
  teacherNotes: BackendTeacherNote[];
};
