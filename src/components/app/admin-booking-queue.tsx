import { useEffect, useMemo, useState } from "react";
import { Check, CircleDollarSign, LoaderCircle, Search, X } from "lucide-react";
import {
  getAdminBookingQueueOnServer,
  updateAdminBookingOnServer,
} from "@/lib/blossom/domain.api";
import type { AdminBookingRow } from "@/lib/blossom/domain.server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eyebrow, Surface } from "@/components/app/primitives";
import { Input } from "@/components/ui/input";

export function AdminBookingQueue() {
  const [rows, setRows] = useState<AdminBookingRow[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      setRows(await getAdminBookingQueueOnServer());
      setError(null);
    } catch {
      setError("Impossible de charger les demandes de réservation.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return term
      ? rows.filter((row) =>
          [row.learnerName, row.catalogueTitle, row.status, row.paymentStatus]
            .join(" ")
            .toLowerCase()
            .includes(term),
        )
      : rows;
  }, [query, rows]);

  async function update(
    row: AdminBookingRow,
    patch: {
      status?: "requested" | "confirmed" | "cancelled";
      paymentStatus?: "unpaid" | "paid" | "refunded";
    },
  ) {
    setBusy(row.id);
    try {
      await updateAdminBookingOnServer({ data: { bookingId: row.id, ...patch } });
      await load();
    } catch {
      setError("Cette transition n’a pas pu être enregistrée.");
    } finally {
      setBusy("");
    }
  }

  return (
    <Surface className="mt-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Commerce · opérations</Eyebrow>
          <h2 className="mt-2 font-display text-2xl">Demandes en attente de traitement</h2>
          <p className="mt-1 text-sm leading-6 text-muted">
            Les transitions ci-dessous passent par le serveur et sont journalisées. Elles ne simulent pas un prestataire de paiement.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Chercher un apprenant ou produit…" className="pl-9" />
        </div>
      </div>

      {error ? (
        <div className="mt-5 rounded-xl border border-destructive/20 bg-destructive/5 p-4">
          <p className="text-sm">{error}</p>
          <Button className="mt-3" size="sm" variant="secondary" onClick={() => void load()}>Réessayer</Button>
        </div>
      ) : null}

      {loading ? (
        <div className="mt-6 flex items-center gap-2 text-sm text-muted"><LoaderCircle className="size-4 animate-spin" /> Chargement des demandes…</div>
      ) : filtered.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-border p-7 text-center">
          <p className="font-display text-xl">Aucune demande à afficher.</p>
          <p className="mt-1 text-sm text-muted">Le filtre ne trouve rien dans les demandes actuelles.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {filtered.map((row) => (
            <article key={row.id} className="rounded-2xl border border-border bg-surface-2/25 p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium">{row.learnerName}</p>
                  <p className="mt-1 text-sm text-muted">{row.catalogueTitle}</p>
                  <p className="mt-1 text-[11px] text-subtle">Mise à jour · {new Date(row.updatedAt).toLocaleString("fr-FR")}</p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline">{row.status}</Badge>
                  <Badge variant="outline">{row.paymentStatus}</Badge>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {row.status === "requested" ? (
                  <>
                    <Button size="sm" disabled={busy === row.id} onClick={() => void update(row, { status: "confirmed" })}>
                      {busy === row.id ? <LoaderCircle className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                      Confirmer
                    </Button>
                    <Button size="sm" variant="outline" disabled={busy === row.id} onClick={() => void update(row, { status: "cancelled" })}>
                      <X className="size-3.5" /> Annuler
                    </Button>
                  </>
                ) : null}
                {row.paymentStatus === "unpaid" ? (
                  <Button size="sm" variant="secondary" disabled={busy === row.id || row.status === "cancelled"} onClick={() => void update(row, { paymentStatus: "paid" })}>
                    <CircleDollarSign className="size-3.5" /> Marquer payé
                  </Button>
                ) : null}
                {row.paymentStatus === "paid" ? (
                  <Button size="sm" variant="outline" disabled={busy === row.id} onClick={() => void update(row, { paymentStatus: "refunded" })}>
                    Rembourser
                  </Button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </Surface>
  );
}
