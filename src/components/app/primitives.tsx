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
        "mx-auto w-full max-w-5xl px-5 pt-6 pb-24 lg:px-10 lg:pt-10 lg:pb-12",
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
      className={cn(
        "text-[11px] font-medium uppercase tracking-[0.2em] text-muted",
        className,
      )}
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
      className={cn(
        "rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Wordmark({ inverted = false }: { inverted?: boolean }) {
  return (
    <div className="leading-none">
      <p
        className={cn(
          "font-display text-[1.35rem] tracking-tight",
          inverted ? "text-primary-foreground" : "text-fg",
        )}
      >
        K'Osez
      </p>
      <p
        className={cn(
          "mt-1 text-[10px] font-medium uppercase tracking-[0.28em]",
          inverted ? "text-primary-foreground/70" : "text-muted",
        )}
      >
        Blossom
      </p>
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
    <Surface className="px-6 py-10 text-center">
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
        "flex size-11 items-center justify-center rounded-full bg-surface-2 font-display text-lg text-primary",
        className,
      )}
    >
      {letters}
    </div>
  );
}
