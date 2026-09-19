import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Eyebrow, Page, Surface } from "@/components/app/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CATALOGUE,
  NEXT_CLASS,
  planAllows,
  setsForLanguage,
} from "@/lib/blossom/data";
import { useBlossom } from "@/lib/blossom/store";
import { formatLongDate } from "@/lib/utils";

export const Route = createFileRoute("/_app/learn")({
  component: LearnPage,
});

function LearnPage() {
  const enrolled = useBlossom((s) => s.enrolledIds);
  const enroll = useBlossom((s) => s.enroll);
  const homework = useBlossom((s) => s.homework).filter(
    (h) =>
      h.studentId === "camille" &&
      (h.status === "sent" || h.status === "done"),
  );
  const completeHomework = useBlossom((s) => s.completeHomework);
  const vocab = useBlossom((s) => s.vocabulary);
  const languageId = useBlossom((s) => s.languageId);
  const plan = useBlossom((s) => s.plan);
  const sets = setsForLanguage(languageId);
  const libraryOk = planAllows(plan, "library");

  return (
    <Page>
      <Eyebrow>LEARN</Eyebrow>
      <h1 className="mt-2 font-display text-4xl tracking-tight">
        Ce qui tient votre semaine
      </h1>
      <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted">
        Un parcours, Pron'Lab, la bibliothèque, l'immersion. Pas un
        marché de contenus.
      </p>

      {homework.length > 0 && (
        <Surface className="mt-8">
          <Eyebrow>De Léa</Eyebrow>
          {homework.map((h) => (
            <div key={h.id} className="mt-3">
              <p className="font-display text-xl">{h.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">{h.body}</p>
              {h.status === "done" ? (
                <p className="mt-3 text-sm text-primary">Fait. Vous progressez.</p>
              ) : (
                <Button
                  size="sm"
                  className="mt-3"
                  onClick={() => {
                    completeHomework(h.id);
                    toast("Devoir noté dans le voyage.");
                  }}
                >
                  J'ai fait
                </Button>
              )}
            </div>
          ))}
        </Surface>
      )}

      <Surface className="mt-8 flex items-center gap-4">
        <img
          src={NEXT_CLASS.instructorAvatar}
          alt=""
          className="size-14 rounded-md object-cover"
        />
        <div className="min-w-0 flex-1">
          <Eyebrow>Prochain cours</Eyebrow>
          <p className="mt-1 font-display text-xl">{NEXT_CLASS.title}</p>
          <p className="text-sm text-muted">
            {formatLongDate(NEXT_CLASS.date)} · {NEXT_CLASS.time} ·{" "}
            {NEXT_CLASS.instructor}
          </p>
        </div>
      </Surface>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link
          to="/pronlab"
          className="overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]"
        >
          <img
            src="/images/vanilla.jpg"
            alt=""
            className="aspect-video w-full object-cover"
          />
          <div className="p-4">
            <Eyebrow>Pron'Lab</Eyebrow>
            <p className="mt-2 font-display text-2xl">Laboratoire</p>
            <p className="mt-1 text-sm text-muted">
              {sets.length} sets · historique · maîtrise
            </p>
          </div>
        </Link>
        {libraryOk ? (
        <Link
          to="/library"
          className="overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]"
        >
          <img
            src="/images/marche.jpg"
            alt=""
            className="aspect-video w-full object-cover"
          />
          <div className="p-4">
            <Eyebrow>Bibliothèque</Eyebrow>
            <p className="mt-2 font-display text-2xl">Textes A2</p>
            <p className="mt-1 text-sm text-muted">
              Toucher un mot, le garder. {vocab.length} en vocabulaire.
            </p>
          </div>
        </Link>
        ) : (
        <div className="overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]">
          <img
            src="/images/marche.jpg"
            alt=""
            className="aspect-video w-full object-cover"
          />
          <div className="p-4">
            <Eyebrow>Bibliothèque</Eyebrow>
            <p className="mt-2 font-display text-2xl">Textes A2</p>
            <p className="mt-1 text-sm text-muted">
              S'ouvre avec Premium ou le centre.
            </p>
          </div>
        </div>
        )}
        <Link
          to="/osez"
          className="overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]"
        >
          <img
            src="/images/cafe.jpg"
            alt=""
            className="aspect-video w-full object-cover"
          />
          <div className="p-4">
            <Eyebrow>Speak</Eyebrow>
            <p className="mt-2 font-display text-2xl">Salles de parole</p>
            <p className="mt-1 text-sm text-muted">
              Café, aéroport, marché — sans traduction live.
            </p>
          </div>
        </Link>
        <Link
          to="/immersion"
          className="overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]"
        >
          <img
            src="/images/reunion-coast.jpg"
            alt=""
            className="aspect-video w-full object-cover"
          />
          <div className="p-4">
            <Eyebrow>Immersion</Eyebrow>
            <p className="mt-2 font-display text-2xl">19–20 septembre</p>
            <p className="mt-1 text-sm text-muted">
              Avant, pendant, l'histoire après.
            </p>
          </div>
        </Link>
      </div>

      <Eyebrow className="mt-10">Parcours</Eyebrow>
      <ul className="mt-4 space-y-4">
        {CATALOGUE.map((item) => {
          const inIt = enrolled.includes(item.id);
          return (
            <li
              key={item.id}
              className="overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)] sm:grid sm:grid-cols-[8rem_minmax(0,1fr)]"
            >
              <img
                src={item.image}
                alt=""
                className="h-36 w-full object-cover sm:h-full"
              />
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-display text-xl">{item.title}</h2>
                  <Badge variant={inIt ? "default" : "outline"}>
                    {inIt ? "Inscrit" : item.price}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted">{item.description}</p>
                <p className="mt-2 text-xs text-subtle">
                  {item.level} · {item.format} · {item.schedule}
                </p>
                {!inIt && (
                  <Button
                    size="sm"
                    className="mt-3"
                    onClick={() => {
                      enroll(item.id);
                      toast("Demande d'inscription envoyée.");
                    }}
                  >
                    Demander une inscription
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </Page>
  );
}
