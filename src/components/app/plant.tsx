import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { PLANT_IMAGE } from "@/lib/blossom/data";
import { STAGES, nextStage, type StageId } from "@/lib/blossom/engine";
import type { GrowthEvent } from "@/lib/blossom/organism";
import { cn } from "@/lib/utils";

function stageProgressPercent(
  stageId: StageId,
  points: number,
  nextAt: number | null,
): number {
  if (nextAt === null) return 100;
  const stage = STAGES.find((s) => s.id === stageId) ?? STAGES[0];
  const span = Math.max(1, nextAt - stage.minPoints);
  const intoStage = Math.min(span, Math.max(0, points - stage.minPoints));
  return Math.min(100, Math.max(4, Math.round((intoStage / span) * 100)));
}

const KIND_GLYPH: Record<GrowthEvent["kind"], string> = {
  root: "◈",
  stem: "◇",
  leaf: "✧",
  flower: "❋",
  mineral: "·",
};

function ParticleField({
  stageId,
  intensity,
}: {
  stageId: StageId;
  intensity: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (prefersReduced) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    const count = Math.round(18 + intensity * 28);
    const particles = Array.from({ length: count }, (_, i) => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.6 + Math.random() * 1.8,
      vx: (Math.random() - 0.5) * 0.00035,
      vy: -0.00015 - Math.random() * 0.0004,
      a: 0.15 + Math.random() * 0.45,
      phase: Math.random() * Math.PI * 2,
      hue: stageId === "independent" || stageId === "blossoming" ? 72 : 140,
    }));

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      w = parent.clientWidth;
      h = parent.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -0.05) {
          p.y = 1.05;
          p.x = Math.random();
        }
        if (p.x < -0.05) p.x = 1.05;
        if (p.x > 1.05) p.x = -0.05;
        const pulse = 0.6 + 0.4 * Math.sin(t * 0.0012 + p.phase);
        const alpha = p.a * pulse * (0.55 + intensity * 0.45);
        ctx.beginPath();
        ctx.arc(p.x * w, p.y * h, p.r * pulse, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 85%, 72%, ${alpha})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [stageId, intensity, prefersReduced]);

  if (prefersReduced) return null;
  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-[1] opacity-90"
      aria-hidden
    />
  );
}

export function BlossomPlant({
  stageId,
  stageLabel,
  points,
  nextAt,
  remaining,
  compact = false,
  linked = true,
  growthEvents = [],
  showCausal = true,
}: {
  stageId: StageId;
  stageLabel: string;
  points: number;
  nextAt: number | null;
  remaining: number;
  compact?: boolean;
  linked?: boolean;
  growthEvents?: GrowthEvent[];
  showCausal?: boolean;
}) {
  const upcoming = nextStage(stageId);
  const src = PLANT_IMAGE[stageId];
  const progress = stageProgressPercent(stageId, points, nextAt);
  const intensity = progress / 100;

  const recent = useMemo(
    () =>
      [...growthEvents]
        .sort((a, b) => b.at.localeCompare(a.at))
        .slice(0, compact ? 2 : 4),
    [growthEvents, compact],
  );

  const statusText = nextAt
    ? `${points} / ${nextAt} · ${remaining} point${remaining > 1 ? "s" : ""} vers ${upcoming?.label ?? "la suite"}`
    : `${points} points · stade ultime — rayonnez`;

  const causalLine =
    recent.length > 0
      ? recent
          .map((g) => `${KIND_GLYPH[g.kind]} ${g.label}`)
          .join("  ·  ")
      : "Aucun geste encore — la terre attend le premier.";

  const className = cn(
    "kosez-plant group relative block overflow-hidden rounded-2xl border border-border/80 bg-surface-2 shadow-[var(--shadow-border)]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
    "transition-[box-shadow,transform,border-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
    "hover:-translate-y-1 hover:border-primary/25 hover:shadow-[0_28px_80px_-36px_rgba(217,255,105,0.35)]",
    compact ? "aspect-square" : "aspect-hero lg:aspect-plant",
  );

  const inner = (
    <>
      <img
        src={src}
        alt=""
        className="plant-sway h-full w-full object-cover object-center transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.045] motion-reduce:transition-none"
      />
      <ParticleField stageId={stageId} intensity={intensity} />
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/92 via-black/40 to-black/10"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 80%, rgba(217,255,105,0.12), transparent 70%)",
        }}
        aria-hidden
      />

      <div className="absolute inset-x-0 bottom-0 z-[2] p-5 text-white sm:p-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/55">
          Votre BLOSSOM
        </p>
        <p className="mt-1.5 font-display text-3xl tracking-tight text-white drop-shadow-[0_0_24px_rgba(217,255,105,0.15)]">
          {stageLabel}
        </p>
        <p className="mt-1.5 text-sm leading-6 text-white/75">{statusText}</p>

        <div
          className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/15"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          aria-label={`Progression du stade ${stageLabel}`}
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out motion-reduce:transition-none plant-breathe"
            style={{ width: `${progress}%` }}
          />
        </div>

        {showCausal && !compact ? (
          <p
            className="mt-3 line-clamp-2 text-[11px] leading-5 text-white/50"
            title={causalLine}
          >
            <span className="font-semibold text-primary/80">Causalité · </span>
            {causalLine}
          </p>
        ) : null}
      </div>

      {!compact && recent.length > 0 ? (
        <ul
          className="pointer-events-none absolute right-3 top-3 z-[2] flex max-w-[46%] flex-col items-end gap-1.5 sm:right-4 sm:top-4"
          aria-label="Gestes récents qui ont nourri la plante"
        >
          {recent.map((g, i) => (
            <li
              key={g.id}
              className="stagger-in rounded-full border border-white/10 bg-black/45 px-2.5 py-1 text-[10px] font-medium text-white/80 backdrop-blur-md"
              style={{ animationDelay: `${80 + i * 60}ms` }}
            >
              <span className="mr-1 text-primary">{KIND_GLYPH[g.kind]}</span>
              {g.label}
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );

  if (!linked) {
    return (
      <div
        className={className}
        aria-label={`Votre BLOSSOM, stade ${stageLabel}. ${statusText}. ${causalLine}`}
      >
        {inner}
      </div>
    );
  }

  return (
    <Link
      to="/plant"
      className={className}
      aria-label={`Votre BLOSSOM, stade ${stageLabel}. ${statusText}. ${causalLine}`}
    >
      {inner}
    </Link>
  );
}
