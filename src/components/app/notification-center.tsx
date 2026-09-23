import { Bell, Check, ExternalLink, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  getNotificationsOnServer,
  markNotificationReadOnServer,
} from "@/lib/blossom/domain.api";
import type { BlossomNotification } from "@/lib/blossom/domain.server";
import { cn } from "@/lib/utils";

function relativeTime(value: string) {
  const delta = Math.max(0, Date.now() - new Date(value).getTime());
  const minutes = Math.floor(delta / 60_000);
  if (minutes < 1) return "À l’instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "Hier" : `Il y a ${days} jours`;
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<BlossomNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const unread = items.filter((item) => !item.readAt).length;

  async function load() {
    setLoading(true);
    try {
      setItems(await getNotificationsOnServer({ data: { limit: 40 } }));
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  async function markRead(item: BlossomNotification) {
    if (item.readAt) return;
    try {
      await markNotificationReadOnServer({ data: { notificationId: item.id } });
      setItems((current) =>
        current.map((entry) =>
          entry.id === item.id
            ? { ...entry, readAt: new Date().toISOString() }
            : entry,
        ),
      );
    } catch {
      /* Keep the notification unread when the server write fails. */
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={unread ? `${unread} notification${unread > 1 ? "s" : ""} non lue${unread > 1 ? "s" : ""}` : "Notifications"}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="relative flex w-full items-center gap-3 rounded-xl border border-border bg-surface-2/50 px-3.5 py-3 text-left transition hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        <span className="relative flex size-8 items-center justify-center rounded-lg bg-bg text-primary">
          <Bell className="size-4" strokeWidth={1.7} />
          {unread ? (
            <span className="absolute -right-1 -top-1 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          ) : null}
        </span>
        <span className="min-w-0">
          <span className="block text-xs font-medium">Notifications</span>
          <span className="mt-0.5 block truncate text-[11px] text-subtle">
            {unread ? `${unread} à lire` : "Rien de nouveau"}
          </span>
        </span>
      </button>

      {open ? (
        <div className="absolute bottom-[calc(100%+0.6rem)] left-0 z-50 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border bg-bg shadow-[0_24px_80px_-32px_rgba(0,0,0,.7)]">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-subtle">Centre</p>
              <p className="mt-1 font-display text-lg">Vos notifications</p>
            </div>
            <button
              type="button"
              onClick={() => void load()}
              className="rounded-lg p-2 text-subtle hover:bg-surface-2 hover:text-fg"
              aria-label="Actualiser les notifications"
            >
              {loading ? <LoaderCircle className="size-4 animate-spin" /> : <Bell className="size-4" />}
            </button>
          </div>
          <div className="max-h-[22rem] overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-5 py-9 text-center">
                <Check className="mx-auto size-5 text-primary" />
                <p className="mt-3 font-display text-lg">Tout est calme.</p>
                <p className="mt-1 text-sm leading-6 text-muted">
                  Les confirmations, devoirs et connexions importantes apparaîtront ici.
                </p>
              </div>
            ) : (
              items.map((item) => {
                const content = (
                  <div
                    className={cn(
                      "flex gap-3 border-b border-border/60 px-4 py-4 transition hover:bg-surface-2/40",
                      !item.readAt && "bg-primary/5",
                    )}
                  >
                    <span className="mt-0.5 size-2 shrink-0 rounded-full bg-primary/80" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-medium">{item.title}</p>
                        <span className="shrink-0 text-[10px] text-subtle">{relativeTime(item.createdAt)}</span>
                      </div>
                      <p className="mt-1 text-xs leading-5 text-muted">{item.body}</p>
                      <div className="mt-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-subtle">
                        {item.href ? <ExternalLink className="size-3" /> : null}
                        {item.kind}
                      </div>
                    </div>
                  </div>
                );

                return item.href ? (
                  <Link
                    key={item.id}
                    to={item.href as never}
                    onClick={() => {
                      void markRead(item);
                      setOpen(false);
                    }}
                  >
                    {content}
                  </Link>
                ) : (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => void markRead(item)}
                    className="block w-full text-left"
                  >
                    {content}
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
