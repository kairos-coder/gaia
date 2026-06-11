// ══════════════════════════════════════════════════════
// APOLLO SHADOW · SYNTHESIS
// Prompt synthesis from triplets.
// Pure logic. No UI. Called only by Apollo.
// ══════════════════════════════════════════════════════

/**
 * Synthesize a creative prompt from available triplets and pairs.
 * @param {Array} triplets - SVO triplets from Ares
 * @param {Array} lovePairs - Pairs from Aphrodite
 * @param {Array} warPairs - Pairs from Ares
 * @returns {{id: string, body: string, telos: string, plan: string, source_triplet_id: string, synthesized_at: string}}
 */
export function synthesizePrompt(triplets = [], lovePairs = [], warPairs = []) {
  const id = `prompt-${Date.now()}`;
  
  // Build prompt body from available material
  let body = '';
  let telos = '';
  let plan = '';

  if (triplets.length > 0) {
    const t = triplets[0];
    body = `${t.subject} ${t.verb} ${t.object}`;
    telos = `Explore the tension between ${t.subject} and ${t.object} through the action of ${t.verb}.`;
    plan = 'Generate an image that captures this SVO relationship.';
  } else if (lovePairs.length > 0 && warPairs.length > 0) {
    const love = lovePairs[0];
    const war = warPairs[0];
    body = `The harmony of ${love.token_a} and the conflict of ${war.token_a}`;
    telos = 'Synthesize love and war into a single vision.';
    plan = 'Juxtapose radiant and crimson visual elements.';
  } else if (lovePairs.length > 0) {
    const p = lovePairs[0];
    body = `${p.token_a} harmonizes with ${p.token_b}`;
    telos = 'Radiate beauty and connection.';
    plan = 'Use golden light and soft focus.';
  } else if (warPairs.length > 0) {
    const p = warPairs[0];
    body = `${p.token_a} clashes with ${p.token_b}`;
    telos = 'Forge meaning from conflict.';
    plan = 'Use sharp contrast and dark tones.';
  } else {
    body = 'The spiral turns, awaiting seeds.';
    telos = 'Begin the cycle.';
    plan = 'Seed the 12 domains and run the full loop.';
  }

  return {
    id,
    body,
    telos,
    plan,
    source_triplet_id: triplets[0] 
      ? `${triplets[0].subject}-${triplets[0].verb}-${triplets[0].object}-${triplets[0].created_at}`
      : 'none',
    synthesized_at: new Date().toISOString()
  };
}
