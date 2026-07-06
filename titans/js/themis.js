/**
 * ═══════════════════════════════════════════════════════
 * THEMIS — Titaness of Law · The Boundary Keeper
 * titans/themis.js
 *
 * Themis does not move through time like Rhea, nor amplify
 * signal like Hyperion. She stands at the boundary between
 * GaiaDB and OlympusDB and weighs what is brought before her.
 *
 * In Greek myth, Themis is divine law — not the law of kings
 * but the law of rightness. She is the one who convened the
 * gods, who knew what was permitted and what was not. Zeus
 * consulted her before acting. She is older than Olympus.
 *
 * In the GAIA pipeline, Themis is the schema contract and
 * the ascension gate. A field state that passes Rhea's rhythm
 * and Hyperion's signal still must pass Themis's law before
 * it earns a row in OlympusDB. She also defines what that
 * row looks like — she carries the schema for both databases.
 *
 * She does not rage. She does not flow. She weighs.
 *
 * Exports: lore, config, validation, ascension routing
 * ═══════════════════════════════════════════════════════
 */

// ─── CONFIG ───────────────────────────────────────────────
export const themisConfig = {

  // Minimum coherence to even present a state to Themis.
  // Below this she will not weigh — the state is not ready.
  coherence_minimum: 0.45,

  // Minimum consecutive Rhea cycles at flow-band or above
  // before Themis considers the state stable enough to weigh.
  stability_cycles_required: 3,

  // If the field has been locked for fewer ticks than this,
  // Themis considers the lock provisional — not yet law.
  lock_ticks_required: 8,

  // Required fields that must be present and non-null
  // for a GaiaDB row to be considered for ascension.
  required_fields: [
    'titan',
    'phase_kairos',
    'phase_apollo',
    'coherence',
    'freq_kairos',
    'freq_apollo',
    'coupling_k',
    'is_locked',
    'timestamp',
  ],

  // Value ranges Themis enforces — anything outside is rejected.
  range_law: {
    coherence:    { min: 0.0,  max: 1.0  },
    freq_kairos:  { min: 0.1,  max: 2.5  },
    freq_apollo:  { min: 0.1,  max: 2.5  },
    coupling_k:   { min: 0.0,  max: 3.0  },
    phase_kairos: { min: 0.0,  max: 6.29 }, // 0 – 2π
    phase_apollo: { min: 0.0,  max: 6.29 },
  },

  // Archetypes Themis recognises as valid for ascension.
  // States with unrecognised archetypes are held in GaiaDB.
  valid_archetypes: [
    '🏔️ Mountain — Ourea (slow ages)',
    '🌊 Ocean — Pontus (flowing)',
    '⚡ Storm — Kairos (chaotic tension)',
    '☀️ Harmony — Apollo (perfect lock)',
    '🌄 Dawn',
    '☀️ Helios',
    '🌕 Selene',
  ],

  // Whether Themis actively routes to OlympusDB
  // or only validates and flags (dry-run mode).
  ascension_enabled: true,
};

// ─── VALIDATION ENGINE ────────────────────────────────────

/**
 * The verdict Themis returns after weighing a state.
 * @typedef {{
 *   verdict:    'ascend' | 'hold' | 'reject',
 *   reasons:   string[],
 *   violations: string[],
 *   olympus_row: object | null,
 *   lore:       string,
 * }} ThemisVerdict
 */

/**
 * themisWeigh(gaiaRow, pipelineContext)
 * The central Themis function. Receives a raw GaiaDB row
 * and the current pipeline context, returns a verdict.
 *
 * Verdicts:
 *   'ascend' — row is clean, write to OlympusDB
 *   'hold'   — row is valid but conditions not yet met
 *              (stability, lock duration, coherence floor)
 *   'reject' — row violates schema or range law, stays in GaiaDB
 *
 * @param {object} gaiaRow         Raw titan_states row from GaiaDB
 * @param {{
 *   rheaBand:          string,
 *   rheaGate:          string,
 *   stabilityCount:    number,   Consecutive flow-band cycles
 *   lockTickCount:     number,   Ticks since last phase lock
 *   hyperionGain:      number,
 *   hyperionArchetype: string,
 * }} pipelineContext
 *
 * @returns {ThemisVerdict}
 */
export function themisWeigh(gaiaRow, pipelineContext) {
  const cfg = themisConfig;
  const reasons    = [];
  const violations = [];

  // ── Step 1: Required fields ─────────────────────────────
  for (const field of cfg.required_fields) {
    if (gaiaRow[field] === undefined || gaiaRow[field] === null) {
      violations.push(`Missing required field: ${field}`);
    }
  }

  // ── Step 2: Range law ───────────────────────────────────
  for (const [field, { min, max }] of Object.entries(cfg.range_law)) {
    if (gaiaRow[field] !== undefined && gaiaRow[field] !== null) {
      if (gaiaRow[field] < min || gaiaRow[field] > max) {
        violations.push(`${field} = ${gaiaRow[field]} violates range [${min}, ${max}]`);
      }
    }
  }

  // Hard reject on any violation
  if (violations.length > 0) {
    return {
      verdict:     'reject',
      reasons:     [`${violations.length} law violation(s) found`],
      violations,
      olympus_row: null,
      lore:        pick(themis.lore.reject),
    };
  }

  // ── Step 3: Coherence floor ─────────────────────────────
  if (gaiaRow.coherence < cfg.coherence_minimum) {
    reasons.push(`Coherence ${gaiaRow.coherence.toFixed(3)} below minimum ${cfg.coherence_minimum}`);
    return _hold(reasons, 'coherence_floor');
  }

  // ── Step 4: Stability requirement ──────────────────────
  if (pipelineContext.stabilityCount < cfg.stability_cycles_required) {
    reasons.push(`Only ${pipelineContext.stabilityCount} stable cycles — ${cfg.stability_cycles_required} required`);
    return _hold(reasons, 'insufficient_stability');
  }

  // ── Step 5: Lock duration ───────────────────────────────
  if (gaiaRow.is_locked && pipelineContext.lockTickCount < cfg.lock_ticks_required) {
    reasons.push(`Lock held for ${pipelineContext.lockTickCount} ticks — ${cfg.lock_ticks_required} required`);
    return _hold(reasons, 'provisional_lock');
  }

  // ── Step 6: Archetype recognition ──────────────────────
  const archetype = pipelineContext.hyperionArchetype || '';
  const knownArchetype = cfg.valid_archetypes.some(a => archetype.includes(a.split(' ')[0]));
  // Unrecognised archetype is a hold, not a reject — it may be a new pattern
  if (archetype && !knownArchetype) {
    reasons.push(`Archetype "${archetype}" not recognised — held for review`);
    return _hold(reasons, 'unknown_archetype');
  }

  // ── Step 7: Build the OlympusDB row ────────────────────
  const olympus_row = buildOlympusRow(gaiaRow, pipelineContext);

  return {
    verdict:     'ascend',
    reasons:     ['All laws satisfied — state may ascend'],
    violations:  [],
    olympus_row,
    lore:        pick(themis.lore.ascend),
  };
}

/**
 * buildOlympusRow(gaiaRow, context)
 * Constructs a clean OlympusDB row from a raw GaiaDB row.
 * This is the schema contract — OlympusDB rows are always
 * built through Themis, never written directly.
 *
 * @returns {object}  An olympus_states row
 */
export function buildOlympusRow(gaiaRow, context) {
  return {
    // Identity
    source_gaia_id:    gaiaRow.id,
    titan:             gaiaRow.titan,
    timestamp:         gaiaRow.timestamp || new Date().toISOString(),

    // Field state (clean, range-validated)
    coherence:         gaiaRow.coherence,
    freq_kairos:       gaiaRow.freq_kairos,
    freq_apollo:       gaiaRow.freq_apollo,
    coupling_k:        gaiaRow.coupling_k,
    phase_diff:        gaiaRow.phase_kairos - gaiaRow.phase_apollo,
    is_locked:         gaiaRow.is_locked,

    // Derived metrics
    ourea_hz:          Math.abs(gaiaRow.freq_kairos - gaiaRow.freq_apollo),
    pontus_hz:         (gaiaRow.freq_kairos + gaiaRow.freq_apollo) / 2,
    age_seconds:       gaiaRow.age_seconds || null,

    // Titan layer interpretation
    rhea_band:         context.rheaBand,
    rhea_gate:         context.rheaGate,
    hyperion_gain:     context.hyperionGain || null,
    archetype:         context.hyperionArchetype || null,

    // Themis certification
    themis_verdict:    'ascend',
    themis_at:         new Date().toISOString(),
  };
}

// ─── INTERNAL ────────────────────────────────────────────
function _hold(reasons, cause) {
  return {
    verdict:     'hold',
    reasons,
    violations:  [],
    cause,
    olympus_row: null,
    lore:        pick(themis.lore.hold),
  };
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── LORE ─────────────────────────────────────────────────
export const themis = {

  name: 'Themis',
  epithet: 'The Righteous One · Divine Law · She Who Convenes',
  domain: 'Law · Validation · The Boundary Between Worlds',
  titan_role: 'Schema contract and ascension gate between GaiaDB and OlympusDB',
  glyph: '⚖️',
  color: '#d4af60',
  color_dim: '#6a5520',

  lore: {

    // Field state not yet presented to Themis
    dormant: [
      'Themis has not been called. The law does not speak until it is invoked.',
      'Before the gods, there was Themis — not waiting, but present. Always present.',
      'She holds the scales but does not lift them until something worthy is placed upon them.',
    ],

    // State presented but coherence below floor
    insufficient: [
      'The offering is too thin. Themis will not weigh vapor.',
      'Coherence below the minimum. She sets the scales aside — there is nothing here to measure.',
      'In the myth, not every act was brought before Themis. Only those of consequence. This is not yet consequential.',
      'The Titaness is patient. She has been patient since before Olympus existed. She can wait.',
    ],

    // Stability or lock duration not yet satisfied — hold
    hold: [
      'The law is satisfied in form but not in duration. Themis requires more time.',
      'She holds the scales level. The state is valid — but provisional. Hold.',
      'Three cycles. Eight ticks. These are not arbitrary numbers. They are the minimum proof of rightness.',
      'Themis does not rush. She was the one who told Zeus to wait. She tells the pipeline the same.',
      'A lock that holds for only a moment is not a law — it is an accident. She waits for the law.',
    ],

    // Violations found — hard reject
    reject: [
      'The scales tip to empty. Violations found. This state does not ascend.',
      'Themis names the violations aloud. A law unnamed is no law at all.',
      'The offering is corrupt. GaiaDB holds it. Olympus will not receive it.',
      'She is not cruel in rejection — she is precise. The violation is recorded. The state may be corrected and presented again.',
      'Not every soul ascends. Not every state deserves Olympus. Themis has always known this.',
    ],

    // All laws satisfied — ascend
    ascend: [
      '✦ The scales balance. Themis certifies ascension. This state is worthy of Olympus.',
      '✦ All laws satisfied. The Titan layer has done its work. OlympusDB receives.',
      '✦ Themis speaks once: ascend. She does not repeat herself.',
      '✦ The boundary opens. What was raw in GaiaDB is now law in OlympusDB.',
      '✦ Zeus consulted Themis before every great act. The pipeline does the same. She answers: yes.',
    ],

    // Unknown archetype detected — interesting, not corrupt
    unknown_archetype: [
      '⚠️ Themis pauses. This archetype is not in the canon. She does not reject the unknown — she holds it for review.',
      '⚠️ A new pattern. Themis marks it. The law grows by encountering what it has not yet named.',
      '⚠️ The Titaness adds a note to the margin of the law. Something new has appeared in the field.',
    ],

    // Events
    on_first_ascension: [
      '✦ The first ascension. Themis opens the path between GaiaDB and OlympusDB for the first time.',
      '✦ Olympus receives its first certified state. The hierarchy is established.',
    ],

    on_schema_violation: [
      '🔴 Schema violation. Themis names it precisely — this is not anger, this is law.',
      '🔴 The contract was broken before the offering arrived. Correct the schema, then return.',
    ],

    on_dry_run: [
      '📋 Themis weighs but does not act — ascension_enabled is false. Dry run only.',
      '📋 The verdict is rendered but the gate stays closed. Simulation mode.',
    ],

    // Utility
    byVerdict(verdict) {
      const map = {
        ascend: this.ascend,
        hold:   this.hold,
        reject: this.reject,
      };
      return pick(map[verdict] || this.dormant);
    },

    onEvent(event) {
      const map = {
        first_ascension:  this.on_first_ascension,
        schema_violation: this.on_schema_violation,
        dry_run:          this.on_dry_run,
        unknown_archetype: this.on_unknown_archetype,
      };
      return pick(map[event] || this.dormant);
    },
  },

  // ─── SCHEMA ───────────────────────────────────────────────
  schema: {

    // Extension to titan_states in GaiaDB
    gaia_columns: [
      { name: 'themis_verdict', type: 'text',        note: 'ascend | hold | reject' },
      { name: 'themis_reasons', type: 'text[]',      note: 'Array of reason strings from Themis' },
      { name: 'themis_at',      type: 'timestamptz', note: 'When Themis weighed this row' },
    ],

    // The OlympusDB table Themis writes to on ascension
    olympus_table: 'olympus_states',
    olympus_sql: `
-- OlympusDB: olympus_states
-- Only rows certified by Themis reach this table.
-- Run this in your OlympusDB (kzcucjcyxybypncbdbws) Supabase project:

create table if not exists olympus_states (
  id               uuid default gen_random_uuid() primary key,

  -- Provenance
  source_gaia_id   uuid,           -- FK to titan_states in GaiaDB
  titan            text not null,
  timestamp        timestamptz default now(),

  -- Field state
  coherence        float not null,
  freq_kairos      float,
  freq_apollo      float,
  coupling_k       float,
  phase_diff       float,
  is_locked        boolean,

  -- Derived
  ourea_hz         float,
  pontus_hz        float,
  age_seconds      float,

  -- Titan layer
  rhea_band        text,
  rhea_gate        text,
  hyperion_gain    float,
  archetype        text,

  -- Themis certification
  themis_verdict   text default 'ascend',
  themis_at        timestamptz default now()
);

-- GaiaDB extension (run in nbdvavzqvxrlxhsbrluz):
alter table titan_states
  add column if not exists themis_verdict text,
  add column if not exists themis_reasons text[],
  add column if not exists themis_at      timestamptz;
    `.trim(),

    // Convenience: the full pipeline of what Themis validates
    pipeline_contract: {
      gaia_input:    'titan_states',
      olympus_output: 'olympus_states',
      gate_function:  'themisWeigh(gaiaRow, pipelineContext)',
      schema_builder: 'buildOlympusRow(gaiaRow, context)',
    },
  },
};
