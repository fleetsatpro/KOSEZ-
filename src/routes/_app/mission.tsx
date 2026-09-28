import { createFileRoute } from "@tanstack/react-router";
import { LearningSurfaceAvailability } from "@/components/app/learning-surface-availability";
import { canUseLearningSurface } from "@/lib/i18n/locales";
import { useBlossom } from "@/lib/blossom/store";
import { MissionTheatreExperience } from "@/components/app/mission-theatre-experience";

export const Route = createFileRoute("/_app/mission")({
  component: MissionRoute,
});

function MissionRoute() {
  const languageId = useBlossom((s) => s.languageId);
  if (!canUseLearningSurface(languageId, "mission")) {
    return <LearningSurfaceAvailability languageId={languageId} surface="mission" />;
  }
  return <MissionTheatreExperience />;
}
