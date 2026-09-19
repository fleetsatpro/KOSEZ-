import { useEffect, useRef, useState, type PointerEvent } from "react";
import { Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Phase = "idle" | "recording" | "processing";

export function RecordControl({
  onFinished,
  cta = "Maintenir pour parler",
  inverted = false,
}: {
  onFinished: (seconds?: number) => void;
  cta?: string;
  inverted?: boolean;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [seconds, setSeconds] = useState(0);
  const timer = useRef<number | null>(null);
  const secondsRef = useRef(0);

  useEffect(() => {
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, []);

  function start(event: PointerEvent<HTMLButtonElement>) {
    if (phase !== "idle") return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setPhase("recording");
    secondsRef.current = 0;
    setSeconds(0);
    timer.current = window.setInterval(() => {
      secondsRef.current += 1;
      setSeconds(secondsRef.current);
    }, 1000);
  }

  function stop() {
    if (phase !== "recording") return;
    if (timer.current) window.clearInterval(timer.current);
    setPhase("processing");
    const captured = secondsRef.current;
    window.setTimeout(() => onFinished(captured), 1100);
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        type="button"
        aria-label={cta}
        onPointerDown={start}
        onPointerUp={stop}
        onPointerLeave={() => {
          if (phase === "recording") stop();
        }}
        disabled={phase === "processing"}
        className={cn(
          "relative flex size-24 touch-none items-center justify-center rounded-full transition-[transform,background-color] duration-150 select-none",
          inverted
            ? phase === "recording"
              ? "bg-clay"
              : "bg-primary-foreground"
            : phase === "recording"
              ? "bg-clay"
              : "bg-primary",
          phase === "processing" && "opacity-70",
        )}
      >
        <Mic
          className={cn(
            "size-8",
            inverted && phase !== "recording" ? "text-primary" : "text-primary-foreground",
          )}
          strokeWidth={1.6}
        />
        {phase === "recording" && (
          <span className="absolute inset-0 animate-ping rounded-full bg-clay/30" />
        )}
      </button>
      <p
        className={cn(
          "text-sm tabular-nums",
          inverted ? "text-primary-foreground/80" : "text-muted",
        )}
      >
        {phase === "idle" && cta}
        {phase === "recording" && `Enregistrement · ${seconds}s`}
        {phase === "processing" && "Écoute en cours…"}
      </p>
      {phase === "idle" && (
        <Button
          variant="ghost"
          size="sm"
          className={inverted ? "text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground" : undefined}
          onClick={() => {
            setPhase("processing");
            window.setTimeout(() => onFinished(0), 900);
          }}
        >
          Je n'ai pas le micro — continuer
        </Button>
      )}
    </div>
  );
}

export function Waveform({
  active,
  tone = "on-primary",
}: {
  active: boolean;
  tone?: "on-primary" | "on-surface";
}) {
  return (
    <div className="flex h-10 items-end justify-center gap-1" aria-hidden>
      {Array.from({ length: 9 }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "w-1 rounded-full",
            tone === "on-primary" ? "bg-primary-foreground/85" : "bg-primary/80",
            active ? "wave-bar h-8" : "h-2",
          )}
          style={{ animationDelay: `${i * 80}ms` }}
        />
      ))}
    </div>
  );
}
