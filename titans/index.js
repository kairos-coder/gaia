/**
 * ═══════════════════════════════════════════════════════
 * TITANS — Pre-Olympian Registry
 * titans/index.js
 *
 * The Order of Olympus
 * Founded May 18, 2026
 * ═══════════════════════════════════════════════════════
 */

// ─── Active Titans ────────────────────────────────────────

export { kronos, kronosTick, kronosShouldFire, kronosGetPhase, kronosAssignments, kronosState, kronosSetBaseFreq, kronosSetReferenceFreq, kronosSetCoupling, kronosResetPhase, kronosConfig } from './kronos.js';
export { rhea, rheaEvaluate, rheaBand, canFire, rheaConfig, rheaState } from './rhea.js';
export { hyperion } from './hyperion.js';
export { themis, themisWeigh, buildOlympusRow, themisConfig } from './themis.js';
export { mnemosyne, mnemosyneState, mnemosyneRecord, mnemosyneRemember, mnemosyneEnrich, mnemosyneResume } from './mnemosyne.js';
export { theia, theiaTheme, theiaAge, theiaConfig, theiaState } from './theia.js';
export { oceanus, oceanusFlow, oceanusMouth, oceanusConfig, oceanusState, oceanusCurrents } from './oceanus.js';
export { tethys, tethysNourish, tethysMouth, tethysConfig, tethysState } from './tethys.js';
export { phoibe, phoibeProphesy, phoibeOracle, phoibeConfig, phoibeState } from './phoibe.js';
export { koios, koiosAsk, koiosAnswer, koiosStreakReport, koiosConfig, koiosState } from './koios.js';

// ─── Planned Titans (uncomment as built) ──────────────────
// export { iapetos }  from './iapetos.js';
// export { kreios }   from './kreios.js';

// ─── Pipeline Order ───────────────────────────────────────

export const TITAN_PIPELINE = [
  { name: 'kronos',    role: 'Phase Accumulator / Manager', status: 'active',   glyph: '⏳' },
  { name: 'rhea',      role: 'Flow / Tick Regulator',       status: 'active',   glyph: '🌊' },
  { name: 'hyperion',  role: 'Signal Amplifier',            status: 'active',   glyph: '🔆' },
  { name: 'oceanus',   role: 'Stream / Confluence',          status: 'active',   glyph: '🌀' },
  { name: 'tethys',    role: 'Nourishment / Smoothing',      status: 'active',   glyph: '💧' },
  { name: 'theia',     role: 'Sight / Palette / Ages',       status: 'active',   glyph: '👁️' },
  { name: 'phoibe',    role: 'Prophecy / Oracle',            status: 'active',   glyph: '🔮' },
  { name: 'themis',    role: 'Law / Ascension Gate',         status: 'active',   glyph: '⚖️' },
  { name: 'mnemosyne', role: 'Memory / Narrative',           status: 'active',   glyph: '📜' },
  { name: 'koios',     role: 'Intellect / Trivia Oracle',    status: 'active',   glyph: '🔮' },
  { name: 'iapetos',   role: 'Mortality / Pruning',         status: 'planned',  glyph: '💀' },
  { name: 'kreios',    role: 'Constellations / Stars',       status: 'planned',  glyph: '⭐' },
];

export const TITAN_NAMES = TITAN_PIPELINE.map(t => t.name);

export const ACTIVE_TITANS = TITAN_PIPELINE
  .filter(t => t.status === 'active')
  .map(t => t.name);

export const TITAN_COUNTS = {
  built: TITAN_PIPELINE.filter(t => t.status === 'active').length,
  planned: TITAN_PIPELINE.filter(t => t.status === 'planned').length,
  total: TITAN_PIPELINE.length,
};
