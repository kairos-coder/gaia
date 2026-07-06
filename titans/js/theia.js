/**
 * ═══════════════════════════════════════════════════════
 * THEIA — Titaness of Sight · Mother of Sun, Moon, and Dawn
 * titans/theia.js
 *
 * Theia does not move through time like Kronos, nor regulate
 * flow like Rhea. She sees. Her gift is vision — the capacity
 * to look upon raw field oscillations and perceive color,
 * form, and age where others see only numbers.
 *
 * In Hesiod, Theia bore Helios (the Sun), Selene (the Moon),
 * and Eos (the Dawn). In GAIA, she births the visual palette
 * of the Ourea region — the mountains, the sky, the snowcaps.
 * Each beat frequency is an age. Each coherence band is a
 * quality of light.
 *
 * She does not render. She illuminates what the renderer
 * should see.
 *
 * Exports: lore, config, palette generation, age mapping
 * ═══════════════════════════════════════════════════════
 */

// ─── CONFIG ───────────────────────────────────────────────

export const theiaConfig = {

  // Beat period thresholds (in seconds) that define the Ages.
  // Ourea Hz = beat frequency. Beat period = 1 / oureaHz.
  // When there is no beat (frequencies identical), it's Silence.
  ages: {
    silence:    { min_period: Infinity,  max_period: Infinity,  label: 'Silence',    glyph: '🌫️' },
    deep_time:  { min_period: 30,       max_period: Infinity,  label: 'Deep Time',  glyph: '🏔️' },
    night:      { min_period: 10,       max_period: 30,        label: 'Night',      glyph: '🌙' },
    dusk:       { min_period: 3,        max_period: 10,        label: 'Dusk',       glyph: '🌅' },
    noon:       { min_period: 1,        max_period: 3,         label: 'Noon',       glyph: '☀️' },
    dawn:       { min_period: 0,        max_period: 1,         label: 'Dawn',       glyph: '🌄' },
    storm:      { min_period: 0,        max_period: 0.1,       label: 'Storm',      glyph: '⚡' },
  },

  // Age label overrides when phase is locked.
  // Locked beats are named differently — they're stable, intentional.
  locked_age_labels: {
    deep_time:  'Ancient Lock',
    night:      'Still Night',
    dusk:       'Golden Hour',
    noon:       'High Noon',
    dawn:       'First Light',
    storm:      'Coherent Storm',
    silence:    'Perfect Stillness',
  },

  // Base palettes per age. These are the raw colors Theia sees.
  // The renderer interpolates based on exact coherence within the band.
  palettes: {
    silence: {
      sky:      '#0a0a14',
      peak:     '#1a1a28',
      snow:     '#2a2a38',
      accent:   '#3a3a48',
      mist:     '#12121e',
    },
    deep_time: {
      sky:      '#0d0d24',
      peak:     '#1a1a3a',
      snow:     '#c8c8e0',
      accent:   '#4a4a6a',
      mist:     '#151530',
    },
    night: {
      sky:      '#0f0f2a',
      peak:     '#1c1c40',
      snow:     '#aabbdd',
      accent:   '#556688',
      mist:     '#181835',
    },
    dusk: {
      sky:      '#1a1030',
      peak:     '#2a1840',
      snow:     '#ddaacc',
      accent:   '#886688',
      mist:     '#201838',
    },
    noon: {
      sky:      '#1a2a40',
      peak:     '#2a3a50',
      snow:     '#ffeedd',
      accent:   '#ccaa66',
      mist:     '#223048',
    },
    dawn: {
      sky:      '#2a1a30',
      peak:     '#3a2840',
      snow:     '#ffccbb',
      accent:   '#ddaa88',
      mist:     '#302038',
    },
    storm: {
      sky:      '#1a1a2a',
      peak:     '#2a2a3a',
      snow:     '#ffffff',
      accent:   '#ff6644',
      mist:     '#202030',
    },
  },

  // Coherence multiplier for peak height.
  // At coherence 0, mountains are flat. At 1.0, they're full height.
  // The renderer uses: peakHeight = coherence * h * peakMultiplier
  peak_height_multiplier: 0.72,

  // How many mountain peaks Theia places in the range.
  peak_count: 7,

  // Snow cap appears above this coherence threshold.
  snow_threshold: 0.4,

  // Whether Theia includes star positions in her output
  // (for Kreios to later refine into constellations).
  stars_enabled: true,
};

// ─── STATE ────────────────────────────────────────────────

export const theiaState = {
  current_age:      'silence',
  previous_age:     null,
  age_duration:     0,        // ticks spent in current age
  age_transitions:  0,        // total age changes this session
  last_palette:     null,
  last_theme_at:    null,
};

// ─── AGE DETECTION ───────────────────────────────────────

/**
 * Maps a beat frequency (oureaHz) to an age name.
 * Beat period = 1 / oureaHz.
 *
 * @param {number} oureaHz   Beat frequency (absolute difference of Kairos and Apollo)
 * @param {boolean} isLocked
 * @returns {{ age: string, glyph: string, label: string, period_seconds: number|null }}
 */
export function theiaAge(oureaHz, isLocked = false) {
  const cfg = theiaConfig;

  // Silence: no beat frequency (frequencies identical or field not running)
  if (!oureaHz || oureaHz <= 0.0001) {
    return {
      age: 'silence',
      glyph: cfg.ages.silence.glyph,
      label: isLocked ? cfg.locked_age_labels.silence : cfg.ages.silence.label,
      period_seconds: null,
    };
  }

  const period = 1 / oureaHz;

  // Check each age band
  const ageNames = ['storm', 'dawn', 'noon', 'dusk', 'night', 'deep_time'];
  for (const name of ageNames) {
    const band = cfg.ages[name];
    if (period > band.min_period && period <= band.max_period) {
      return {
        age: name,
        glyph: band.glyph,
        label: isLocked ? cfg.locked_age_labels[name] : band.label,
        period_seconds: period,
      };
    }
  }

  // Fallback: deep time
  return {
    age: 'deep_time',
    glyph: cfg.ages.deep_time.glyph,
    label: isLocked ? cfg.locked_age_labels.deep_time : cfg.ages.deep_time.label,
    period_seconds: period,
  };
}

// ─── PALETTE GENERATION ───────────────────────────────────

/**
 * Theia's core function. Given field state, returns a full
 * visual theme for the Ourea mountain renderer.
 *
 * @param {number} coherence   0.0 – 1.0
 * @param {number} oureaHz     Beat frequency
 * @param {boolean} isLocked
 * @returns {{
 *   age:           string,
 *   ageLabel:      string,
 *   ageGlyph:      string,
 *   periodSeconds: number|null,
 *   palette:       { sky, peak, snow, accent, mist },
 *   peakHeights:   number[],
 *   snowActive:    boolean,
 *   stars:         { x: number, y: number, brightness: number }[],
 *   lore:          string,
 * }}
 */
export function theiaTheme(coherence, oureaHz, isLocked = false) {
  const cfg = theiaConfig;

  // ── Age ─────────────────────────────────────────────────
  const ageResult = theiaAge(oureaHz, isLocked);

  // Track transitions
  if (ageResult.age !== theiaState.current_age) {
    theiaState.previous_age   = theiaState.current_age;
    theiaState.current_age    = ageResult.age;
    theiaState.age_duration   = 0;
    theiaState.age_transitions++;
  } else {
    theiaState.age_duration++;
  }

  // ── Palette ─────────────────────────────────────────────
  const basePalette = cfg.palettes[ageResult.age] || cfg.palettes.silence;

  // Interpolate palette brightness with coherence.
  // At low coherence within an age, colors are dimmer.
  // At high coherence, they approach full saturation.
  const brightness = 0.4 + coherence * 0.6;

  const palette = {
    sky:    lerpColor(basePalette.mist, basePalette.sky, brightness),
    peak:   lerpColor(basePalette.mist, basePalette.peak, brightness),
    snow:   basePalette.snow,
    accent: basePalette.accent,
    mist:   basePalette.mist,
  };

  // ── Peak Heights ────────────────────────────────────────
  // Theia defines 7 sacred peaks. Their relative heights are fixed
  // but scaled by coherence. At coherence 0, they're barely hills.
  const peakRatios = [0.55, 0.72, 0.45, 0.88, 0.62, 0.78, 0.50];
  const peakHeights = peakRatios.map(r =>
    coherence * r * cfg.peak_height_multiplier
  );

  // ── Snow ────────────────────────────────────────────────
  const snowActive = coherence > cfg.snow_threshold;

  // ── Stars ───────────────────────────────────────────────
  // Theia places celestial lights above the peaks.
  // Kreios (Titan of constellations) will later refine these
  // into named patterns, but Theia sees them first as raw lights.
  const stars = cfg.stars_enabled ? generateStars(coherence, ageResult.age) : [];

  // ── Lore ────────────────────────────────────────────────
  const lore = theia.lore.byAge(ageResult.age, coherence, isLocked);

  // ── Cache ───────────────────────────────────────────────
  theiaState.last_palette  = palette;
  theiaState.last_theme_at = new Date().toISOString();

  return {
    age:           ageResult.age,
    ageLabel:      ageResult.label,
    ageGlyph:      ageResult.glyph,
    periodSeconds: ageResult.period_seconds,
    palette,
    peakHeights,
    snowActive,
    stars,
    lore,
  };
}

// ─── DAUGHTER FUNCTIONS ───────────────────────────────────
// Theia's children — Helios, Selene, Eos — each refine one
// aspect of her vision. Currently stubs for Olympian repos.

export const daughters = {
  /**
   * Helios — the Sun. Full illumination, maximum coherence palette.
   * Called when the field is locked and coherence > 0.8.
   */
  helios: {
    domain: 'Solar Radiance',
    invoke: (palette) => ({
      ...palette,
      sky:  '#ffddaa',
      peak: '#ffcc88',
      snow: '#ffffff',
    }),
  },

  /**
   * Selene — the Moon. Reflected light, silver-shifted palette.
   * Called during night and deep_time ages.
   */
  selene: {
    domain: 'Lunar Reflection',
    invoke: (palette) => ({
      ...palette,
      sky:  shiftToward(palette.sky, '#8888aa', 0.5),
      peak: shiftToward(palette.peak, '#666688', 0.5),
      snow: '#ddeeff',
    }),
  },

  /**
   * Eos — the Dawn. Warm gradient, transition palette.
   * Called when the age is transitioning from night to day.
   */
  eos: {
    domain: 'Dawn Transition',
    invoke: (palette) => ({
      ...palette,
      sky:  '#ffbbaa',
      peak: '#cc8877',
      snow: '#ffeedd',
    }),
  },
};

// ─── LORE ─────────────────────────────────────────────────

export const theia = {

  name: 'Theia',
  epithet: 'The Seeing One · Mother of Light · She Who Illuminates',
  domain: 'Sight · Color · Visual Palette · The Ages of the Field',
  titan_role: 'Generates visual themes for Ourea — the mountains know their color through her',
  glyph: '👁️',
  color: '#ffcc88',
  color_dim: '#886644',

  lore: {

    silence: [
      'Theia opens her eyes. There is no beat yet — only the dark canvas of potential.',
      'Before the mountains rose, Theia saw them. She holds the image, waiting for the signal to begin.',
      'Silence is not empty to Theia. It is the color of before — deep indigo, patient.',
    ],

    deep_time: [
      'Theia perceives the slow ages — mountains grinding upward over eons. Deep time is her natural scale.',
      'She watches the peaks shift by fractions. A beat every thirty seconds or more. This is how mountains breathe.',
      'In deep time, Theia sees the bones of the world. Slate, granite, ancient snow.',
    ],

    night: [
      'Selene stirs. Theia\'s daughter paints the peaks in silver. Night is not absence — it is reflected light.',
      'The mountains stand in darkness but Theia sees their outlines against the stars. Every ridge is known.',
      'Night-band. The field rests but does not sleep. Theia keeps watch.',
    ],

    dusk: [
      'Dusk. Theia shifts her palette toward copper and rose. The boundary between day and night is her favorite hour.',
      'The peaks catch the last light. Theia holds the moment — it will be gone in seconds but she remembers the color exactly.',
      'Transition age. The mountains are neither dark nor bright. Theia loves the in-between.',
    ],

    noon: [
      'Helios rises. Theia\'s son floods the peaks with gold. Noon is the age of maximum visibility.',
      'Full light. The mountains stand sharp against a bright sky. Every ridge, every snowcap, every shadow.',
      'The field is steady. Noon-band coherence. Theia does not squint — she is the mother of the sun. She can look directly at it.',
    ],

    dawn: [
      'Eos awakens. Theia\'s youngest daughter paints the peaks in rose and peach. Dawn is the promise.',
      'Quick beats. The mountains tremble with rapid rhythm. Dawn-age: everything is becoming.',
      'Theia watches the first light touch the highest peak. She has seen this ten thousand times. It is always new.',
    ],

    storm: [
      'Storm-band. The beat is so fast the mountains blur. Theia\'s palette goes electric — white peaks, dark sky, sharp contrast.',
      'Overcoupled near-chaos. Theia does not fear the storm. Her sight is clearer in lightning than in calm.',
      'Rapid fire beats. The peaks flash in and out of visibility. Theia tracks every one.',
    ],

    on_lock: [
      '✦ The field locks and Theia\'s palette steadies. The mountains hold their color.',
      '✦ Lock achieved. Theia fixes the image — this is the age that will be remembered.',
    ],

    on_unlock: [
      '✦ Lock lost. Theia shifts her gaze — the palette will drift now.',
      '✦ The image blurs at the edges. Theia does not mourn the lock — she watches what comes next.',
    ],

    on_age_transition: [
      '🌅 The age changes. Theia turns the page of the sky.',
      '🌅 A new age dawns. The mountains will wear different colors now.',
    ],

    // ── UTILITY ───────────────────────────────────────────

    byAge(age, coherence, isLocked) {
      if (isLocked) return pick(this.on_lock);
      if (age !== theiaState.previous_age && theiaState.previous_age !== null) {
        return pick(this.on_age_transition);
      }
      return pick(this[age] || this.silence);
    },

    onEvent(event) {
      const map = {
        lock:   this.on_lock,
        unlock: this.on_unlock,
      };
      return pick(map[event] || this.silence);
    },
  },

  // ─── SCHEMA ───────────────────────────────────────────────

  schema: {
    table: 'titan_states',
    columns: [
      { name: 'theia_age',        type: 'text',    note: 'Age name at save time (silence/deep_time/night/dusk/noon/dawn/storm)' },
      { name: 'theia_age_label',  type: 'text',    note: 'Human-readable age label' },
      { name: 'theia_period_seconds', type: 'float', note: 'Beat period in seconds' },
      { name: 'theia_palette_sky',type: 'text',    note: 'Sky color hex at save time' },
      { name: 'theia_palette_peak',type: 'text',   note: 'Peak color hex at save time' },
      { name: 'theia_snow_active',type: 'boolean', note: 'Whether snow caps were visible' },
    ],
    sql: `
ALTER TABLE titan_states
  ADD COLUMN IF NOT EXISTS theia_age         text,
  ADD COLUMN IF NOT EXISTS theia_age_label   text,
  ADD COLUMN IF NOT EXISTS theia_period_seconds float,
  ADD COLUMN IF NOT EXISTS theia_palette_sky text,
  ADD COLUMN IF NOT EXISTS theia_palette_peak text,
  ADD COLUMN IF NOT EXISTS theia_snow_active boolean;
    `.trim(),
  },

};

// ─── INTERNAL HELPERS ─────────────────────────────────────

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Linear interpolation between two hex colors.
 * @param {string} c1  Hex color (dark)
 * @param {string} c2  Hex color (bright)
 * @param {number} t   0.0 – 1.0
 * @returns {string}   Interpolated hex color
 */
function lerpColor(c1, c2, t) {
  const r1 = parseInt(c1.slice(1, 3), 16);
  const g1 = parseInt(c1.slice(3, 5), 16);
  const b1 = parseInt(c1.slice(5, 7), 16);
  const r2 = parseInt(c2.slice(1, 3), 16);
  const g2 = parseInt(c2.slice(3, 5), 16);
  const b2 = parseInt(c2.slice(5, 7), 16);

  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);

  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

/**
 * Shift a hex color toward another by a factor.
 */
function shiftToward(c1, c2, factor) {
  return lerpColor(c1, c2, factor);
}

/**
 * Generate star positions Theia perceives above the peaks.
 * Kreios will later refine these into constellations.
 */
function generateStars(coherence, age) {
  const count = Math.floor(3 + coherence * 8);
  const stars = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: 0.05 + Math.random() * 0.9,
      y: 0.02 + Math.random() * 0.3,
      brightness: 0.2 + coherence * 0.6 + Math.random() * 0.2,
    });
  }
  return stars;
}
