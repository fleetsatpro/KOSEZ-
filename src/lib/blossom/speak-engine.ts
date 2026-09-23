/**
 * Speak Engine — multi-agent generative swarm for Speak Rooms.
 *
 * Agents (composition pipeline, not parallel chatbots):
 *  1. WorldAgent     — picks place + real-world event anchor
 *  2. CastAgent      — assigns interlocutor from place roles
 *  3. PressureAgent  — selects time/social pressure pattern
 *  4. BeatAgent      — sequences dialogue beats (never fixed 5-turn scripts)
 *  5. VoiceAgent     — materialises AI lines + you-hints with level kit
 *  6. DebriefAgent   — builds private post-session feedback
 *  7. MemoryAgent    — injects learner friction without interrupting
 *
 * Output is a LivingRoom: unique every seed, grounded in Reunion /
 * Indian Ocean context, expandable to live open-source LLM backends.
 */

import {
  BEAT_LIBRARY,
  EVENT_ANCHORS,
  LEVEL_KITS,
  PLACES,
  PRESSURES,
  type DialogueBeat,
  type EventAnchor,
  type PlaceNode,
  type PressurePattern,
} from "./speak-world.ts";

export type SpeakTurn = {
  id: string;
  speaker: "ai" | "you";
  line?: string;
  hint: string;
  stretch?: string;
  recovery: string[];
  beatId: string;
  goal: string;
};

export type LivingRoom = {
  id: string;
  seed: string;
  title: string;
  titleFr: string;
  setting: string;
  image: string;
  durationMin: number;
  level: string;
  cast: { role: string; name: string; stance: string };
  place: { id: string; archetype: string; sensory: string; localColour: string };
  event: { id: string; title: string; atmosphere: string; hooks: string[] } | null;
  pressure: { id: string; label: string; description: string };
  culturalNote: string;
  kit: Array<{ phrase: string; use: string }>;
  turns: SpeakTurn[];
  protocol: string[];
  debrief: { strength: string; improvement: string; model: string };
  memoryWhisper: string | null;
  generatedAt: string;
};

export type GenerateInput = {
  archetype?: string;
  level?: string;
  firstName?: string;
  friction?: string | null;
  interests?: string[];
  entropy?: string;
  now?: Date;
};

function hashSeed(parts: string[]): string {
  const s = parts.join("|");
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

function mulberry32(seed: number) {
  return function next() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)]!;
}

function shuffle<T>(rng: () => number, arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

function monthOf(d: Date): number {
  return d.getUTCMonth() + 1;
}

function anchorsForDate(d: Date): EventAnchor[] {
  const m = monthOf(d);
  return EVENT_ANCHORS.filter((a) => {
    if (a.window === "always") return true;
    const { monthStart, monthEnd } = a.window;
    if (monthStart <= monthEnd) return m >= monthStart && m <= monthEnd;
    return m >= monthStart || m <= monthEnd;
  });
}

function worldAgent(
  rng: () => number,
  input: GenerateInput,
  now: Date,
): { place: PlaceNode; event: EventAnchor | null } {
  let candidates = PLACES;
  if (input.archetype) {
    const filtered = PLACES.filter((p) => p.archetype === input.archetype);
    if (filtered.length) candidates = filtered;
  }
  const place = pick(rng, candidates);
  const anchors = anchorsForDate(now).filter(
    (a) => a.placeBias.includes(place.archetype) || a.window === "always",
  );
  const event = anchors.length && rng() < 0.72 ? pick(rng, anchors) : null;
  return { place, event };
}

function castAgent(rng: () => number, place: PlaceNode) {
  const roleDef = pick(rng, place.roles);
  const name = pick(rng, roleDef.namePool);
  return { role: roleDef.role, name, stance: roleDef.stance };
}

function pressureAgent(rng: () => number, place: PlaceNode): PressurePattern {
  const bias: Record<string, string[]> = {
    airport: ["stakes", "time-short", "queue-watching"],
    clinic: ["stakes", "first-meeting"],
    market: ["queue-watching", "noise", "friendly"],
    office: ["time-short", "stakes", "friendly"],
    social: ["friendly", "first-meeting"],
    cafe: ["friendly", "noise", "time-short"],
    hotel: ["first-meeting", "friendly"],
    campus: ["first-meeting", "friendly", "time-short"],
    coast: ["friendly", "noise"],
    shop: ["friendly", "queue-watching"],
    transit: ["time-short", "stakes", "noise"],
    home: ["friendly"],
  };
  const preferred = bias[place.archetype] ?? ["friendly"];
  const pool = PRESSURES.filter((p) => preferred.includes(p.id));
  return pick(rng, pool.length ? pool : PRESSURES);
}

function beatAgent(
  rng: () => number,
  place: PlaceNode,
  pressure: PressurePattern,
  hasEvent: boolean,
  level: string,
): DialogueBeat[] {
  const openPool =
    place.archetype === "social"
      ? BEAT_LIBRARY.open.filter((b) => b.id.includes("social"))
      : place.archetype === "office" ||
          place.archetype === "airport" ||
          place.archetype === "clinic"
        ? BEAT_LIBRARY.open.filter(
            (b) => b.id.includes("formal") || b.id.includes("service"),
          )
        : BEAT_LIBRARY.open.filter(
            (b) => b.id.includes("service") || b.id.includes("social"),
          );

  const open = pick(rng, openPool.length ? openPool : BEAT_LIBRARY.open);
  const choose = pick(rng, BEAT_LIBRARY.choose);
  const clarify = pick(rng, BEAT_LIBRARY.clarify);
  const relance = pick(rng, BEAT_LIBRARY.relance);
  const close = pick(rng, BEAT_LIBRARY.close);

  const sequence: DialogueBeat[] = [open, choose];

  if (level === "B1" || level === "B2") {
    sequence.push(pick(rng, BEAT_LIBRARY.challenge));
  }

  if (pressure.timePressure === "high" || pressure.socialRisk === "high") {
    if (rng() < 0.85) sequence.push(pick(rng, BEAT_LIBRARY.pressure));
  }
  if (rng() < 0.9) sequence.push(clarify);
  if (rng() < 0.75) sequence.push(relance);

  if (hasEvent && rng() < 0.8) {
    sequence.push({
      id: "event-hook",
      goal: "Ancrer l'echange dans le reel",
      youHint: "Reagissez a ce qui se passe autour — une phrase suffit.",
      aiOpeners: [],
      recovery: ["Sorry, could you repeat that?", "I mean…"],
      stretch: "Ajoutez une opinion courte (I think / maybe).",
    });
  }

  sequence.push(close);

  if (rng() < 0.35 && sequence.length > 4) {
    const i = 1 + Math.floor(rng() * (sequence.length - 3));
    const j = 1 + Math.floor(rng() * (sequence.length - 3));
    if (i !== j) {
      const tmp = sequence[i]!;
      sequence[i] = sequence[j]!;
      sequence[j] = tmp;
    }
  }

  return sequence;
}

function voiceAgent(
  rng: () => number,
  beats: DialogueBeat[],
  cast: { name: string; role: string },
  event: EventAnchor | null,
  level: string,
): SpeakTurn[] {
  const kit = LEVEL_KITS[level] ?? LEVEL_KITS.A2!;
  const turns: SpeakTurn[] = [];
  let turnIdx = 0;

  for (const beat of beats) {
    let openers = [...beat.aiOpeners];
    if (beat.id === "event-hook" && event) {
      openers = [...event.talkHooks];
    }
    if (!openers.length) {
      openers = ["Right — what do you think?", "And you?"];
    }
    const line = pick(rng, openers);

    turns.push({
      id: `t${turnIdx++}`,
      speaker: "ai",
      line,
      hint: `${cast.name} parle…`,
      recovery: beat.recovery,
      beatId: beat.id,
      goal: beat.goal,
    });

    const stretch =
      kit.allowStretch && beat.stretch && rng() < 0.55 ? beat.stretch : undefined;
    turns.push({
      id: `t${turnIdx++}`,
      speaker: "you",
      hint: beat.youHint,
      stretch,
      recovery: beat.recovery,
      beatId: beat.id,
      goal: beat.goal,
    });
  }

  return turns;
}

function debriefAgent(
  rng: () => number,
  place: PlaceNode,
  pressure: PressurePattern,
  cast: { name: string },
  event: EventAnchor | null,
): LivingRoom["debrief"] {
  const strengths = [
    `Vous etes reste dans la langue jusqu'au bout avec ${cast.name}.`,
    "Vous avez ouvert l'echange sans repasser au francais.",
    "Votre rythme etait clair — une phrase, puis l'ecoute.",
    "Vous avez utilise une question de recuperation sans abandonner.",
  ];
  const improvements = [
    pressure.timePressure === "high"
      ? "Sous pression, raccourcissez encore : sujet + verbe + complement."
      : "Remplacez une formulation calquee par une phrase modele du kit.",
    "Apres la reponse, une relance courte (And you? / What about…?) ancre mieux l'echange.",
    "Gardez un silence d'une seconde plutot que de remplir en francais.",
  ];
  const models = [
    place.archetype === "cafe" || place.archetype === "market"
      ? "What do you recommend?"
      : place.archetype === "airport"
        ? "Could you tell me the boarding time?"
        : place.archetype === "social"
          ? "How has your week been?"
          : "Could you say that again?",
  ];
  if (event?.vocabulary[0]) {
    models.push(`About the ${event.vocabulary[0]} — …`);
  }
  return {
    strength: pick(rng, strengths),
    improvement: pick(rng, improvements),
    model: pick(rng, models),
  };
}

function memoryAgent(
  friction: string | null | undefined,
  firstName: string,
): string | null {
  if (!friction) return null;
  return `${firstName}, Leo garde « ${friction} » en arriere-plan — sans vous interrompre pendant la room.`;
}

function culturalNoteFor(
  place: PlaceNode,
  event: EventAnchor | null,
  rng: () => number,
): string {
  const base = [
    ...place.localColour,
    "En anglais, une question courte ouvre souvent plus qu'une longue justification.",
    "Le silence de deux secondes est autorise — ce n'est pas un echec.",
  ];
  if (event) base.unshift(event.atmosphere);
  return pick(rng, base);
}

function kitFor(
  place: PlaceNode,
  event: EventAnchor | null,
  rng: () => number,
): LivingRoom["kit"] {
  const core = [
    { phrase: "What do you recommend?", use: "Ouvrir un choix." },
    { phrase: "Could you say that again?", use: "Recuperer sans francais." },
    { phrase: "I'll have…", use: "Choisir clairement." },
    { phrase: "What about you?", use: "Relancer." },
    { phrase: "Sorry — I mean…", use: "Reparrer une phrase." },
    { phrase: "Let me think for a second.", use: "Gagner une seconde." },
  ];
  if (event) {
    for (const v of event.vocabulary.slice(0, 2)) {
      core.push({ phrase: v, use: `Ancre dans « ${event.title} ».` });
    }
  }
  if (place.archetype === "airport") {
    core.push({ phrase: "Window or aisle?", use: "Preference siege." });
  }
  return shuffle(rng, core).slice(0, 5);
}

function durationFor(turns: SpeakTurn[], pressure: PressurePattern): number {
  const base = Math.round(turns.length * 0.9);
  if (pressure.timePressure === "high") return Math.max(4, base - 1);
  if (pressure.timePressure === "low") return base + 1;
  return base;
}

export function adaptLivingRoomAfterTranscript(
  room: LivingRoom,
  nextTurnIndex: number,
  transcript: string,
): LivingRoom {
  const clean = transcript.trim().replace(/\s+/g, " ");
  if (!clean || clean.length < 3) return room;

  const nextAiIndex = room.turns.findIndex(
    (turn, index) => index >= nextTurnIndex && turn.speaker === "ai",
  );
  if (nextAiIndex < 0) return room;

  const lower = clean.toLowerCase();
  const next = room.turns[nextAiIndex]!;
  const goal = next.goal.toLowerCase();
  const responseLooksLikeQuestion =
    /\?|\b(what|where|when|why|how|can|could|would|do|does|is|are)\b/.test(lower);
  const asksForRepair = /\b(repeat|again|slow|clarify|mean|understand)\b/.test(lower);
  const chooses = /\b(i'd|i would|i prefer|i want|i'll|i will|choose|rather|like)\b/.test(lower);
  const isVeryShort = clean.split(/\s+/).length <= 3;

  let line = next.line ?? "And you?";
  if (asksForRepair || /clarif/.test(goal)) {
    line = "Of course. The important detail is this — does that make sense?";
  } else if (chooses || /choisir|choice|recommend/.test(goal)) {
    line = "That makes sense. What is the main reason for your choice?";
  } else if (responseLooksLikeQuestion) {
    line = "Good question. What matters most to you here?";
  } else if (isVeryShort) {
    line = "Could you tell me a little more about that?";
  } else if (clean.length >= 40) {
    line = "That is useful. Could you give me one concrete example?";
  } else {
    line = "I see. And what about the other option?";
  }

  return {
    ...room,
    turns: room.turns.map((turn, index) =>
      index === nextAiIndex
        ? { ...turn, line }
        : turn,
    ),
  };
}

export function generateLivingRoom(input: GenerateInput = {}): LivingRoom {
  const now = input.now ?? new Date();
  const dayKey = now.toISOString().slice(0, 10);
  const seedStr = hashSeed([
    input.archetype ?? "any",
    input.level ?? "A2",
    input.firstName ?? "learner",
    input.friction ?? "",
    (input.interests ?? []).join(","),
    input.entropy ?? "",
    dayKey,
  ]);
  const seedNum = parseInt(seedStr, 36) || 1;
  const rng = mulberry32(seedNum);

  const level = input.level ?? "A2";
  const firstName = input.firstName ?? "Camille";

  const { place, event } = worldAgent(rng, input, now);
  const cast = castAgent(rng, place);
  const pressure = pressureAgent(rng, place);
  const beats = beatAgent(rng, place, pressure, Boolean(event), level);
  const turns = voiceAgent(rng, beats, cast, event, level);
  const debrief = debriefAgent(rng, place, pressure, cast, event);
  const memoryWhisper = memoryAgent(input.friction, firstName);

  const title =
    event && rng() < 0.55
      ? `${place.titleEn} · ${event.title}`
      : place.titleEn;

  const protocol = [
    "Pas de traduction a voix haute pendant l'echange.",
    "Maintenez pour repondre — Leo ecoute, puis enchaine.",
    `Pression : ${pressure.label.toLowerCase()} — ${pressure.description}`,
    event
      ? `Le monde entre dans la room : ${event.title}.`
      : "Le bilan arrive apres — jamais pendant.",
  ];

  return {
    id: `room-${seedStr}`,
    seed: seedStr,
    title,
    titleFr: place.titleFr,
    setting: place.setting,
    image: place.image,
    durationMin: durationFor(turns, pressure),
    level,
    cast,
    place: {
      id: place.id,
      archetype: place.archetype,
      sensory: pick(rng, place.sensory),
      localColour: pick(rng, place.localColour),
    },
    event: event
      ? {
          id: event.id,
          title: event.title,
          atmosphere: event.atmosphere,
          hooks: event.talkHooks.slice(0, 2),
        }
      : null,
    pressure: {
      id: pressure.id,
      label: pressure.label,
      description: pressure.description,
    },
    culturalNote: culturalNoteFor(place, event, rng),
    kit: kitFor(place, event, rng),
    turns,
    protocol,
    debrief,
    memoryWhisper,
    generatedAt: now.toISOString(),
  };
}

export function generateRoomCatalog(input: GenerateInput = {}): LivingRoom[] {
  const archetypes = [
    "cafe",
    "market",
    "airport",
    "hotel",
    "office",
    "campus",
    "coast",
    "social",
    "shop",
    "transit",
  ] as const;
  return archetypes.map((archetype) =>
    generateLivingRoom({
      ...input,
      archetype,
      entropy: input.entropy ?? "catalog",
    }),
  );
}

export function reshuffleRoom(
  previous: LivingRoom,
  input: GenerateInput = {},
): LivingRoom {
  return generateLivingRoom({
    ...input,
    archetype: previous.place.archetype,
    entropy: `${previous.seed}-${Date.now()}`,
  });
}

export type LlmBridgeConfig = {
  url: string;
  model?: string;
  apiKey?: string;
};

export function roomBriefForLlm(room: LivingRoom): string {
  return [
    `You are ${room.cast.name}, a ${room.cast.role}. Stance: ${room.cast.stance}`,
    `Setting: ${room.setting}`,
    room.event ? `Today's world: ${room.event.atmosphere}` : "",
    `Pressure: ${room.pressure.description}`,
    `Level: ${room.level}. Keep lines short, natural, no teaching voice.`,
    `Goals in order: ${room.turns
      .filter((t) => t.speaker === "ai")
      .map((t) => t.goal)
      .join(" → ")}`,
  ]
    .filter(Boolean)
    .join("\n");
}
