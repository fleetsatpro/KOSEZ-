import { Activity, ArrowRight, BookOpen, Mic, Target } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  getGuardianLearnerDetailOnServer,
  getTeacherLearnerDetailOnServer,
} from "@/lib/blossom/domain.api";
import type { LearnerDetail } from "@/lib/blossom/domain.server";
import { Badge } from "@/components/ui/badge";
import { Eyebrow, Surface } from "@/components/app/primitives";

function relative(value: string) {
  const delta = Math.max(0, Date.now() - new Date(value).getTime());
  const minutes = Math.floor(delta / 60_000);
  if (minutes < 60) return minutes < 1 ? "À l’instant" : `Il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "Hier" : `Il y a ${days} jours`;
}

export function LearnerDetail({
  learnerUserId,
  role,
}: {
  learnerUserId: string;
  role: "teacher" | "guardian";
}) {
  const [detail, setDetail] = useState<LearnerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let disposed = false;
    setLoading(true);
    setError(false);
    const load =
      role === "teacher"
        ? getTeacherLearnerDetailOnServer({ data: { learnerUserId } })
        : getGuardianLearnerDetailOnServer({ data: { learnerUserId } });
    void load
      .then((value) => {
        if (!disposed) setDetail(value);
      })
      .catch(() => {
        if (!disposed) {
          setDetail(null);
          setError(true);
        }
      })
      .finally(() => {
        if (!disposed) setLoading(false);
      });
    return () => {
      disposed = true;
    };
  }, [learnerUserId, role]);

  if (loading) {
    return (
      <Surface className="mt-5">
        <p className="text-sm text-muted">Lecture du parcours autorisé…</p>
      </Surface>
    );
  }

  if (error || !detail) {
    return (
      <Surface className="mt-5">
        <Eyebrow>Parcours</Eyebrow>
        <p className="mt-2 font-display text-xl">Ce dossier n’est pas disponible.</p>
        <p className="mt-1 text-sm text-muted">
          L’accès est revérifié côté serveur pour chaque apprenant.
        </p>
      </Surface>
    );
  }

  const recentActivity = detail.activity.slice(0, 8);
  const recentPronlab = detail.pronlab.slice(0, 6);
  const recentHomework = detail.homework.slice(0, 6);

  return (
    <section className="mt-5 grid gap-4 lg:grid-cols-[1.05fr_.95fr]">
      <div className="space-y-4">
        <Surface>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Eyebrow>Lecture individualisée</Eyebrow>
              <h2 className="mt-2 font-display text-3xl tracking-tight">{detail.name}</h2>
              <p className="mt-1 text-sm text-muted">
                {detail.targetLanguage} · {detail.level ?? "Niveau non renseigné"}
              </p>
            </div>
            <Badge variant="outline">{detail.activity.length} traces récentes</Badge>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Metric icon={Activity} label="Traces" value={String(detail.activity.length)} />
            <Metric icon={Mic} label="Pron’Lab" value={String(detail.pronlab.length)} />
            <Metric icon={BookOpen} label="Devoirs" value={String(detail.homework.length)} />
          </div>
          {detail.goal ? (
            <div className="mt-5 rounded-xl border border-border bg-surface-2/45 p-4">
              <p className="text-[10px] uppercase tracking-[0.16em] text-subtle">Objectif</p>
              <p className="mt-2 text-sm leading-6">{detail.goal}</p>
            </div>
          ) : null}
        </Surface>

        <Surface>
          <div className="flex items-center justify-between gap-3">
            <div>
              <Eyebrow>Fil de preuves</Eyebrow>
              <h3 className="mt-1 font-display text-xl">Ce qui s’est réellement passé</h3>
            </div>
            <Target className="size-4 text-primary" />
          </div>
          {recentActivity.length ? (
            <ul className="mt-4 space-y-2">
              {recentActivity.map((event) => (
                <li key={event.id} className="rounded-xl border border-border/70 bg-surface-2/30 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium">{event.type}</p>
                    <span className="shrink-0 text-[10px] text-subtle">{relative(event.occurredAt)}</span>
                  </div>
                  {event.sourceId ? <p className="mt-1 text-xs text-muted">{event.sourceId}</p> : null}
                  {event.note ? <p className="mt-2 text-xs leading-5 text-muted">{event.note}</p> : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted">Aucune trace récente.</p>
          )}
        </Surface>
      </div>

      <div className="space-y-4">
        <Surface>
          <div className="flex items-end justify-between gap-3">
            <div>
              <Eyebrow>Pron’Lab</Eyebrow>
              <h3 className="mt-1 font-display text-xl">Dernières observations</h3>
            </div>
            <Link to="/pronlab" className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              Ouvrir <ArrowRight className="inline size-3.5" />
            </Link>
          </div>
          {recentPronlab.length ? (
            <ul className="mt-4 space-y-2">
              {recentPronlab.map((attempt) => (
                <li key={attempt.id} className="flex items-center justify-between gap-3 rounded-xl bg-surface-2/40 px-3 py-3 text-sm">
                  <span className="min-w-0 truncate">{attempt.itemId}</span>
                  <span className="shrink-0 text-xs text-muted">
                    {attempt.assessment === "capture-only" ? `Capture · ${attempt.seconds}s` : `${attempt.score}/100`}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted">Aucune observation Pron’Lab.</p>
          )}
        </Surface>

        <Surface>
          <Eyebrow>Devoirs</Eyebrow>
          {recentHomework.length ? (
            <ul className="mt-4 space-y-3">
              {recentHomework.map((item) => (
                <li key={item.id} className="rounded-xl border border-border/70 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium">{item.title}</p>
                    <Badge variant="outline">{item.status}</Badge>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-muted">{item.body}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted">Aucun devoir enregistré.</p>
          )}
        </Surface>

        {role === "teacher" && detail.notes.length ? (
          <Surface>
            <Eyebrow>Notes enseignant</Eyebrow>
            <ul className="mt-4 space-y-3">
              {detail.notes.slice(0, 5).map((note) => (
                <li key={note.id}>
                  <div className="flex flex-wrap gap-1">
                    {note.tags.map((tag) => <Badge key={tag} variant="outline">{tag}</Badge>)}
                  </div>
                  <p className="mt-2 text-sm leading-6">{note.text}</p>
                </li>
              ))}
            </ul>
          </Surface>
        ) : null}
      </div>
    </section>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface-2/40 p-4">
      <Icon className="size-4 text-primary" />
      <p className="mt-2 text-[10px] uppercase tracking-[0.16em] text-subtle">{label}</p>
      <p className="mt-1 font-display text-2xl tabular-nums">{value}</p>
    </div>
  );
}
