import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getSql } from "@/lib/db";
import {
  CATALOGUE,
  EVENTS,
  MARKETPLACE,
  type CatalogueItem,
  type EventItem,
} from "./data";

const contentKeySchema = z.string().trim().regex(/^[a-z0-9][a-z0-9-]{1,159}$/);
export class ContentForbiddenError extends Error {
  readonly status = 403;
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ContentForbiddenError";
  }
}


const eventPayloadSchema = z.object({
  id: contentKeySchema,
  title: z.string().trim().min(1).max(200),
  blurb: z.string().trim().max(1000),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine((value) => {
      const parsed = new Date(value + "T00:00:00Z");
      return parsed.toISOString().slice(0, 10) === value;
    }, "invalid-calendar-date"),
  time: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/),
  place: z.string().trim().min(1).max(240),
  language: z.string().trim().min(1).max(120),
  spots: z.number().int().min(1).max(500),
  image: z.string().trim().max(500),
  host: z.string().trim().min(1).max(160),
});

const cataloguePayloadSchema = z.object({
  id: contentKeySchema,
  kind: z.enum([
    "course",
    "individual",
    "group",
    "immersion",
    "workshop",
    "event",
    "pronlab",
  ]),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(1500),
  language: z.string().trim().min(1).max(80),
  level: z.string().trim().min(1).max(40),
  format: z.string().trim().min(1).max(160),
  instructor: z.string().trim().min(1).max(160),
  location: z.string().trim().min(1).max(240),
  capacity: z.number().int().min(1).max(500),
  schedule: z.string().trim().min(1).max(240),
  price: z.string().trim().min(1).max(160),
  image: z.string().trim().max(500),
  early: z.boolean().optional(),
  companion: z.boolean().optional(),
});

export type ContentKind = "event" | "catalogue";
export type ContentState = "draft" | "published" | "archived";

export type ContentPayload = Record<string, string | number | boolean | null>;

export type AdminContentItem = {
  contentKey: string;
  kind: ContentKind;
  state: ContentState | "fallback";
  draftRevision: number;
  publishedRevision: number;
  draftPayload: ContentPayload;
  publishedPayload: ContentPayload | null;
  updatedBy: string | null;
  publishedBy: string | null;
  publishedAt: string | null;
  updatedAt: string;
};

export type PublishedContent = {
  events: EventItem[];
  catalogue: CatalogueItem[];
};

async function assertAdmin(userId: string) {
  const sql = await getSql();
  const rows = await sql.query(
    "select 1 from blossom_platform_admin where user_id = $1 and status = 'active' limit 1",
    [userId],
  );
  if (!rows[0]) throw new ContentForbiddenError("Admin access is required.");
}

function validatePayload(kind: ContentKind, payload: unknown) {
  return kind === "event"
    ? eventPayloadSchema.parse(payload)
    : cataloguePayloadSchema.parse(payload);
}

function mapPublishedRow(row: Record<string, unknown>) {
  const kind = String(row.kind) as ContentKind;
  const payload = validatePayload(kind, row.published_payload);
  return { kind, payload };
}

function codeFallbackContent(): PublishedContent {
  const immersionCatalogue: CatalogueItem[] = MARKETPLACE.map((item) => ({
    id: item.id,
    kind: "immersion",
    title: item.title,
    description: item.blurb,
    language: "English",
    level: "A2+",
    format: "Immersion",
    instructor: "Équipe K'Osez",
    location: item.place,
    capacity: item.spots,
    schedule: item.dates,
    price: item.price,
    image: item.image,
    early: item.early,
    companion: item.companion,
  }));

  return {
    events: [...EVENTS],
    catalogue: [...CATALOGUE, ...immersionCatalogue],
  };
}

async function ensureBootstrapContent(sql: Awaited<ReturnType<typeof getSql>>) {
  const immersionCatalogue: CatalogueItem[] = MARKETPLACE.map((item) => ({
    id: item.id,
    kind: "immersion",
    title: item.title,
    description: item.blurb,
    language: "English",
    level: "A2+",
    format: "Immersion",
    instructor: "Équipe K'Osez",
    location: item.place,
    capacity: item.spots,
    schedule: item.dates,
    price: item.price,
    image: item.image,
    early: item.early,
    companion: item.companion,
  }));

  const authored = [
    ...EVENTS.map((event) => ({ kind: "event" as const, item: event })),
    ...CATALOGUE.map((item) => ({ kind: "catalogue" as const, item })),
    ...immersionCatalogue.map((item) => ({ kind: "catalogue" as const, item })),
  ];

  const existingRows = await sql.query(
    "select content_key, state, published_payload from blossom_content_item where content_key = any($1::text[])",
    [authored.map(({ item }) => item.id)],
  );
  const existing = new Set(existingRows.map((row) => String(row.content_key)));

  for (const { kind, item } of authored) {
    // Bootstrap only creates missing rows. Once an admin has archived or edited
    // a key, authored code must never silently resurrect or overwrite it.
    if (existing.has(item.id)) continue;
    validatePayload(kind, item);
    await sql.query(
      "insert into blossom_content_item (content_key, kind, draft_payload, published_payload, draft_revision, published_revision, state, updated_by, published_by, published_at) values ($1, $2, $3::jsonb, $3::jsonb, 1, 1, 'published', 'system-bootstrap', 'system-bootstrap', current_timestamp) on conflict (content_key) do nothing",
      [item.id, kind, JSON.stringify(item)],
    );
  }
}

async function recordContentRevision(
  userId: string | null,
  contentKey: string,
  kind: ContentKind,
  revision: number,
  channel: "draft" | "published" | "archived",
  payload: unknown,
) {
  const sql = await getSql();
  await sql.query(
    "insert into blossom_content_revision (id, content_key, kind, revision, channel, payload, actor_user_id) values ($1::uuid, $2, $3, $4, $5, $6::jsonb, $7) on conflict (content_key, channel, revision) do nothing",
    [
      randomUUID(),
      contentKey,
      kind,
      revision,
      channel,
      JSON.stringify(payload),
      userId,
    ],
  );
}

export type ContentRevision = {
  revisionId: string;
  contentKey: string;
  kind: ContentKind;
  revision: number;
  channel: "draft" | "published" | "archived";
  payload: ContentPayload;
  actorUserId: string | null;
  createdAt: string;
};

export async function getContentRevisionHistory(
  userId: string,
  contentKeyInput: string,
): Promise<ContentRevision[]> {
  await assertAdmin(userId);
  const contentKey = contentKeySchema.parse(contentKeyInput);
  const sql = await getSql();
  const rows = await sql.query(
    "select id, content_key, kind, revision, channel, payload, actor_user_id, created_at from blossom_content_revision where content_key = $1 order by revision desc, created_at desc limit 80",
    [contentKey],
  );
  return rows.map((row) => ({
    revisionId: String(row.id),
    contentKey: String(row.content_key),
    kind: String(row.kind) as ContentKind,
    revision: Number(row.revision),
    channel: String(row.channel) as ContentRevision["channel"],
    payload: row.payload as ContentPayload,
    actorUserId: row.actor_user_id ? String(row.actor_user_id) : null,
    createdAt: new Date(String(row.created_at)).toISOString(),
  }));
}

export async function getPublishedContent(): Promise<PublishedContent> {
  const sql = await getSql();
  const rows = await sql.query(
    "select content_key, kind, published_payload, state from blossom_content_item where (state = 'published' and published_payload is not null) or state = 'archived' order by updated_at desc",
  );

  const result = codeFallbackContent();
  const eventMap = new Map(result.events.map((event) => [event.id, event]));
  const catalogueMap = new Map(result.catalogue.map((item) => [item.id, item]));
  const hiddenKeys = new Set<string>();

  for (const row of rows) {
    const state = String(row.state);
    if (state === "archived" || !row.published_payload) {
      hiddenKeys.add(String(row.content_key));
      continue;
    }
    try {
      const mapped = mapPublishedRow(row);
      if (mapped.kind === "event") {
        eventMap.set(mapped.payload.id, mapped.payload as EventItem);
      } else {
        catalogueMap.set(mapped.payload.id, mapped.payload as CatalogueItem);
      }
    } catch {
      // Never silently serve stale authored copy over a broken published row.
      // Fail closed for this key until an admin repairs the publication.
      hiddenKeys.add(String(row.content_key));
    }
  }

  for (const key of hiddenKeys) {
    eventMap.delete(key);
    catalogueMap.delete(key);
  }

  return {
    events: [...eventMap.values()],
    catalogue: [...catalogueMap.values()],
  };
}

export async function getAdminContentItems(userId: string): Promise<AdminContentItem[]> {
  await assertAdmin(userId);
  const sql = await getSql();
  await ensureBootstrapContent(sql);
  const rows = await sql.query(
    "select content_key, kind, draft_payload, published_payload, draft_revision, published_revision, state, updated_by, published_by, published_at, updated_at from blossom_content_item order by kind, content_key",
  );

  const byKey = new Map<string, AdminContentItem>();
  for (const row of rows) {
    const kind = String(row.kind) as ContentKind;
    byKey.set(String(row.content_key), {
      contentKey: String(row.content_key),
      kind,
      state: String(row.state) as ContentState,
      draftRevision: Number(row.draft_revision ?? 1),
      publishedRevision: Number(row.published_revision ?? 0),
      draftPayload: row.draft_payload as ContentPayload,
      publishedPayload: row.published_payload
        ? (row.published_payload as ContentPayload)
        : null,
      updatedBy: row.updated_by ? String(row.updated_by) : null,
      publishedBy: row.published_by ? String(row.published_by) : null,
      publishedAt: row.published_at
        ? new Date(String(row.published_at)).toISOString()
        : null,
      updatedAt: new Date(String(row.updated_at)).toISOString(),
    });
  }

  for (const event of EVENTS) {
    if (!byKey.has(event.id)) {
      byKey.set(event.id, {
        contentKey: event.id,
        kind: "event",
        state: "fallback",
        draftRevision: 0,
        publishedRevision: 0,
        draftPayload: { ...event },
        publishedPayload: null,
        updatedBy: null,
        publishedBy: null,
        publishedAt: null,
        updatedAt: new Date().toISOString(),
      });
    }
  }

  for (const item of CATALOGUE) {
    if (!byKey.has(item.id)) {
      byKey.set(item.id, {
        contentKey: item.id,
        kind: "catalogue",
        state: "fallback",
        draftRevision: 0,
        publishedRevision: 0,
        draftPayload: { ...item },
        publishedPayload: null,
        updatedBy: null,
        publishedBy: null,
        publishedAt: null,
        updatedAt: new Date().toISOString(),
      });
    }
  }

  return [...byKey.values()];
}

export async function saveContentDraft(
  userId: string,
  input: {
    contentKey: string;
    kind: ContentKind;
    payload: unknown;
    expectedDraftRevision: number;
  },
) {
  await assertAdmin(userId);
  const contentKey = contentKeySchema.parse(input.contentKey);
  const payload = validatePayload(input.kind, input.payload);
  if (payload.id !== contentKey) throw new Error("content-key-mismatch");

  const sql = await getSql();
  const existing = await sql.query(
    "select kind, state, published_payload, published_revision, draft_revision from blossom_content_item where content_key = $1",
    [contentKey],
  );

  if (existing[0] && String(existing[0].kind) !== input.kind) {
    throw new Error("content-kind-mismatch");
  }
  if (
    existing[0] &&
    Number(existing[0].draft_revision ?? 0) !== input.expectedDraftRevision
  ) {
    throw new Error("content-revision-conflict");
  }

  const rows = await sql.query(
    "insert into blossom_content_item (content_key, kind, draft_payload, published_payload, draft_revision, published_revision, state, updated_by) values ($1, $2, $3::jsonb, null, 1, 0, 'draft', $4) on conflict (content_key) do update set draft_payload = excluded.draft_payload, draft_revision = blossom_content_item.draft_revision + 1, state = case when blossom_content_item.state = 'archived' then 'archived' else 'draft' end, updated_by = excluded.updated_by, updated_at = current_timestamp where blossom_content_item.draft_revision = $5 returning content_key, kind, draft_revision, published_revision, state",
    [
      contentKey,
      input.kind,
      JSON.stringify(payload),
      userId,
      input.expectedDraftRevision,
    ],
  );

  const row = rows[0];
  if (!row) throw new Error("content-draft-write-failed");

  await sql.query(
    "insert into blossom_audit_event (id, actor_user_id, action, resource_type, resource_id, metadata) values ($1::uuid, $2, 'content.draft_saved', 'content', $3, $4::jsonb)",
    [randomUUID(), userId, contentKey, JSON.stringify({ kind: input.kind, revision: row.draft_revision })],
  );

  await recordContentRevision(
    userId,
    contentKey,
    input.kind,
    Number(row.draft_revision),
    "draft",
    payload,
  );

  return {
    contentKey,
    kind: input.kind,
    draftRevision: Number(row.draft_revision),
    publishedRevision: Number(row.published_revision),
    state: String(row.state) as ContentState,
  };
}

export async function archiveContent(
  userId: string,
  contentKeyInput: string,
  expectedPublishedRevision: number,
) {
  await assertAdmin(userId);
  const contentKey = contentKeySchema.parse(contentKeyInput);
  const sql = await getSql();
  const rows = await sql.query(
    "update blossom_content_item set state = 'archived', updated_by = $3, updated_at = current_timestamp where content_key = $1 and published_revision = $2 and published_payload is not null returning content_key, kind, published_revision",
    [contentKey, expectedPublishedRevision, userId],
  );
  if (!rows[0]) throw new Error("content-revision-conflict");

  await sql.query(
    "insert into blossom_audit_event (id, actor_user_id, action, resource_type, resource_id, metadata) values ($1::uuid, $2, 'content.archived', 'content', $3, $4::jsonb)",
    [
      randomUUID(),
      userId,
      contentKey,
      JSON.stringify({ revision: Number(rows[0].published_revision) }),
    ],
  );

  const archivedPayload = await sql.query(
    "select kind, published_payload from blossom_content_item where content_key = $1",
    [contentKey],
  );
  if (archivedPayload[0]?.published_payload) {
    await recordContentRevision(
      userId,
      contentKey,
      String(archivedPayload[0].kind) as ContentKind,
      Number(rows[0].published_revision),
      "archived",
      archivedPayload[0].published_payload,
    );
  }

  return {
    contentKey,
    kind: String(rows[0].kind) as ContentKind,
    publishedRevision: Number(rows[0].published_revision),
  };
}

export async function publishContent(
  userId: string,
  contentKeyInput: string,
  expectedDraftRevision: number,
) {
  await assertAdmin(userId);
  const contentKey = contentKeySchema.parse(contentKeyInput);
  const sql = await getSql();
  const rows = await sql.query(
    "select kind, draft_payload, draft_revision from blossom_content_item where content_key = $1",
    [contentKey],
  );
  if (!rows[0]) throw new Error("content-not-managed-yet");

  const kind = String(rows[0].kind) as ContentKind;
  const draftRevision = Number(rows[0].draft_revision);
  if (draftRevision !== expectedDraftRevision) {
    throw new Error("content-revision-conflict");
  }
  const payload = validatePayload(kind, rows[0].draft_payload);

  if (kind === "event") {
    const registrations = await sql.query(
      "select count(*)::integer as count from blossom_event_registration where event_id = $1 and status = 'joined'",
      [contentKey],
    );
    const joined = Number(registrations[0]?.count ?? 0);
    const capacity = Number((payload as EventItem).spots ?? 0);
    if (capacity < joined) {
      throw new Error("content-capacity-below-registrations");
    }
  }

  const updated = await sql.query(
    "update blossom_content_item set published_payload = $2::jsonb, published_revision = draft_revision, state = 'published', published_by = $3, published_at = current_timestamp, updated_by = $3, updated_at = current_timestamp where content_key = $1 and draft_revision = $4 returning content_key, kind, published_revision",
    [contentKey, JSON.stringify(payload), userId, expectedDraftRevision],
  );
  if (!updated[0]) throw new Error("content-publish-failed");

  await sql.query(
    "insert into blossom_audit_event (id, actor_user_id, action, resource_type, resource_id, metadata) values ($1::uuid, $2, 'content.published', 'content', $3, $4::jsonb)",
    [
      randomUUID(),
      userId,
      contentKey,
      JSON.stringify({
        kind,
        revision: Number(updated[0].published_revision),
      }),
    ],
  );

  await recordContentRevision(
    userId,
    contentKey,
    kind,
    Number(updated[0].published_revision),
    "published",
    payload,
  );

  return {
    contentKey,
    kind,
    publishedRevision: Number(updated[0].published_revision),
  };
}


export async function restoreContentDraft(
  userId: string,
  input: {
    contentKey: string;
    channel: "draft" | "published" | "archived";
    revision: number;
    expectedDraftRevision: number;
  },
) {
  await assertAdmin(userId);
  const contentKey = contentKeySchema.parse(input.contentKey);
  const sql = await getSql();

  const historyRows = await sql.query(
    "select kind, payload from blossom_content_revision where content_key = $1 and channel = $2 and revision = $3",
    [contentKey, input.channel, input.revision],
  );
  if (!historyRows[0]) throw new Error("content-history-not-found");

  const kind = String(historyRows[0].kind) as ContentKind;
  const payload = validatePayload(kind, historyRows[0].payload);

  const rows = await sql.query(
    "update blossom_content_item set draft_payload = $2::jsonb, draft_revision = draft_revision + 1, state = case when state = 'archived' then 'archived' else 'draft' end, updated_by = $3, updated_at = current_timestamp where content_key = $1 and draft_revision = $4 returning draft_revision, published_revision, state",
    [contentKey, JSON.stringify(payload), userId, input.expectedDraftRevision],
  );
  if (!rows[0]) throw new Error("content-revision-conflict");

  const draftRevision = Number(rows[0].draft_revision);
  await recordContentRevision(userId, contentKey, kind, draftRevision, "draft", payload);

  await sql.query(
    "insert into blossom_audit_event (id, actor_user_id, action, resource_type, resource_id, metadata) values ($1::uuid, $2, 'content.draft_restored', 'content', $3, $4::jsonb)",
    [
      randomUUID(),
      userId,
      contentKey,
      JSON.stringify({
        fromChannel: input.channel,
        fromRevision: input.revision,
        draftRevision,
      }),
    ],
  );

  return {
    contentKey,
    kind,
    draftRevision,
    publishedRevision: Number(rows[0].published_revision),
    state: String(rows[0].state) as ContentState,
    payload: payload as ContentPayload,
  };
}
