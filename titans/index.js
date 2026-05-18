/**
 * ═══════════════════════════════════════════════════════
 * TITANS — Pre-Olympian Registry
 * titans/index.js
 *
 * GAIA imports from here. Add new Titans to this file
 * as they are built — the HTML shell never needs to change.
 *
 * Import pattern in gaia.html (ES module script tag):
 *   import { titans, getTitan } from './titans/index.js';
 *
 * Current roster:
 *   ✦ Hyperion  — Light / Signal Amplifier         [lore]
 *   ○ Kronos    — Time / Phase Accumulator          [inline in gaia.html — extract later]
 *   ○ Rhea      — Flow / Rhythm                     [planned]
 *   ○ Oceanus   — Deep Data / Streams               [planned]
 *   ○ Themis    — Law / Thresholds                  [planned]
 *   ○ Mnemosyne — Memory / Storage                  [planned]
 *   ○ Prometheus— Fire / LLM Gate                   [planned]
 *   ○ Iapetus   — Mortality / Decay / Pruning       [planned]
 * ═══════════════════════════════════════════════════════
 */

export { hyperion } from './hyperion.js';

// Stub imports — uncomment as each Titan is built:
// export { rhea }      from './rhea.js';
// export { oceanus }   from './oceanus.js';
// export { themis }    from './themis.js';
// export { mnemosyne } from './mnemosyne.js';
// export { prometheus } from './prometheus.js';
// export { iapetus }   from './iapetus.js';
// export { kronos }    from './kronos.js';  // extract from gaia.html when ready

/**
 * All active Titans in pipeline order.
 * Order matters: data flows Kronos → Hyperion → Apollo
 */
export const titans = {
  hyperion: () => import('./hyperion.js').then(m => m.hyperion),
  // kronos, rhea, oceanus... added here as built
};

/**
 * Convenience getter — returns a Titan module by name.
 * @param {string} name  e.g. 'hyperion'
 * @returns {Promise}
 */
export async function getTitan(name) {
  const loader = titans[name];
  if (!loader) throw new Error(`Titan "${name}" not found in registry.`);
  return loader();
}

/**
 * Pipeline order for GAIA to iterate.
 * Each entry is { name, role, status }
 */
export const TITAN_PIPELINE = [
  { name: 'kronos',    role: 'Phase Accumulator',   status: 'inline',   glyph: '⏳' },
  { name: 'hyperion',  role: 'Signal Amplifier',     status: 'active',   glyph: '🔆' },
  { name: 'rhea',      role: 'Flow / Rhythm',        status: 'planned',  glyph: '🌊' },
  { name: 'oceanus',   role: 'Deep Data Streams',    status: 'planned',  glyph: '🌀' },
  { name: 'themis',    role: 'Law / Thresholds',     status: 'planned',  glyph: '⚖️'  },
  { name: 'mnemosyne', role: 'Memory / Storage',     status: 'planned',  glyph: '📜' },
  { name: 'prometheus',role: 'Fire / LLM Gate',      status: 'planned',  glyph: '🔥' },
  { name: 'iapetus',   role: 'Mortality / Pruning',  status: 'planned',  glyph: '💀' },
];
