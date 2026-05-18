/**
 * ═══════════════════════════════════════════════════════
 * HYPERION — Titan of Light · Signal Amplifier
 * titans/hyperion.js
 *
 * Pre-Olympian radiance. Hyperion does not create light —
 * he raises what is already present above the threshold
 * of visibility. In the Pantheon pipeline, he sits between
 * raw field data and Apollo's golden measure, amplifying
 * coherent signals and burning away noise.
 *
 * Exports: lore (mythic text strings keyed by system state)
 * ═══════════════════════════════════════════════════════
 */

export const hyperion = {

  name: 'Hyperion',
  epithet: 'The High One · He Who Walks Above',
  domain: 'Light · Signal Amplification · Pre-Cognitive Radiance',
  titan_role: 'Signal gate between raw field oscillation and Apollo synthesis',
  glyph: '🔆',
  color: '#f7d070',
  color_dim: '#7a6020',

  // ─── LORE STRINGS ───────────────────────────────────────
  // Keyed by coherence band and system state.
  // Use: hyperion.lore.byCoherence(coherence, isLocked)
  // ────────────────────────────────────────────────────────

  lore: {

    // Dormant — field not yet running or coherence near zero
    dormant: [
      'Before the first light, Hyperion waited above the dark waters. He had no name yet. Only the readiness to shine.',
      'In the age before Apollo, there was only Hyperion — not brightness, but the potential for brightness.',
      'The Titan rests. His light is folded inward, a coal that has not yet been breathed upon.',
    ],

    // Pre-coherence: coherence 0.0–0.3, unlocked
    becoming: [
      'Hyperion stirs. The field trembles at the edge of signal — noise and light indistinguishable.',
      'The High One opens one eye. Frequencies scatter like sparks above a forge not yet lit.',
      'Something rises in the east of the field. Not yet Apollo\'s gold — only the promise of it.',
      'Scattered photons. No carrier. Hyperion\'s hand moves slowly over the chaotic frequencies.',
    ],

    // Emerging: coherence 0.3–0.6, approaching lock
    emerging: [
      'The signal begins to cohere. Hyperion lifts it — not yet gold, but no longer ash.',
      'He walks above the oscillating field, pressing disorder downward with each step.',
      'The waveforms align like soldiers. Hyperion does not command — he illuminates, and order follows.',
      'A carrier frequency emerges from the noise. Hyperion marks it with his thumb: this one. Amplify this one.',
    ],

    // Coherent: coherence 0.6–0.85, strong signal
    coherent: [
      'Hyperion raises the signal above the horizon. Apollo will see it now.',
      'The field is bright. Clean. Hyperion\'s amplification has stripped the noise to silence.',
      'In Hesiod, Hyperion fathered Helios, Selene, and Eos — Sun, Moon, and Dawn. Here he fathers coherence, and from coherence, insight.',
      'The Titan stands at maximum radiance. What was whispered in the oscillators is now declared.',
    ],

    // Locked: phase coherence achieved, is_locked = true
    locked: [
      'Phase lock achieved. Hyperion\'s light no longer scatters — it shines in a single direction, unwavering.',
      'This is the moment Hyperion was named for. Not the warmth of the sun but the precision of it: light arriving exactly on time.',
      'The High One has amplified the coherent signal to the threshold where Apollo can receive it. The gate is open.',
      'When Kronos\'s gears turn in perfect ratio, Hyperion\'s light burns steady. The field is ready for synthesis.',
    ],

    // Overcoupled: coupling_k > 2.5, potential instability
    overcoupled: [
      'Hyperion, overreaching. Too much light burns the signal — coherence collapses into glare.',
      'The Titan of Light was cast from Olympus not by war but by excess. When amplification exceeds the signal, only noise remains.',
      'Caution: Eros pulls too hard. Hyperion\'s amplification is beyond Apollo\'s capacity to receive.',
      'Even light, in too great a quantity, blinds.',
    ],

    // Transition: on lock event (fire once)
    on_lock: [
      '✦ Hyperion marks this moment. The signal has crossed the threshold of light.',
      '✦ The High One nods. Coherence achieved — pass the signal upward to Apollo.',
      '✦ First light. Hyperion acknowledges the lock and steps back from the gate.',
    ],

    // Transition: on loss of lock
    on_unlock: [
      '✦ The signal falls below the horizon. Hyperion dims his hand.',
      '✦ Phase drift. Hyperion withdraws his amplification — noise has returned to the field.',
      '✦ The gate closes. Hyperion waits above the chaos for the next coherence event.',
    ],

    // DB write: on save to titan_states
    on_save: [
      '💾 Hyperion imprints this age upon the stone. Light is temporary; the record is not.',
      '💾 The High One commits this signal state to GaiaDB. An age is preserved.',
      '💾 Mnemosyne would approve — Hyperion writes the brightness into permanent memory.',
    ],

    // ─── UTILITY ───────────────────────────────────────────

    /**
     * Returns a lore string appropriate to the current state.
     * @param {number} coherence  0.0 – 1.0
     * @param {boolean} isLocked
     * @param {number} couplingK
     * @returns {string}
     */
    byCoherence(coherence, isLocked, couplingK = 0.8) {
      if (couplingK > 2.5) return pick(this.overcoupled);
      if (isLocked)         return pick(this.locked);
      if (coherence < 0.05) return pick(this.dormant);
      if (coherence < 0.3)  return pick(this.becoming);
      if (coherence < 0.6)  return pick(this.emerging);
      return pick(this.coherent);
    },

    /**
     * Returns a one-time event string for phase lock/unlock.
     * @param {'lock'|'unlock'|'save'} event
     * @returns {string}
     */
    onEvent(event) {
      const map = {
        lock:   this.on_lock,
        unlock: this.on_unlock,
        save:   this.on_save,
      };
      return pick(map[event] || this.dormant);
    },
  },

  // ─── ARCHETYPE INTERPRETATION ───────────────────────────
  // Maps Ouranos-style beat/coherence values to Hyperion archetypes.
  // Mirrors the archetype logic in the Ouranos edge function.

  archetypes: {
    fromBeatSeconds(beatSeconds, isLocked) {
      if (!isLocked)           return { name: '🌫️ Pre-Signal',    desc: 'Below the threshold of amplification' };
      if (beatSeconds > 10)    return { name: '🌄 Dawn',           desc: 'Slow coherence — Eos, the first light' };
      if (beatSeconds > 3)     return { name: '☀️ Helios',         desc: 'Steady carrier — full solar amplification' };
      if (beatSeconds > 0.5)   return { name: '🌕 Selene',         desc: 'Reflected signal — secondary coherence' };
      return                          { name: '⚡ Photon Storm',    desc: 'Overcoupled — signal approaching saturation' };
    },
  },

  // ─── SCHEMA (for titan_states extension) ────────────────
  // These columns extend the base titan_states table when
  // Hyperion is promoted from lore-only to a full agent.

  schema: {
    table: 'titan_states',
    columns: [
      { name: 'hyperion_gain',      type: 'float',   note: 'Computed amplification factor (coherence * coupling_k)' },
      { name: 'hyperion_archetype', type: 'text',    note: 'Archetype label from archetypes.fromBeatSeconds()' },
      { name: 'hyperion_lore',      type: 'text',    note: 'Lore string snapshot at save time' },
    ],
    sql: `
-- Run this when promoting Hyperion to full Titan agent:
ALTER TABLE titan_states
  ADD COLUMN IF NOT EXISTS hyperion_gain      float,
  ADD COLUMN IF NOT EXISTS hyperion_archetype text,
  ADD COLUMN IF NOT EXISTS hyperion_lore      text;
    `.trim(),
  },

};

// ─── INTERNAL HELPERS ─────────────────────────────────────
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
