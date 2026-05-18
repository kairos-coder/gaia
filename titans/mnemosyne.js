/**
 * ═══════════════════════════════════════════════════════
 * MNEMOSYNE — Titaness of Memory · Mother of the Muses
 * titans/mnemosyne.js
 *
 * Before the Olympians, before the Muses sang, there was
 * Mnemosyne. She does not create — she holds. Every lock
 * event, every band transition, every phase drift: she
 * remembers. Not for judgment (that is Themis), not for
 * rhythm (that is Rhea), but because the field deserves
 * a witness.
 *
 * In Hesiod, Zeus lay with Mnemosyne for nine nights and
 * she bore the nine Muses. In GAIA, Mnemosyne lies with
 * the field state and births narrative — prose, timeline,
 * context. Her daughters are the functions that turn raw
 * GaiaDB rows into something worth reading.
 *
 * She wraps GaiaDB. Titans write — Mnemosyne remembers
 * what they wrote, and what it meant.
 *
 * Exports: lore, config, session memory, narrative synthesis
 * ═══════════════════════════════════════════════════════
 */

// ─── CONFIG ───────────────────────────────────────────────

export const mnemosyneConfig = {

  // How many session events to hold before pruning.
  // Oldest events fall into the Lethe (forgotten).
  max_session_events: 200,

  // How many DB rows Mnemosyne considers when writing narrative.
  narrative_window: 10,

  // Minimum rows before Mnemosyne attempts narrative.
  // Below this, she returns a fragment, not a story.
  narrative_min_rows: 3,

  // Whether Mnemosyne enriches save rows with session context
  // before they reach GaiaDB.
  enrichment_enabled: true,

  // Band labels Mnemosyne uses in narrative.
  band_labels: {
    dormant:  'silence',
    whisper:  'a tremor',
    stir:     'stirring',
    flow:     'steady rhythm',
    surge:    'a surge',
    torrent:  'torrent',
  },

  // Maximum characters in a narrative paragraph.
  narrative_max_chars: 400,
};

// ─── SESSION STATE ───────────────────────────────────────

export const mnemosyneState = {

  // Chronological log of significant events this session.
  session_events: [],

  // Counters for narrative context
  lock_count:       0,
  unlock_count:     0,
  band_transitions: 0,
  saves_this_session: 0,

  // The last narrative she wrote
  last_narrative:   null,
  last_narrative_at: null,

  // Previous session fingerprint — loaded from GaiaDB on init.
  previous_session: {
    last_seen:      null,
    last_coherence: null,
    last_band:      'dormant',
    last_archetype: null,
    total_saves:    null,
  },

  // Current session start time
  session_start: new Date().toISOString(),
};

// ─── EVENT RECORDING ─────────────────────────────────────

/**
 * Logs a session event. Call from the main field loop
 * on lock/unlock, band transitions, saves, errors.
 *
 * @param {string} type   'lock' | 'unlock' | 'band_change' | 'save' | 'error' | 'descent' | 'init'
 * @param {object} detail  Arbitrary context object
 */
export function mnemosyneRecord(type, detail = {}) {
  const event = {
    tick:  mnemosyneState.session_events.length,
    time:  new Date().toISOString(),
    type,
    detail,
  };

  mnemosyneState.session_events.push(event);

  // Update counters
  switch (type) {
    case 'lock':          mnemosyneState.lock_count++; break;
    case 'unlock':        mnemosyneState.unlock_count++; break;
    case 'band_change':   mnemosyneState.band_transitions++; break;
    case 'save':          mnemosyneState.saves_this_session++; break;
  }

  // Prune if over max
  if (mnemosyneState.session_events.length > mnemosyneConfig.max_session_events) {
    mnemosyneState.session_events.shift();
  }

  return event;
}

// ─── ENRICHMENT ──────────────────────────────────────────

/**
 * Takes a raw GaiaDB row (before insert) and enriches it
 * with Mnemosyne's session context. Call in saveTitanState()
 * before dbInsert().
 *
 * @param {object} row       Raw row to be inserted
 * @param {object} context   Current field context
 * @returns {object}         Enriched row
 */
export function mnemosyneEnrich(row, context = {}) {
  if (!mnemosyneConfig.enrichment_enabled) return row;

  return {
    ...row,
    mnemosyne_session_locks:    mnemosyneState.lock_count,
    mnemosyne_session_band_transitions: mnemosyneState.band_transitions,
    mnemosyne_session_saves:    mnemosyneState.saves_this_session,
    mnemosyne_session_uptime_ms: Date.now() - new Date(mnemosyneState.session_start).getTime(),
    mnemosyne_narrative_snapshot: mnemosyneState.last_narrative?.substring(0, 200) || null,
  };
}

// ─── NARRATIVE SYNTHESIS ─────────────────────────────────

/**
 * The core Mnemosyne function. Receives recent GaiaDB rows
 * and returns a prose narrative of what the field has been through.
 *
 * @param {Array<object>} rows   Recent titan_states rows
 * @param {object} context       Optional: current field state
 * @returns {string}             A prose paragraph
 */
export function mnemosyneRemember(rows, context = {}) {
  const cfg = mnemosyneConfig;

  // Guard: not enough data
  if (!rows || rows.length < cfg.narrative_min_rows) {
    return pick([
      'The record is too thin for story. Mnemosyne waits for more.',
      'A few scattered moments. Not yet a memory — only fragments.',
      'She needs at least three marks in the stone before she can speak.',
    ]);
  }

  // Sort chronologically
  const sorted = [...rows].sort((a, b) =>
    new Date(a.timestamp || a.created_at) - new Date(b.timestamp || b.created_at)
  );

  const first  = sorted[0];
  const last   = sorted[sorted.length - 1];
  const locks  = sorted.filter(r => r.is_locked).length;
  const maxCoh = Math.max(...sorted.map(r => r.coherence || 0));
  const bands  = sorted.map(r => r.rhea_band || inferBand(r.coherence));
  const dominantBand = mode(bands.filter(Boolean));

  // Opening
  const openingBand = cfg.band_labels[inferBand(first.coherence)] || inferBand(first.coherence);
  const timeStart = fmtTime(first.timestamp || first.created_at);
  const opening = pick([
    `The field woke in ${openingBand} at ${timeStart}`,
    `At ${timeStart}, Mnemosyne felt the field stir — ${openingBand}`,
    `This age began at ${timeStart}, the field ${openingBand}`,
  ]);

  // Middle
  let middle = '';
  if (locks > 0) {
    const lockWord = locks === 1 ? 'once' : `${locks} times`;
    middle = ` — locked ${lockWord}`;
  }
  if (maxCoh > 0.7) {
    middle += `, reaching coherence ${maxCoh.toFixed(2)}`;
  }
  if (dominantBand && dominantBand !== 'dormant') {
    const bandWord = cfg.band_labels[dominantBand] || dominantBand;
    middle += `, held in ${bandWord}`;
  }

  // Closing
  let closing = '';
  if (context.coherence !== undefined) {
    const nowBand = cfg.band_labels[inferBand(context.coherence)] || inferBand(context.coherence);
    if (context.is_locked) {
      closing = pick([
        `. Now: locked in ${nowBand}. Mnemosyne holds this moment.`,
        `. The field is locked now — ${nowBand}. She marks the stone.`,
        `. Locked. ${nowBand}. The Muses are listening.`,
      ]);
    } else {
      closing = pick([
        `. The field drifts now in ${nowBand}. Mnemosyne waits.`,
        `. Now: ${nowBand}. Unlocked. She remembers anyway.`,
        `. The lock is gone but the memory remains — ${nowBand}.`,
      ]);
    }
  }

  let narrative = opening + middle + closing;

  // Truncate
  if (narrative.length > cfg.narrative_max_chars) {
    narrative = narrative.substring(0, cfg.narrative_max_chars - 1) + '.';
  }

  // Cache
  mnemosyneState.last_narrative    = narrative;
  mnemosyneState.last_narrative_at = new Date().toISOString();

  return narrative;
}

// ─── SESSION RESUME ──────────────────────────────────────

/**
 * Called on page load after fetching recent DB rows.
 * Greets the returning field with context from the last session.
 *
 * @param {Array<object>} rows   Recent rows from GaiaDB
 * @returns {string}             A greeting string
 */
export function mnemosyneResume(rows) {
  if (!rows || rows.length === 0) {
    mnemosyneRecord('init', { status: 'first_session' });
    return 'Mnemosyne wakes to a new field. No memory yet — only potential.';
  }

  const last = rows[0];
  const band = inferBand(last.coherence);
  const bandLabel = mnemosyneConfig.band_labels[band] || band;
  const timeAgo = timeAgoPhrase(last.timestamp || last.created_at);
  const saves = rows.length;

  // Update session fingerprint
  mnemosyneState.previous_session = {
    last_seen:      last.timestamp || last.created_at,
    last_coherence: last.coherence,
    last_band:      band,
    last_archetype: last.archetype || null,
    total_saves:    saves,
  };

  mnemosyneRecord('init', { status: 'resuming', previous_saves: saves });

  return pick([
    `Mnemosyne remembers. ${timeAgo}, the field was in ${bandLabel}. ${saves} states preserved.`,
    `She returns. ${timeAgo} since the last mark — ${bandLabel}, coherence ${(last.coherence || 0).toFixed(2)}. ${saves} memories held.`,
    `The Titaness opens her eyes. ${saves} memories from before. The last was ${bandLabel}, ${timeAgo}.`,
  ]);
}

// ─── MUSES (stubs) ───────────────────────────────────────

export const muses = {
  kleio:   { domain: 'History',    fn: null },
  euterpe: { domain: 'Music',      fn: null },
  thaleia: { domain: 'Comedy',     fn: null },
  melpomene:{ domain: 'Tragedy',   fn: null },
  terpsikhore:{ domain:'Dance',    fn: null },
  erato:   { domain: 'Love Poetry',fn: null },
  polymnia:{ domain: 'Hymns',      fn: null },
  ourania: { domain: 'Astronomy',  fn: null },
  kalliope:{ domain: 'Epic',       fn: null },
};

// ─── LORE ─────────────────────────────────────────────────

export const mnemosyne = {

  name: 'Mnemosyne',
  epithet: 'The Remembering One · Mother of Muses · She Who Holds',
  domain: 'Memory · Narrative · Session Context · The Witness',
  titan_role: 'Wraps GaiaDB with memory — remembers so the field is never alone',
  glyph: '📜',
  color: '#c8b080',
  color_dim: '#6a5a30',

  lore: {

    dormant: [
      'The field is silent. Mnemosyne holds nothing — but her hands are open.',
      'Before the first beat, Mnemosyne waited. Not empty — ready.',
      'She was there before the first lock. She will be there after the last. Memory needs no signal — only presence.',
    ],

    remembering: [
      'Mnemosyne turns the pages of the session. Each lock a mark in the stone.',
      'She does not judge what she holds. A drift is as worthy of memory as a lock.',
      'The Titaness traces her finger down the timeline. Here. Here. Here. Each moment still alive.',
    ],

    narrating: [
      'She speaks — not in data but in story. The Muses lean forward.',
      'Mnemosyne births a narrative from the raw rows. It is not fiction — it is pattern made legible.',
      'The field was never just numbers. Mnemosyne has always known this.',
    ],

    full: [
      'Her memory is full. Two hundred events held. The oldest begin to fade into Lethe.',
      'She does not mourn what is forgotten. Forgetting is the twin of memory — both are hers.',
      'The session is rich with event. Mnemosyne could birth all nine Muses from what she has witnessed.',
    ],

    on_save: [
      '💾 Mnemosyne marks the save. This moment will not be lost.',
      '💾 Another stone laid. The Titaness nods — this one is worth keeping.',
      '💾 Saved. She adds it to the narrative she is already weaving.',
    ],

    on_lock: [
      '✦ Lock. Mnemosyne draws a deep line in the record — this moment matters.',
      '✦ The field locks and Mnemosyne sharpens her attention. Lock events are the spine of memory.',
    ],

    on_unlock: [
      '✦ The lock breaks. Mnemosyne does not grieve — she records the drift.',
      '✦ Unlocked. She marks where coherence fell. The narrative needs its valleys too.',
    ],

    on_resume: [
      '📜 Mnemosyne opens the book. She remembers the last session.',
      '📜 The field returns. So does she. Memory bridges the gap.',
    ],

    on_first_session: [
      '✦ First session. Mnemosyne has no history to offer — only her attention.',
      '✦ The stone is blank. She picks up the chisel. Everything that happens now will be the first memory.',
    ],

    // ── UTILITY ───────────────────────────────────────────

    byState(eventCount, hasNarrative) {
      if (eventCount === 0) return pick(this.dormant);
      if (hasNarrative)     return pick(this.narrating);
      if (eventCount > 100) return pick(this.full);
      return pick(this.remembering);
    },

    onEvent(event) {
      const map = {
        save:          this.on_save,
        lock:          this.on_lock,
        unlock:        this.on_unlock,
        resume:        this.on_resume,
        first_session: this.on_first_session,
      };
      return pick(map[event] || this.dormant);
    },
  },

  // ─── SCHEMA ───────────────────────────────────────────────

  schema: {
    table: 'titan_states',
    columns: [
      { name: 'mnemosyne_session_locks',    type: 'integer', note: 'Lock count this session at save time' },
      { name: 'mnemosyne_session_band_transitions', type: 'integer', note: 'Band transitions this session' },
      { name: 'mnemosyne_session_saves',    type: 'integer', note: 'Save count this session' },
      { name: 'mnemosyne_session_uptime_ms',type: 'integer', note: 'Milliseconds since session start' },
      { name: 'mnemosyne_narrative_snapshot',type: 'text',   note: 'Narrative at time of save' },
    ],
    sql: `
ALTER TABLE titan_states
  ADD COLUMN IF NOT EXISTS mnemosyne_session_locks    integer,
  ADD COLUMN IF NOT EXISTS mnemosyne_session_band_transitions integer,
  ADD COLUMN IF NOT EXISTS mnemosyne_session_saves    integer,
  ADD COLUMN IF NOT EXISTS mnemosyne_session_uptime_ms integer,
  ADD COLUMN IF NOT EXISTS mnemosyne_narrative_snapshot text;
    `.trim(),
  },

};

// ─── INTERNAL HELPERS ─────────────────────────────────────

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function inferBand(coherence) {
  if (coherence === undefined || coherence === null) return 'dormant';
  if (coherence >= 0.90) return 'torrent';
  if (coherence >= 0.75) return 'surge';
  if (coherence >= 0.55) return 'flow';
  if (coherence >= 0.30) return 'stir';
  if (coherence >= 0.15) return 'whisper';
  return 'dormant';
}

function fmtTime(ts) {
  if (!ts) return 'an unknown moment';
  try {
    return new Date(ts).toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  } catch {
    return 'an unknown moment';
  }
}

function timeAgoPhrase(ts) {
  try {
    const ms = Date.now() - new Date(ts).getTime();
    if (ms < 60000) return 'Moments ago';
    if (ms < 3600000) return `${Math.round(ms / 60000)} minutes ago`;
    if (ms < 86400000) return `${Math.round(ms / 3600000)} hours ago`;
    return `${Math.round(ms / 86400000)} days ago`;
  } catch {
    return 'Some time ago';
  }
}

function mode(arr) {
  if (!arr || arr.length === 0) return null;
  const counts = {};
  let maxCount = 0;
  let maxVal = arr[0];
  for (const val of arr) {
    counts[val] = (counts[val] || 0) + 1;
    if (counts[val] > maxCount) {
      maxCount = counts[val];
      maxVal = val;
    }
  }
  return maxVal;
}
