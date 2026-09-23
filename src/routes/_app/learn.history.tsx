import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Filter, History as HistoryIcon, Mic2, Target } from "lucide-react";
import { useMemo, useState } from "react";
import { Eyebrow, Page, Surface } from "@/components/app/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { historyRows } from "@/lib/blossom/learning-os";
import { useBlossom } from "@/lib/blossom/store";

type FilterId = "all" | "activité" | "preuve" | "session";

export const Route = createFileRoute("/_app/learn/history")({
  component: HistoryPage,
});

function HistoryPage() {
  const log = useBlossom((s) => s.activityLog);
  const attempts = useBlossom((s) => s.pronlabAttempts);
  const missionSessions = useBlossom((s) => s.missionSessions);
  const rows = useMemo(() => historyRows(log, attempts, missionSessions), [log, attempts, missionSessions]);
  const [filter, setFilter] = useState<FilterId>("all");
  const visible = filter === "all" ? rows : rows.filter((row) => row.kind === filter);

  return (
    <Page className="kosez-feature-page">
      <Link to="/learn" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted hover:text-primary">
        <ArrowLeft className="size-3.5" /> Atelier
      </Link>
      <header className="mt-6">
        <Eyebrow>ATELIER · HISTORIQUE</Eyebrow>
        <h1 className="mt-3 font-display text-[clamp(2.7rem,6vw,5.2rem)] leading-[0.9] tracking-[-0.05em]">
          Votre histoire, <span className="text-primary">sans bruit.</span>
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-muted sm:text-base">
          Les actions, sessions et preuves sont réunies ici pour que la progression soit inspectable — pas seulement ressentie.
        </p>
      </header>

      <div className="mt-7 flex flex-wrap gap-2">
        {([
          ["all", "Tout"],
          ["activité", "Activités"],
          ["preuve", "Preuves"],
          ["session", "Sessions"],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={`rounded-full border px-3.5 py-2 text-xs font-semibold transition ${filter === id ? "border-primary/30 bg-primary/10 text-primary" : "border-border bg-surface text-muted hover:text-fg"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <section className="mt-5 overflow-hidden rounded-2xl bg-surface shadow-[var(--shadow-border)]">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <HistoryIcon className="size-4 text-primary" />
            <p className="text-xs font-semibold uppercase tracking-[0.16em]">Chronologie</p>
          </div>
          <Badge variant="outline">{visible.length} entrées</Badge>
        </div>

        {visible.length ? (
          <ol className="divide-y divide-border">
            {visible.slice(0, 80).map((row) => (
              <li key={row.id} className="relative flex gap-4 px-5 py-5 sm:px-6">
                <span className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-primary">
                  {row.kind === "preuve" ? <Mic2 className="size-4" /> : row.kind === "session" ? <Target className="size-4" /> : <Filter className="size-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{row.title}</p>
                    <span className="text-[11px] uppercase tracking-[0.14em] text-subtle">{row.kind}</span>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-muted">{row.detail}</p>
                </div>
                <time className="shrink-0 text-xs tabular-nums text-subtle" dateTime={row.at}>
                  {new Date(row.at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                </time>
              </li>
            ))}
          </ol>
        ) : (
          <div className="p-8 text-center">
            <p className="font-display text-2xl">Rien dans ce filtre.</p>
            <p className="mt-2 text-sm text-muted">La prochaine activité apparaîtra ici.</p>
            <Button className="mt-5" asChild><Link to="/mission" search={{ missionId: undefined }}>Créer une première trace</Link></Button>
          </div>
        )}
      </section>
    </Page>
  );
}
