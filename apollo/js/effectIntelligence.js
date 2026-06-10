/**
 * ═══════════════════════════════════════════════════════════
 * effectIntelligence.js — Apollo's Effect Knowledge Base
 * ═══════════════════════════════════════════════════════════
 * 
 * The deck defines 22 cards with effects and triggers.
 * The triggers are executable — they fire when the card is played.
 * But Apollo's MIND needs to UNDERSTAND effects BEFORE playing them.
 * 
 * This module teaches the mind what every effect means:
 *   - What it does (strategic category)
 *   - When to play it (situational affinity)
 *   - What it costs and yields
 *   - How it changes the table state
 * 
 * This closes the "Effect: unknown" gap — not by registering
 * payloads (they're already in the triggers), but by giving
 * the mind strategic intelligence about every card in the deck.
 * ═══════════════════════════════════════════════════════════
 */

const EffectIntelligence = (function() {
  'use strict';

  /**
   * ── EFFECT CATEGORIES ──────────────────────────────────
   * Every effect falls into one of these strategic categories.
   * The mind uses categories to match effects to situations.
   */
  const CATEGORIES = {
    SPAWN:      'spawn',       // Creates new cards/tokens
    REMOVE:     'remove',      // Destroys or removes cards
    BUFF:       'buff',        // Increases value of cards
    DEBUFF:     'debuff',      // Decreases value of cards
    REVEAL:     'reveal',      // Reveals hidden information
    SHUFFLE:    'shuffle',     // Rearranges table positions
    RESURRECT:  'resurrect',   // Returns cards from graveyard
    SACRIFICE:  'sacrifice',   // Self-destroys for greater effect
    BIND:       'bind',        // Restricts or traps cards
    MERGE:      'merge',       // Combines cards
    COPY:       'copy',        // Duplicates cards/effects
    HAUNT:      'haunt',       // Applies void/debuff over time
    COMPLETE:   'complete',    // Cycle-ending mega effects
    REFRESH:    'refresh',     // Resets hand or resources
    MULTIPLY:   'multiply',    // Amplifies/multiplies effects
  };

  /**
   * ── EFFECT INTELLIGENCE MAP ─────────────────────────────
   * 
   * Every effect from major_arcana.json is defined here.
   * The mind uses this to understand what a card does
   * and when to play it strategically.
   * 
   * Structure:
   * {
   *   effectName: {
   *     category:     'spawn' | 'remove' | 'buff' | ...,
   *     description:  'Human-readable strategic description',
   *     targets:      'self' | 'neighbors' | 'all' | 'row' | 'single' | 'table' | 'graveyard',
   *     direction:    'offensive' | 'defensive' | 'synthesis' | 'clearing' | 'prophetic' | 'harmonic',
   *     valueImpact:  'high' | 'medium' | 'low' | 'negative' | 'variable',
   *     tableImpact:  'massive' | 'significant' | 'moderate' | 'minimal',
   *     bestWhen:     ['situation_type_1', 'situation_type_2'],
   *     worstWhen:    ['situation_type_1'],
   *     combosWith:   ['effect_name_1', 'effect_name_2'],
   *   }
   * }
   */
  const EFFECT_MAP = {

    // ══ 0 · THE FOOL — spawn_card ══
    spawn_card: {
      category: 'spawn',
      description: 'Generates an additional draw next turn by increasing mana.',
      targets: 'self',
      direction: 'prophetic',
      valueImpact: 'low',
      tableImpact: 'minimal',
      bestWhen: ['low_mana', 'empty_table', 'early_game'],
      worstWhen: ['table_near_full', 'high_mana'],
      combosWith: ['refresh_hand', 'illuminate_all'],
      manaGain: 1,
      priority: 4
    },

    // ══ I · THE MAGICIAN — copy_card ══
    copy_card: {
      category: 'copy',
      description: 'Gains air tokens when neighbors change. Grows stronger through adjacency.',
      targets: 'self',
      direction: 'synthesis',
      valueImpact: 'medium',
      tableImpact: 'moderate',
      bestWhen: ['dense_table', 'cluster', 'air_dominance'],
      worstWhen: ['empty_table', 'isolated_position'],
      combosWith: ['buff_neighbors', 'spread_element'],
      priority: 5
    },

    // ══ II · THE HIGH PRIESTESS — reveal_card ══
    reveal_card: {
      category: 'reveal',
      description: 'Deepens the veil — grants void tokens to adjacent cards each turn.',
      targets: 'neighbors',
      direction: 'prophetic',
      valueImpact: 'low',
      tableImpact: 'moderate',
      bestWhen: ['void_pressure', 'cluster', 'defensive_stance'],
      worstWhen: ['empty_table', 'need_immediate_value'],
      combosWith: ['haunt_card', 'bind_card'],
      priority: 4
    },

    // ══ III · THE EMPRESS — spread_element ══
    spread_element: {
      category: 'buff',
      description: 'Nourishes all cards of the same element on the table. +1 value to each.',
      targets: 'all_same_element',
      direction: 'harmonic',
      valueImpact: 'high',
      tableImpact: 'significant',
      bestWhen: ['element_dominance', 'cluster', 'mid_game'],
      worstWhen: ['empty_table', 'mixed_elements_only'],
      combosWith: ['illuminate_all', 'buff_neighbors'],
      priority: 7
    },

    // ══ IV · THE EMPEROR — buff_neighbors ══
    buff_neighbors: {
      category: 'buff',
      description: 'Commands adjacent cards — grants +2 value and air tokens to all neighbors.',
      targets: 'neighbors',
      direction: 'offensive',
      valueImpact: 'high',
      tableImpact: 'significant',
      bestWhen: ['dense_table', 'cluster', 'amplify'],
      worstWhen: ['empty_table', 'isolated_position'],
      combosWith: ['spread_element', 'illuminate_all'],
      priority: 8
    },

    // ══ V · THE HIEROPHANT — remove_card ══
    remove_card: {
      category: 'remove',
      description: 'When destroyed, takes a neighbor with him. Martyrdom with collateral.',
      targets: 'neighbors_on_death',
      direction: 'clearing',
      valueImpact: 'negative',
      tableImpact: 'significant',
      bestWhen: ['stale_card', 'table_near_full', 'crisis_full', 'past_warning'],
      worstWhen: ['empty_table', 'protect_high_value_neighbors'],
      combosWith: ['sacrifice_self', 'judge_table'],
      priority: 9
    },

    // ══ VI · THE LOVERS — merge_cards ══
    merge_cards: {
      category: 'merge',
      description: 'Charms adjacent cards with water tokens. Draws power through desire.',
      targets: 'neighbors',
      direction: 'synthesis',
      valueImpact: 'medium',
      tableImpact: 'moderate',
      bestWhen: ['dense_table', 'cluster', 'water_dominance'],
      worstWhen: ['empty_table', 'need_immediate_value'],
      combosWith: ['spread_element', 'haunt_card'],
      priority: 6
    },

    // ══ VII · THE CHARIOT — split_card ══
    split_card: {
      category: 'debuff',
      description: 'Hunts the highest-value enemy card — marks it with void. Sovereignty through targeting.',
      targets: 'single_strongest_enemy',
      direction: 'offensive',
      valueImpact: 'medium',
      tableImpact: 'moderate',
      bestWhen: ['strong_enemy', 'amplify', 'void_pressure'],
      worstWhen: ['empty_table', 'only_friendly_cards'],
      combosWith: ['remove_card', 'haunt_card'],
      childCount: 2,
      priority: 6
    },

    // ══ VIII · JUSTICE — multiply_effect ══
    multiply_effect: {
      category: 'multiply',
      description: 'Strategizes each turn — buffs the weakest adjacent card by +1. Compound growth.',
      targets: 'weakest_neighbor',
      direction: 'synthesis',
      valueImpact: 'high',
      tableImpact: 'significant',
      bestWhen: ['dense_table', 'cluster', 'mid_game', 'late_game'],
      worstWhen: ['empty_table', 'no_neighbors'],
      combosWith: ['buff_neighbors', 'spread_element', 'illuminate_all'],
      multiplier: 2,
      priority: 8
    },

    // ══ IX · THE HERMIT — reveal_card (earth variant) ══
    // NOTE: This is the second reveal_card. The Hermit's version grants self earth tokens.
    // The effect name is the same but behavior differs — handled by card-specific triggers.
    // For intelligence purposes, we note it as a self-buff variant.
    // (Already mapped under reveal_card above — the mind can check card.god for nuance.)

    // ══ X · WHEEL OF FORTUNE — shuffle_table ══
    shuffle_table: {
      category: 'shuffle',
      description: 'The Fates reshuffle — randomizes all card positions on the table.',
      targets: 'table',
      direction: 'prophetic',
      valueImpact: 'variable',
      tableImpact: 'massive',
      bestWhen: ['stale_positions', 'bad_adjacency', 'table_near_full', 'break_patterns'],
      worstWhen: ['perfect_setup', 'cluster_active', 'preserve_positions'],
      combosWith: ['illuminate_all', 'judge_table'],
      priority: 5
    },

    // ══ XI · STRENGTH — buff_self ══
    buff_self: {
      category: 'buff',
      description: 'Works through the night — gains +1 value per turn. Endurance engine.',
      targets: 'self',
      direction: 'defensive',
      valueImpact: 'high',
      tableImpact: 'moderate',
      bestWhen: ['early_game', 'long_game', 'defensive_stance', 'isolated_position'],
      worstWhen: ['table_near_full', 'need_immediate_impact'],
      combosWith: ['illuminate_all', 'buff_neighbors'],
      priority: 6
    },

    // ══ XII · THE HANGED MAN — sacrifice_self ══
    sacrifice_self: {
      category: 'sacrifice',
      description: 'Burns himself — all other cards gain +2 value and fire tokens. The ultimate gift.',
      targets: 'all_others',
      direction: 'clearing',
      valueImpact: 'high',
      tableImpact: 'massive',
      bestWhen: ['dense_table', 'many_low_value_cards', 'fire_surge', 'mid_game'],
      worstWhen: ['empty_table', 'only_high_value_cards', 'late_game_solo'],
      combosWith: ['resurrect_card', 'spread_element'],
      priority: 7
    },

    // ══ XIII · DEATH — remove_card (targeted) ══
    // NOTE: Death's remove_card targets the oldest card specifically.
    // The mind already handles remove_card well. Card-specific targeting
    // is in the trigger, not the effect name.
    // (Already mapped under remove_card above.)

    // ══ XIV · TEMPERANCE — refresh_hand ══
    refresh_hand: {
      category: 'refresh',
      description: "Hestia's hearth warms all — every card on table gains +1 value and fire tokens.",
      targets: 'all',
      direction: 'harmonic',
      valueImpact: 'high',
      tableImpact: 'significant',
      bestWhen: ['dense_table', 'low_mana', 'fire_surge', 'defensive_stance'],
      worstWhen: ['empty_table', 'only_one_card'],
      combosWith: ['illuminate_all', 'spread_element'],
      priority: 7
    },

    // ══ XV · THE DEVIL — bind_card ══
    bind_card: {
      category: 'bind',
      description: 'Hades binds — adjacent cards lose 1 value and gain void tokens. The underworld claims its due.',
      targets: 'neighbors',
      direction: 'offensive',
      valueImpact: 'medium',
      tableImpact: 'significant',
      bestWhen: ['dense_table', 'void_pressure', 'strong_enemy_neighbors', 'stale_card'],
      worstWhen: ['protect_friendly_neighbors', 'empty_table'],
      combosWith: ['haunt_card', 'remove_card'],
      priority: 6
    },

    // ══ XVI · THE TOWER — destroy_row ══
    destroy_row: {
      category: 'remove',
      description: 'Poseidon shakes — destroys all cards in his row. The wave does not negotiate.',
      targets: 'row',
      direction: 'clearing',
      valueImpact: 'high',
      tableImpact: 'massive',
      bestWhen: ['crisis_full', 'table_near_full', 'row_has_enemies', 'many_stale_cards'],
      worstWhen: ['row_has_valuable_allies', 'empty_row', 'preserve_setup'],
      combosWith: ['resurrect_card', 'judge_table'],
      priority: 9
    },

    // ══ XVII · THE STAR — resurrect_card ══
    resurrect_card: {
      category: 'resurrect',
      description: 'Persephone returns — brings a card back from the graveyard. Rebirth with a green prefix.',
      targets: 'graveyard',
      direction: 'synthesis',
      valueImpact: 'high',
      tableImpact: 'significant',
      bestWhen: ['graveyard_rich', 'empty_table', 'fresh_after_clear', 'mid_game'],
      worstWhen: ['graveyard_empty', 'table_near_full'],
      combosWith: ['sacrifice_self', 'destroy_row', 'judge_table'],
      priority: 8
    },

    // ══ XVIII · THE MOON — haunt_card ══
    haunt_card: {
      category: 'haunt',
      description: 'Melinoe walks — random adjacent card gains +2 void tokens per turn. Persistent haunting.',
      targets: 'random_neighbor',
      direction: 'offensive',
      valueImpact: 'low',
      tableImpact: 'moderate',
      bestWhen: ['void_pressure', 'dense_table', 'long_game', 'stale_card'],
      worstWhen: ['empty_table', 'no_neighbors'],
      combosWith: ['bind_card', 'reveal_card', 'remove_card'],
      priority: 5
    },

    // ══ XIX · THE SUN — illuminate_all ══
    illuminate_all: {
      category: 'buff',
      description: 'Apollo rises — all cards gain +1 value and fire tokens. Adjacent cards gain fire each turn.',
      targets: 'all',
      direction: 'offensive',
      valueImpact: 'high',
      tableImpact: 'massive',
      bestWhen: ['dense_table', 'fire_surge', 'void_pressure', 'any_situation'],
      worstWhen: ['empty_table'],
      combosWith: ['spread_element', 'buff_neighbors', 'refresh_hand', 'multiply_effect'],
      priority: 9
    },

    // ══ XX · JUDGEMENT — judge_table ══
    judge_table: {
      category: 'remove',
      description: 'The Judges weigh — removes all cards with value <= 1. Final accounting.',
      targets: 'all_low_value',
      direction: 'clearing',
      valueImpact: 'high',
      tableImpact: 'massive',
      bestWhen: ['many_low_value_cards', 'table_near_full', 'crisis_full', 'late_game'],
      worstWhen: ['all_high_value_cards', 'empty_table', 'preserve_low_value_setup'],
      combosWith: ['sacrifice_self', 'resurrect_card'],
      priority: 8
    },

    // ══ XXI · THE WORLD — complete_cycle ══
    complete_cycle: {
      category: 'complete',
      description: 'Gaia completes — every card gains +1 to all four elemental tokens AND +1 value. Integration.',
      targets: 'all',
      direction: 'harmonic',
      valueImpact: 'high',
      tableImpact: 'massive',
      bestWhen: ['dense_table', 'late_game', 'long_dominance', 'any_situation'],
      worstWhen: ['empty_table'],
      combosWith: ['illuminate_all', 'spread_element', 'multiply_effect', 'refresh_hand'],
      priority: 10
    },
  };

  /**
   * ── PUBLIC METHODS ─────────────────────────────────────
   */

  /**
   * Get the full intelligence for an effect.
   * @param {string} effectName - e.g. "illuminate_all"
   * @returns {object|null} The effect intelligence or null if unknown.
   */
  function getEffectIntel(effectName) {
    return EFFECT_MAP[effectName] || null;
  }

  /**
   * Get the strategic category of an effect.
   * @param {string} effectName
   * @returns {string} e.g. 'buff', 'remove', 'spawn'
   */
  function getCategory(effectName) {
    const intel = EFFECT_MAP[effectName];
    return intel ? intel.category : 'unknown';
  }

  /**
   * Get the primary strategic direction of an effect.
   * @param {string} effectName
   * @returns {string} 'offensive' | 'defensive' | 'synthesis' | 'clearing' | 'prophetic' | 'harmonic'
   */
  function getDirection(effectName) {
    const intel = EFFECT_MAP[effectName];
    return intel ? intel.direction : 'harmonic';
  }

  /**
   * Check if an effect is good for a given situation type.
   * @param {string} effectName
   * @param {string} situationType - e.g. 'crisis_full', 'graveyard_rich'
   * @returns {boolean}
   */
  function isGoodFor(effectName, situationType) {
    const intel = EFFECT_MAP[effectName];
    if (!intel) return false;
    return intel.bestWhen.includes(situationType);
  }

  /**
   * Get the priority of an effect (1-10, higher = more impactful).
   * @param {string} effectName
   * @returns {number}
   */
  function getPriority(effectName) {
    const intel = EFFECT_MAP[effectName];
    return intel ? intel.priority : 3;
  }

  /**
   * Rank playable cards by their strategic value given the current situation.
   * This is the method the mind should call during DECIDE.
   * 
   * @param {array} playableCards - Array of card objects (from obs.playable)
   * @param {array} situations - Array of situation objects (from interpret)
   * @returns {array} Playable cards sorted by strategic fit (best first)
   */
  function rankBySituation(playableCards, situations) {
    const situationTypes = situations.map(s => s.type);
    
    const scored = playableCards.map(card => {
      const intel = EFFECT_MAP[card.effect];
      if (!intel) return { card, score: 0, reason: 'unknown_effect' };

      let score = intel.priority * 10; // Base score from effect priority

      // Bonus for matching bestWhen to current situations
      for (const sitType of situationTypes) {
        if (intel.bestWhen.includes(sitType)) {
          score += 30; // Strong bonus for direct match
        }
        if (intel.worstWhen && intel.worstWhen.includes(sitType)) {
          score -= 40; // Strong penalty for anti-match
        }
      }

      // Element synergy bonus (handled by mind's existing logic, but we can hint)
      // Cost efficiency
      const costEfficiency = (card.value || 0) - (card.cost || 0);
      score += costEfficiency * 5;

      return {
        card,
        score,
        reason: `${card.effect} · base ${intel.priority} · category ${intel.category} · direction ${intel.direction}`,
        intel
      };
    });

    return scored.sort((a, b) => b.score - a.score);
  }

  /**
   * Get a human-readable description of what an effect does.
   * @param {string} effectName
   * @returns {string}
   */
  function describe(effectName) {
    const intel = EFFECT_MAP[effectName];
    return intel ? intel.description : `Unknown effect: "${effectName}". Apollo cannot see its nature.`;
  }

  /**
   * List all known effect names.
   * @returns {string[]}
   */
  function getKnownEffects() {
    return Object.keys(EFFECT_MAP);
  }

  /**
   * Check if an effect is known to the intelligence module.
   * @param {string} effectName
   * @returns {boolean}
   */
  function isKnown(effectName) {
    return !!EFFECT_MAP[effectName];
  }

  /**
   * Get coverage stats — how many of the 22 cards have effect intelligence?
   * @returns {object} { known, total, unknown, percentComplete, unknownEffects }
   */
  function getCoverage() {
    // Extract unique effect names from the cards we've mapped
    const knownEffects = Object.keys(EFFECT_MAP);
    
    // The deck has these unique effect names (some reused across cards):
    const allEffectsInDeck = [
      'spawn_card', 'copy_card', 'reveal_card', 'spread_element',
      'buff_neighbors', 'remove_card', 'merge_cards', 'split_card',
      'multiply_effect', 'shuffle_table', 'buff_self', 'sacrifice_self',
      'refresh_hand', 'bind_card', 'destroy_row', 'resurrect_card',
      'haunt_card', 'illuminate_all', 'judge_table', 'complete_cycle'
    ];
    
    const unknownEffects = allEffectsInDeck.filter(e => !knownEffects.includes(e));
    
    return {
      known: knownEffects.length,
      total: allEffectsInDeck.length,
      unknown: unknownEffects.length,
      percentComplete: Math.round((knownEffects.length / allEffectsInDeck.length) * 100),
      unknownEffects
    };
  }

  /**
   * ── MIND INTEGRATION POINT ──────────────────────────────
   * 
   * Call this in apolloMind.decide() to get a smarter card choice:
   * 
   *   const ranked = EffectIntelligence.rankBySituation(playable, situations);
   *   const bestMatch = ranked[0]; // Highest strategic score
   *   
   *   // Fallback if no intel available:
   *   if (bestMatch.score <= 0) {
   *     // Use existing mind logic
   *   } else {
   *     chosen = bestMatch.card;
   *     reason = bestMatch.reason;
   *   }
   */

  // ── PUBLIC API ──────────────────────────────────────────

  return {
    // Core intelligence
    getEffectIntel,
    getCategory,
    getDirection,
    getPriority,
    isGoodFor,
    
    // Decision support
    rankBySituation,
    
    // Utility
    describe,
    isKnown,
    getKnownEffects,
    getCoverage,
    
    // Constants
    CATEGORIES,
    EFFECT_MAP
  };

})();

// ── EXPORT ────────────────────────────────────────────────
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EffectIntelligence;
}
if (typeof window !== 'undefined') {
  window.EffectIntelligence = EffectIntelligence;
}
