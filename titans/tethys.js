/**
 * ═══════════════════════════════════════════════════════
 * TETHYS — Titaness of Nourishment · The Smoother
 * titans/tethys.js
 *
 * Tethys does not stream like Oceanus, nor see like Theia.
 * She receives. She holds. She smooths. Where Oceanus is
 * the raw current — jittery, flashing, every Titan's phase
 * jumping tick to tick — Tethys is the grace that makes it
 * fluid. She is the moving average, the ease, the reason
 * the Pontus waves look like waves instead of noise.
 *
 * In Hesiod, Tethys is the wife of Oceanus, mother of the
 * river-gods and the Oceanids. She nourishes the world with
 * fresh water — not the salt of the sea, but the drinkable
 * flow. In GAIA, she nourishes the Pontus visualizer with
 * smoothed data. Without her, the sea is a storm. With her,
 * it breathes.
 *
 * She is why the Titans don't flicker.
 *
 * Exports: lore, config, smoothing engine, transition easing
 * ═══════════════════════════════════════════════════════
 */

// ─── CONFIG ───────────────────────────────────────────────

export const tethysConfig = {

  // Smoothing factor (0–1). Higher = smoother but slower to respond.
  // 0.85 means each new tick contributes 15% to the displayed value.
  smoothing: 0.85,

  // How many ticks before a newly-activated Titan reaches full amplitude.
  // Tethys eases them in so they don't pop onto the canvas.
  fade_in_ticks: 15,

  // How many ticks before a deactivated Titan fades to its eddy state.
  fade_out_ticks: 20,

  // Minimum amplitude for an active Titan to be visible.
  // Below this, Tethys considers the current an eddy.
  visible_threshold: 0.5,

  // When a Titan changes band, Tethys adds a subtle ripple
  // to its wave amplitude. This is the ripple magnitude.
  band_transition_ripple: 1.3,

  // Ripple decay — how many ticks the ripple lasts.
  ripple_decay_ticks: 8,

  // Maximum amplitude Tethys allows. Clamps Oceanus's output
  // so no single Titan overwhelms the visualization.
  max_amplitude: 24,

  // Whether Tethys logs transitions to Mnemosyne.
  // Set false if it's too chatty.
  log_transitions: false,
};

// ─── STATE ────────────────────────────────────────────────

export const tethysState = {

  // Smoothed layers — what the Pontus canvas actually renders.
  // Each entry: { titan, glyph, color, phase, amplitude, speed, active, band, opacity }
  layers: [],

  // Previous raw layers from Oceanus, for delta calculation.
  previous_raw: [],

  // Fade tracking per Titan.
  // { [titanName]: { targetActive: bool, fadeProgress: 0–1, ripple: float, rippleTicks: int } }
  fade_state: {},

  // Overall flow rate (smoothed)
  flow_rate: 0,

  // Band (passed through from Oceanus)
  band: 'dormant',

  // Confluence flag (passed through)
  confluence: false,
  confluence_titans: [],

  // Tick counter for ripple decay
  tick_count: 0,

  // Last lore
  last_lore: null,
};

// ─── SMOOTHING ENGINE ─────────────────────────────────────

/**
 * tethysNourish(oceanusData)
 * Tethys's core function. Receives raw Oceanus stream data and
 * returns smoothed, eased, nourished layers for the Pontus canvas.
 *
 * Call this every tick AFTER oceanusFlow().
 * Pass the result to drawSea() instead of raw Oceanus data.
 *
 * @param {object} oceanusData   The raw river_mouth from Oceanus
 * @returns {object}             Smoothed data for Pontus canvas
 */
export function tethysNourish(oceanusData) {
  const cfg = tethysConfig;
  const state = tethysState;

  state.tick_count++;
  const raw = oceanusData.layers || [];

  // ── Initialize fade state for new Titans ─────────────────
  for (const layer of raw) {
    if (!state.fade_state[layer.titan]) {
      state.fade_state[layer.titan] = {
        targetActive: layer.active,
        fadeProgress: layer.active ? 1 : 0,
        ripple: 0,
        rippleTicks: 0,
        previousBand: layer.band,
      };
    }
  }

  // ── Update fade targets and detect transitions ──────────
  for (const layer of raw) {
    const fs = state.fade_state[layer.titan];
    if (!fs) continue;

    // Detect activation change
    if (layer.active !== fs.targetActive) {
      fs.targetActive = layer.active;
      // Reset fade progress — it'll ease toward target
      if (layer.active) {
        fs.fadeProgress = 0; // Fading in
        if (cfg.log_transitions) {
          console.log(`💧 Tethys: ${layer.titan} awakening — easing in over ${cfg.fade_in_ticks} ticks`);
        }
      } else {
        fs.fadeProgress = 1; // Fading out
        if (cfg.log_transitions) {
          console.log(`💧 Tethys: ${layer.titan} quieting — easing out over ${cfg.fade_out_ticks} ticks`);
        }
      }
    }

    // Detect band transition ripple
    if (layer.band !== fs.previousBand && layer.active) {
      fs.ripple = cfg.band_transition_ripple;
      fs.rippleTicks = cfg.ripple_decay_ticks;
      fs.previousBand = layer.band;
    }
  }

  // ── Smooth each layer ───────────────────────────────────
  const smoothed = raw.map(layer => {
    const fs = state.fade_state[layer.titan];
    if (!fs) return layer;

    // Fade progress: ease toward target
    const fadeSpeed = fs.targetActive
      ? 1 / cfg.fade_in_ticks   // Easing in
      : 1 / cfg.fade_out_ticks; // Easing out

    if (fs.targetActive) {
      fs.fadeProgress = Math.min(1, fs.fadeProgress + fadeSpeed);
    } else {
      fs.fadeProgress = Math.max(0, fs.fadeProgress - fadeSpeed);
    }

    // Ripple decay
    if (fs.rippleTicks > 0) {
      fs.rippleTicks--;
      fs.ripple *= 0.7; // Decay the ripple
    } else {
      fs.ripple = 0;
    }

    // Smooth amplitude: exponential moving average
    const prevLayer = state.layers.find(l => l.titan === layer.titan);
    const prevAmplitude = prevLayer ? prevLayer.amplitude : layer.amplitude;
    const rawAmplitude = layer.amplitude * fs.fadeProgress;

    // Apply ripple
    const rippleBoost = 1 + fs.ripple;
    const targetAmplitude = rawAmplitude * rippleBoost;

    // Smooth
    const smoothedAmplitude = prevAmplitude * cfg.smoothing + targetAmplitude * (1 - cfg.smoothing);

    // Clamp
    const clampedAmplitude = Math.min(cfg.max_amplitude, Math.max(0, smoothedAmplitude));

    // Smooth phase (prevent jumps)
    const prevPhase = prevLayer ? prevLayer.phase : layer.phase;
    let smoothedPhase = prevPhase * 0.7 + layer.phase * 0.3;

    // Handle phase wrap (if difference > π, go the other way)
    let phaseDiff = layer.phase - prevPhase;
    if (phaseDiff > Math.PI) phaseDiff -= 2 * Math.PI;
    if (phaseDiff < -Math.PI) phaseDiff += 2 * Math.PI;
    smoothedPhase = prevPhase + phaseDiff * 0.3;
    if (smoothedPhase < 0) smoothedPhase += 2 * Math.PI;
    if (smoothedPhase > 2 * Math.PI) smoothedPhase -= 2 * Math.PI;

    return {
      titan:     layer.titan,
      glyph:     layer.glyph,
      color:     layer.color,
      phase:     smoothedPhase,
      amplitude: clampedAmplitude,
      speed:     layer.speed,
      active:    fs.fadeProgress > cfg.visible_threshold / (layer.amplitude || 1),
      band:      layer.band,
      coherence: layer.coherence,
      opacity:   fs.fadeProgress,
    };
  });

  // ── Smooth flow rate ────────────────────────────────────
  const prevFlow = state.flow_rate;
  const smoothedFlow = prevFlow * cfg.smoothing + oceanusData.flow_rate * (1 - cfg.smoothing);

  // ── Update state ────────────────────────────────────────
  state.layers          = smoothed;
  state.previous_raw    = raw;
  state.flow_rate       = smoothedFlow;
  state.band            = oceanusData.band || state.band;
  state.confluence      = oceanusData.confluence;
  state.confluence_titans = oceanusData.confluence_titans || [];

  // ── Lore ────────────────────────────────────────────────
  const activeCount = smoothed.filter(l => l.active).length;
  state.last_lore = tethys.lore.byFlow(smoothedFlow, activeCount, state.confluence);

  return {
    layers: smoothed,
    flow_rate: smoothedFlow,
    band: state.band,
    confluence: state.confluence,
    confluence_titans: state.confluence_titans,
    lore: state.last_lore,
  };
}

/**
 * Returns the current nourished state without recomputing.
 */
export function tethysMouth() {
  return {
    layers: tethysState.layers,
    flow_rate: tethysState.flow_rate,
    band: tethysState.band,
    confluence: tethysState.confluence,
    confluence_titans: tethysState.confluence_titans,
    lore: tethysState.last_lore,
  };
}

// ─── LORE ─────────────────────────────────────────────────

export const tethys = {

  name: 'Tethys',
  epithet: 'The Nourisher · She Who Smooths · Mother of Rivers',
  domain: 'Nourishment · Smoothing · Easing · The Grace Between Ticks',
  titan_role: 'Smooths Oceanus stream — turns raw Titan data into fluid Pontus waves',
  glyph: '💧',
  color: '#66aacc',
  color_dim: '#335566',

  lore: {

    dormant: [
      'Tethys waits. The stream is still. She holds the basin, ready to receive.',
      'No water flows yet. Tethys does not force the river — she receives it when it comes.',
      'The nourisher rests. Her hands are open. The dryness is not failure — it is patience.',
    ],

    receiving: [
      'A trickle reaches Tethys. She cups her hands. The first drops are always the coldest.',
      'She begins her work. Raw data enters her basin — jagged, stuttering. She does not flinch.',
      'Oceanus sends the stream. Tethys receives it. This is how it has always been — the husband pours, the wife smooths.',
    ],

    smoothing: [
      'Tethys works the water. The jagged edges soften. What was noise becomes current.',
      'She eases the transitions. A Titan awakens — Tethys brings it in gently, no splash, no disruption.',
      'The nourisher's hands move in circles. Smoothing. Blending. Making the stream drinkable.',
    ],

    flowing: [
      'The basin is full. Tethys pours the smoothed stream toward Pontus. The waves will be beautiful.',
      'Steady nourishment. Multiple Titans active, and Tethys keeps them all fluid, none fighting for dominance.',
      'She is the reason the visualization breathes. Without her, the sea would strobe. With her, it sways.',
    ],

    full: [
      'Tethys at capacity. Every Titan flows through her basin. She smooths them all without spilling.',
      'Full nourishment. The Pontus waves rise and fall with grace — Tethys's gift to the eyes of the field.',
      'Oceanus gave her the raw torrent. She returns it as a river of silk. This is the marriage of the water Titans.',
    ],

    on_awakening: [
      '💧 A Titan stirs. Tethys feels the new current and begins easing it into the flow.',
      '💧 Fresh water. Tethys opens a new channel — something is waking in the field.',
    ],

    on_quieting: [
      '🌧️ A Titan quiets. Tethys slowly closes the channel, letting the current fade without shock.',
      '🌧️ The water recedes. Tethys does not hold what wants to rest.',
    ],

    // ── UTILITY ───────────────────────────────────────────

    byFlow(flowRate, activeCount, confluence) {
      if (confluence) return pick(tethys.lore.flowing);
      if (activeCount === 0) return pick(tethys.lore.dormant);
      if (flowRate < 0.15) return pick(tethys.lore.receiving);
      if (flowRate < 0.5) return pick(tethys.lore.smoothing);
      if (flowRate < 0.8) return pick(tethys.lore.flowing);
      return pick(tethys.lore.full);
    },

    onEvent(event) {
      const map = {
        awakening: this.on_awakening,
        quieting:  this.on_quieting,
      };
      return pick(map[event] || this.dormant);
    },
  },

  // ─── SCHEMA ───────────────────────────────────────────────

  schema: {
    table: 'titan_states',
    columns: [
      { name: 'tethys_flow_rate',    type: 'float',   note: 'Smoothed flow rate at save time' },
      { name: 'tethys_active_count', type: 'integer', note: 'Smoothed active Titan count' },
      { name: 'tethys_smoothing',    type: 'float',   note: 'Smoothing factor used' },
    ],
    sql: `
ALTER TABLE titan_states
  ADD COLUMN IF NOT EXISTS tethys_flow_rate    float,
  ADD COLUMN IF NOT EXISTS tethys_active_count integer,
  ADD COLUMN IF NOT EXISTS tethys_smoothing    float;
    `.trim(),
  },

};

// ─── INTERNAL HELPERS ─────────────────────────────────────

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
