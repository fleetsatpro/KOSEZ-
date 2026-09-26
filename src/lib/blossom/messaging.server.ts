import { randomUUID } from "node:crypto";
import { getSql } from "@/lib/db";
import { BlossomForbiddenError, createNotification, writeAuditEvent } from "./domain.server";
import { conversationIdForRelationship } from "./communication";

export type ConversationKind = "tandem" | "teacher" | "support";

export type ConversationSummary = {
  id: string;
  kind: ConversationKind;
  peerUserId: string | null;
  peerName: string;
  unreadCount: number;
  lastMessageBody: string | null;
  lastMessageAt: string | null;
  updatedAt: string;
};

export type ConversationMessage = {
  id: string;
  senderUserId: string;
  body: string;
  createdAt: string;
};

export type SupportConversationSummary = ConversationSummary & {
  requesterUserId: string | null;
};

async function isAdmin(userId: string) {
  const sql = await getSql();
  const rows = await sql.query(
    "select 1 from blossom_platform_admin where user_id = $1 and status = 'active' limit 1",
    [userId],
  );
  return Boolean(rows[0]);
}

async function assertRelationship(
  userId: string,
  partnerUserId: string,
  kind: Exclude<ConversationKind, "support">,
) {
  if (userId === partnerUserId) {
    throw new BlossomForbiddenError("Une conversation exige deux personnes différentes.");
  }
  const sql = await getSql();
  const profile = await sql.query(
    "select 1 from blossom_profile where user_id = $1 limit 1",
    [partnerUserId],
  );
  if (!profile[0]) throw new BlossomForbiddenError("Cette personne n'est plus disponible.");

  if (kind === "tandem") {
    const rows = await sql.query(
      "select 1 from blossom_tandem_connection mine join blossom_tandem_connection theirs on theirs.user_id = mine.partner_user_id and theirs.partner_user_id = mine.user_id where mine.user_id = $1 and mine.partner_user_id = $2 and mine.status = 'accepted' and theirs.status = 'accepted' limit 1",
      [userId, partnerUserId],
    );
    if (!rows[0]) {
      throw new BlossomForbiddenError("La conversation tandem exige une connexion réciproque.");
    }
    return;
  }

  const rows = await sql.query(
    `select 1
     from blossom_teacher_link
     where status = 'active'
       and ((teacher_user_id = $1 and learner_user_id = $2)
         or (teacher_user_id = $2 and learner_user_id = $1))
     union all
     select 1
     from blossom_organization_group g
     join blossom_organization_group_member gm
       on gm.group_id = g.id
      and gm.user_id = $2
     join blossom_organization_member staff
       on staff.organization_id = g.organization_id
      and staff.user_id = $1
      and staff.status = 'active'
      and staff.role = 'teacher'
     where g.teacher_user_id = $1
       and g.status = 'active'
     union all
     select 1
     from blossom_guardian_link guardian
     join blossom_teacher_link teacher
       on teacher.learner_user_id = guardian.learner_user_id
      and teacher.status = 'active'
     where guardian.guardian_user_id = $1
       and guardian.status = 'active'
       and teacher.teacher_user_id = $2
     union all
     select 1
     from blossom_guardian_link guardian
     join blossom_organization_group_member gm
       on gm.user_id = guardian.learner_user_id
     join blossom_organization_group g
       on g.id = gm.group_id
      and g.status = 'active'
      and g.teacher_user_id = $2
     where guardian.guardian_user_id = $1
       and guardian.status = 'active'
     limit 1`,
    [userId, partnerUserId],
  );
  if (!rows[0]) {
    throw new BlossomForbiddenError("La conversation enseignant–apprenant exige un lien actif.");
  }
}

async function assertConversationAccess(userId: string, conversationId: string) {
  const sql = await getSql();
  const rows = await sql.query(
    "select c.kind, cm.user_id from blossom_conversation c left join blossom_conversation_member cm on cm.conversation_id = c.id and cm.user_id = $2 where c.id = $1::uuid limit 1",
    [conversationId, userId],
  );
  const row = rows[0];
  if (!row) throw new BlossomForbiddenError("Cette conversation n'existe plus.");
  const kind = String(row.kind) as ConversationKind;
  if (row.user_id) {
    if (kind === "support") return { kind };
    const peerRows = await sql.query(
      "select user_id from blossom_conversation_member where conversation_id = $1::uuid and user_id <> $2 limit 1",
      [conversationId, userId],
    );
    const peerUserId = peerRows[0]?.user_id ? String(peerRows[0].user_id) : "";
    if (!peerUserId) throw new BlossomForbiddenError("Cette conversation est incomplète.");
    await assertRelationship(userId, peerUserId, kind);
    return { kind };
  }

  if (kind === "support" && (await isAdmin(userId))) {
    await sql.query(
      "insert into blossom_conversation_member (conversation_id, user_id, role) values ($1::uuid, $2, 'agent') on conflict (conversation_id, user_id) do update set role = 'agent'",
      [conversationId, userId],
    );
    return { kind };
  }

  throw new BlossomForbiddenError("Vous n'avez pas accès à cette conversation.");
}

export async function getOrCreateConversation(
  userId: string,
  input: { kind: ConversationKind; partnerUserId?: string },
) {
  if (input.kind === "support") {
    const sql = await getSql();
    const existing = await sql.query(
      "select c.id from blossom_conversation c join blossom_conversation_member cm on cm.conversation_id = c.id where c.kind = 'support' and cm.user_id = $1 order by c.updated_at desc limit 1",
      [userId],
    );
    if (existing[0]) return { id: String(existing[0].id), kind: input.kind, peerUserId: null };

    const id = randomUUID();
    await sql.query(
      "insert into blossom_conversation (id, kind, created_by_user_id) values ($1::uuid, 'support', $2)",
      [id, userId],
    );
    await sql.query(
      "insert into blossom_conversation_member (conversation_id, user_id, role) values ($1::uuid, $2, 'participant')",
      [id, userId],
    );
    await writeAuditEvent(userId, {
      action: "communication.support.opened",
      resourceType: "conversation",
      resourceId: id,
    });
    return { id, kind: input.kind, peerUserId: null };
  }

  const partnerUserId = input.partnerUserId?.trim();
  if (!partnerUserId) {
    throw new BlossomForbiddenError("Un partenaire est requis pour cette conversation.");
  }
  await assertRelationship(userId, partnerUserId, input.kind);

  const sql = await getSql();
  const id = conversationIdForRelationship(input.kind, userId, partnerUserId);
  await sql.query(
    "insert into blossom_conversation (id, kind, created_by_user_id) values ($1::uuid, $2, $3) on conflict (id) do nothing",
    [id, input.kind, userId],
  );
  await sql.query(
    "insert into blossom_conversation_member (conversation_id, user_id, role) values ($1::uuid, $2, 'participant'), ($1::uuid, $3, 'participant') on conflict (conversation_id, user_id) do nothing",
    [id, userId, partnerUserId],
  );
  return { id, kind: input.kind, peerUserId: partnerUserId };
}

export async function listConversations(userId: string): Promise<ConversationSummary[]> {
  const sql = await getSql();
  const rows = await sql.query(
    "select c.id, c.kind, c.updated_at, peer.user_id as peer_user_id, coalesce(nullif(p.display_name, ''), peer.user_id, 'K’Osez') as peer_name, coalesce(unread.unread_count, 0)::integer as unread_count, last.body as last_message_body, last.created_at as last_message_at from blossom_conversation c join blossom_conversation_member mine on mine.conversation_id = c.id and mine.user_id = $1 left join lateral (select cm.user_id from blossom_conversation_member cm where cm.conversation_id = c.id and cm.user_id <> $1 order by cm.joined_at asc limit 1) peer on true left join blossom_profile p on p.user_id = peer.user_id left join lateral (select count(*)::integer as unread_count from blossom_message m where m.conversation_id = c.id and m.sender_user_id <> $1 and (mine.last_read_at is null or m.created_at > mine.last_read_at)) unread on true left join lateral (select m.body, m.created_at from blossom_message m where m.conversation_id = c.id order by m.created_at desc limit 1) last on true order by c.updated_at desc",
    [userId],
  );
  return rows.map((row) => ({
    id: String(row.id),
    kind: String(row.kind) as ConversationKind,
    peerUserId: row.peer_user_id ? String(row.peer_user_id) : null,
    peerName: String(row.peer_name),
    unreadCount: Number(row.unread_count ?? 0),
    lastMessageBody: row.last_message_body ? String(row.last_message_body) : null,
    lastMessageAt: row.last_message_at ? new Date(String(row.last_message_at)).toISOString() : null,
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  }));
}

export async function getConversationMessages(userId: string, conversationId: string, limit = 60) {
  await assertConversationAccess(userId, conversationId);
  const sql = await getSql();
  const bounded = Math.min(100, Math.max(1, Math.round(limit)));
  const rows = await sql.query(
    "select id, sender_user_id, body, created_at from blossom_message where conversation_id = $1::uuid order by created_at desc limit " + bounded,
    [conversationId],
  );
  return rows.reverse().map((row) => ({
    id: String(row.id),
    senderUserId: String(row.sender_user_id),
    body: String(row.body),
    createdAt: new Date(String(row.created_at)).toISOString(),
  }));
}

export async function sendMessage(
  userId: string,
  input: { conversationId: string; body: string; clientMessageId?: string | null },
): Promise<ConversationMessage> {
  const access = await assertConversationAccess(userId, input.conversationId);
  const body = input.body.trim();
  if (body.length < 1 || body.length > 4000) {
    throw new BlossomForbiddenError("Un message doit contenir entre 1 et 4000 caractères.");
  }
  const sql = await getSql();

  if (input.clientMessageId) {
    const duplicate = await sql.query(
      "select id, conversation_id, sender_user_id, body, created_at from blossom_message where sender_user_id = $1 and client_message_id = $2::uuid limit 1",
      [userId, input.clientMessageId],
    );
    if (duplicate[0]) {
      if (String(duplicate[0].conversation_id) !== input.conversationId) {
        throw new BlossomForbiddenError("Cette clé de message a déjà été utilisée pour un autre fil.");
      }
      return {
        id: String(duplicate[0].id),
        senderUserId: String(duplicate[0].sender_user_id),
        body: String(duplicate[0].body),
        createdAt: new Date(String(duplicate[0].created_at)).toISOString(),
      };
    }
  }

  const messageId = randomUUID();
  let rows: Record<string, unknown>[] = [];
  try {
    rows = await sql.query(
      "insert into blossom_message (id, conversation_id, sender_user_id, client_message_id, body) values ($1::uuid, $2::uuid, $3, $4::uuid, $5) returning id, sender_user_id, body, created_at",
      [messageId, input.conversationId, userId, input.clientMessageId ?? null, body],
    );
  } catch (error) {
    if ((error as { code?: string })?.code !== "23505" || !input.clientMessageId) {
      throw error;
    }
    rows = await sql.query(
      `select id, conversation_id, sender_user_id, body, created_at
       from blossom_message
       where sender_user_id = $1 and client_message_id = $2::uuid
       limit 1`,
      [userId, input.clientMessageId],
    );
    if (!rows[0] || String(rows[0].conversation_id) !== input.conversationId) {
      throw new BlossomForbiddenError("Cette clé de message a déjà été utilisée pour un autre fil.");
    }
  }
  if (!rows[0]) throw new Error("message-write-failed");
  const duplicateMessage = String(rows[0].id) !== messageId;

  await sql.query(
    "update blossom_conversation set updated_at = current_timestamp where id = $1::uuid",
    [input.conversationId],
  );
  await sql.query(
    "update blossom_conversation_member set last_read_at = current_timestamp where conversation_id = $1::uuid and user_id = $2",
    [input.conversationId, userId],
  );

  if (duplicateMessage) {
    return {
      id: String(rows[0].id),
      senderUserId: String(rows[0].sender_user_id),
      body: String(rows[0].body),
      createdAt: new Date(String(rows[0].created_at)).toISOString(),
    };
  }

  const recipients = await sql.query(
    "select user_id from blossom_conversation_member where conversation_id = $1::uuid and user_id <> $2",
    [input.conversationId, userId],
  );
  const notified = new Set<string>();
  for (const recipient of recipients) {
    const recipientId = String(recipient.user_id);
    notified.add(recipientId);
    await createNotification(recipientId, {
      kind: "communication",
      title: access.kind === "support" ? "Réponse de K’Osez" : "Nouveau message",
      body: body.length > 120 ? body.slice(0, 117) + "…" : body,
      href: "/connect",
      metadata: { conversationId: input.conversationId },
    });
  }

  if (access.kind === "support") {
    const admins = await sql.query(
      "select user_id from blossom_platform_admin where status = 'active' and user_id <> $1",
      [userId],
    );
    for (const admin of admins) {
      const adminId = String(admin.user_id);
      if (notified.has(adminId)) continue;
      await createNotification(adminId, {
        kind: "communication",
        title: "Nouvelle demande pour K’Osez",
        body: body.length > 120 ? body.slice(0, 117) + "…" : body,
        href: "/moi",
        metadata: { conversationId: input.conversationId },
      });
    }
  }

  await writeAuditEvent(userId, {
    action: "communication.message.sent",
    resourceType: "conversation",
    resourceId: input.conversationId,
    metadata: { messageId },
  });

  return {
    id: String(rows[0].id),
    senderUserId: String(rows[0].sender_user_id),
    body: String(rows[0].body),
    createdAt: new Date(String(rows[0].created_at)).toISOString(),
  };
}

export async function markConversationRead(userId: string, conversationId: string) {
  const access = await assertConversationAccess(userId, conversationId);
  const sql = await getSql();
  const rows = await sql.query(
    "update blossom_conversation_member set last_read_at = current_timestamp where conversation_id = $1::uuid and user_id = $2 returning conversation_id, last_read_at",
    [conversationId, userId],
  );
  if (!rows[0]) throw new Error("conversation-read-write-failed");
  await writeAuditEvent(userId, {
    action: "communication.conversation.read",
    resourceType: "conversation",
    resourceId: conversationId,
    metadata: { kind: access.kind },
  });
  return {
    conversationId: String(rows[0].conversation_id),
    readAt: new Date(String(rows[0].last_read_at)).toISOString(),
  };
}

export async function reportMessage(
  userId: string,
  input: { conversationId: string; messageId: string; reason: string },
) {
  await assertConversationAccess(userId, input.conversationId);
  const reason = input.reason.trim();
  if (reason.length < 1 || reason.length > 500) {
    throw new BlossomForbiddenError("Le motif du signalement est requis.");
  }
  const sql = await getSql();
  const message = await sql.query(
    "select 1 from blossom_message where id = $1::uuid and conversation_id = $2::uuid limit 1",
    [input.messageId, input.conversationId],
  );
  if (!message[0]) throw new BlossomForbiddenError("Ce message n'existe plus dans cette conversation.");

  const rows = await sql.query(
    "insert into blossom_message_report (id, reporter_user_id, conversation_id, message_id, reason) values ($1::uuid, $2, $3::uuid, $4::uuid, $5) returning id, status, created_at",
    [randomUUID(), userId, input.conversationId, input.messageId, reason],
  );

  await writeAuditEvent(userId, {
    action: "communication.message.reported",
    resourceType: "message",
    resourceId: input.messageId,
    metadata: { conversationId: input.conversationId },
  });

  const admins = await sql.query(
    "select user_id from blossom_platform_admin where status = 'active' and user_id <> $1",
    [userId],
  );
  for (const admin of admins) {
    await createNotification(String(admin.user_id), {
      kind: "communication",
      title: "Signalement de conversation",
      body: "Un message a été signalé et demande une revue.",
      href: "/moi",
      metadata: { conversationId: input.conversationId, reportId: String(rows[0]?.id ?? "") },
    });
  }
  if (!rows[0]) throw new Error("message-report-write-failed");
  return {
    id: String(rows[0].id),
    status: String(rows[0].status) as "open" | "reviewing" | "resolved" | "dismissed",
    createdAt: new Date(String(rows[0].created_at)).toISOString(),
  };
}

export type GuardianTeacherContact = {
  teacherUserId: string;
  teacherName: string;
  learnerUserId: string;
  learnerName: string;
};

export async function getGuardianTeacherContacts(
  guardianUserId: string,
): Promise<GuardianTeacherContact[]> {
  const sql = await getSql();
  const rows = await sql.query(
    `select distinct
       teacher.teacher_user_id,
       coalesce(nullif(tp.display_name, ''), teacher.teacher_user_id) as teacher_name,
       guardian.learner_user_id,
       coalesce(nullif(lp.display_name, ''), guardian.learner_user_id) as learner_name
     from blossom_guardian_link guardian
     join blossom_profile lp on lp.user_id = guardian.learner_user_id
     join blossom_teacher_link teacher
       on teacher.learner_user_id = guardian.learner_user_id
      and teacher.status = 'active'
     join blossom_profile tp on tp.user_id = teacher.teacher_user_id
     where guardian.guardian_user_id = $1
       and guardian.status = 'active'
     union
     select distinct
       g.teacher_user_id,
       coalesce(nullif(tp.display_name, ''), g.teacher_user_id) as teacher_name,
       guardian.learner_user_id,
       coalesce(nullif(lp.display_name, ''), guardian.learner_user_id) as learner_name
     from blossom_guardian_link guardian
     join blossom_profile lp on lp.user_id = guardian.learner_user_id
     join blossom_organization_group_member gm on gm.user_id = guardian.learner_user_id
     join blossom_organization_group g
       on g.id = gm.group_id
      and g.status = 'active'
      and g.teacher_user_id is not null
     join blossom_profile tp on tp.user_id = g.teacher_user_id
     where guardian.guardian_user_id = $1
       and guardian.status = 'active'
     order by teacher_name asc, learner_name asc`,
    [guardianUserId],
  );
  return rows.map((row) => ({
    teacherUserId: String(row.teacher_user_id),
    teacherName: String(row.teacher_name),
    learnerUserId: String(row.learner_user_id),
    learnerName: String(row.learner_name),
  }));
}

export async function getSupportInbox(userId: string): Promise<SupportConversationSummary[]> {
  if (!(await isAdmin(userId))) throw new BlossomForbiddenError("Admin requis.");
  const sql = await getSql();
  const rows = await sql.query(
    "select c.id, c.kind, c.updated_at, requester.user_id as requester_user_id, coalesce(nullif(p.display_name, ''), requester.user_id, 'Utilisateur') as peer_name, coalesce(unread.unread_count, 0)::integer as unread_count, last.body as last_message_body, last.created_at as last_message_at from blossom_conversation c join blossom_conversation_member requester on requester.conversation_id = c.id and requester.role = 'participant' left join blossom_profile p on p.user_id = requester.user_id left join lateral (select count(*)::integer as unread_count from blossom_message m where m.conversation_id = c.id and m.sender_user_id <> requester.user_id and m.created_at > coalesce(requester.last_read_at, '-infinity'::timestamptz)) unread on true left join lateral (select m.body, m.created_at from blossom_message m where m.conversation_id = c.id order by m.created_at desc limit 1) last on true where c.kind = 'support' order by c.updated_at desc limit 100",
  );
  return rows.map((row) => ({
    id: String(row.id),
    kind: "support",
    requesterUserId: row.requester_user_id ? String(row.requester_user_id) : null,
    peerUserId: row.requester_user_id ? String(row.requester_user_id) : null,
    peerName: String(row.peer_name),
    unreadCount: Number(row.unread_count ?? 0),
    lastMessageBody: row.last_message_body ? String(row.last_message_body) : null,
    lastMessageAt: row.last_message_at ? new Date(String(row.last_message_at)).toISOString() : null,
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  }));
}
