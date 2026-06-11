// ══════════════════════════════════════════════════════
// APOLLO SHADOW · ARES
// Stress-testing war tokens, triplet formation.
// Pure logic. No UI. Called only by Apollo.
// ══════════════════════════════════════════════════════

/**
 * Stress-test war tokens by forming high-tension SVO triplets.
 * Ares takes what Aphrodite rejects (manifest: war) and forges structure from conflict.
 * @param {Array} tokens - Tokens with sentiment applied
 * @returns {Array<{subject: string, verb: string, object: string, tension: number, domain: string, created_at: string}>}
 */
export function stressTestAndFormTriplets(tokens) {
  const warTokens = tokens.filter(t => t.manifest === 'war');
  const triplets = [];

  const subjects = warTokens.filter(t => t.word_type === 'S');
  const verbs = warTokens.filter(t => t.word_type === 'V');
  const objects = warTokens.filter(t => t.word_type === 'O');

  // Form high-tension triplets from war tokens
  if (subjects.length > 0 && verbs.length > 0 && objects.length > 0) {
    const s = subjects[0]; // Most war-like subject
    const v = verbs[Math.floor(Math.random() * verbs.length)];
    const o = objects[Math.floor(Math.random() * objects.length)];

    triplets.push({
      subject: s.body,
      verb: v.body,
      object: o.body,
      tension: 0.85 + Math.random() * 0.15, // High tension: 0.85-1.0
      domain: 'war',
      created_at: new Date().toISOString()
    });
  }

  // Also form triplets using latent love — flipping the coin
  const latentLoveTokens = tokens.filter(t => t.latent === 'love' && t.manifest === 'war');
  if (latentLoveTokens.length >= 2 && verbs.length > 0) {
    const s = latentLoveTokens[0];
    const o = latentLoveTokens[1];
    const v = verbs[Math.floor(Math.random() * verbs.length)];
    triplets.push({
      subject: s.body,
      verb: v.body,
      object: o.body,
      tension: 0.6, // Lower tension — love trying to emerge from conflict
      domain: 'forge', // War forging love
      created_at: new Date().toISOString()
    });
  }

  // Pairs of war tokens (for the graph)
  const warPairs = [];
  for (let i = 0; i < Math.min(warTokens.length - 1, 5); i++) {
    const a = warTokens[i];
    const b = warTokens[i + 1];
    if (a.body !== b.body) {
      warPairs.push({
        token_a: a.body,
        token_b: b.body,
        relation_type: 'CLASHES_WITH',
        visual_modifier: 'crimson sparks',
        composed_at: new Date().toISOString()
      });
    }
  }

  return { triplets, warPairs };
}
