import { createHash } from "node:crypto";

export type MessageKind = "tandem" | "teacher" | "support";

export function conversationIdForRelationship(
  kind: Exclude<MessageKind, "support">,
  userA: string,
  userB: string,
): string {
  const [left, right] = [userA, userB].sort();
  const digest = createHash("sha256")
    .update("kosez-conversation:")
    .update(kind)
    .update(":")
    .update(left)
    .update(":")
    .update(right)
    .digest("hex")
    .slice(0, 32);
  return [
    digest.slice(0, 8),
    digest.slice(8, 12),
    "5" + digest.slice(13, 16),
    ((parseInt(digest.slice(16, 18), 16) & 0x3f) | 0x80).toString(16).padStart(2, "0") +
      digest.slice(18, 20),
    digest.slice(20),
  ].join("-");
}
