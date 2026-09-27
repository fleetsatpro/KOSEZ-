import { useState } from "react";
import { toast } from "sonner";
import { useBlossom } from "@/lib/blossom/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eyebrow, Surface } from "@/components/app/primitives";
import { LEARN_LANGUAGES } from "@/lib/i18n/locales";

export function MoiSettings() {
  const learner = useBlossom((s) => s.learner);
  const languageId = useBlossom((s) => s.languageId);
  const setLearner = useBlossom((s) => s.setLearner);
  const setLanguageId = useBlossom((s) => s.setLanguageId);
  const enqueue = useBlossom((s) => s.enqueueSync);

  const [firstName, setFirstName] = useState(learner.firstName);
  const [lastName, setLastName] = useState(learner.lastName);
  const [city, setCity] = useState(learner.city);
  const [goal, setGoal] = useState(learner.goal);
  const [saved, setSaved] = useState(false);

  function save() {
    const next = {
      ...learner,
      firstName: firstName.trim().slice(0, 80),
      lastName: lastName.trim().slice(0, 80),
      city: city.trim().slice(0, 80),
      goal: goal.trim().slice(0, 240),
    };
    setLearner(next);
    enqueue("profile.upsert", "profile", {
      firstName: next.firstName,
      lastName: next.lastName,
      city: next.city,
      goal: next.goal,
      targetLanguage: languageId,
    });
    setSaved(true);
    toast("Préférences enregistrées localement. Synchronisation en cours.");
    window.setTimeout(() => setSaved(false), 2500);
  }

  return (
    <Surface className="mt-5">
      <Eyebrow>Préférences</Eyebrow>
      <h2 className="mt-2 font-display text-2xl">Votre profil apprenant</h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        Ces informations aident le coach et les rencontres. Elles ne sont pas publiques hors cercle.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="firstName">Prénom</Label>
          <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="lastName">Nom</Label>
          <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="city">Ville</Label>
          <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="language">Langue cible</Label>
          <select
            id="language"
            className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={languageId}
            onChange={(e) => setLanguageId(e.target.value)}
          >
            {LEARN_LANGUAGES.map((lang) => (
              <option key={lang.id} value={lang.id}>
                {lang.nativeName}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="goal">Objectif</Label>
          <Input id="goal" value={goal} onChange={(e) => setGoal(e.target.value)} className="mt-1.5" />
        </div>
      </div>

      <Button className="mt-6" onClick={save}>
        {saved ? "Enregistré localement · sync en attente" : "Enregistrer mes préférences"}
      </Button>
    </Surface>
  );
}
