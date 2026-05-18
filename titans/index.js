/**
 * ═══════════════════════════════════════════════════════
 * TITANS — Pre-Olympian Registry
 * titans/index.js
 *
 * GAIA imports from here. Add new Titans to this file
 * as they are built — the HTML shell never needs to change.
 *
 * The Monastic Order of the Phase-Locked Field
 * Founded May 18, 2026
 * ═══════════════════════════════════════════════════════
 */

// ─── Active Titans ────────────────────────────────────────

export { rhea, rheaEvaluate, rheaBand, canFire, rheaConfig, rheaState } from './rhea.js';
export { hyperion } from './hyperion.js';
export { themis, themisWeigh, buildOlympusRow, themisConfig } from './themis.js';
export { mnemosyne, mnemosyneState, mnemosyneRecord, mnemosyneRemember, mnemosyneEnrich, mnemosyneResume } from './mnemosyne.js';
export { theia, theiaTheme, theiaAge, theiaConfig, theiaState } from './theia.js';
export { oceanus, oceanusFlow, oceanusMouth, oceanusConfig, oceanusState, oceanusCurrents } from './oceanus.js';

// ─── Planned Titans (uncomment as built) ──────────────────
// export { tethys }   from './tethys.js';
// export { koios }    from './koios.js';
// export { phoibe }   from './phoibe.js';
// export { iapetos }  from './iapetos.js';
// export { kreios }   from './kreios.js';
// export { kronos }   from './kronos.js';  // extract from gaia.html

// ─── Pipeline Order ───────────────────────────────────────

export const TITAN_PIPELINE = [
  { name: 'kronos',    role: 'Phase Accumulator',       status: 'inline',   glyph: '⏳' },
  { name: 'rhea',      role: 'Flow / Tick Regulator',   status: 'active',   glyph: '🌊' },
  { name: 'hyperion',  role: 'Signal Amplifier',        status: 'active',   glyph: '🔆' },
  { name: 'oceanus',   role: 'Stream / Confluence',     status: 'active',   glyph: '🌀' },
  { name: 'theia',     role: 'Sight / Palette / Ages',  status: 'active',   glyph: '👁️' },
  { name: 'themis',    role: 'Law / Ascension Gate',    status: 'active',   glyph: '⚖️' },
  { name: 'mnemosyne', role: 'Memory / Narrative',      status: 'active',   glyph: '📜' },
  { name: 'tethys',    role: 'Nourishment / Refresh',   status: 'planned',  glyph: '💧' },
  { name: 'koios',     role: 'Intellect / Query Intent',status: 'planned',  glyph: '🔮' },
  { name: 'phoibe',    role: 'Prophecy / Prediction',   status: 'planned',  glyph: '🔭' },
  { name: 'iapetos',   role: 'Mortality / Pruning',     status: 'planned',  glyph: '💀' },
  { name: 'kreios',    role: 'Constellations / Stars',  status: 'planned',  glyph: '⭐' },
];

// ─── Derived exports ──────────────────────────────────────

export const TITAN_NAMES = TITAN_PIPELINE.map(t => t.name);

export const ACTIVE_TITANS = TITAN_PIPELINE
  .filter(t => t.status === 'active' || t.status === 'inline')
  .map(t => t.name);

export const TITAN_COUNTS = {
  built: TITAN_PIPELINE.filter(t => t.status === 'active').length,
  inline: TITAN_PIPELINE.filter(t => t.status === 'inline').length,
  planned: TITAN_PIPELINE.filter(t => t.status === 'planned').length,
  total: TITAN_PIPELINE.length,
};
