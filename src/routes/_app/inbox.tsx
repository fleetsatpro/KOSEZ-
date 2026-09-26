import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Eyebrow, Page } from "@/components/app/primitives";
import { ConversationInbox } from "@/components/app/conversation-inbox";
import { ConversationPanel } from "@/components/app/conversation-panel";
import type { ConversationSummary } from "@/lib/blossom/messaging.server";

export const Route = createFileRoute("/_app/inbox")({
  component: InboxRoute,
});

function InboxRoute() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<ConversationSummary | undefined>();

  return (
    <Page className="max-w-6xl">
      <header className="max-w-2xl">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <MessageCircle className="size-4" />
          </span>
          <Eyebrow>MESSAGES</Eyebrow>
        </div>
        <h1 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
          Les liens qui existent peuvent parler.
        </h1>
        <p className="mt-3 text-sm leading-7 text-muted sm:text-base">
          Une boîte commune pour les conversations que K’Osez autorise réellement :
          tandem accepté, relation enseignant ou assistance.
        </p>
      </header>

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(18rem,24rem)_1fr]">
        <ConversationInbox
          selectedId={selectedId}
          onSelect={(id, summary) => {
            setSelectedId(id);
            setSelected(summary);
          }}
        />
        {selectedId ? (
          <ConversationPanel
            conversationId={selectedId}
            kind={selected?.kind}
            partnerUserId={selected?.peerUserId ?? undefined}
            partnerName={selected?.peerName}
            title={selected?.kind === "support" ? "Assistance K’Osez" : selected?.peerName}
          />
        ) : (
          <div className="flex min-h-[24rem] items-center justify-center rounded-2xl border border-dashed border-border bg-surface-2/20 p-6 text-center">
            <div>
              <MessageCircle className="mx-auto size-5 text-primary" />
              <p className="mt-3 font-display text-xl">Choisissez un fil.</p>
              <p className="mt-1 max-w-sm text-sm leading-6 text-muted">
                Les messages restent liés aux relations et permissions qui les ont créés.
              </p>
            </div>
          </div>
        )}
      </div>
    </Page>
  );
}
