export type MessageKind = "teacher" | "guardian" | "tandem";

export type MessageContact = {
  id: string;
  name: string;
  level: string | null;
  city: string | null;
  kinds: MessageKind[];
};

export function conversationKey(kind: MessageKind, userA: string, userB: string): string {
  const [first, second] = [userA, userB].sort();
  return `${kind}:${D}{first}:${D}{second}`;
}

export function messageKindLabel(kind: MessageKind): string {
  if (kind === "teacher") return "Enseignant";
  if (kind === "guardian") return "Parent / tuteur";
  return "Tandem";
}

export function messagePreview(body: string, max = 92): string {
  const value = body.replace(/\\s+/g, " ").trim();
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}