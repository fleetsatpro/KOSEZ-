import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { Mic, MicOff, Radio, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Phase = "idle" | "requesting" | "recording" | "processing" | "error";

export function RecordControl({
  onFinished,
  cta = "Maintenir pour parler",
  inverted = false,
}: {
  onFinished: (result: { seconds: number; blob: Blob | null; mimeType: string }) => void;
  cta?: string;
  inverted?: boolean;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [seconds, setSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const timer = useRef<number | null>(null);
  const processTimer = useRef<number | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const secondsRef = useRef(0);
  const holding = useRef(false);

  useEffect(() => {
    return () => {
      if (timer.current) window.clearInterval(timer.current);
      if (processTimer.current) window.clearTimeout(processTimer.current);
      recorder.current?.stop();
      stream.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  function clearTimers() {
    if (timer.current) window.clearInterval(timer.current);
    timer.current = null;
    if (processTimer.current) window.clearTimeout(processTimer.current);
    processTimer.current = null;
  }

  function finish(secondsValue: number) {
    clearTimers();
    const activeRecorder = recorder.current;
    const mimeType = activeRecorder?.mimeType || chunks.current[0]?.type || "audio/webm";
    const audioBlob =
      chunks.current.length > 0
        ? new Blob(chunks.current, { type: mimeType })
        : null;
    chunks.current = [];
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    recorder.current = null;
    setPhase("processing");
    processTimer.current = window.setTimeout(
      () => onFinished({ seconds: Math.max(0, Math.round(secondsValue)), blob: audioBlob, mimeType }),
      650,
    );
  }

  function fallbackWithoutMic() {
    holding.current = false;
    clearTimers();
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    recorder.current = null;
    setSeconds(0);
    setPhase("processing");
    processTimer.current = window.setTimeout(
      () => onFinished({ seconds: 0, blob: null, mimeType: "audio/webm" }),
      350,
    );
  }

  async function begin() {
    if (phase !== "idle" && phase !== "error") return;
    holding.current = true;
    setErrorMessage(null);
    setPhase("requesting");

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setPhase("error");
      setErrorMessage("Votre navigateur ne permet pas l'enregistrement ici.");
      return;
    }

    try {
      const nextStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!holding.current) {
        nextStream.getTracks().forEach((track) => track.stop());
        setPhase("idle");
        return;
      }

      stream.current = nextStream;
      recorder.current = new MediaRecorder(nextStream);
      chunks.current = [];
      recorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.current.push(event.data);
      };
      recorder.current.start();
      secondsRef.current = 0;
      setSeconds(0);
      setPhase("recording");
      timer.current = window.setInterval(() => {
        secondsRef.current += 1;
        setSeconds(secondsRef.current);
      }, 1000);
    } catch {
      holding.current = false;
      setPhase("error");
      setErrorMessage("Le micro n'est pas disponible. Vous pouvez continuer sans enregistrer.");
    }
  }

  function stop() {
    holding.current = false;
    if (phase === "requesting") return;
    if (phase !== "recording") return;
    const activeRecorder = recorder.current;
    if (activeRecorder && activeRecorder.state !== "inactive") {
      activeRecorder.onstop = () => finish(secondsRef.current);
      activeRecorder.stop();
    } else {
      finish(secondsRef.current);
    }
  }

  function onPointerDown(event: PointerEvent<HTMLButtonElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    void begin();
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.repeat) return;
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      void begin();
    }
  }

  function onKeyUp(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      stop();
    }
  }

  const recording = phase === "recording";
  const requesting = phase === "requesting";
  const processing = phase === "processing";

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        {recording ? (
          <span
            className={cn(
              "absolute -inset-5 rounded-full border animate-[ping_1.8s_ease-out_infinite]",
              inverted ? "border-primary-foreground/15" : "border-primary/15",
            )}
            aria-hidden
          />
        ) : null}
        <button
          type="button"
          aria-label={recording ? "Relâcher pour terminer" : cta}
          aria-pressed={recording}
          aria-busy={requesting || processing}
          onPointerDown={onPointerDown}
          onPointerUp={stop}
          onPointerCancel={stop}
          onPointerLeave={stop}
          onKeyDown={onKeyDown}
          onKeyUp={onKeyUp}
          disabled={processing || requesting}
          className={cn(
            "relative flex size-28 touch-none select-none items-center justify-center rounded-full border-4 shadow-[0_16px_50px_rgba(0,0,0,0.12)] transition-[transform,background-color,box-shadow] duration-200 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-4",
            inverted
              ? recording
                ? "border-clay bg-clay text-primary-foreground"
                : "border-primary-foreground/15 bg-primary-foreground text-primary"
              : recording
                ? "border-clay bg-clay text-primary-foreground"
                : "border-primary/10 bg-primary text-primary-foreground",
            processing && "opacity-70",
          )}
        >
          {requesting ? (
            <Radio className="size-9 animate-pulse" strokeWidth={1.7} />
          ) : recording ? (
            <Mic className="size-9" strokeWidth={1.7} />
          ) : phase === "error" ? (
            <MicOff className="size-9" strokeWidth={1.7} />
          ) : (
            <Mic className="size-9" strokeWidth={1.7} />
          )}
        </button>
      </div>

      <div className="mt-7 min-h-16 text-center">
        <p
          className={cn(
            "text-sm font-medium tabular-nums",
            inverted ? "text-primary-foreground" : "text-fg",
          )}
          aria-live="polite"
        >
          {phase === "idle" && cta}
          {phase === "requesting" && "Accès au micro…"}
          {phase === "recording" && "Parole en cours · " + String(seconds) + "s"}
          {phase === "processing" && "Préparation du débrief…"}
          {phase === "error" && "Micro indisponible"}
        </p>
        <p
          className={cn(
            "mx-auto mt-2 max-w-sm text-xs leading-relaxed",
            inverted ? "text-primary-foreground/60" : "text-muted",
          )}
        >
          {phase === "idle" && "Maintenez le bouton. Relâchez quand vous avez terminé."}
          {phase === "requesting" && "Votre navigateur va demander l'autorisation d'utiliser le micro."}
          {phase === "recording" && "Continuez naturellement. Rien ne vous oblige à remplir le silence."}
          {phase === "processing" && "Votre prise peut être transmise à un moteur de transcription configuré. K’Osez ne fabrique pas de note phonétique."}
          {phase === "error" && (errorMessage ?? "Une erreur est survenue.")}
        </p>
      </div>

      <div className="mt-4 w-full max-w-sm" aria-hidden>
        <Waveform active={recording} tone={inverted ? "on-primary" : "on-surface"} />
      </div>

      {(phase === "idle" || phase === "error") ? (
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "mt-3",
            inverted &&
              "text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground",
          )}
          onClick={fallbackWithoutMic}
        >
          {phase === "error" ? "Continuer sans micro" : "Je préfère continuer sans micro"}
        </Button>
      ) : null}

      {processing ? (
        <div className="mt-4 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-primary-foreground/60">
          <Sparkles className="size-3.5" />
          Débrief BLOSSOM
        </div>
      ) : null}
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
    <div className="flex h-10 items-end justify-center gap-1.5">
      {Array.from({ length: 13 }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "w-1 rounded-full transition-[height,opacity] duration-200",
            tone === "on-primary" ? "bg-primary-foreground/80" : "bg-primary/70",
            active ? "wave-bar" : "h-1.5 opacity-45",
          )}
          style={{
            height: active ? String(12 + ((i * 17) % 22)) + "px" : undefined,
            animationDelay: String(i * 70) + "ms",
          }}
        />
      ))}
    </div>
  );
}
