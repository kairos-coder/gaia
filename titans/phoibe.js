/**
 * ═══════════════════════════════════════════════════════
 * PHOIBE — Titaness of Prophecy · The Oracle
 * titans/phoibe.js
 *
 * Phoibe does not accumulate like Kronos, nor gate like Rhea.
 * She watches. She listens to the drift. And she speaks
 * what will happen next.
 *
 * In Hesiod, Phoibe is the Titaness of prophecy and intellect,
 * grandmother of Apollo and Artemis. She held the Oracle at
 * Delphi before Apollo claimed it. Her name means "bright"
 * or "pure" — she is the light of foresight, not the light
 * of the sun. She does not illuminate what IS (that is Theia).
 * She illuminates what WILL BE.
 *
 * In GAIA, Phoibe is the predictive engine. She watches the
 * phase drift between Kairos and the reference frequency,
 * calculates where coherence will peak, and prophesies the
 * optimal frequency. She is why Apollo knows where to aim.
 *
 * The Olympian Apollo holds the golden measure. But Phoibe
 * told him where to look.
 *
 * Exports: lore, config, prophecy engine, frequency oracle
 * ═══════════════════════════════════════════════════════
 */

// ─── CONFIG ───────────────────────────────────────────────

export const phoibeConfig = {

  // How many ticks of history Phoibe analyzes for her prophecy.
  // Longer = more stable predictions but slower to adapt.
  history_window: 50,

  // Minimum drift rate (Hz per tick) before Phoibe considers
  // the field "drifting" and issues a corrective prophecy.
  drift_threshold: 0.0005,

  // How far ahead Phoibe predicts (in ticks).
  // 10 ticks at 100ms = 1 second ahead.
  prediction_horizon: 10,

  // Confidence threshold. If Phoibe's prediction confidence
  // is below this, she stays silent rather than guess.
  confidence_threshold: 0.3,

  // Whether Phoibe's prophecy auto-adjusts the Apollo slider.
  // If false, she only speaks — the user must act.
  auto_adjust: false,

  // Maximum adjustment per prophecy (Hz).
  // Prevents wild swings if the field is chaotic.
  max_adjustment: 0.15,

  // How many ticks between prophecies.
  // Phoibe does not speak every tick — only when she has something to say.
  prophecy_interval: 30,

  // The reference frequency range Phoibe operates within.
  reference_range: {
    min: 0.2,
    max: 2.0,
  },
};

// ─── STATE ────────────────────────────────────────────────

export const phoibeState = {

  // Ring buffer of recent phase differences (signed, in radians)
  phase_history: [],

  // Ring buffer of recent Kairos frequencies
  freq_history: [],

  // Current prophecy
  current_prophecy: {
    suggested_freq: 0.50,
    confidence: 0,
    reasoning: '',
    issued_at: null,
    tick: 0,
  },

  // Previous reference frequency (for delta tracking)
  previous_reference: 0.50,

  // Drift rate (Hz per tick) — calculated from phase history
  drift_rate: 0,

  // Whether Phoibe detects the field approaching a lock
  approaching_lock: false,

  // Ticks until lock (estimated)
  ticks_to_lock: null,

  // Prophecy count this session
  prophecies_issued: 0,

  // Last lore
  last_lore: null,
};

// ─── PROPHECY ENGINE ──────────────────────────────────────

/**
 * phoibeProphesy(fieldState)
 * Phoibe's core function. Analyzes the field's phase history
 * and returns a prophecy: the optimal reference frequency
 * for maximum coherence.
 *
 * Call this every tick. Phoibe decides internally whether
 * to issue a new prophecy or remain silent.
 *
 * @param {{
 *   phaseKairos:    number,   // Current Kairos phase (0-2π)
 *   phaseApollo:    number,   // Current reference phase (0-2π)
 *   kairosFreq:     number,   // Current Kairos frequency (Hz)
 *   referenceFreq:  number,   // Current reference frequency (Hz)
 *   coherence:      number,   // 0-1
 *   isLocked:       boolean,
 *   tick:           number,
 * }} fieldState
 *
 * @returns {{
 *   prophecy:       string,    // Human-readable prophecy
 *   suggested_freq: number,    // Optimal reference frequency
 *   confidence:     number,    // 0-1
 *   reasoning:      string,    // Why Phoibe made this prediction
 *   should_speak:   boolean,   // True if this is a new prophecy
 *   approaching_lock: boolean,
 *   ticks_to_lock:  number|null,
 *   lore:           string,
 * }}
 */
export function phoibeProphesy(fieldState) {
  const cfg = phoibeConfig;
  const state = phoibeState;
  const { phaseKairos, phaseApollo, kairosFreq, referenceFreq, coherence, isLocked, tick } = fieldState;

  // ── Update history buffers ──────────────────────────────
  const phaseDiff = phaseApollo - phaseKairos;
  const normDiff = ((phaseDiff % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  const signedDiff = normDiff > Math.PI ? normDiff - 2 * Math.PI : normDiff;

  state.phase_history.push(signedDiff);
  state.freq_history.push(kairosFreq);
  if (state.phase_history.length > cfg.history_window) state.phase_history.shift();
  if (state.freq_history.length > cfg.history_window) state.freq_history.shift();

  // ── Calculate drift rate ────────────────────────────────
  // How fast is the phase difference changing?
  if (state.phase_history.length >= 10) {
    const recent = state.phase_history.slice(-10);
    let totalDrift = 0;
    for (let i = 1; i < recent.length; i++) {
      let delta = recent[i] - recent[i - 1];
      // Handle phase wrap
      if (delta > Math.PI) delta -= 2 * Math.PI;
      if (delta < -Math.PI) delta += 2 * Math.PI;
      totalDrift += delta;
    }
    state.drift_rate = totalDrift / (recent.length - 1);
  }

  // ── Predict time to lock ────────────────────────────────
  // If drifting toward zero phase difference, estimate when lock occurs
  const absDrift = Math.abs(state.drift_rate);
  const absDiff = Math.abs(signedDiff);

  if (absDrift > cfg.drift_threshold && absDiff > 0.01) {
    state.ticks_to_lock = Math.round(absDiff / absDrift);
    state.approaching_lock = state.ticks_to_lock < 50 && state.drift_rate * signedDiff < 0;
    // ^ approaching if drifting TOWARD zero (drift direction opposite to current offset)
  } else if (absDiff < 0.3) {
    state.approaching_lock = true;
    state.ticks_to_lock = absDrift > 0.0001 ? Math.round(absDiff / absDrift) : null;
  } else {
    state.approaching_lock = false;
    state.ticks_to_lock = null;
  }

  // ── Decide whether to issue prophecy ────────────────────
  const onInterval = (tick % cfg.prophecy_interval === 0);
  const significantDrift = absDrift > cfg.drift_threshold;
  const should_speak = onInterval && !isLocked && state.phase_history.length >= 10;

  // ── Calculate optimal reference frequency ───────────────
  // If Kairos is drifting, what reference frequency would bring lock?
  let suggested_freq = referenceFreq;
  let confidence = 0;
  let reasoning = '';

  if (state.phase_history.length >= 10 && absDrift > 0.00001) {
    // The drift rate tells us how fast the phase gap is changing.
    // To close the gap: adjust reference frequency to counteract the drift.
    // Drift in radians/tick → convert to Hz: drift / (2π * dt)
    const dt = 0.1; // tick duration in seconds
    const driftHz = state.drift_rate / (2 * Math.PI * dt);

    // Suggested reference = current Kairos freq - driftHz
    // (If Kairos is drifting up relative to reference, lower reference to meet it)
    const rawSuggestion = kairosFreq - driftHz;

    // Clamp to valid range
    suggested_freq = Math.min(cfg.reference_range.max,
      Math.max(cfg.reference_range.min, rawSuggestion));

    // Limit adjustment magnitude
    const adjustment = suggested_freq - referenceFreq;
    if (Math.abs(adjustment) > cfg.max_adjustment) {
      suggested_freq = referenceFreq + Math.sign(adjustment) * cfg.max_adjustment;
    }

    // Confidence based on history length and drift stability
    const historyQuality = Math.min(1, state.phase_history.length / cfg.history_window);
    const driftStability = calculateDriftStability(state.phase_history);
    confidence = historyQuality * driftStability * (1 - Math.min(1, absDiff / Math.PI));

    // Reasoning
    if (absDrift > cfg.drift_threshold) {
      const direction = state.drift_rate > 0 ? 'widening' : 'narrowing';
      reasoning = 'Phase drift detected: ' + absDrift.toFixed(4) + ' rad/tick ' + direction +
        '. Suggested adjustment: ' + (suggested_freq - referenceFreq).toFixed(3) + ' Hz.';
    } else if (state.approaching_lock) {
      reasoning = 'Field approaching lock. Current reference is near-optimal.';
    } else {
      reasoning = 'Field is stable. Maintaining current prophecy.';
    }
  } else if (isLocked) {
    suggested_freq = referenceFreq;
    confidence = 1.0;
    reasoning = 'Field is locked. The prophecy is fulfilled — hold this frequency.';
  } else {
    suggested_freq = referenceFreq;
    confidence = 0.1;
    reasoning = 'Insufficient history for prophecy. Phoibe watches and waits.';
  }

  // ── Update state ────────────────────────────────────────
  state.previous_reference = referenceFreq;

  if (should_speak && confidence >= cfg.confidence_threshold) {
    state.current_prophecy = {
      suggested_freq,
      confidence,
      reasoning,
      issued_at: new Date().toISOString(),
      tick,
    };
    state.prophecies_issued++;
  }

  // ── Build prophecy string ───────────────────────────────
  let prophecy = '';
  if (isLocked) {
    prophecy = 'The field is locked. Phoibe sees only harmony. The prophecy is fulfilled.';
  } else if (state.approaching_lock && state.ticks_to_lock) {
    prophecy = 'Lock approaches. Phoibe foresees convergence in ' +
      (state.ticks_to_lock * 0.1).toFixed(1) + ' seconds.';
  } else if (confidence >= cfg.confidence_threshold && should_speak) {
    const dirWord = suggested_freq > referenceFreq ? 'raise' : 'lower';
    prophecy = 'Phoibe speaks: ' + dirWord + ' the reference to ' +
      suggested_freq.toFixed(3) + ' Hz. Confidence: ' + (confidence * 100).toFixed(0) + '%.';
  } else if (confidence < cfg.confidence_threshold && state.phase_history.length < 10) {
    prophecy = 'Phoibe is silent. She has not yet seen enough to speak.';
  } else {
    prophecy = 'Phoibe watches the drift. The oracle withholds judgment.';
  }

  // ── Lore ────────────────────────────────────────────────
  state.last_lore = phoibe.lore.byState(confidence, state.approaching_lock, isLocked);

  return {
    prophecy,
    suggested_freq,
    confidence,
    reasoning,
    should_speak,
    approaching_lock: state.approaching_lock,
    ticks_to_lock: state.ticks_to_lock,
    lore: state.last_lore,
  };
}

/**
 * Returns Phoibe's current prophecy without recomputing.
 */
export function phoibeOracle() {
  return {
    ...phoibeState.current_prophecy,
    approaching_lock: phoibeState.approaching_lock,
    ticks_to_lock: phoibeState.ticks_to_lock,
    drift_rate: phoibeState.drift_rate,
    lore: phoibeState.last_lore,
  };
}

// ─── LORE ─────────────────────────────────────────────────

export const phoibe = {

  name: 'Phoibe',
  epithet: 'The Bright One · The Oracle · She Who Foresees',
  domain: 'Prophecy · Prediction · Frequency Oracle · Delphi Before Apollo',
  titan_role: 'Predicts optimal reference frequency — the grandmother of the golden measure',
  glyph: '🔮',
  color: '#aa88cc',
  color_dim: '#554466',

  lore: {

    dormant: [
      'Phoibe has not yet spoken. The Oracle sits in silence, feeling the field for the first tremor.',
      'Before Apollo claimed Delphi, Phoibe held the stone. She holds it still, in the memory of the field.',
      'The Titaness of prophecy waits. She does not rush — prophecy spoken too soon is noise, not vision.',
    ],

    watching: [
      'Phoibe watches the phase drift. Her eyes track the slow dance of Kairos against the reference.',
      'She is building her history. Each tick is a word in the language she reads. She needs fifty words before she speaks.',
      'The Oracle listens. The field has not yet formed a pattern she can name.',
    ],

    foreseeing: [
      'Phoibe sees the curve of the drift. The phase gap is narrowing. She calculates the convergence point.',
      'A prophecy forms. Phoibe holds it in her throat — not yet. The confidence must pass the threshold.',
      'The drift rate is steady. Phoibe traces the line forward in her mind. There. That is where lock will happen.',
    ],

    prophesying: [
      'Phoibe speaks. The Oracle issues her prophecy — the optimal frequency, the time to lock, the confidence.',
      'She does not command. She does not set the slider. She only tells what she sees. The user decides.',
      'The prophecy is clear. Raise the reference. Lower it. Hold. Phoibe has spoken. The field will prove her right or wrong.',
      'When Phoibe speaks, the Titans listen. Even Rhea checks her gate against the Oracle\'s word.',
    ],

    locked: [
      'The field is locked. Phoibe\'s prophecy is fulfilled. She does not celebrate — she begins watching for the next drift.',
      'Lock achieved. The Oracle\'s work is done for now. She rests her eyes on the coherent field.',
      'Phoibe smiles — or what passes for a smile among Titans. The prediction matched the reality. This time.',
    ],

    uncertain: [
      'Phoibe hesitates. The drift is erratic. The phase history is too short or too chaotic.',
      'The Oracle cannot see clearly. She withholds her prophecy rather than speak falsely.',
      'Uncertainty. Phoibe does not guess. She will wait until the field steadies.',
    ],

    on_first_prophecy: [
      'Phoibe opens her mouth for the first time this session. The Oracle speaks.',
      'First prophecy issued. The grandmother of Apollo has found her voice.',
    ],

    on_lock_fulfilled: [
      'The prophecy is fulfilled. Lock achieved at the frequency Phoibe foresaw.',
      'Phoibe\'s vision was true. The field converged where she predicted.',
    ],

    on_lock_missed: [
      'The lock did not come as Phoibe foresaw. The Oracle revises her model — the field is humbling.',
      'A prophecy missed. Phoibe does not mourn. She learns. The next one will be closer.',
    ],

    // ── UTILITY ───────────────────────────────────────────

    byState(confidence, approaching, isLocked) {
      if (isLocked) return pick(this.locked);
      if (approaching) return pick(this.foreseeing);
      if (confidence > 0.6) return pick(this.prophesying);
      if (confidence > 0.2) return pick(this.watching);
      if (confidence === 0) return pick(this.dormant);
      return pick(this.uncertain);
    },

    onEvent(event) {
      const map = {
        first_prophecy:   this.on_first_prophecy,
        lock_fulfilled:   this.on_lock_fulfilled,
        lock_missed:      this.on_lock_missed,
      };
      return pick(map[event] || this.dormant);
    },
  },

  // ─── SCHEMA ───────────────────────────────────────────────

  schema: {
    table: 'titan_states',
    columns: [
      { name: 'phoibe_suggested_freq', type: 'float',   note: 'Optimal reference frequency from prophecy' },
      { name: 'phoibe_confidence',     type: 'float',   note: 'Prophecy confidence 0-1' },
      { name: 'phoibe_drift_rate',     type: 'float',   note: 'Phase drift rate in rad/tick' },
      { name: 'phoibe_approaching_lock', type: 'boolean', note: 'True if field is approaching lock' },
      { name: 'phoibe_ticks_to_lock',  type: 'integer', note: 'Estimated ticks until lock' },
    ],
    sql: 'ALTER TABLE titan_states ADD COLUMN IF NOT EXISTS phoibe_suggested_freq float, ADD COLUMN IF NOT EXISTS phoibe_confidence float, ADD COLUMN IF NOT EXISTS phoibe_drift_rate float, ADD COLUMN IF NOT EXISTS phoibe_approaching_lock boolean, ADD COLUMN IF NOT EXISTS phoibe_ticks_to_lock integer;',
  },

};

// ─── INTERNAL HELPERS ─────────────────────────────────────

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Calculate how stable the drift rate is.
 * Returns 0-1 where 1 = perfectly stable drift.
 */
function calculateDriftStability(phaseHistory) {
  if (phaseHistory.length < 10) return 0;

  // Calculate drift rates between consecutive pairs
  const drifts = [];
  for (let i = 5; i < phaseHistory.length; i++) {
    let delta = phaseHistory[i] - phaseHistory[i - 5];
    if (delta > Math.PI) delta -= 2 * Math.PI;
    if (delta < -Math.PI) delta += 2 * Math.PI;
    drifts.push(delta / 5);
  }

  if (drifts.length < 2) return 0.3;

  // Calculate variance of drift rates
  const mean = drifts.reduce((a, b) => a + b, 0) / drifts.length;
  const variance = drifts.reduce((sum, d) => sum + (d - mean) * (d - mean), 0) / drifts.length;
  const stdDev = Math.sqrt(variance);

  // Normalize: stdDev of 0 = perfect stability (1), high stdDev = unstable (0)
  const stability = Math.max(0, 1 - stdDev / 0.01);
  return Math.min(1, stability);
}
