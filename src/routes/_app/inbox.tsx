import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { LoaderCircle, MessageCircle, Send, Users } from "lucide-react";
import { Eyebrow, Page, Surface } from "@/components/app/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getMessageContactsOnServer, getConversationOnServer, getConversationsOnServer, markConversationReadOnServer, sendMessageOnServer, startConversationOnServer } from "@/lib/blossom/domain.api";
import { messageKindLabel, messagePreview, type MessageKind } from "@/lib/blossom/communication";

export const Route = createFileRoute("/_app/inbox")({ component: InboxPage });
type Conversation = Awaited<ReturnType<typeof getConversationsOnServer>>[number];
type Contact = Awaited<ReturnType<typeof getMessageContactsOnServer>>[number];

function InboxPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Awaited<ReturnType<typeof getConversationOnServer>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [conversationLoading, setConversationLoading] = useState(false);
  const [composer, setComposer] = useState("");
  const [composerBusy, setComposerBusy] = useState(false);
  const [startOpen, setStartOpen] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [nextConversations, nextContacts] = await Promise.all([getConversationsOnServer(), getMessageContactsOnServer()]);
      setConversations(nextConversations);
      setContacts(nextContacts);
      setSelectedId((current) => current ?? nextConversations[0]?.id ?? null);
    } catch {
      setConversations([]); setContacts([]);
    } finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  async function openConversation(id: string) {
    setSelectedId(id); setConversationLoading(true);
    try {
      const value = await getConversationOnServer({ data: { conversationId: id } });
      setSelected(value);
      await markConversationReadOnServer({ data: { conversationId: id } });
      setConversations((current) => current.map((item) => item.id === id ? { ...item, unreadCount: 0 } : item));
    } catch { setSelected(null); } finally { setConversationLoading(false); }
  }
  useEffect(() => { if (selectedId) void openConversation(selectedId); }, [selectedId]);

  async function start(kind: MessageKind, targetUserId: string) {
    setStartError(null);
    try { const id = await startConversationOnServer({ data: { kind, targetUserId } }); setStartOpen(false); await load(); setSelectedId(id); }
    catch (error) { setStartError(error instanceof Error ? error.message : "Cette conversation ne peut pas être ouverte."); }
  }

  async function send() {
    const body = composer.trim(); if (!body || !selectedId || composerBusy) return;
    setComposerBusy(true);
    try {
      const message = await sendMessageOnServer({ data: { conversationId: selectedId, body, clientMessageId: crypto.randomUUID() } });
      setComposer("");
      setSelected((current) => current ? { ...current, messages: [...current.messages, message] } : current);
      setConversations((current) => current.map((item) => item.id === selectedId ? { ...item, lastMessage: message.body, lastMessageAt: message.createdAt } : item));
    } catch { /* Keep the draft if delivery is rejected. */ } finally { setComposerBusy(false); }
  }

  const contactsByKind = useMemo(() => contacts.flatMap((contact) => contact.kinds.map((kind) => ({ contact, kind }))), [contacts]);

  if (loading) return <Page className="max-w-5xl"><Eyebrow>MESSAGES</Eyebrow><h1 className="mt-2 font-display text-4xl">Votre espace de conversation.</h1><div className="mt-8 flex items-center gap-2 text-sm text-muted"><LoaderCircle className="size-4 animate-spin" /> Chargement…</div></Page>;

  return (
    <Page className="max-w-5xl">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div><Eyebrow>MESSAGES</Eyebrow><h1 className="mt-2 font-display text-4xl tracking-tight">Parler à quelqu’un, sans fabriquer le lien.</h1><p className="mt-2 max-w-2xl text-sm leading-7 text-muted">Les conversations existent uniquement quand une relation K’Osez les autorise : enseignant, parent/tuteur ou tandem réciproque.</p></div>
        <Button onClick={() => setStartOpen((value) => !value)}><MessageCircle className="size-4" /> Nouveau message</Button>
      </header>
      {startOpen ? <Surface className="mt-5 !p-5"><div className="flex items-center gap-2"><Users className="size-4 text-primary" /><Eyebrow>Destinataires autorisés</Eyebrow></div><p className="mt-2 text-sm leading-6 text-muted">Aucun utilisateur libre-service : choisissez une personne avec laquelle K’Osez a déjà établi une relation.</p>{startError ? <p className="mt-3 text-sm text-destructive">{startError}</p> : null}<div className="mt-4 grid gap-2 sm:grid-cols-2">{contactsByKind.length === 0 ? <p className="text-sm text-subtle">Aucun destinataire disponible pour votre compte.</p> : contactsByKind.map(({ contact, kind }) => <button key={`${contact.id}:${D}{kind}`} type="button" onClick={() => void start(kind, contact.id)} className="flex min-h-12 items-center justify-between gap-3 rounded-xl border border-border bg-surface-2/40 px-4 py-3 text-left hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"><span className="min-w-0"><span className="block font-medium">{contact.name}</span><span className="mt-0.5 block text-xs text-muted">{messageKindLabel(kind)}{contact.level ? ` · ${D}{contact.level}` : ""}</span></span><MessageCircle className="size-4 shrink-0 text-primary" /></button>)}</div></Surface> : null}
      <div className="mt-6 grid gap-4 lg:grid-cols-[20rem_1fr]">
        <Surface className="!p-2"><div className="px-3 py-3"><Eyebrow>Conversations</Eyebrow><p className="mt-1 text-xs text-muted">{conversations.length} ouverte{conversations.length === 1 ? "" : "s"}</p></div>{conversations.length === 0 ? <div className="px-3 py-8 text-center"><MessageCircle className="mx-auto size-5 text-primary" /><p className="mt-3 font-display text-lg">Pas encore de conversation.</p><p className="mt-1 text-sm leading-6 text-muted">Commencez par un enseignant, un proche autorisé ou un tandem accepté.</p></div> : <ul>{conversations.map((conversation) => <li key={conversation.id}><button type="button" onClick={() => void openConversation(conversation.id)} className={`flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition ${D}{selectedId === conversation.id ? "bg-primary/10" : "hover:bg-surface-2"}`}><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-primary"><MessageCircle className="size-4" /></span><span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><span className="truncate text-sm font-medium">{conversation.otherName}</span>{conversation.unreadCount > 0 ? <Badge>{conversation.unreadCount}</Badge> : null}</span><span className="mt-1 block truncate text-[11px] text-muted">{messageKindLabel(conversation.kind)} · {conversation.lastMessage ? messagePreview(conversation.lastMessage) : "Aucun message"}</span></span></button></li>)}</ul>}</Surface>
        <Surface className="!p-0 overflow-hidden">{!selected && !conversationLoading ? <div className="flex min-h-[30rem] items-center justify-center px-6 text-center"><div><MessageCircle className="mx-auto size-6 text-primary" /><p className="mt-4 font-display text-2xl">Choisissez une conversation.</p><p className="mt-2 text-sm text-muted">Les messages sont conservés côté K’Osez.</p></div></div> : conversationLoading ? <div className="flex min-h-[30rem] items-center justify-center gap-2 text-sm text-muted"><LoaderCircle className="size-4 animate-spin" /> Ouverture…</div> : selected ? <div className="flex min-h-[30rem] flex-col"><header className="border-b border-border px-5 py-4"><Eyebrow>{messageKindLabel(selected.kind)}</Eyebrow><h2 className="mt-1 font-display text-xl">{selected.otherName}</h2></header><div className="flex-1 space-y-3 overflow-y-auto px-5 py-5">{selected.messages.length === 0 ? <div className="py-16 text-center"><p className="font-display text-xl">Le fil commence ici.</p><p className="mt-1 text-sm text-muted">Écrivez quelque chose de concret.</p></div> : selected.messages.map((message) => <article key={message.id} className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-6 ${D}{message.mine ? "ml-auto bg-primary text-primary-foreground" : "bg-surface-2 text-fg"}`}><p className="whitespace-pre-wrap break-words">{message.body}</p><p className={`mt-2 text-[10px] ${D}{message.mine ? "text-primary-foreground/65" : "text-subtle"}`}>{new Date(message.createdAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}</p></article>)}</div><div className="border-t border-border px-5 py-4"><div className="flex items-end gap-2"><textarea value={composer} onChange={(event) => setComposer(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void send(); } }} maxLength={4000} rows={2} placeholder="Écrivez un message…" className="min-h-12 flex-1 resize-y rounded-xl border border-border bg-bg p-3 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-ring/20" /><Button type="button" onClick={() => void send()} disabled={composerBusy || !composer.trim()} className="min-h-12" aria-label="Envoyer le message">{composerBusy ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}</Button></div><p className="mt-2 text-[10px] text-subtle">Entrée pour envoyer · Maj + Entrée pour un retour.</p></div></div> : null}</Surface>
      </div>
    </Page>
  );
}