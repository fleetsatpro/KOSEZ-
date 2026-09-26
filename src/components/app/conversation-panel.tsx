import { useEffect, useState } from "react";
import { Flag, LoaderCircle, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Eyebrow, Surface } from "@/components/app/primitives";
import { getConversationMessagesOnServer, getOrCreateConversationOnServer, markConversationReadOnServer, reportConversationMessageOnServer, sendConversationMessageOnServer, getSupportInboxOnServer } from "@/lib/blossom/domain.api";
import type { ConversationKind, ConversationMessage } from "@/lib/blossom/messaging.server";
import { useCurrentUser } from "@/lib/auth/use-current-user";

export function ConversationPanel({
  kind,
  partnerUserId,
  partnerName,
  conversationId,
  title,
}: {
  kind?: ConversationKind;
  partnerUserId?: string;
  partnerName?: string;
  conversationId?: string;
  title?: string;
}) {
  const currentUser = useCurrentUser();
  const [id, setId] = useState(conversationId ?? "");
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadMessages(targetId: string) {
    try {
      const next = await getConversationMessagesOnServer({ data: { conversationId: targetId, limit: 60 } });
      setMessages(next);
      await markConversationReadOnServer({ data: { conversationId: targetId } });
      setError(null);
    } catch {
      setError("La conversation n’est pas disponible pour ce compte.");
    }
  }

  useEffect(() => {
    let disposed = false;
    setLoading(true);
    setError(null);
    const ready = conversationId
      ? Promise.resolve({ id: conversationId })
      : getOrCreateConversationOnServer({ data: { kind: kind ?? "support", partnerUserId } });
    void ready.then((conversation) => {
      if (disposed) return;
      setId(conversation.id);
      return loadMessages(conversation.id);
    }).finally(() => {
      if (!disposed) setLoading(false);
    });
    return () => { disposed = true; };
  }, [conversationId, kind, partnerUserId]);

  useEffect(() => {
    if (!id) return;
    const timer = window.setInterval(() => void loadMessages(id), 15_000);
    return () => window.clearInterval(timer);
  }, [id]);

  async function send() {
    const trimmed = body.trim();
    if (!id || !trimmed || sending) return;
    setSending(true);
    try {
      const message = await sendConversationMessageOnServer({
        data: { conversationId: id, body: trimmed, clientMessageId: crypto.randomUUID() },
      });
      setMessages((current) => current.some((item) => item.id === message.id) ? current : [...current, message]);
      setBody("");
      await markConversationReadOnServer({ data: { conversationId: id } });
    } catch {
      toast("Le message n’a pas été envoyé. Rien n’est affiché comme envoyé.");
    } finally {
      setSending(false);
    }
  }

  async function report(messageId: string) {
    const reason = window.prompt("Motif du signalement")?.trim();
    if (!reason) return;
    try {
      await reportConversationMessageOnServer({ data: { conversationId: id, messageId, reason } });
      toast("Signalement transmis au circuit de sécurité.");
    } catch {
      toast("Le signalement n’a pas pu être enregistré.");
    }
  }

  return (
    <Surface className="mt-5 !p-0 overflow-hidden">
      <div className="border-b border-border p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <MessageCircle className="size-4" />
          </span>
          <div className="min-w-0">
            <Eyebrow>{kind === "support" ? "Assistance" : "Conversation"}</Eyebrow>
            <h3 className="mt-1 font-display text-xl tracking-tight">{title ?? partnerName ?? (kind === "support" ? "K’Osez" : "Conversation privée")}</h3>
          </div>
        </div>
      </div>

      {loading ? <div className="p-6 text-sm text-muted">Chargement de la conversation…</div> : error ? <div className="p-6 text-sm text-muted">{error}</div> : (
        <>
          <div className="max-h-[24rem] space-y-3 overflow-y-auto p-5 sm:p-6" aria-live="polite">
            {messages.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border p-4 text-sm leading-6 text-muted">Aucun message encore. La première phrase peut être simple et concrète.</p>
            ) : messages.map((message) => {
              const mine = currentUser?.id === message.senderUserId;
              return (
                <div key={message.id} className={mine ? "ml-auto max-w-[86%]" : "max-w-[86%]"}>
                  <div className={mine ? "rounded-2xl bg-primary p-3.5 text-primary-foreground" : "rounded-2xl bg-surface-2 p-3.5"}>
                    <p className="whitespace-pre-wrap text-sm leading-6">{message.body}</p>
                  </div>
                  {!mine ? <button type="button" onClick={() => void report(message.id)} className="mt-1 inline-flex min-h-6 items-center gap-1 rounded px-1 text-[10px] text-subtle hover:text-fg" aria-label="Signaler ce message"><Flag className="size-3" /> Signaler</button> : null}
                </div>
              );
            })}
          </div>
          <div className="border-t border-border p-4 sm:p-5">
            <div className="flex gap-2">
              <textarea value={body} onChange={(event) => setBody(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void send(); } }} maxLength={4000} rows={2} className="min-h-12 flex-1 resize-y rounded-xl border border-border bg-bg px-3 py-3 text-sm leading-6 outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/10" placeholder="Écrire un message…" aria-label="Nouveau message" />
              <Button size="icon" className="size-12 shrink-0 self-end" disabled={!body.trim() || sending} onClick={() => void send()} aria-label="Envoyer le message">
                {sending ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}
              </Button>
            </div>
            <p className="mt-2 text-[11px] leading-5 text-subtle">Les messages sont enregistrés côté serveur uniquement après confirmation de l’envoi.</p>
          </div>
        </>
      )}
    </Surface>
  );
}


export function SupportInbox({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [items, setItems] = useState<Awaited<ReturnType<typeof getSupportInboxOnServer>>>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      setItems(await getSupportInboxOnServer());
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

  return (
    <Surface className="mt-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Eyebrow>Support</Eyebrow>
          <h2 className="mt-2 font-display text-2xl">Demandes réelles</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={() => void load()}>
          Actualiser
        </Button>
      </div>

      {loading ? (
        <p className="mt-5 text-sm text-muted">Chargement…</p>
      ) : items.length === 0 ? (
        <p className="mt-5 text-sm text-muted">Aucune conversation d’assistance ouverte.</p>
      ) : (
        <div className="mt-5 space-y-2">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={
                selectedId === item.id
                  ? "flex min-h-12 w-full items-center gap-3 rounded-xl bg-primary/10 px-3 text-left"
                  : "flex min-h-12 w-full items-center gap-3 rounded-xl bg-surface-2/50 px-3 text-left hover:bg-surface-2"
              }
            >
              <span className="size-2 shrink-0 rounded-full bg-primary" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{item.peerName}</span>
                <span className="mt-0.5 block truncate text-xs text-muted">
                  {item.lastMessageBody ?? "Aucun message"}
                </span>
              </span>
              {item.unreadCount ? (
                <span className="rounded-full bg-primary px-2 py-1 text-[10px] font-bold text-primary-foreground">
                  {item.unreadCount}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      )}
    </Surface>
  );
}
