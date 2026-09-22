import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import {
  getAdminContentItems,
  getPublishedContent,
  publishContent,
  archiveContent,
  saveContentDraft,
} from "./content.server";

const eventContentSchema = z.object({
  id: z.string().trim().regex(/^[a-z0-9][a-z0-9-]{1,159}$/),
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

const catalogueContentSchema = z.object({
  id: z.string().trim().regex(/^[a-z0-9][a-z0-9-]{1,159}$/),
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

export const getPublishedContentOnServer = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async () => getPublishedContent());

export const getAdminContentItemsOnServer = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => getAdminContentItems(context.userId));

export const saveAdminContentDraftOnServer = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(
    z.discriminatedUnion("kind", [
      z.object({
        kind: z.literal("event"),
        contentKey: z.string().trim().regex(/^[a-z0-9][a-z0-9-]{1,159}$/),
        payload: eventContentSchema,
        expectedDraftRevision: z.number().int().nonnegative(),
      }),
      z.object({
        kind: z.literal("catalogue"),
        contentKey: z.string().trim().regex(/^[a-z0-9][a-z0-9-]{1,159}$/),
        payload: catalogueContentSchema,
        expectedDraftRevision: z.number().int().nonnegative(),
      }),
    ]),
  )
  .handler(async ({ context, data }) =>
    saveContentDraft(context.userId, data),
  );

export const archiveAdminContentOnServer = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      contentKey: z.string().trim().regex(/^[a-z0-9][a-z0-9-]{1,159}$/),
      expectedPublishedRevision: z.number().int().positive(),
    }),
  )
  .handler(async ({ context, data }) =>
    archiveContent(context.userId, data.contentKey, data.expectedPublishedRevision),
  );

export const publishAdminContentOnServer = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      contentKey: z.string().trim().regex(/^[a-z0-9][a-z0-9-]{1,159}$/),
      expectedDraftRevision: z.number().int().positive(),
    }),
  )
  .handler(async ({ context, data }) =>
    publishContent(context.userId, data.contentKey, data.expectedDraftRevision),
  );
