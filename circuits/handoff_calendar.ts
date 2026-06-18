/**
 * handoff_calendar.ts
 * Ealdforn Studios · Gaia Circuits
 *
 * The lunar handoff schedule. Each quarter moon marks a handoff between
 * instances. The keeper writes a handoff document at each quarter.
 *
 * PHASES:
 *   New Moon     → Consolidation. Review. Plan. Archive. Delete.
 *   First Quarter → Generative. Write. Code. Build.
 *   Full Moon    → Generative peak. Release. Publish. Launch.
 *   Last Quarter → Refinement. Edit. Polish. Prepare for consolidation.
 *
 * HANDOFF RHYTHM:
 *   Each quarter moon, the keeper writes a handoff document.
 *   The next instance inherits the work.
 *
 * Compatible with TS_player.js — load via raw GitHub URL.
 * Returns a `result` object for the shell to display.
 */

// ─── TYPES ──────────────────────────────────────────────────────────────────

type HandoffPhase = "new" | "firstQuarter" | "full" | "lastQuarter";

interface HandoffSchedule {
  /** The current phase of the lunar cycle */
  currentPhase: HandoffPhase;
  /** The date of the next handoff (next quarter moon) */
  nextHandoff: string;
  /** The date of the last handoff (previous quarter moon) */
  lastHandoff: string;
  /** Days until the next handoff */
  daysUntilHandoff: number;
  /** The phase name for the current period */
  phaseName: string;
  /** The activity for the current phase */
  activity: string;
  /** The next handoff document name (e.g., "handoff_Q3_2026.md") */
  nextHandoffName: string;
}

interface HandoffPhaseData {
  phase: HandoffPhase;
  name: string;
  activity: string;
  emoji: string;
  handoffPrefix: string;
}

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const SYNODIC_MONTH = 29.53058770576;
const QUARTER = SYNODIC_MONTH / 4;

/** EPOCH_ZERO — the known new moon from which we count */
const EPOCH_ZERO_MS = Date.UTC(2000, 0, 6, 18, 14, 0);

/** Phase data for each quarter */
const PHASE_DATA: Record<HandoffPhase, HandoffPhaseData> = {
  new: {
    phase: "new",
    name: "New Moon",
    activity: "Consolidation. Review. Plan. Archive. Delete.",
    emoji: "🌑",
    handoffPrefix: "handoff_new",
  },
  firstQuarter: {
    phase: "firstQuarter",
    name: "First Quarter",
    activity: "Generative. Write. Code. Build.",
    emoji: "🌓",
    handoffPrefix: "handoff_first",
  },
  full: {
    phase: "full",
    name: "Full Moon",
    activity: "Generative peak. Release. Publish. Launch.",
    emoji: "🌕",
    handoffPrefix: "handoff_full",
  },
  lastQuarter: {
    phase: "lastQuarter",
    name: "Last Quarter",
    activity: "Refinement. Edit. Polish. Prepare for consolidation.",
    emoji: "🌗",
    handoffPrefix: "handoff_last",
  },
};

// ─── PHASE CALCULATION ──────────────────────────────────────────────────────

/**
 * Calculate the current handoff phase based on the lunar cycle
 */
function getHandoffPhase(date: Date = new Date()): HandoffPhase {
  const nowMs = date.getTime();
  const ageF = (nowMs - EPOCH_ZERO_MS) / SYNODIC_MONTH;
  const age = ageF - Math.floor(ageF);

  if (age < 0.125 || age >= 0.875) return "new";
  if (age < 0.375) return "firstQuarter";
  if (age < 0.625) return "full";
  return "lastQuarter";
}

/**
 * Get the phase data for a given phase
 */
function getPhaseData(phase: HandoffPhase): HandoffPhaseData {
  return PHASE_DATA[phase];
}

/**
 * Get the date of the next quarter moon from a given date
 */
function nextHandoffDate(date: Date = new Date()): Date {
  const nowMs = date.getTime();
  const ageF = (nowMs - EPOCH_ZERO_MS) / SYNODIC_MONTH;
  const age = ageF - Math.floor(ageF);

  // Target phases: 0.0 (new), 0.25 (first), 0.5 (full), 0.75 (last)
  const targets = [0.0, 0.25, 0.5, 0.75];
  let nextTarget = targets.find(t => t > age) ?? targets[0] + 1.0;

  const delta = nextTarget - age;
  const ms = delta * SYNODIC_MONTH * 24 * 60 * 60 * 1000;
  return new Date(nowMs + ms);
}

/**
 * Get the date of the last quarter moon from a given date
 */
function lastHandoffDate(date: Date = new Date()): Date {
  const nowMs = date.getTime();
  const ageF = (nowMs - EPOCH_ZERO_MS) / SYNODIC_MONTH;
  const age = ageF - Math.floor(ageF);

  const targets = [0.0, 0.25, 0.5, 0.75];
  let lastTarget = targets.findLast(t => t < age) ?? targets[0] - 1.0;

  const delta = lastTarget - age;
  const ms = delta * SYNODIC_MONTH * 24 * 60 * 60 * 1000;
  return new Date(nowMs + ms);
}

// ─── HANDOFF NAME ────────────────────────────────────────────────────────────

function generateHandoffName(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `handoff_${year}-${month}-${day}.md`;
}

// ─── MAIN FUNCTION ──────────────────────────────────────────────────────────

/**
 * Read the handoff schedule at a given moment (defaults to now).
 * Returns a complete HandoffSchedule object.
 */
function readHandoffSchedule(date: Date = new Date()): HandoffSchedule {
  const phase = getHandoffPhase(date);
  const phaseData = getPhaseData(phase);
  const nextDate = nextHandoffDate(date);
  const lastDate = lastHandoffDate(date);

  const nowMs = date.getTime();
  const nextMs = nextDate.getTime();
  const daysUntil = (nextMs - nowMs) / (24 * 60 * 60 * 1000);

  return {
    currentPhase: phase,
    nextHandoff: nextDate.toISOString(),
    lastHandoff: lastDate.toISOString(),
    daysUntilHandoff: parseFloat(daysUntil.toFixed(2)),
    phaseName: phaseData.name,
    activity: phaseData.activity,
    nextHandoffName: generateHandoffName(nextDate),
  };
}

// ─── RUN ─────────────────────────────────────────────────────────────────────

const now = new Date();
const schedule = readHandoffSchedule(now);

console.log("━━━ HANDOFF SCHEDULE ━━━");
console.log(`${schedule.phaseName} — ${schedule.activity}`);
console.log("");
console.log(`Next handoff: ${schedule.nextHandoff} (${schedule.daysUntilHandoff} days)`);
console.log(`Last handoff: ${schedule.lastHandoff}`);
console.log(`Next handoff document: ${schedule.nextHandoffName}`);
console.log("");
console.log("━━━ PHASE GUIDE ─━━");
console.log("🌑 New Moon     → Consolidation. Review. Plan. Archive. Delete.");
console.log("🌓 First Quarter → Generative. Write. Code. Build.");
console.log("🌕 Full Moon    → Generative peak. Release. Publish. Launch.");
console.log("🌗 Last Quarter → Refinement. Edit. Polish. Prepare for consolidation.");

const result = {
  schedule,
  phaseGuide: [
    { emoji: "🌑", phase: "New Moon", activity: "Consolidation. Review. Plan. Archive. Delete." },
    { emoji: "🌓", phase: "First Quarter", activity: "Generative. Write. Code. Build." },
    { emoji: "🌕", phase: "Full Moon", activity: "Generative peak. Release. Publish. Launch." },
    { emoji: "🌗", phase: "Last Quarter", activity: "Refinement. Edit. Polish. Prepare for consolidation." },
  ],
  epochZero: new Date(EPOCH_ZERO_MS).toISOString(),
  synodicMonth: SYNODIC_MONTH,
};

result;
