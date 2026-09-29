import { writeAuditEvent, createNotification } from "./notifications.server";
import { assertFeaturePlan, getServerPlan } from "./workspaces.server";
import type { AdminBookingRow } from "./notifications.server";
import { assertAdmin, BlossomForbiddenError } from "./access.server";
import { randomUUID } from "node:crypto";
import { getSql } from "@/lib/db";
import { getPublishedContent } from "./content.server";
import { enforceRateLimit } from "./rate-limit.server";

export async function requestCatalogueBooking(
  userId: string,
  catalogueItemId: string,
) {
  await enforceRateLimit(userId, "commerce.booking-request", 10, 3600);
  const { catalogue } = await getPublishedContent();
  if (!catalogue.some((item) => item.id === catalogueItemId)) {
    throw new Error("unknown-catalogue-item");
  }
  const sql = await getSql();
  const existing = await sql.query(
    "select id, status from blossom_booking_request where user_id = $1 and catalogue_item_id = $2",
    [userId, catalogueItemId],
  );
  const previousStatus = existing[0]?.status ? String(existing[0].status) : null;

  const rows = await sql.query(
    `insert into blossom_booking_request (id, user_id, catalogue_item_id, status)
     values ($1::uuid, $2, $3, 'requested')
     on conflict (user_id, catalogue_item_id)
     do update set
       status = case
         when blossom_booking_request.status = 'confirmed'
           then blossom_booking_request.status
         else 'requested'
       end,
       updated_at = current_timestamp
     returning id, catalogue_item_id, status, payment_status, created_at, updated_at`,
    [randomUUID(), userId, catalogueItemId],
  );
  if (rows[0]) {
    const nextStatus = String(rows[0].status);
    if (previousStatus !== nextStatus) {
      await writeAuditEvent(userId, {
        action: "commerce.booking_requested",
        resourceType: "booking_request",
        resourceId: String(rows[0].id),
        metadata: { previousStatus, nextStatus },
      });
    }
    return rows[0];
  }

  const current = await sql.query(
    `select id, catalogue_item_id, status, payment_status, created_at, updated_at
     from blossom_booking_request
     where user_id = $1 and catalogue_item_id = $2`,
    [userId, catalogueItemId],
  );
  if (!current[0]) throw new Error("booking-request-write-failed");
  await writeAuditEvent(userId, {
    action: "commerce.booking_requested",
    resourceType: "booking_request",
    resourceId: String(current[0].id),
  });
  return current[0];
}

export async function requestWaitlist(userId: string, itemId: string) {
  await enforceRateLimit(userId, "commerce.waitlist-request", 10, 3600);
  const { catalogue } = await getPublishedContent();
  const item = catalogue.find((entry) => entry.id === itemId && entry.kind === "immersion");
  if (!item) throw new Error("unknown-waitlist-item");
  if (item.early === true) assertFeaturePlan(await getServerPlan(userId), "immersionEarly");
  const sql = await getSql();
  const rows = await sql.query(
    `insert into blossom_waitlist_request (id, user_id, item_id, status)
     values ($1::uuid, $2, $3, 'requested')
     on conflict (user_id, item_id)
     do update set
       status = case
         when blossom_waitlist_request.status = 'notified'
           then blossom_waitlist_request.status
         else 'requested'
       end,
       updated_at = current_timestamp
     returning id, item_id, status, created_at, updated_at`,
    [randomUUID(), userId, itemId],
  );
  if (rows[0]) return rows[0];

  const current = await sql.query(
    `select id, item_id, status, created_at, updated_at
     from blossom_waitlist_request
     where user_id = $1 and item_id = $2`,
    [userId, itemId],
  );
  if (!current[0]) throw new Error("waitlist-write-failed");
  await writeAuditEvent(userId, {
    action: "commerce.waitlist_requested",
    resourceType: "waitlist_request",
    resourceId: String(current[0].id),
  });
  return current[0];
}

export type PronlabAttemptInput = {
  itemId: string;
  score: number;
  seconds: number;
  tip?: string | null;
  metadata?: Record<string, unknown>;
  idempotencyKey?: string | null;
};

export async function getAdminBookingQueue(userId: string): Promise<AdminBookingRow[]> {
  await assertAdmin(userId);
  const sql = await getSql();
  const { catalogue } = await getPublishedContent();
  const titleMap = new Map(catalogue.map((item) => [item.id, item.title]));
  const rows = await sql.query(
    `select
       b.id,
       b.user_id,
       coalesce(nullif(p.display_name, ''), b.user_id) as learner_name,
       b.catalogue_item_id,
       b.status,
       b.payment_status,
       b.provider_reference,
       b.created_at,
       b.updated_at
     from blossom_booking_request b
     left join blossom_profile p on p.user_id = b.user_id
     order by b.updated_at desc
     limit 50`,
  );
  return rows.map((row) => ({
    id: String(row.id),
    learnerUserId: String(row.user_id),
    learnerName: String(row.learner_name),
    catalogueItemId: String(row.catalogue_item_id),
    catalogueTitle: titleMap.get(String(row.catalogue_item_id)) ?? String(row.catalogue_item_id),
    status: String(row.status) as AdminBookingRow["status"],
    paymentStatus: String(row.payment_status) as AdminBookingRow["paymentStatus"],
    providerReference: row.provider_reference ? String(row.provider_reference) : null,
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  }));
}

export type AdminBookingUpdateResult = {
  bookingId: string;
  status: AdminBookingRow["status"];
  paymentStatus: AdminBookingRow["paymentStatus"];
  providerReference: string | null;
};

export async function updateAdminBooking(
  userId: string,
  input: {
    bookingId: string;
    status?: "requested" | "confirmed" | "cancelled";
    paymentStatus?: "unpaid" | "paid" | "refunded";
    providerReference?: string | null;
  },
): Promise<AdminBookingUpdateResult> {
  await enforceRateLimit(userId, "admin.booking-update", 60, 60);
  await assertAdmin(userId);
  const sql = await getSql();
  const currentRows = await sql.query(
    `select id, user_id, status, payment_status, provider_reference
     from blossom_booking_request
     where id = $1::uuid limit 1`,
    [input.bookingId],
  );
  const current = currentRows[0];
  if (!current) throw new BlossomForbiddenError("Cette demande n'existe plus.");

  const currentStatus = String(current.status) as AdminBookingRow["status"];
  const currentPayment = String(current.payment_status) as AdminBookingRow["paymentStatus"];
  const nextStatus = input.status ?? currentStatus;
  const nextPayment = input.paymentStatus ?? currentPayment;

  if (nextStatus === "requested" && currentStatus !== "requested") {
    throw new BlossomForbiddenError("Une demande déjà traitée ne revient pas en attente.");
  }
  if (nextStatus === "requested" && nextPayment !== "unpaid") {
    throw new BlossomForbiddenError("Une demande en attente doit rester impayée.");
  }
  if (currentStatus === "cancelled" && nextStatus !== "cancelled") {
    throw new BlossomForbiddenError("Une demande annulée reste clôturée.");
  }
  if (nextPayment === "paid" && currentPayment === "refunded") {
    throw new BlossomForbiddenError("Un paiement remboursé ne peut pas être marqué payé ici.");
  }
  if (currentPayment === "refunded" && nextPayment !== "refunded") {
    throw new BlossomForbiddenError("Un paiement remboursé reste clôturé.");
  }
  if (currentPayment === "paid" && nextPayment === "unpaid") {
    throw new BlossomForbiddenError("Un paiement déjà marqué payé ne revient pas à impayé ici.");
  }
  if (nextPayment === "paid" && nextStatus === "cancelled") {
    throw new BlossomForbiddenError("Une demande annulée ne peut pas rester marquée payée.");
  }
  if (currentPayment === "paid" && nextStatus === "cancelled" && nextPayment !== "refunded") {
    throw new BlossomForbiddenError("Une annulation après paiement doit être remboursée dans la même transition.");
  }
  if (nextPayment === "paid" && nextStatus !== "confirmed") {
    throw new BlossomForbiddenError("Un paiement ne peut être confirmé qu'après la réservation.");
  }
  if (nextPayment === "refunded" && currentPayment !== "paid") {
    throw new BlossomForbiddenError("Un remboursement exige un paiement marqué payé.");
  }

  const providerReference =
    input.providerReference === undefined
      ? current.provider_reference ? String(current.provider_reference) : null
      : input.providerReference;

  const rows = await sql.query(
    `update blossom_booking_request
     set status = $2, payment_status = $3, provider_reference = $4, updated_at = current_timestamp
     where id = $1::uuid
     returning id, user_id, catalogue_item_id, status, payment_status, provider_reference, created_at, updated_at`,
    [input.bookingId, nextStatus, nextPayment, providerReference],
  );
  if (!rows[0]) throw new Error("booking-update-failed");

  const learnerId = String(rows[0].user_id);

  if (nextStatus !== currentStatus) {
    await writeAuditEvent(userId, {
      subjectUserId: learnerId,
      action: `commerce.booking.${nextStatus}`,
      resourceType: "booking_request",
      resourceId: input.bookingId,
      metadata: { previousStatus: currentStatus, nextStatus },
    });
    if (nextStatus === "confirmed") {
      await createNotification(learnerId, {
        kind: "booking",
        title: "Votre réservation est confirmée",
        body: "K’Osez a confirmé votre demande. Consultez votre espace pour la suite.",
        href: "/moi",
        metadata: { bookingId: input.bookingId },
      });
    } else if (nextStatus === "cancelled") {
      await createNotification(learnerId, {
        kind: "booking",
        title: "Votre réservation a été annulée",
        body: "La demande n’est plus active. K’Osez reste disponible pour vous proposer une autre porte.",
        href: "/explore",
        metadata: { bookingId: input.bookingId },
      });
    }
  }

  if (nextPayment !== currentPayment) {
    await writeAuditEvent(userId, {
      subjectUserId: learnerId,
      action: `commerce.payment.${nextPayment}`,
      resourceType: "booking_request",
      resourceId: input.bookingId,
      metadata: { previousPaymentStatus: currentPayment, nextPaymentStatus: nextPayment },
    });
    await createNotification(learnerId, {
      kind: "booking",
      title: nextPayment === "paid" ? "Paiement enregistré" : "Paiement remboursé",
      body:
        nextPayment === "paid"
          ? "Le paiement associé à votre réservation est marqué comme payé par K’Osez."
          : "Le paiement associé à votre réservation est marqué comme remboursé.",
      href: "/moi",
      metadata: { bookingId: input.bookingId, paymentStatus: nextPayment },
    });
  }

  return {
    bookingId: String(rows[0].id),
    status: String(rows[0].status) as AdminBookingRow["status"],
    paymentStatus: String(rows[0].payment_status) as AdminBookingRow["paymentStatus"],
    providerReference: rows[0].provider_reference
      ? String(rows[0].provider_reference)
      : null,
  };
}
