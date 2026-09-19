import { toast } from "sonner";
import { Eyebrow, Page, Surface } from "@/components/app/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { INTELLIGENCE, ORG, ORG_MEMBERS } from "@/lib/blossom/data";
import { useBlossom } from "@/lib/blossom/store";

export function OrgStudio() {
  const setOrgMode = useBlossom((s) => s.setOrgMode);
  const orgInvites = useBlossom((s) => s.orgInvites);
  const inviteOrgSeat = useBlossom((s) => s.inviteOrgSeat);
  const invoiceRequested = useBlossom((s) => s.invoiceRequested);
  const requestInvoice = useBlossom((s) => s.requestInvoice);
  const used = ORG.used + orgInvites;
  const remaining = Math.max(0, ORG.seats - used);

  return (
    <Page>
      <div className="flex items-start justify-between gap-4">
        <div>
          <Eyebrow>Espace entreprise</Eyebrow>
          <h1 className="mt-2 font-display text-3xl tracking-tight">
            {ORG.name}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {ORG.city} · {ORG.framing}
          </p>
        </div>
        <Button variant="secondary" onClick={() => setOrgMode(false)}>
          Revenir au voyage
        </Button>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Surface>
          <p className="text-xs uppercase tracking-[0.16em] text-muted">Sièges</p>
          <p className="mt-2 font-display text-3xl tabular-nums">
            {used} / {ORG.seats}
          </p>
          <Button
            size="sm"
            className="mt-4"
            variant="secondary"
            disabled={remaining === 0}
            onClick={() => {
              const result = inviteOrgSeat();
              toast(
                result.ok
                  ? "Siège ouvert. La personne reçoit le lien du centre."
                  : "Tous les sièges sont pris.",
              );
            }}
          >
            {remaining === 0 ? "Complet" : `Inviter · ${remaining} restants`}
          </Button>
        </Surface>
        <Surface>
          <p className="text-xs uppercase tracking-[0.16em] text-muted">Parole</p>
          <p className="mt-2 font-display text-3xl tabular-nums">
            {ORG_MEMBERS.reduce((s, m) => s + m.minutes, 0)} min
          </p>
        </Surface>
        <Surface>
          <p className="text-xs uppercase tracking-[0.16em] text-muted">Atelier</p>
          <p className="mt-2 font-display text-xl">Mardi 18:00</p>
        </Surface>
      </div>

      <Surface className="mt-4">
        <Eyebrow>Équipe</Eyebrow>
        <ul className="mt-4 space-y-3">
          {ORG_MEMBERS.map((member) => (
            <li key={member.id} className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium">{member.name}</p>
                <p className="text-xs text-subtle">
                  {member.role} · {member.stage}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm tabular-nums">{member.minutes} min</p>
                <p className="text-xs text-muted">{member.last}</p>
              </div>
            </li>
          ))}
        </ul>
      </Surface>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Surface>
          <Eyebrow>Lecture — sans vanité</Eyebrow>
          <ul className="mt-4 space-y-4">
            {INTELLIGENCE.map((row) => (
              <li key={row.label}>
                <p className="text-xs uppercase tracking-[0.16em] text-muted">
                  {row.label}
                </p>
                <p className="mt-1 font-display text-xl">{row.value}</p>
                <p className="text-sm text-muted">{row.note}</p>
              </li>
            ))}
          </ul>
        </Surface>
        <Surface>
          <Eyebrow>Atelier groupe</Eyebrow>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Un samedi, huit personnes, anglais de service autour de la
            table. Pas un team-building bruyant — une QVT qui parle.
          </p>
          <Badge className="mt-4" variant="outline">
            19 septembre · Maison K'Osez
          </Badge>
          {invoiceRequested ? (
            <p className="mt-5 text-sm text-primary">
              Demande envoyée. Le centre confirme la facture — jamais
              l'écran.
            </p>
          ) : (
            <Button
              className="mt-5 w-full"
              onClick={() => {
                requestInvoice();
                toast("Demande envoyée au centre. La facture suivra.");
              }}
            >
              Demander l'atelier
            </Button>
          )}
          <p className="mt-4 text-xs text-subtle">{ORG.invoice}</p>
        </Surface>
      </div>
    </Page>
  );
}
