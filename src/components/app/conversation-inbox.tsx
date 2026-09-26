import { useEffect, useState } from "react";
import { LifeBuoy, MessageCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Eyebrow, Surface } from "@/components/app/primitives";
import {
  getOrCreateConversationOnServer,
  listConversationsOnServer,
} from "@/lib/blossom/domain.api";
import type { ConversationSummary } from "@/lib/blossom/messaging.server";

export function ConversationInbox({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect: (id: string, summary?: ConversationSummary) => void;
}) {
  const [items, setItems] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      setItems(await listConversationsOnServer());
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 15_000);
    return () => window.clearInterval(timer);
  }, []);

  async function openSupport() {
    try {
      const conversation = await getOrCreateConversationOnServer({ data: { kind: "support" } });
      onSelect(conversation.id);
      await load();
    } catch {
      toast("L’assistance n’est pas disponible pour ce compte.");
    }
  }

  return (
    <Surface className="mt-5 !p-0 overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-border p-5 sm:p-6">
        <div>
          <Eyebrow>Messagerie</Eyebrow>
          <h2 className="mt-2 font-display text-2xl tracking-tight">Vos conversations</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Une même boîte rassemble les fils réellement ouverts avec vos relations autorisées.
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => void load()} aria-label="Actualiser les conversations">
          <RefreshCw className="size-4" />
        </Button>
      </div>

      <div className="border-b border-border/70 p-4">
        <Button variant="secondary" className="w-full justify-center" onClick={() => void openSupport()}>
          <LifeBuoy className="size-4" />
          Parler à K’Osez
        </Button>
      </div>

      {loading ? (
        <p className="p-6 text-sm text-muted">Lecture des conversations…</p>
      ) : items.length === 0 ? (
        <div className="p-6 text-center">
          <MessageCircle className="mx-auto size-5 text-primary" />
          <p className="mt-3 text-sm text-muted">Aucune conversation durable pour le moment.</p>
        </div>
      ) : (
        <div className="divide-y divide-border/60">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id, item)}
              className={
                selectedId === item.id
                  ? "flex w-full items-start gap-3 bg-primary/5 p-4 text-left"
                  : "flex w-full items-start gap-3 p-4 text-left hover:bg-surface-2/50"
              }
            >
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <MessageCircle className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-3">
                  <span className="truncate text-sm font-medium">{item.peerName}</span>
                  {item.unreadCount > 0 ? (
                    <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                      {item.unreadCount}
                    </span>
                  ) : null}
                </span>
                <span className="mt-1 block text-[11px] uppercase tracking-[0.12em] text-subtle">
                  {item.kind === "tandem" ? "Tandem" : item.kind === "teacher" ? "Enseignant" : "Assistance"}
                </span>
                <span className="mt-1 block truncate text-xs text-muted">
                  {item.lastMessageBody ?? "Aucun message encore"}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </Surface>
  );
}
