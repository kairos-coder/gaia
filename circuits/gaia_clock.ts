/**
 * gaia_clock.ts
 * Ealdforn Studios · Gaia Pillar
 *
 * Gaia's cosmological clock. No timers. No heartbeat interval.
 * The clock IS the sky — reads the actual lunar phase from
 * astronomical calculation and derives the current age, phase
 * name, and epoch position from it.
 *
 * AGE STRUCTURE (one lunation = one age, ~29.5 days):
 *   🌑 New Moon      — AGE START (birth)
 *   🌓 First Quarter — waxing, age rising
 *   🌕 Full Moon     — HALF-AGE (apex)
 *   🌗 Last Quarter  — waning, age dying
 *   🌑 New Moon      — FIN / next age birth
 *
 * AGE NAMES cycle: Ouranos → Pontus → Ourea → Eros → (repeat)
 * Total age count accumulates from EPOCH_ZERO — never resets.
 *
 * Compatible with TS_player.js — load via raw GitHub URL.
 * Returns a `result` object for the shell to display.
 */

// ─── TYPES ──────────────────────────────────────────────────────────────────

interface LunarPhase {
  /** 0.0 – 1.0 where 0/1 = new moon, 0.5 = full moon */
  illumination: number;
  /** Canonical phase name */
  phaseName: PhaseName;
  /** Glyph for the phase */
  glyph: string;
  /** Age position: 'start' | 'waxing' | 'apex' | 'waning' */
  agePosition: AgePosition;
}

interface GaiaAge {
  /** Total ages elapsed since EPOCH_ZERO */
  totalCount: number;
  /** Name within the four-age cycle */
  name: AgeName;
  /** Which cycle of the four-age wheel we are in (0-indexed) */
  cycle: number;
  /** Position within the current cycle (0–3) */
  cycleIndex: number;
}

interface GaiaClock {
  /** ISO timestamp of this reading */
  readingAt: string;
  /** Current lunar phase data */
  phase: LunarPhase;
  /** Current age data */
  age: GaiaAge;
  /** Human-readable cosmological timestamp */
  timestamp: string;
  /** Days elapsed in the current lunation (0–29.5) */
  daysIntoAge: number;
  /** Days remaining until the next new moon (FIN) */
  daysUntilFin: number;
  /** Unix ms of the most recent new moon (age start) */
  ageStartMs: number;
  /** Unix ms of the next new moon (fin) */
  ageFinMs: number;
}

type PhaseName = "New Moon" | "First Quarter" | "Full Moon" | "Last Quarter";
type AgePosition = "start" | "waxing" | "apex" | "waning";
type AgeName = "Ouranos" | "Pontus" | "Ourea" | "Eros";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

/** Mean synodic month in days */
const SYNODIC_MONTH = 29.53058770576;
const SYNODIC_MS = SYNODIC_MONTH * 24 * 60 * 60 * 1000;

/**
 * EPOCH_ZERO — the known new moon from which we count ages.
 * Using 2000-01-06 18:14 UTC (J2000.0 reference new moon).
 * All age counts derive from this anchor.
 */
const EPOCH_ZERO_MS = Date.UTC(2000, 0, 6, 18, 14, 0);

/** The four ages in cosmological order */
const AGE_NAMES: AgeName[] = ["Ouranos", "Pontus", "Ourea", "Eros"];

/** Phase glyphs */
const GLYPHS: Record<PhaseName, string> = {
  "New Moon":      "🌑",
  "First Quarter": "🌓",
  "Full Moon":     "🌕",
  "Last Quarter":  "🌗",
};

/** Phase thresholds (illumination 0.0–1.0, waxing vs waning encoded by direction) */
const PHASE_BOUNDARY = 0.03; // within 3% of 0 or 1.0 = new moon

// ─── ASTRONOMICAL CORE ───────────────────────────────────────────────────────

/**
 * Calculate lunar illumination fraction (0–1) and waxing/waning
 * using a simplified but accurate astronomical algorithm.
 * Based on Jean Meeus "Astronomical Algorithms" Ch. 49.
 */
function calculateLunarState(date: Date): {
  illumination: number;
  isWaxing: boolean;
  ageElapsed: number; // 0.0–1.0 through current lunation
} {
  const nowMs = date.getTime();

  // Ages elapsed since epoch (fractional)
  const totalAgesF = (nowMs - EPOCH_ZERO_MS) / SYNODIC_MS;

  // Fraction through the current lunation (0 = new moon, 0.5 = full, 1 = next new)
  const ageElapsed = totalAgesF - Math.floor(totalAgesF);

  // Illumination follows a cosine curve:
  // 0 at new moon, peaks at 1.0 at full moon, returns to 0
  // illumination = (1 - cos(2π * ageElapsed)) / 2
  const illumination = (1 - Math.cos(2 * Math.PI * ageElapsed)) / 2;

  // Waxing if in first half of lunation
  const isWaxing = ageElapsed < 0.5;

  return { illumination, isWaxing, ageElapsed };
}

// ─── PHASE CLASSIFICATION ────────────────────────────────────────────────────

function classifyPhase(ageElapsed: number): {
  phaseName: PhaseName;
  agePosition: AgePosition;
} {
  // ageElapsed: 0.0 – 1.0
  // New Moon:      0.0  – 0.125  and 0.875 – 1.0
  // First Quarter: 0.125 – 0.375
  // Full Moon:     0.375 – 0.625
  // Last Quarter:  0.625 – 0.875

  if (ageElapsed < 0.125 || ageElapsed >= 0.875) {
    return { phaseName: "New Moon", agePosition: "start" };
  } else if (ageElapsed < 0.375) {
    return { phaseName: "First Quarter", agePosition: "waxing" };
  } else if (ageElapsed < 0.625) {
    return { phaseName: "Full Moon", agePosition: "apex" };
  } else {
    return { phaseName: "Last Quarter", agePosition: "waning" };
  }
}

// ─── AGE DERIVATION ──────────────────────────────────────────────────────────

function deriveAge(nowMs: number): GaiaAge {
  const totalAgesF = (nowMs - EPOCH_ZERO_MS) / SYNODIC_MS;
  const totalCount = Math.floor(totalAgesF);
  const cycleIndex = ((totalCount % 4) + 4) % 4; // guard against negative
  const cycle = Math.floor(totalCount / 4);

  return {
    totalCount,
    name: AGE_NAMES[cycleIndex],
    cycle,
    cycleIndex,
  };
}

// ─── AGE BOUNDARY TIMESTAMPS ─────────────────────────────────────────────────

function ageStartMs(nowMs: number): number {
  const totalAgesF = (nowMs - EPOCH_ZERO_MS) / SYNODIC_MS;
  const totalCount = Math.floor(totalAgesF);
  return EPOCH_ZERO_MS + totalCount * SYNODIC_MS;
}

function ageFinMs(nowMs: number): number {
  return ageStartMs(nowMs) + SYNODIC_MS;
}

// ─── COSMOLOGICAL TIMESTAMP ──────────────────────────────────────────────────

function buildTimestamp(age: GaiaAge, phase: LunarPhase, daysIntoAge: number): string {
  const dayStr = daysIntoAge.toFixed(1);
  return `${phase.glyph} Age of ${age.name} · ${phase.phaseName} · Day ${dayStr} · Total Age ${age.totalCount}`;
}

// ─── MAIN CLOCK FUNCTION ─────────────────────────────────────────────────────

/**
 * Read Gaia's clock at a given moment (defaults to now).
 * Returns a complete GaiaClock object.
 */
function readGaiaClock(date: Date = new Date()): GaiaClock {
  const nowMs = date.getTime();

  const { ageElapsed } = calculateLunarState(date);
  const { phaseName, agePosition } = classifyPhase(ageElapsed);

  // Illumination for display
  const illumination = (1 - Math.cos(2 * Math.PI * ageElapsed)) / 2;

  const phase: LunarPhase = {
    illumination,
    phaseName,
    glyph: GLYPHS[phaseName],
    agePosition,
  };

  const age = deriveAge(nowMs);
  const startMs = ageStartMs(nowMs);
  const finMs = ageFinMs(nowMs);

  const daysIntoAge = ageElapsed * SYNODIC_MONTH;
  const daysUntilFin = (1 - ageElapsed) * SYNODIC_MONTH;

  const timestamp = buildTimestamp(age, phase, daysIntoAge);

  return {
    readingAt: date.toISOString(),
    phase,
    age,
    timestamp,
    daysIntoAge,
    daysUntilFin,
    ageStartMs: startMs,
    ageFinMs: finMs,
  };
}

// ─── UTILITY: NEXT PHASE TIMES ───────────────────────────────────────────────

/**
 * Returns the UTC timestamps of the next four phase events
 * from the given date.
 */
function nextPhaseEvents(date: Date = new Date()): Array<{
  phaseName: PhaseName;
  glyph: string;
  dateUtc: string;
  daysFromNow: number;
}> {
  const nowMs = date.getTime();
  const totalAgesF = (nowMs - EPOCH_ZERO_MS) / SYNODIC_MS;
  const ageElapsed = totalAgesF - Math.floor(totalAgesF);

  // Phase thresholds in lunation fraction
  const thresholds: Array<{ t: number; name: PhaseName }> = [
    { t: 0.0,   name: "New Moon" },
    { t: 0.25,  name: "First Quarter" },
    { t: 0.5,   name: "Full Moon" },
    { t: 0.75,  name: "Last Quarter" },
    { t: 1.0,   name: "New Moon" }, // next cycle
  ];

  const events: Array<{ phaseName: PhaseName; glyph: string; dateUtc: string; daysFromNow: number }> = [];

  for (const { t, name } of thresholds) {
    let delta = t - ageElapsed;
    if (delta <= 0.001) delta += 1.0; // already past, push to next cycle
    if (delta > 1.0) delta -= 1.0;

    const eventMs = nowMs + delta * SYNODIC_MS;
    const daysFromNow = delta * SYNODIC_MONTH;

    events.push({
      phaseName: name,
      glyph: GLYPHS[name],
      dateUtc: new Date(eventMs).toUTCString(),
      daysFromNow: parseFloat(daysFromNow.toFixed(2)),
    });
  }

  // Sort by proximity
  events.sort((a, b) => a.daysFromNow - b.daysFromNow);

  return events.slice(0, 4);
}

// ─── RUN ─────────────────────────────────────────────────────────────────────

const clock = readGaiaClock();
const upcoming = nextPhaseEvents();

console.log("━━━ GAIA CLOCK ━━━");
console.log(clock.timestamp);
console.log("");
console.log(`Age of ${clock.age.name} (Total Age #${clock.age.totalCount})`);
console.log(`Cycle ${clock.age.cycle} · Position ${clock.age.cycleIndex + 1}/4`);
console.log(`Illumination: ${(clock.phase.illumination * 100).toFixed(1)}%`);
console.log(`Day ${clock.daysIntoAge.toFixed(2)} of ${SYNODIC_MONTH.toFixed(2)}`);
console.log(`FIN in ${clock.daysUntilFin.toFixed(2)} days`);
console.log("");
console.log("━━━ NEXT PHASE EVENTS ━━━");
for (const e of upcoming) {
  console.log(`${e.glyph} ${e.phaseName} — in ${e.daysFromNow} days (${e.dateUtc})`);
}

// TS_player.js captures this as the return value
const result = {
  clock,
  upcoming,
  epochZero: new Date(EPOCH_ZERO_MS).toISOString(),
  synodicMonth: SYNODIC_MONTH,
};

result;
