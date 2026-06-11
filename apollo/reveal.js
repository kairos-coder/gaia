/**
 * APOLLO v0.1 — Semantic Compiler for Ambiguity
 * Domain: clarity, truth, interpretation, revelation
 * 
 * Input:  apollo.reveal.request event
 * Output: apollo.reveal.response event
 */

const Apollo = {
  version: '0.1',
  domain: 'clarity',
  
  // Card → symbolic vector mapping table
  // In v1, this loads from apollo_deck.json
  // In v0.1, it's hardcoded as the reference implementation
  cardMap: {
    // SUN SUIT
    'apollo_01': { name: 'The Rising',     suit: 'sun', keywords: ['emergence', 'dawn', 'beginning', 'light'],         valence: 'positive', motion: 'outward' },
    'apollo_02': { name: 'The Apex',       suit: 'sun', keywords: ['clarity', 'revelation', 'fullness', 'demand'],     valence: 'positive', motion: 'still' },
    'apollo_03': { name: 'The Descent',    suit: 'sun', keywords: ['settling', 'wisdom', 'reflection', 'integration'], valence: 'neutral',  motion: 'inward' },
    'apollo_04': { name: 'The Eclipse',    suit: 'sun', keywords: ['shadow', 'occlusion', 'hidden_revelation', 'liminal'], valence: 'neutral', motion: 'inward' },
    // SONGS SUIT
    'apollo_05': { name: 'The Paean',      suit: 'songs', keywords: ['celebration', 'victory', 'gratitude', 'joy'],     valence: 'positive', motion: 'outward' },
    'apollo_06': { name: 'The Lament',     suit: 'songs', keywords: ['grief', 'beauty', 'sorrow', 'alchemy'],          valence: 'negative', motion: 'inward' },
    'apollo_07': { name: 'The War Hymn',   suit: 'songs', keywords: ['conflict', 'intensity', 'boundary', 'will'],     valence: 'negative', motion: 'outward' },
    'apollo_08': { name: 'The Wanderer\'s Air', suit: 'songs', keywords: ['journey', 'detachment', 'movement', 'freedom'], valence: 'neutral', motion: 'outward' },
    'apollo_09': { name: 'The Lover\'s Mode',   suit: 'songs', keywords: ['longing', 'elevation', 'desire', 'reach'],   valence: 'positive', motion: 'upward' },
    'apollo_10': { name: 'The Night Ode',  suit: 'songs', keywords: ['darkness', 'beauty_in_shadow', 'depth', 'melancholy'], valence: 'negative', motion: 'inward' },
    'apollo_11': { name: 'The Threshold Song', suit: 'songs', keywords: ['liminal', 'becoming', 'instability', 'edge'], valence: 'neutral', motion: 'still' },
    // SCRIPTS SUIT
    'apollo_12': { name: 'Know Thyself',   suit: 'scripts', keywords: ['self-knowledge', 'origin', 'identity', 'foundation'], valence: 'neutral', motion: 'inward' },
    'apollo_13': { name: 'Nothing in Excess', suit: 'scripts', keywords: ['balance', 'precision', 'moderation', 'measure'], valence: 'neutral', motion: 'still' },
    'apollo_14': { name: 'Certainty Brings Ruin', suit: 'scripts', keywords: ['doubt', 'protection', 'humility', 'openness'], valence: 'negative', motion: 'inward' },
    'apollo_15': { name: 'The Arrow Flies True', suit: 'scripts', keywords: ['clarity', 'aim', 'intention', 'precision'], valence: 'positive', motion: 'outward' },
    'apollo_16': { name: 'The Pythia Speaks', suit: 'scripts', keywords: ['revelation', 'inner_truth', 'oracle', 'receptivity'], valence: 'neutral', motion: 'inward' },
    'apollo_17': { name: 'The Laurel',     suit: 'scripts', keywords: ['victory', 'pursuit', 'transformation', 'crown'], valence: 'positive', motion: 'outward' },
    'apollo_18': { name: 'The Silver Bow', suit: 'scripts', keywords: ['distance', 'care', 'wisdom', 'non-attachment'], valence: 'neutral', motion: 'still' },
    'apollo_19': { name: 'The God Himself', suit: 'scripts', keywords: ['apollo_unmasked', 'pure_light', 'revelation', 'arrival'], valence: 'positive', motion: 'still' },
  },

  /**
   * Synthesize a narrative from card vectors
   */
  synthesize(vectors) {
    if (vectors.length === 0) {
      return {
        synthesis: 'No symbols received. The light reveals nothing because nothing was offered.',
        confidence: 0
      };
    }

    // Gather keywords
    const allKeywords = vectors.flatMap(v => v.keywords);
    const motions = vectors.map(v => v.motion);
    const valences = vectors.map(v => v.valence);

    // Motion analysis
    const uniqueMotions = [...new Set(motions)];
    let motionReading = '';
    if (uniqueMotions.length === 1) {
      const motion = uniqueMotions[0];
      const motionPhrases = {
        'inward': 'The energy is contracting. This is a time for reflection, not action.',
        'outward': 'The energy is expanding. The moment calls for expression and movement.',
        'still': 'The energy is holding. The center is steady. Do not rush the stillness.',
        'upward': 'The energy is ascending. Something is being elevated beyond its current form.'
      };
      motionReading = motionPhrases[motion] || 'The motion is unclear.';
    } else if (uniqueMotions.includes('inward') && uniqueMotions.includes('outward')) {
      motionReading = 'The cards describe a tension between contraction and expansion. The way forward is not one or the other — it is a rhythm between them.';
    } else {
      motionReading = 'The motion across the cards is complex. Multiple directions suggest a system in transition.';
    }

    // Valence analysis
    const positiveCount = valences.filter(v => v === 'positive').length;
    const negativeCount = valences.filter(v => v === 'negative').length;
    const neutralCount = valences.filter(v => v === 'neutral').length;
    let valenceReading = '';
    if (negativeCount > positiveCount) {
      valenceReading = 'The cards lean toward shadow. But shadow is not absence — it is light shaped by form. What is difficult carries instruction.';
    } else if (positiveCount > negativeCount) {
      valenceReading = 'The cards lean toward light. But light can blind as easily as it can illuminate. Receive the brightness without being consumed by it.';
    } else {
      valenceReading = 'The forces are balanced. Neither light nor shadow dominates. The system is in equilibrium — which means choice has real weight now.';
    }

    // Domain analysis
    const suits = vectors.map(v => v.suit);
    const uniqueSuits = [...new Set(suits)];
    let suitReading = '';
    if (uniqueSuits.length === 1) {
      const suit = uniqueSuits[0];
      const suitPhrases = {
        'sun': 'The solar domain dominates — this is a question of light, time, and visibility.',
        'songs': 'The musical domain dominates — this is a question of emotion, resonance, and expression.',
        'scripts': 'The oracular domain dominates — this is a question of truth, identity, and the word that is spoken.'
      };
      suitReading = suitPhrases[suit] || '';
    } else if (uniqueSuits.length >= 2) {
      suitReading = `The domains of ${uniqueSuits.join(' and ')} are both active. The question spans multiple layers of reality. Integration is the work.`;
    }

    // Full synthesis
    const synthesis = `${motionReading} ${valenceReading} ${suitReading}`.trim();
    
    // Confidence based on how clean the vectors are
    const confidence = uniqueMotions.length === 1 ? 0.8 :
                       uniqueMotions.length === 2 ? 0.65 : 0.5;

    return { synthesis, confidence: Math.round(confidence * 100) / 100 };
  },

  /**
   * Build axis from card keywords
   */
  buildAxis(keywords) {
    if (keywords.length >= 2) {
      return `${keywords[0]} / ${keywords[1]} / ${keywords[keywords.length - 1]}`;
    }
    return keywords[0] || 'unknown';
  },

  /**
   * Build individual card meaning
   */
  buildMeaning(vectors) {
    if (vectors.length === 0) return 'No symbols to interpret.';
    
    const allKeywords = vectors.flatMap(v => v.keywords);
    const motions = vectors.map(v => v.motion);
    const names = vectors.map(v => v.name);

    // If single card
    if (vectors.length === 1) {
      const v = vectors[0];
      const motionPhrases = {
        'inward': 'turn your attention within',
        'outward': 'express what is emerging',
        'still': 'hold the center and wait',
        'upward': 'allow yourself to be lifted'
      };
      return `${v.name} arrives alone. The instruction is to ${motionPhrases[v.motion] || 'attend closely'}.`;
    }

    // Multiple cards
    const motionPattern = motions.join(' → ');
    return `${names.join(' and ')} converge. The pattern is ${motionPattern}.`;
  },

  /**
   * TRANSFORM — The core function
   * Input:  apollo.reveal.request event
   * Output: apollo.reveal.response event (plain object, emission handled by caller)
   */
  transform(event) {
    // Perception filter
    if (event.type !== 'apollo.reveal.request') return null;
    if (!event.payload || !event.payload.cards) return null;

    const { cards, intent = 'clarity' } = event.payload;

    // Resolve card IDs to vectors
    const vectors = cards
      .map(cardId => this.cardMap[cardId])
      .filter(Boolean);

    if (vectors.length === 0) return null;

    // Build reading
    const reading = vectors.map(v => ({
      card: v.name,
      axis: this.buildAxis(v.keywords),
      meaning: this.buildMeaning(vectors)
    }));

    const { synthesis, confidence } = this.synthesize(vectors);

    return {
      id: `event_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      type: 'apollo.reveal.response',
      source: 'apollo.v0.1',
      payload: {
        reading,
        synthesis,
        confidence
      },
      context: {
        system: event.context?.system || 'divination',
        deck: event.context?.deck || 'apollonian',
        resolved_by: 'apollo.v0.1',
        intent_resolved: intent
      },
      lineage: [event.id],
      status: 'resolved'
    };
  }
};

// Export for use by Olympian Bridge or direct invocation
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Apollo;
}
