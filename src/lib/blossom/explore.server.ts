import { getSql } from "@/lib/db";
import { getPublishedContent } from "./content.server";
import { BlossomForbiddenError, writeAuditEvent } from "./domain.server";

export type SavedExploreItemType = "event" | "catalogue";

export async function getSavedExploreItems(userId: string) {
  const sql = await getSql();
  const rows = await sql.query(
    "select item_type, item_id from blossom_saved_explore_item where user_id = $1 order by created_at desc",
    [userId],
  );
  return rows.map((row) => ({
    itemType: String(row.item_type) as SavedExploreItemType,
    itemId: String(row.item_id),
  }));
}

export async function toggleSavedExploreItem(
  userId: string,
  input: { itemType: SavedExploreItemType; itemId: string },
) {
  const published = await getPublishedContent();
  const exists =
    input.itemType === "event"
      ? published.events.some((event) => event.id === input.itemId)
      : published.catalogue.some((item) => item.id === input.itemId);

  if (!exists) throw new BlossomForbiddenError("Cet élément n'est plus publié.");

  const sql = await getSql();
  const existing = await sql.query(
    "select 1 from blossom_saved_explore_item where user_id = $1 and item_type = $2 and item_id = $3 limit 1",
    [userId, input.itemType, input.itemId],
  );

  if (existing[0]) {
    await sql.query(
      "delete from blossom_saved_explore_item where user_id = $1 and item_type = $2 and item_id = $3",
      [userId, input.itemType, input.itemId],
    );
    await writeAuditEvent(userId, {
      action: "explore.saved.removed",
      resourceType: input.itemType,
      resourceId: input.itemId,
    });
    return { saved: false, itemType: input.itemType, itemId: input.itemId };
  }

  await sql.query(
    "insert into blossom_saved_explore_item (user_id, item_type, item_id) values ($1, $2, $3) on conflict do nothing",
    [userId, input.itemType, input.itemId],
  );
  await writeAuditEvent(userId, {
    action: "explore.saved.added",
    resourceType: input.itemType,
    resourceId: input.itemId,
  });
  return { saved: true, itemType: input.itemType, itemId: input.itemId };
}
