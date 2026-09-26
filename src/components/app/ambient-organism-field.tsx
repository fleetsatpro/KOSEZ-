import { MINERAL_DEFINITIONS, type MineralKey, type MineralSnapshot } from "@/lib/blossom/organism";

const DOTS: Array<{ key: MineralKey; x: number; y: number; size: number; phase: number }> = [
  { key: "mission", x: 12, y: 24, size: 3, phase: 0 }, { key: "mission", x: 21, y: 66, size: 2, phase: 1.4 },
  { key: "parole", x: 36, y: 18, size: 2, phase: 0.7 }, { key: "parole", x: 45, y: 72, size: 3, phase: 2.1 },
  { key: "pron", x: 62, y: 20, size: 2, phase: 1.1 }, { key: "pron", x: 76, y: 38, size: 3, phase: 0.2 },
  { key: "social", x: 84, y: 18, size: 2, phase: 2.4 }, { key: "social", x: 72, y: 70, size: 3, phase: 1.5 },
  { key: "atelier", x: 54, y: 48, size: 2, phase: 2.8 }, { key: "atelier", x: 30, y: 46, size: 2, phase: 1.7 },
  { key: "social", x: 90, y: 60, size: 2, phase: 0.9 }, { key: "pron", x: 68, y: 82, size: 2, phase: 3.2 },
];

export function AmbientOrganismField({ minerals }: { minerals: MineralSnapshot }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(217,255,105,0.09),transparent_34%)]" />
      {DOTS.map((dot, index) => {
        const value = minerals[dot.key];
        const opacity = 0.10 + value / 170;
        return (
          <span key={`${dot.key}-${index}`} className="kosez-ambient-dot absolute rounded-full bg-primary blur-[0.1px]" style={{ left: `${dot.x}%`, top: `${dot.y}%`, width: `${dot.size}px`, height: `${dot.size}px`, opacity, animation: `kosez-float ${5 + (index % 4)}s ease-in-out ${dot.phase}s infinite` }} title={MINERAL_DEFINITIONS[dot.key].label} />
        );
      })}
      <style>{`@keyframes kosez-float{0%,100%{transform:translate3d(0,0,0)}50%{transform:translate3d(0,-7px,0)}}@media (prefers-reduced-motion: reduce){.kosez-ambient-dot{animation:none!important}}`}</style>
    </div>
  );
}