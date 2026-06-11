// ══════════════════════════════════════════════════════
// APOLLO SHADOW · APHRODITE
// Sentiment classification + love-pair composition.
// Pure logic. No UI. Called only by Apollo.
// ══════════════════════════════════════════════════════

// ── Sentiment Classification ──

/**
 * Classify a token's emotional valence.
 * Uses word-level heuristics (replace with Transformers.js later).
 * @param {string} word - The token body
 * @param {string} domain - The token's current domain
 * @returns {{ manifest: 'love'|'war', latent: 'love'|'war', confidence: number }}
 */
export function classifySentiment(word, domain) {
  // Positive-emotion words → manifest love
  const loveKeywords = new Set([
    'love','heart','desire','beauty','grace','tenderness','embrace',
    'longing','bloom','devotion','soul','charm','harmony','dawn',
    'prophecy','song','balance','golden','lyre','oracle','radiance',
    'healing','clarity','truth','peace','cultivate','harvest','growth',
    'seed','bloom','ecstasy','dance','release'
  ]);

  // Negative/conflict words → manifest war
  const warKeywords = new Set([
    'battle','strike','clash','blade','shield','rage','force','conquest',
    'enemy','siege','weapon','army','thunder','lightning','wrath',
    'judgment','authority','dominion','hunt','beast','fang','claw',
    'predator','wilderness','madness','frenzy','intoxication','chaos',
    'forge','hammer','anvil','smelt','temper'
  ]);

  const lower = word.toLowerCase();

  if (loveKeywords.has(lower)) {
    return { manifest: 'love', latent: 'war', confidence: 85 };
  }
  if (warKeywords.has(lower)) {
    return { manifest: 'war', latent: 'love', confidence: 85 };
  }

  // Default: trust the domain tag
  if (domain === 'love' || domain === 'light' || domain === 'vine') {
    return { manifest: 'love', latent: 'war', confidence: 60 };
  }
  if (domain === 'war' || domain === 'storm' || domain === 'wild') {
    return { manifest: 'war', latent: 'love', confidence: 60 };
  }

  // Neutral domains → coin flip with slight bias
  return Math.random() > 0.5
    ? { manifest: 'love', latent: 'war', confidence: 50 }
    : { manifest: 'war', latent: 'love', confidence: 50 };
}

/**
 * Apply sentiment to a batch of tokens.
 * Returns tokens with updated domain fields.
 * @param {Array} tokens - Tokens from Hermes extraction
 * @returns {Array} - Tokens with manifest/latent domains assigned
 */
export function applySentiment(tokens) {
  return tokens.map(token => {
    const sentiment = classifySentiment(token.body, token.domain);
    return {
      ...token,
      manifest: sentiment.manifest,
      latent: sentiment.latent,
      confidence: sentiment.confidence
    };
  });
}

// ── Pair Composition ──

/**
 * Compose love pairs from tokens where manifest === 'love'.
 * Creates Subject-Verb-Object style pairs.
 * @param {Array} tokens - Tokens with sentiment applied
 * @returns {Array<{token_a: string, token_b: string, relation_type: string, visual_modifier: string, composed_at: string}>}
 */
export function composeLovePairs(tokens) {
  const loveTokens = tokens.filter(t => t.manifest === 'love');
  const pairs = [];

  // Separate by word type
  const subjects = loveTokens.filter(t => t.word_type === 'S');
  const verbs = loveTokens.filter(t => t.word_type === 'V');
  const objects = loveTokens.filter(t => t.word_type === 'O');

  // If we have all three types, make classic SVO pairs
  if (subjects.length > 0 && verbs.length > 0) {
    const s = subjects[Math.floor(Math.random() * subjects.length)];
    const v = verbs[Math.floor(Math.random() * verbs.length)];
    pairs.push({
      token_a: s.body,
      token_b: v.body,
      relation_type: 'ACTS_THROUGH',
      visual_modifier: 'radiant glow',
      composed_at: new Date().toISOString()
    });
  }

  if (verbs.length > 0 && objects.length > 0) {
    const v = verbs[Math.floor(Math.random() * verbs.length)];
    const o = objects[Math.floor(Math.random() * objects.length)];
    pairs.push({
      token_a: v.body,
      token_b: o.body,
      relation_type: 'CREATES',
      visual_modifier: 'blooming light',
      composed_at: new Date().toISOString()
    });
  }

  // Also pair love tokens by domain affinity
  for (let i = 0; i < loveTokens.length - 1; i++) {
    const a = loveTokens[i];
    const b = loveTokens[i + 1];
    // Don't duplicate SVO pairs
    const alreadyPaired = pairs.some(p =>
      (p.token_a === a.body && p.token_b === b.body) ||
      (p.token_a === b.body && p.token_b === a.body)
    );
    if (!alreadyPaired && a.body !== b.body) {
      pairs.push({
        token_a: a.body,
        token_b: b.body,
        relation_type: 'HARMONIZES_WITH',
        visual_modifier: 'soft shimmer',
        composed_at: new Date().toISOString()
      });
    }
  }

  return pairs;
}
