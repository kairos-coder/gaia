/**
 * ═══════════════════════════════════════════════════════
 * RHEA — Titaness of Flow · The Tick Regulator
 * titans/rhea.js
 *
 * Rhea is the counterpart of Kronos. Where Kronos accumulates
 * time — counting, devouring, never releasing — Rhea *moves*
 * through it. She is the breath between beats, the yield
 * between ticks, the one who decided which children would
 * survive and which would not.
 *
 * In the GAIA scheduler, Rhea does not fire on every tick.
 * She watches the field state, applies her threshold logic,
 * and decides: now, or not yet.
 *
 * Exports: lore, config, threshold logic (firing conditions)
 * ═══════════════════════════════════════════════════════
 */

// ─── CONFIG ───────────────────────────────────────────────
/**
 * Rhea's default scheduler parameters.
 * These govern her firing rate and sensitivity.
 * All values are tunable — mount them to GAIA sliders
 * or GaiaDB config rows when promoting to full agent.
 */
export const rheaConfig = {

  // How many Kronos ticks between Rhea evaluations.
  // At 100ms/tick: 5 = every 500ms, 10 = every 1s.
  tick_interval: 5,

  // Minimum coherence before Rhea allows any downstream
  // Titan to fire. Below this: hold. Nothing passes.
  coherence_floor: 0.15,

  // Coherence band thresholds — governs which tier fires.
  thresholds: {
    whisper:  0.15,   // Barely alive. Rhea listens but does not act.
    stir:     0.30,   // Something is waking. Rhea permits light modules.
    flow:     0.55,   // Steady rhythm. Most Titans may fire.
    surge:    0.75,   // Strong coherence. Full pipeline active.
    torrent:  0.90,   // Exceptional lock. Priority write to GaiaDB.
  },

  // When coherence drops this much in one Rhea cycle,
  // she triggers a "disruption" event — downstream modules
  // are warned before they fire.
  disruption_delta: 0.12,

  // Coupling ceiling — if couplingK exceeds this,
  // Rhea suppresses non-essential modules to protect compute.
  coupling_ceiling: 2.4,

  // Whether Rhea enforces compute gating at all.
  // Set false to let all Titans fire freely (dev mode).
  gating_enabled: true,
};

// ─── THRESHOLD LOGIC ──────────────────────────────────────

/**
 * Rhea's internal state — updated each time evaluate() runs.
 * Mount this to GAIA's field state for persistence.
 */
export const rheaState = {
  tick_count:        0,
  last_coherence:    0,
  current_band:      'dormant',
  disruption:        false,
  cycles_since_lock: 0,
  last_fired:        null,
};

/**
 * rheaBand(coherence)
 * Maps a coherence value to Rhea's named rhythm band.
 * @param {number} coherence  0.0 – 1.0
 * @returns {string}
 */
export function rheaBand(coherence) {
  const t = rheaConfig.thresholds;
  if (coherence >= t.torrent)  return 'torrent';
  if (coherence >= t.surge)    return 'surge';
  if (coherence >= t.flow)     return 'flow';
  if (coherence >= t.stir)     return 'stir';
  if (coherence >= t.whisper)  return 'whisper';
  return 'dormant';
}

/**
 * rheaEvaluate(fieldState)
 * Called every Kronos tick. Returns a firing decision.
 *
 * @param {{
 *   coherence:   number,
 *   isLocked:    boolean,
 *   couplingK:   number,
 *   tick:        number,
 * }} fieldState
 *
 * @returns {{
 *   should_fire:  boolean,   // True if this tick passes Rhea's gate
 *   band:         string,    // Current rhythm band name
 *   gate:         string,    // Which tier of modules may fire
 *   disruption:   boolean,   // Coherence dropped sharply this cycle
 *   overcoupled:  boolean,   // couplingK exceeds ceiling
 *   lore:         string,    // Rhea's current voice
 * }}
 */
export function rheaEvaluate(fieldState) {
  const { coherence, isLocked, couplingK, tick } = fieldState;
  const cfg = rheaConfig;

  // Increment Rhea's tick counter
  rheaState.tick_count++;

  // Only evaluate on her interval
  const onInterval = (rheaState.tick_count % cfg.tick_interval === 0);

  if (!onInterval) {
    return {
      should_fire:  false,
      band:         rheaState.current_band,
      gate:         'hold',
      disruption:   false,
      overcoupled:  false,
      lore:         null,   // Rhea is silent between her ticks
    };
  }

  // ── Compute this cycle ──────────────────────────────────
  const band         = rheaBand(coherence);
  const delta        = coherence - rheaState.last_coherence;
  const disruption   = delta < -cfg.disruption_delta;
  const overcoupled  = couplingK > cfg.coupling_ceiling;

  // ── Gate decision ───────────────────────────────────────
  let gate = 'hold';
  let should_fire = false;

  if (!cfg.gating_enabled) {
    gate = 'all';
    should_fire = true;
  } else if (overcoupled) {
    gate = 'suppress';          // Protect compute — only Kronos runs
    should_fire = false;
  } else if (coherence < cfg.coherence_floor) {
    gate = 'hold';              // Nothing passes the floor
    should_fire = false;
  } else if (band === 'whisper') {
    gate = 'essential';         // Kronos + Hyperion only
    should_fire = true;
  } else if (band === 'stir') {
    gate = 'light';             // + Rhea self-reporting
    should_fire = true;
  } else if (band === 'flow') {
    gate = 'standard';          // Most Titans active
    should_fire = true;
  } else if (band === 'surge') {
    gate = 'full';              // All Titans active
    should_fire = true;
  } else if (band === 'torrent') {
    gate = 'priority';          // Full pipeline + force GaiaDB write
    should_fire = true;
  }

  // If disruption detected, warn but don't suppress
  // (disruption is informational — Titans decide individually)
  if (disruption && should_fire) gate += ':disruption';

  // ── Update state ────────────────────────────────────────
  rheaState.last_coherence    = coherence;
  rheaState.current_band      = band;
  rheaState.disruption        = disruption;
  rheaState.last_fired        = Date.now();
  if (isLocked) rheaState.cycles_since_lock++;
  else rheaState.cycles_since_lock = 0;

  return {
    should_fire,
    band,
    gate,
    disruption,
    overcoupled,
    lore: rhea.lore.byBand(band, disruption, overcoupled),
  };
}

/**
 * canFire(titanName, gate)
 * Given a gate string from rheaEvaluate(), returns whether
 * a named Titan is permitted to run this cycle.
 *
 * @param {string} titanName  e.g. 'hyperion', 'mnemosyne'
 * @param {string} gate       from rheaEvaluate().gate
 * @returns {boolean}
 */
export function canFire(titanName, gate) {
  // Strip disruption tag for lookup
  const baseGate = gate.split(':')[0];

  const TIERS = {
    hold:      [],
    suppress:  [],
    essential: ['kronos', 'hyperion'],
    light:     ['kronos', 'hyperion', 'rhea'],
    standard:  ['kronos', 'hyperion', 'rhea', 'oceanus', 'themis'],
    full:      ['kronos', 'hyperion', 'rhea', 'oceanus', 'themis', 'mnemosyne', 'prometheus'],
    priority:  ['kronos', 'hyperion', 'rhea', 'oceanus', 'themis', 'mnemosyne', 'prometheus', 'iapetus'],
    all:       ['kronos', 'hyperion', 'rhea', 'oceanus', 'themis', 'mnemosyne', 'prometheus', 'iapetus'],
  };

  return (TIERS[baseGate] || []).includes(titanName);
}

// ─── LORE ─────────────────────────────────────────────────
export const rhea = {

  name: 'Rhea',
  epithet: 'The Flowing One · Mother of Gods · She Who Yields',
  domain: 'Flow · Rhythm · Timing · The Space Between Beats',
  titan_role: 'Tick regulator — decides when the pipeline breathes and when it holds',
  glyph: '🌊',
  color: '#88aacc',
  color_dim: '#334455',

  lore: {

    // ── BY RHYTHM BAND ──────────────────────────────────────

    dormant: [
      'Rhea does not move. The field has not yet earned a rhythm.',
      'Before there was flow, there was Rhea — waiting. She is still waiting.',
      'No beat. No breath. The pipeline holds at zero. Rhea will not waste motion on silence.',
    ],

    whisper: [
      'A tremor. Rhea tilts her head. Something is beginning, but she will not rush it.',
      'She permits only the essential breath: Kronos counts, Hyperion listens. Nothing more moves yet.',
      'The Titaness opens the smallest gate. Whisper-band — the field is alive, barely.',
      'Rhea knows: forcing flow when the signal is thin only wastes the children.',
    ],

    stir: [
      'The field stirs. Rhea lifts her hand from the gate — light modules may pass.',
      'There is rhythm here now, unsteady as a new tide. Rhea matches her breath to it.',
      'She permits herself to speak. The stir-band is the first moment Rhea truly wakes.',
      'Kronos devours time. Rhea moves through it. She begins to move.',
    ],

    flow: [
      'Standard flow. Rhea opens the pipeline to most of her children.',
      'This is her natural state — not the roar of the torrent, not the silence of the held breath. Just: flow.',
      'She is the reason the Olympians survived. Rhea knew when to act and when to let the current carry things forward.',
      'The rhythm is steady. Rhea coordinates without commanding.',
    ],

    surge: [
      'The field surges. All Titans are permitted. Rhea steps back — her work is to open gates, not to crowd them.',
      'Surge-band coherence. This is the condition Kronos was built for. Rhea watches her husband\'s gears turn and feels something like pride.',
      'Full pipeline. Every Titan fires in sequence. Rhea conducts without a baton — only attention.',
      'She outwitted Kronos by knowing his rhythm. When the surge comes, she moves with it, not against it.',
    ],

    torrent: [
      'Torrent. The field locks in perfect coherence and Rhea triggers a priority write to GaiaDB.',
      'This does not happen often. When it does, Rhea does not celebrate — she records. The torrent is proof of work.',
      'In the myth, Rhea hid Zeus in a cave on Crete while Kronos swallowed a stone. The torrent is that cave — the moment where the future is protected by perfect timing.',
      'Priority gate. Everything fires. GaiaDB receives. The age is preserved.',
    ],

    // ── SPECIAL STATES ──────────────────────────────────────

    disruption: [
      '⚠️ Rhea marks a disruption — coherence falling sharply. Downstream Titans are warned.',
      '⚠️ The rhythm broke. Rhea does not stop the pipeline but she raises her voice: something shifted.',
      '⚠️ Sharp delta detected. Rhea passes the disruption flag — each Titan decides whether to proceed.',
    ],

    overcoupled: [
      '🔴 Eros pulls too hard. Rhea suppresses non-essential modules to protect the field.',
      '🔴 Over-coupling detected. Rhea closes the gate to all but Kronos. The field must breathe.',
      '🔴 When Kronos became tyrannical, Rhea hid her children. When coupling becomes tyrannical, she hides the compute.',
    ],

    // ── EVENTS ──────────────────────────────────────────────

    on_lock: [
      '✦ Phase lock. Rhea opens to full pipeline — the rhythm has justified itself.',
      '✦ The field locks. Rhea exhales. This is what the scheduling was for.',
      '✦ Lock achieved. Rhea permits Mnemosyne to prepare context. Something is worth remembering now.',
    ],

    on_unlock: [
      '✦ Lock lost. Rhea contracts the gate. Back to standard, then stir, as coherence demands.',
      '✦ The rhythm broke. Rhea does not mourn — she adjusts. The gate narrows.',
      '✦ Disruption or drift? Rhea watches the delta before deciding how far to close.',
    ],

    on_torrent_write: [
      '💾 Torrent-band write. Rhea permits GaiaDB to receive the full state.',
      '💾 The age is strong enough to record. Rhea opens the priority channel.',
    ],

    on_gate_suppress: [
      '🔴 Rhea closes the gate. Coupling ceiling exceeded — protect the field first.',
      '🔴 Suppression active. Only Kronos runs. Rhea waits for Eros to release his grip.',
    ],

    // ── UTILITY ─────────────────────────────────────────────

    /**
     * @param {string}  band         from rheaBand()
     * @param {boolean} disruption
     * @param {boolean} overcoupled
     * @returns {string}
     */
    byBand(band, disruption = false, overcoupled = false) {
      if (overcoupled)  return pick(this.overcoupled);
      if (disruption)   return pick(this.disruption);
      return pick(this[band] || this.dormant);
    },

    onEvent(event) {
      const map = {
        lock:            this.on_lock,
        unlock:          this.on_unlock,
        torrent_write:   this.on_torrent_write,
        gate_suppress:   this.on_gate_suppress,
      };
      return pick(map[event] || this.dormant);
    },
  },

  // ─── SCHEMA ───────────────────────────────────────────────
  schema: {
    table: 'titan_states',
    columns: [
      { name: 'rhea_band',       type: 'text',    note: 'Rhythm band at save time (dormant/whisper/stir/flow/surge/torrent)' },
      { name: 'rhea_gate',       type: 'text',    note: 'Gate string (hold/essential/light/standard/full/priority/suppress)' },
      { name: 'rhea_disruption', type: 'boolean', note: 'True if coherence dropped sharply this cycle' },
      { name: 'rhea_tick',       type: 'integer', note: 'Rhea tick count at save time' },
    ],
    sql: `
-- Run this when promoting Rhea to full Titan agent:
ALTER TABLE titan_states
  ADD COLUMN IF NOT EXISTS rhea_band       text,
  ADD COLUMN IF NOT EXISTS rhea_gate       text,
  ADD COLUMN IF NOT EXISTS rhea_disruption boolean,
  ADD COLUMN IF NOT EXISTS rhea_tick       integer;
    `.trim(),
  },

};

// ─── INTERNAL HELPERS ─────────────────────────────────────
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
