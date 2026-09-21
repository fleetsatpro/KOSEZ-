import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Page({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "kosez-main-page mx-auto w-full px-5 pt-7 pb-24 lg:px-12 lg:pt-11 lg:pb-14",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Eyebrow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn("kosez-eyebrow text-[10px] font-bold uppercase", className)}
    >
      {children}
    </p>
  );
}

export function Surface({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("kosez-surface rounded-2xl p-5 sm:p-6", className)}
    >
      {children}
    </div>
  );
}

export function Wordmark({ inverted = false }: { inverted?: boolean }) {
  return (
    <div className="flex items-center gap-3 leading-none">
      <span
        aria-hidden="true"
        className={cn(
          "kosez-wordmark-mark relative flex shrink-0 items-center justify-center rounded-lg",
          inverted && "border-primary-foreground/30 bg-primary-foreground/10",
        )}
      >
        <span
          className={cn(
            "block size-2.5 rounded-full bg-primary",
            inverted && "bg-primary-foreground",
          )}
        />
      </span>
      <div>
        <p
          className={cn(
            "kosez-wordmark-primary",
            inverted ? "text-primary-foreground" : "text-fg",
          )}
        >
          K'Osez
        </p>
        <p
          className={cn(
            "kosez-wordmark-sub mt-1",
            inverted ? "text-primary-foreground/65" : "text-muted",
          )}
        >
          BLOSSOM
        </p>
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <Surface className="px-6 py-12 text-center">
      <p className="font-display text-xl text-fg">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
        {body}
      </p>
    </Surface>
  );
}

export function Sparkline({ values }: { values: number[] }) {
  if (values.length === 0) {
    return <p className="text-xs text-subtle">Pas encore d'historique.</p>;
  }
  return (
    <div className="flex h-10 items-end gap-1" aria-hidden>
      {values.slice(-10).map((value, i) => (
        <div
          key={`${value}-${i}`}
          className="flex-1 rounded-sm bg-primary/80"
          style={{ height: `${Math.max(10, value)}%` }}
        />
      ))}
    </div>
  );
}

export function DualWave({
  leftLabel,
  rightLabel,
  match = 0.72,
}: {
  leftLabel: string;
  rightLabel: string;
  match?: number;
}) {
  const model = [40, 70, 55, 88, 62, 75, 48, 80, 58];
  const scale = Math.max(0.35, Math.min(1, match));
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-subtle">{leftLabel}</p>
        <div className="mt-2 flex h-10 items-end gap-1" aria-hidden>
          {model.map((h, i) => (
            <div
              key={`m-${i}`}
              className="flex-1 rounded-sm bg-primary/70"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-subtle">{rightLabel}</p>
        <div className="mt-2 flex h-10 items-end gap-1" aria-hidden>
          {model.map((h, i) => (
            <div
              key={`y-${i}`}
              className="flex-1 rounded-sm bg-clay/80"
              style={{ height: `${Math.max(18, Math.round(h * scale * 0.92))}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function Initials({
  letters,
  className,
}: {
  letters: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex size-11 items-center justify-center rounded-xl bg-surface-2 font-display text-lg font-semibold text-primary",
        className,
      )}
    >
      {letters}
    </div>
  );
}
