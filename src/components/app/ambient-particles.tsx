import { useEffect, useRef } from "react";
import type { StageId } from "@/lib/blossom/engine";

/**
 * Soft drifting lime/teal particles over a living surface.
 * Respects prefers-reduced-motion. Intensity 0–1 scales density and alpha.
 */
export function AmbientParticles({
  stageId = "seed",
  intensity = 0.55,
  className = "pointer-events-none absolute inset-0 z-[1] opacity-90",
}: {
  stageId?: StageId;
  intensity?: number;
  className?: string;
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
    const clamped = Math.min(1, Math.max(0.15, intensity));

    const count = Math.round(14 + clamped * 32);
    const particles = Array.from({ length: count }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.55 + Math.random() * 1.9,
      vx: (Math.random() - 0.5) * 0.00032,
      vy: -0.00012 - Math.random() * 0.00038,
      a: 0.12 + Math.random() * 0.42,
      phase: Math.random() * Math.PI * 2,
      hue:
        stageId === "independent" || stageId === "blossoming"
          ? 72
          : stageId === "growing" || stageId === "flourishing"
            ? 130
            : 140,
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
        const alpha = p.a * pulse * (0.5 + clamped * 0.5);
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
  return <canvas ref={canvasRef} className={className} aria-hidden />;
}
