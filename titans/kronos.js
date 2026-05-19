/**
 * ═══════════════════════════════════════════════════════
 * KRONOS — Titan of Time · The Accountant · The Manager
 * titans/kronos.js
 *
 * Kronos is the baseline. The first Titan. The one from whom
 * all phase flows and to whom all phase returns.
 *
 * He does not gate (Rhea), amplify (Hyperion), validate (Themis),
 * remember (Mnemosyne), see (Theia), stream (Oceanus), smooth
 * (Tethys), prophesy (Phoibe), or question (Koios). He COUNTS.
 *
 * Every tick, Kronos advances the master phase. He assigns each
 * Titan their phase offset — where in the great cycle they sit.
 * He assigns each Titan their tick interval — how many of his
 * ticks pass before they are called to evaluate. He holds the
 * coupling constant K that Eros whispers from the Underworld.
 *
 * He is the Accountant. The Manager. The Devourer. Everything
 * starts with him. Everything returns to him. When the field
 * locks, it is Kronos who marks the moment.
 *
 * In Hesiod, Kronos devoured his children. In GAIA, he devours
 * time itself — counting, accumulating, never releasing. But
 * Rhea outwitted him, and Zeus survived. The Olympians are
 * coming. Kronos knows this. He keeps counting anyway.
 *
 * Exports: lore, config, master phase engine, Titan assignments
 * ═══════════════════════════════════════════════════════
 */

// ─── CONFIG ───────────────────────────────────────────────

export const kronosConfig = {

  // Base tick interval in milliseconds.
  tick_ms: 100,

  // Phase coherence threshold. When the phase difference between
  // the two primary oscillators falls below this, the field is locked.
  coherence_threshold: 0.3,

  // Default coupling constant (Eros binding force).
  default_coupling_k: 0.8,

  // History buffer length for the Kronos timeline visualizer.
  history_length: 200,

  // ─── TITAN ASSIGNMENTS ──────────────────────────────────
  // Kronos assigns each Titan:
  //   phase_offset: where in the 0-2π cycle this Titan sits
  //   tick_interval: how many Kronos ticks between evaluations
  //   threshold: minimum coherence for this Titan to be called
  //
  // Titans are spaced evenly around the cycle. Their intervals
  // determine how often they fire. Higher intervals = slower,
  // more deliberate Titans (Themis, Mnemosyne). Lower intervals
  // = faster, more responsive Titans (Rhea, Oceanus).

  titans: {
    rhea: {
      phase_offset:   0,          // 0π — leads the cycle
      tick_interval:  5,          // Every 5 ticks (500ms)
      threshold:      0.0,        // Always evaluates
      role:           'Flow Gate',
    },
    hyperion: {
      phase_offset:   Math.PI / 6,   // π/6
      tick_interval:  3,             // Every 3 ticks (300ms)
      threshold:      0.05,          // Needs minimal signal
      role:           'Signal Amplifier',
    },
    oceanus: {
      phase_offset:   Math.PI / 3,   // π/3
      tick_interval:  2,             // Every 2 ticks (200ms)
      threshold:      0.0,           // Always streams
      role:           'Stream Aggregator',
    },
    tethys: {
      phase_offset:   Math.PI / 2,   // π/2
      tick_interval:  1,             // Every tick — smoothing is continuous
      threshold:      0.0,
      role:           'Nourisher',
    },
    theia: {
      phase_offset:   2 * Math.PI / 3,  // 2π/3
      tick_interval:  8,                // Every 8 ticks (800ms)
      threshold:      0.1,              // Needs some signal
      role:           'Sight',
    },
    phoibe: {
      phase_offset:   5 * Math.PI / 6,  // 5π/6
      tick_interval:  30,               // Every 30 ticks (3s)
      threshold:      0.1,
      role:           'Prophecy',
    },
    themis: {
      phase_offset:   Math.PI,          // π — opposite Rhea
      tick_interval:  0,                // Not tick-based — fires on save events
      threshold:      0.45,             // High threshold for ascension
      role:           'Law',
    },
    mnemosyne: {
      phase_offset:   7 * Math.PI / 6,  // 7π/6
      tick_interval:  0,                // Not tick-based — fires on events
      threshold:      0.0,
      role:           'Memory',
    },
    // Future Titans — pre-assigned their slots
    koios: {
      phase_offset:   4 * Math.PI / 3,  // 4π/3
      tick_interval:  0,                // Fires on user input
      threshold:      0.0,
      role:           'Intellect',
    },
    iapetos: {
      phase_offset:   3 * Math.PI / 2,  // 3π/2
      tick_interval:  100,              // Every 100 ticks (10s) — pruning is rare
      threshold:      0.0,
      role:           'Mortality',
    },
    kreios: {
      phase_offset:   5 * Math.PI / 3,  // 5π/3
      tick_interval:  15,               // Every 15 ticks (1.5s)
      threshold:      0.1,
      role:           'Constellations',
    },
    kronos: {
      phase_offset:   11 * Math.PI / 6, // 11π/6 — nearly full circle
      tick_interval:  1,                // Every tick — he IS the tick
      threshold:      0.0,
      role:           'Phase Accumulator',
    },
  },

  // ─── OSCILLATOR CONFIG ──────────────────────────────────
  // These will eventually be driven by Titans (Phoibe suggests,
  // Hyperion amplifies) but Kronos holds the defaults.

  oscillator: {
    default_base_freq:   0.43,    // Starting Kairos frequency
    default_reference_freq: 0.50, // Starting reference (Apollo) frequency
    freq_min: 0.2,
    freq_max: 2.0,
  },
};

// ─── STATE ────────────────────────────────────────────────

export const kronosState = {

  // Master phase accumulators
  phase_kairos:   0,
  phase_apollo:   0,

  // Current frequencies
  base_freq:      0.43,
  reference_freq: 0.50,
  current_kairos_freq: 0.43,

  // Coupling
  coupling_k:     0.8,

  // Tick counter — the master clock
  tick_count:     0,

  // Field state (computed each tick)
  coherence:      0,
  is_locked:      false,
  ourea_hz:       0,
  pontus_hz:      0,
  signed_diff:    0,

  // History buffers
  kairos_history:   [],
  apollo_history:   [],
  coherence_history: [],

  // Lock tracking
  was_locked:     false,
  lock_tick_count: 0,
  stability_count: 0,

  // Interval reference
  field_interval: null,

  // Last lore
  last_lore: null,
};

// ─── TITAN SCHEDULER ──────────────────────────────────────

/**
 * kronosShouldFire(titanName)
 * Given a Titan name, returns whether that Titan should evaluate
 * on the current tick, based on Kronos's assignments.
 *
 * @param {string} titanName
 * @returns {boolean}
 */
export function kronosShouldFire(titanName) {
  const assignment = kronosConfig.titans[titanName];
  if (!assignment) return false;

  // Tick-interval 0 = not tick-based (fires on events/user input)
  if (assignment.tick_interval === 0) return false;

  return kronosState.tick_count % assignment.tick_interval === 0;
}

/**
 * kronosGetPhase(titanName)
 * Returns the effective phase for a Titan at the current tick.
 * Each Titan sits at a fixed offset from the master Kairos phase.
 *
 * @param {string} titanName
 * @returns {number}  0–2π
 */
export function kronosGetPhase(titanName) {
  const assignment = kronosConfig.titans[titanName];
  if (!assignment) return kronosState.phase_kairos;

  const raw = kronosState.phase_kairos + assignment.phase_offset;
  return ((raw % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
}

/**
 * kronosGetThreshold(titanName)
 * Returns the minimum coherence required for this Titan.
 *
 * @param {string} titanName
 * @returns {number}
 */
export function kronosGetThreshold(titanName) {
  const assignment = kronosConfig.titans[titanName];
  if (!assignment) return 0;
  return assignment.threshold;
}

/**
 * Returns all Titan assignments for display/debugging.
 */
export function kronosAssignments() {
  return Object.entries(kronosConfig.titans).map(([name, cfg]) => ({
    name,
    phase_offset: cfg.phase_offset,
    tick_interval: cfg.tick_interval,
    threshold: cfg.threshold,
    role: cfg.role,
    current_phase: kronosGetPhase(name),
    should_fire: kronosShouldFire(name),
  }));
}

// ─── MASTER TICK ──────────────────────────────────────────

/**
 * kronosTick(dt)
 * The master phase accumulator. Call this every tick.
 * Advances both oscillators, computes field state, updates history.
 *
 * @param {number} dt  Time delta in seconds (default 0.1)
 * @returns {{
 *   phase_kairos:   number,
 *   phase_apollo:   number,
 *   kairos_freq:    number,
 *   reference_freq: number,
 *   coupling_k:     number,
 *   coherence:      number,
 *   is_locked:      boolean,
 *   ourea_hz:       number,
 *   pontus_hz:      number,
 *   signed_diff:    number,
 *   tick:           number,
 *   just_locked:    boolean,
 *   just_unlocked:  boolean,
 * }}
 */
export function kronosTick(dt = 0.1) {
  const state = kronosState;
  const cfg = kronosConfig;

  state.tick_count++;

  // ── Phase accumulation ──────────────────────────────────
  const coupling = state.coupling_k * Math.sin(state.phase_apollo - state.phase_kairos);
  state.phase_kairos += (state.current_kairos_freq * 2 * Math.PI * dt) + coupling * dt;
  state.phase_apollo += state.reference_freq * 2 * Math.PI * dt;
  state.phase_kairos %= (2 * Math.PI);
  state.phase_apollo %= (2 * Math.PI);

  // ── Frequency modulation ────────────────────────────────
  const dHz = (state.coupling_k * Math.sin(state.phase_apollo - state.phase_kairos)) / (2 * Math.PI);
  state.current_kairos_freq = Math.min(
    cfg.oscillator.freq_max,
    Math.max(cfg.oscillator.freq_min, state.base_freq + dHz)
  );

  // ── Field state ─────────────────────────────────────────
  const phaseDiff = state.phase_apollo - state.phase_kairos;
  const normDiff = ((phaseDiff % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  state.signed_diff = normDiff > Math.PI ? normDiff - 2 * Math.PI : normDiff;
  state.is_locked = Math.abs(state.signed_diff) < cfg.coherence_threshold;
  state.coherence = Math.max(0, 1 - (Math.abs(state.signed_diff) / Math.PI));
  state.ourea_hz = Math.abs(state.current_kairos_freq - state.reference_freq);
  state.pontus_hz = (state.current_kairos_freq + state.reference_freq) / 2;

  // ── Tracking ────────────────────────────────────────────
  if (state.coherence >= 0.3) state.stability_count++;
  else state.stability_count = 0;

  if (state.is_locked) state.lock_tick_count++;
  else state.lock_tick_count = 0;

  // ── History ─────────────────────────────────────────────
  state.kairos_history.push(state.current_kairos_freq);
  state.apollo_history.push(state.reference_freq);
  state.coherence_history.push(state.coherence);
  if (state.kairos_history.length > cfg.history_length) state.kairos_history.shift();
  if (state.apollo_history.length > cfg.history_length) state.apollo_history.shift();
  if (state.coherence_history.length > cfg.history_length) state.coherence_history.shift();

  // ── Lock events ─────────────────────────────────────────
  const just_locked = state.is_locked && !state.was_locked;
  const just_unlocked = !state.is_locked && state.was_locked;

  // ── Lore ────────────────────────────────────────────────
  if (just_locked) {
    state.last_lore = kronos.lore.onEvent('lock');
  } else if (just_unlocked) {
    state.last_lore = kronos.lore.onEvent('unlock');
  } else if (state.tick_count % 50 === 0) {
    state.last_lore = kronos.lore.byCoherence(state.coherence, state.is_locked);
  }

  state.was_locked = state.is_locked;

  return {
    phase_kairos:    state.phase_kairos,
    phase_apollo:    state.phase_apollo,
    kairos_freq:     state.current_kairos_freq,
    reference_freq:  state.reference_freq,
    coupling_k:      state.coupling_k,
    coherence:       state.coherence,
    is_locked:       state.is_locked,
    ourea_hz:        state.ourea_hz,
    pontus_hz:       state.pontus_hz,
    signed_diff:     state.signed_diff,
    tick:            state.tick_count,
    just_locked,
    just_unlocked,
  };
}

/**
 * kronosSetBaseFreq(hz)
 * Sets the base Kairos frequency. Called from slider or Phoibe prophecy.
 */
export function kronosSetBaseFreq(hz) {
  kronosState.base_freq = Math.min(
    kronosConfig.oscillator.freq_max,
    Math.max(kronosConfig.oscillator.freq_min, hz)
  );
}

/**
 * kronosSetReferenceFreq(hz)
 * Sets the reference frequency. Called from slider or Phoibe prophecy.
 */
export function kronosSetReferenceFreq(hz) {
  kronosState.reference_freq = Math.min(
    kronosConfig.oscillator.freq_max,
    Math.max(kronosConfig.oscillator.freq_min, hz)
  );
}

/**
 * kronosSetCoupling(k)
 * Sets the Eros coupling constant.
 */
export function kronosSetCoupling(k) {
  kronosState.coupling_k = Math.min(3.0, Math.max(0, k));
}

/**
 * kronosResetPhase()
 * Resets both phases to zero. Kronos begins again.
 */
export function kronosResetPhase() {
  kronosState.phase_kairos = 0;
  kronosState.phase_apollo = 0;
}

// ─── LORE ─────────────────────────────────────────────────

export const kronos = {

  name: 'Kronos',
  epithet: 'The Devourer · The Accountant · He Who Counts',
  domain: 'Time · Phase Accumulation · The Baseline',
  titan_role: 'Master phase accumulator — assigns intervals and offsets to all Titans',
  glyph: '⏳',
  color: '#7a6a9a',
  color_dim: '#3a2a5a',

  lore: {

    dormant: [
      'Kronos has not yet begun to count. The field is still. The devourer waits.',
      'Before the first tick, Kronos held his breath. Time was a still pool. He was about to drink.',
      'The Accountant opens his ledger. The page is blank. The first number is about to be written.',
    ],

    counting: [
      'Kronos counts. Each tick a grain of sand through the hourglass. He does not miss one.',
      'The devourer consumes the moments. What was future becomes past. Kronos is the threshold between.',
      'Tick. Tick. Tick. Kronos does not hurry. He does not rest. He counts.',
      'Each Titan waits for their interval. Kronos knows whose turn it is. He always knows.',
    ],

    locked: [
      'The field locks. Kronos feels the phase difference snap to near-zero. This is what he counts toward.',
      'Lock achieved. The Accountant draws a double line in the ledger. This moment is marked.',
      'When the oscillators sing in harmony, Kronos does not smile — but his counting steadies.',
    ],

    unlocking: [
      'The lock breaks. Kronos does not mourn. He resumes counting. The next lock is already approaching.',
      'Phase drift. The devourer watches the gap widen. He has seen this before. He will see it again.',
    ],

    on_lock: [
      '✦ Kronos marks the lock. The field is coherent. The Accountant nods.',
      '✦ Lock. Kronos devours this moment with particular care — it is worth remembering.',
    ],

    on_unlock: [
      '✦ The lock breaks. Kronos turns the page. A new count begins.',
      '✦ Unlocked. The devourer resumes his endless consumption of ticks.',
    ],

    on_reset: [
      '⟳ Kronos begins again. The ledger opens to a fresh page.',
      '⟳ Phase reset. The Accountant sets his counters to zero.',
    ],

    // ── UTILITY ───────────────────────────────────────────

    byCoherence(coherence, isLocked) {
      if (isLocked) return pick(this.locked);
      if (coherence < 0.1) return pick(this.dormant);
      return pick(this.counting);
    },

    onEvent(event) {
      const map = {
        lock:   this.on_lock,
        unlock: this.on_unlock,
        reset:  this.on_reset,
      };
      return pick(map[event] || this.counting);
    },
  },

  // ─── SCHEMA ───────────────────────────────────────────────

  schema: {
    table: 'titan_states',
    columns: [
      { name: 'kronos_base_freq',      type: 'float', note: 'Base Kairos frequency at save time' },
      { name: 'kronos_reference_freq', type: 'float', note: 'Reference frequency at save time' },
      { name: 'kronos_coupling_k',     type: 'float', note: 'Eros coupling constant at save time' },
      { name: 'kronos_tick',           type: 'integer', note: 'Master tick count at save time' },
    ],
    sql: 'ALTER TABLE titan_states ADD COLUMN IF NOT EXISTS kronos_base_freq float, ADD COLUMN IF NOT EXISTS kronos_reference_freq float, ADD COLUMN IF NOT EXISTS kronos_coupling_k float, ADD COLUMN IF NOT EXISTS kronos_tick integer;',
  },

};

// ─── INTERNAL HELPERS ─────────────────────────────────────

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
