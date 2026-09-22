import type { LeoLetter } from "@/lib/blossom/organism";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LeoLetterCard({
  letter,
  onRead,
  className,
}: {
  letter: LeoLetter | null;
  onRead?: () => void;
  className?: string;
}) {
  if (!letter) {
    return (
      <div
        className={cn(
          "rounded-2xl border border-border/70 bg-surface p-5 shadow-[var(--shadow-border)]",
          className,
        )}
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-subtle">
          Lettre de Léo
        </p>
        <p className="mt-3 text-sm leading-6 text-muted">
          Léo écrira après quelques gestes.
        </p>
      </div>
    );
  }

  return (
    <article
      className={cn(
        "rounded-2xl border border-border/70 bg-surface p-5 shadow-[var(--shadow-border)] sm:p-6",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-subtle">
            Lettre de Léo
          </p>
          <p className="mt-1 text-xs text-muted">{letter.week}</p>
        </div>
        {!letter.read && (
          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
            Nouvelle
          </span>
        )}
      </div>
      <pre className="mt-4 whitespace-pre-wrap font-sans text-sm leading-7 text-fg">
        {letter.body}
      </pre>
      {!letter.read && onRead ? (
        <Button variant="ghost" size="sm" className="mt-4 -ml-2" onClick={onRead}>
          Marquer comme lue
        </Button>
      ) : null}
    </article>
  );
}
