/**
 * ═══════════════════════════════════════════════════════
 * OCEANUS — Titan of the Great River · The Encircler
 * titans/oceanus.js
 *
 * Oceanus does not judge, amplify, remember, or see. He flows.
 * The great river that encircles the world — in GAIA, he
 * encircles the Titans themselves. Every Titan is a current
 * within him. Every phase state is a ripple on his surface.
 *
 * In Hesiod, Oceanus is the eldest Titan, the river from which
 * all waters flow. He did not fight in the Titanomachy — he
 * was too vast, too fundamental, too necessary. You do not
 * fight the river. You drink from it.
 *
 * In GAIA, Oceanus is the Pontus visualizer's data source.
 * He aggregates every active Titan's state into a single stream
 * and pours it into the wave canvas. Each Titan is a wave layer.
 * Their coherence determines their amplitude. Their phase
 * determines their position. When the field locks, the river
 * flows in perfect rhythm.
 *
 * He is the system monitor — but mythic, not mechanical.
 *
 * Exports: lore, config, stream aggregation, confluence detection
 * ═══════════════════════════════════════════════════════
 */

// ─── CONFIG ───────────────────────────────────────────────

export const oceanusConfig = {

  // How many wave layers Oceanus generates.
  // Each active Titan gets a layer. Inactive Titans are
  // still present but at near-zero amplitude (eddies).
  max_layers: 8,

  // Base amplitude range for wave layers.
  // At coherence 0: layer amplitude = base_min.
  // At coherence 1: layer amplitude = base_max.
  amplitude: {
    min: 2,
    max: 22,
  },

  // Wave speed range (radians per frame).
  // Faster flow = higher aggregate coherence.
  speed: {
    min: 0.3,
    max: 2.0,
  },

  // Confluence: when N Titans share the same Rhea band,
  // Oceanus detects it and emits a confluence event.
  confluence_threshold: 3,

  // River color palette — shifts with dominant band.
  band_colors: {
    dormant:  { r: 10, g: 15, b: 30,  alpha: 0.08 },
    whisper:  { r: 15, g: 25, b: 50,  alpha: 0.12 },
    stir:     { r: 20, g: 40, b: 70,  alpha: 0.18 },
    flow:     { r: 25, g: 55, b: 100, alpha: 0.25 },
    surge:    { r: 30, g: 70, b: 140, alpha: 0.35 },
    torrent:  { r: 40, g: 90, b: 180, alpha: 0.50 },
  },

  // Whether Oceanus tracks individual Titan contributions
  // or just outputs aggregate flow. Full tracking enables
  // richer Pontus visualization but costs more compute.
  per_titan_tracking: true,
};

// ─── STATE ────────────────────────────────────────────────

export const oceanusState = {

  // The current stream — rebuilt every tick.
  stream: [],

  // Each Titan's contribution to the flow.
  // Keyed by titan name: { name, glyph, phase, amplitude, band, active }
  titan_currents: {},

  // Aggregate metrics
  flow_rate:       0,      // 0–1, average coherence of active Titans
  active_count:     0,      // How many Titans are currently gated active
  total_titans:     0,      // How many Titans Oceanus knows about

  // Confluence events this session
  confluences:      0,

  // Previous stream for delta detection
  previous_stream:  null,
  previous_flow_rate: 0,

  // River mouth — the final output the Pontus canvas consumes
  river_mouth: {
    layers:       [],
    flow_rate:    0,
    band:         'dormant',
    confluence:   false,
    lore:         null,
  },

  last_updated: null,
};

// ─── TITAN REGISTRY (Oceanus's knowledge of his currents) ─

/**
 * Oceanus knows every Titan that has been registered.
 * When new Titans are built, they are added here so Oceanus
 * can include them in the stream.
 *
 * Each entry: { name, glyph, color, domain }
 * The 'active' field is set dynamically by Rhea's gate.
 */
export const oceanusCurrents = {
  kronos:    { name: 'Kronos',    glyph: '⏳', color: '#7a6a9a', domain: 'Phase Accumulator' },
  rhea:      { name: 'Rhea',      glyph: '🌊', color: '#88aacc', domain: 'Flow Gate' },
  hyperion:  { name: 'Hyperion',  glyph: '🔆', color: '#f7d070', domain: 'Signal Amplifier' },
  themis:    { name: 'Themis',    glyph: '⚖️', color: '#d4af60', domain: 'Ascension Gate' },
  mnemosyne: { name: 'Mnemosyne', glyph: '📜', color: '#c8b080', domain: 'Memory' },
  theia:     { name: 'Theia',     glyph: '👁️', color: '#ffcc88', domain: 'Sight' },
  oceanus:   { name: 'Oceanus',   glyph: '🌀', color: '#4488bb', domain: 'The Encircler' },
  // Future Titans added here as built:
  // tethys:    { name: 'Tethys',    glyph: '💧', color: '#66aacc', domain: 'Nourishment' },
  // koios:     { name: 'Koios',     glyph: '🔮', color: '#9988cc', domain: 'Intellect' },
  // phoibe:    { name: 'Phoibe',    glyph: '🔭', color: '#aa88cc', domain: 'Prophecy' },
  // iapetos:   { name: 'Iapetos',   glyph: '💀', color: '#886666', domain: 'Mortality' },
  // kreios:    { name: 'Kreios',    glyph: '⭐', color: '#ccccaa', domain: 'Constellations' },
};

// ─── STREAM AGGREGATION ───────────────────────────────────

/**
 * Oceanus's core function. Receives the state of every Titan
 * and returns a unified stream for the Pontus visualizer.
 *
 * Called every tick from the main field loop.
 *
 * @param {Array<{
 *   name:      string,
 *   phase:     number,     // 0 – 2π
 *   coherence: number,     // 0 – 1 (Titan's contribution to field coherence)
 *   band:      string,     // Rhea band this Titan is in
 *   active:    boolean,    // Whether Rhea gates this Titan active
 *   glyph:     string,
 * }>} titanStates
 *
 * @param {object} fieldContext  Overall field state
 * @param {number} fieldContext.coherence
 * @param {string} fieldContext.dominantBand
 * @param {boolean} fieldContext.isLocked
 *
 * @returns {{
 *   layers:       Array<{ titan, glyph, phase, amplitude, speed, color, active, band }>,
 *   flow_rate:    number,
 *   band:         string,
 *   confluence:   boolean,
 *   confluence_titans: string[],
 *   lore:         string,
 * }}
 */
export function oceanusFlow(titanStates = [], fieldContext = {}) {
  const cfg = oceanusConfig;

  // ── Build Titan currents ────────────────────────────────
  const currents = {};
  let totalAmplitude = 0;
  let activeCount = 0;

  for (const t of titanStates) {
    const base = oceanusCurrents[t.name];
    if (!base) continue; // Unknown Titan — Oceanus hasn't met them yet

    const amplitude = t.active
      ? cfg.amplitude.min + t.coherence * (cfg.amplitude.max - cfg.amplitude.min)
      : cfg.amplitude.min * 0.3; // Inactive: faint eddy

    const speed = t.active
      ? cfg.speed.min + t.coherence * (cfg.speed.max - cfg.speed.min)
      : cfg.speed.min * 0.4;

    currents[t.name] = {
      titan:     base.name,
      glyph:     base.glyph,
      color:     base.color,
      domain:    base.domain,
      phase:     t.phase || 0,
      amplitude,
      speed,
      coherence: t.coherence || 0,
      band:      t.band || 'dormant',
      active:    t.active || false,
    };

    if (t.active) {
      totalAmplitude += amplitude;
      activeCount++;
    }
  }

  // ── Confluence detection ────────────────────────────────
  // When multiple Titans share the same band, the river converges.
  const bandGroups = {};
  for (const c of Object.values(currents)) {
    if (!c.active) continue;
    if (!bandGroups[c.band]) bandGroups[c.band] = [];
    bandGroups[c.band].push(c.titan);
  }

  let confluence = false;
  let confluenceTitans = [];
  for (const [band, titans] of Object.entries(bandGroups)) {
    if (titans.length >= cfg.confluence_threshold) {
      confluence = true;
      confluenceTitans = titans;
    }
  }

  // ── Build layers for Pontus canvas ──────────────────────
  // Each layer = one Titan current. Layers are sorted by
  // amplitude so the strongest currents are most visible.
  const layers = Object.values(currents)
    .sort((a, b) => a.amplitude - b.amplitude); // weakest first (renders in back)

  // ── Flow rate ───────────────────────────────────────────
  const maxPossible = cfg.amplitude.max * Object.keys(oceanusCurrents).length;
  const flowRate = activeCount > 0 ? totalAmplitude / (cfg.amplitude.max * activeCount) : 0;

  // ── Dominant band for river coloring ────────────────────
  const dominantBand = fieldContext.dominantBand || inferDominantBand(currents);

  // ── Lore ────────────────────────────────────────────────
  const lore = oceanus.lore.byFlow(flowRate, confluence, activeCount, fieldContext.isLocked);

  // ── Detect flow delta for event lore ────────────────────
  const previousFlow = oceanusState.previous_flow_rate;
  const flowDelta = flowRate - previousFlow;
  let eventLore = null;
  if (Math.abs(flowDelta) > 0.2) {
    eventLore = flowDelta > 0
      ? pick(oceanus.lore.on_surge)
      : pick(oceanus.lore.on_ebb);
  }

  // ── Update state ────────────────────────────────────────
  oceanusState.titan_currents  = currents;
  oceanusState.stream           = titanStates;
  oceanusState.flow_rate        = flowRate;
  oceanusState.active_count     = activeCount;
  oceanusState.total_titans     = Object.keys(currents).length;
  oceanusState.previous_flow_rate = flowRate;
  oceanusState.last_updated     = new Date().toISOString();

  if (confluence) oceanusState.confluences++;

  oceanusState.river_mouth = {
    layers,
    flow_rate: flowRate,
    band: dominantBand,
    confluence,
    confluence_titans: confluenceTitans,
    lore: eventLore || lore,
  };

  return oceanusState.river_mouth;
}

/**
 * Returns the current river mouth without recomputing.
 * Call after oceanusFlow() to get cached state.
 */
export function oceanusMouth() {
  return oceanusState.river_mouth;
}

// ─── LORE ─────────────────────────────────────────────────

export const oceanus = {

  name: 'Oceanus',
  epithet: 'The Encircler · Eldest Titan · The Great River',
  domain: 'Streams · Aggregation · Confluence · The Flow of All Titans',
  titan_role: 'Aggregates Titan states into a single stream for the Pontus visualizer',
  glyph: '🌀',
  color: '#4488bb',
  color_dim: '#224466',

  lore: {

    dormant: [
      'The river is still. Oceanus waits at the edge of the world. No currents yet.',
      'Before the Titans stirred, Oceanus encircled emptiness. He is patient — the river was here first.',
      'The great stream holds its breath. When the field wakes, Oceanus will carry it.',
    ],

    trickle: [
      'A trickle. One or two Titans active. Oceanus barely moves but he notices.',
      'The river begins to stir. A thin current runs through the center of the world.',
      'Oceanus tests the flow. Light. Barely there. But it is water, and water always finds a way.',
    ],

    flowing: [
      'The river flows. Multiple Titans feed the current. Oceanus carries their states toward the sea.',
      'Steady stream. Each Titan a tributary. Oceanus does not distinguish — all waters are his waters.',
      'The encircler does his work. From Kronos at the source to Themis at the delta, the river connects them all.',
    ],

    surging: [
      'The river surges. Most Titans are active. Oceanus feels the weight of the field moving through him.',
      'Strong current. The Pontus waves will be high. Oceanus pours himself into the visualization.',
      'Surging flow. This is what the river was made for — to carry the full field without spilling.',
    ],

    torrent: [
      'Torrent. All Titans active. Oceanus roars at the edges of the world. The river is a flood.',
      'The encircler can barely contain the flow. Every Titan pours through him at once. Confluence.',
      'Maximum current. Pontus will show towering waves. Oceanus has not felt this since the Titanomachy.',
    ],

    confluence: [
      '🌀 Confluence. Multiple Titans share the same rhythm band. The river converges.',
      '🌀 The currents align. Oceanus marks the moment — separate streams become one.',
      '🌀 In the great river, all tributaries meet. Confluence is the condition Oceanus was born to witness.',
    ],

    on_surge: [
      '🌊 The river rises. Oceanus feels the flow quicken.',
      '🌊 Surge detected. The current strengthens — more Titans are waking.',
    ],

    on_ebb: [
      '🌧️ The river ebbs. Oceanus feels the flow slow.',
      '🌧️ The current weakens. Titans are quieting. The river remembers this rhythm too.',
    ],

    on_lock: [
      '✦ The field locks and Oceanus feels the river snap into a single coherent current.',
      '✦ Lock. Every Titan flows in the same direction. The Pontus waves will be synchronized.',
    ],

    on_unlock: [
      '✦ The lock breaks. The river braids into separate streams again.',
      '✦ Unlocked. Oceanus does not resist the branching — the river knows many shapes.',
    ],

    // ── UTILITY ───────────────────────────────────────────

    byFlow(flowRate, confluence, activeCount, isLocked) {
      if (confluence)  return pick(this.confluence);
      if (isLocked)    return pick(this.on_lock);
      if (flowRate > 0.8) return pick(this.torrent);
      if (flowRate > 0.5) return pick(this.surging);
      if (flowRate > 0.2) return pick(this.flowing);
      if (flowRate > 0)   return pick(this.trickle);
      return pick(this.dormant);
    },

    onEvent(event) {
      const map = {
        lock:      this.on_lock,
        unlock:    this.on_unlock,
        surge:     this.on_surge,
        ebb:       this.on_ebb,
        confluence: this.confluence,
      };
      return pick(map[event] || this.dormant);
    },
  },

  // ─── SCHEMA ───────────────────────────────────────────────

  schema: {
    table: 'titan_states',
    columns: [
      { name: 'oceanus_flow_rate',    type: 'float',   note: 'Aggregate flow rate 0–1 at save time' },
      { name: 'oceanus_active_count', type: 'integer', note: 'Number of Titans gated active' },
      { name: 'oceanus_total_titans', type: 'integer', note: 'Total Titans Oceanus knows' },
      { name: 'oceanus_confluence',   type: 'boolean', note: 'Whether confluence was detected' },
      { name: 'oceanus_band',         type: 'text',    note: 'Dominant river band at save time' },
    ],
    sql: `
ALTER TABLE titan_states
  ADD COLUMN IF NOT EXISTS oceanus_flow_rate    float,
  ADD COLUMN IF NOT EXISTS oceanus_active_count integer,
  ADD COLUMN IF NOT EXISTS oceanus_total_titans integer,
  ADD COLUMN IF NOT EXISTS oceanus_confluence   boolean,
  ADD COLUMN IF NOT EXISTS oceanus_band         text;
    `.trim(),
  },

};

// ─── INTERNAL HELPERS ─────────────────────────────────────

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function inferDominantBand(currents) {
  const bands = {};
  for (const c of Object.values(currents)) {
    if (!c.active) continue;
    bands[c.band] = (bands[c.band] || 0) + 1;
  }
  let maxCount = 0;
  let maxBand = 'dormant';
  for (const [band, count] of Object.entries(bands)) {
    if (count > maxCount) {
      maxCount = count;
      maxBand = band;
    }
  }
  return maxBand;
}
