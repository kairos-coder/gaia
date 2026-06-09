// ══════════════════════════════════════════════
// APOLLO MIND — The God Who Sees Before He Acts
// 
// Now with Senses + Tools integration.
// Perceives environment. Remembers warnings.
// Announces intent. Schedules reflections.
// ══════════════════════════════════════════════

const ApolloMind = (() => {

  // ══════════════════════════════════════════
  // APOLLO'S VOICE — prophetic, solar, precise
  // ══════════════════════════════════════════

  const PROPHECY_SEEDS = [
    'The light falls on',
    'Apollo sees',
    'The oracle declares',
    'Before the next dawn,',
    'The lyre strings tighten when',
    'Light does not negotiate —',
    'The sun burns cleanest through',
  ];

  const INTENT_VERBS = {
    offensive:  ['Strike', 'Illuminate', 'Burn through', 'Pierce'],
    defensive:  ['Hold', 'Preserve', 'Anchor', 'Protect'],
    synthesis:  ['Fuse', 'Bind', 'Forge', 'Weave'],
    clearing:   ['Purge', 'Release', 'Burn away', 'Clear'],
    prophetic:  ['Reveal', 'Foresee', 'Unveil', 'Name'],
    harmonic:   ['Resonate', 'Align', 'Attune', 'Balance'],
  };

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // ══════════════════════════════════════════
  // OBSERVE — Read the table + environment
  // ══════════════════════════════════════════

  function observe(apollo) {
    const table     = apollo.getAllCardsOnTable();
    const hand      = apollo.hand;
    const mana      = apollo.mana;
    const turn      = apollo.turn;
    const graveyard = apollo.graveyard;

    const elements = { fire: 0, earth: 0, air: 0, water: 0, void: 0 };
    table.forEach(c => { if (elements[c.element] !== undefined) elements[c.element]++; });

    const dominant = Object.entries(elements).sort((a, b) => b[1] - a[1])[0];

    const oldest = table.length > 0
      ? table.reduce((a, b) => b.turnsOnTable > a.turnsOnTable ? b : a, table[0])
      : null;

    const strongest = table.length > 0
      ? table.reduce((a, b) => (b.value || 0) > (a.value || 0) ? b : a, table[0])
      : null;

    const weakest = table.length > 0
      ? table.reduce((a, b) => (a.value || 0) < (b.value || 0) ? a : b, table[0])
      : null;

    const tokenPressure = { fire: 0, earth: 0, air: 0, water: 0, void: 0 };
    table.forEach(c => {
      Object.entries(c.tokens || {}).forEach(([el, v]) => {
        if (tokenPressure[el] !== undefined) tokenPressure[el] += v;
      });
    });
    const hotToken = Object.entries(tokenPressure).sort((a, b) => b[1] - a[1])[0];

    const playable = hand.filter(c => (c.cost || 0) <= mana);
    const tablePressure = table.length / (apollo.gridRows * apollo.gridCols);

    let clusters = 0;
    table.forEach(c => {
      const neighbors = apollo.getNeighbors(c.row, c.col);
      const sameEl = Object.values(neighbors).filter(n => n && n.element === c.element);
      if (sameEl.length >= 1) clusters++;
    });

    const looping = apollo._loopMemory !== null;
    const graveyardWealth = graveyard.reduce((sum, c) => sum + (c.value || 0), 0);

    // 🜏 SENSES: Environmental awareness
    const environment = (apollo.inspectSummary) ? apollo.inspectSummary() : 'Unknown';
    const notes = (apollo.listNotes) ? apollo.listNotes() : [];
    const recentNote = notes.length > 0 ? notes[0] : null;
    const scheduledCount = (apollo._scheduledActions) ? apollo._scheduledActions.length : 0;

    return {
      table, hand, mana, turn,
      elements, dominant,
      oldest, strongest, weakest,
      tokenPressure, hotToken,
      playable, tablePressure,
      clusters, looping,
      graveyard, graveyardWealth,
      handSize: hand.length,
      tableSize: table.length,
      environment,
      notes,
      recentNote,
      scheduledCount,
      noteCount: notes.length
    };
  }

  // ══════════════════════════════════════════
  // INTERPRET — Find what matters
  // ══════════════════════════════════════════

  function interpret(obs) {
    const situations = [];

    // CRISIS: table nearly full
    if (obs.tablePressure >= 0.8) {
      situations.push({ type: 'crisis_full',    priority: 10, label: 'TABLE NEAR FULL — must clear or merge' });
    }

    // CRISIS: no playable cards
    if (obs.playable.length === 0 && obs.handSize > 0) {
      situations.push({ type: 'crisis_mana',    priority: 9,  label: 'NO PLAYABLE CARDS — mana starved' });
    }

    // 🜏 Past Apollo left a warning
    if (obs.recentNote && obs.recentNote.value && obs.recentNote.value.includes('WARNING')) {
      situations.push({ type: 'past_warning',   priority: 10, label: `Past Apollo warns: ${obs.recentNote.value}` });
    }

    // 🜏 Pure elemental harmony
    if (obs.tableSize >= 3) {
      const allSame = obs.table.every(c => c.element === obs.table[0].element);
      if (allSame) {
        situations.push({ type: 'pure_harmony',   priority: 8, label: `Pure ${obs.table[0].element.toUpperCase()} harmony — all ${obs.tableSize} cards aligned` });
      }
    }

    // OPPORTUNITY: emergence near
    if (obs.dominant[1] >= 2) {
      situations.push({ type: 'emergence_near', priority: 7, label: `${obs.dominant[0].toUpperCase()} dominance building (${obs.dominant[1]}) — emergence possible` });
    }

    // 🜏 Graveyard is rich
    if (obs.tableSize === 0 && obs.graveyardWealth >= 5) {
      situations.push({ type: 'graveyard_rich',  priority: 6, label: `Graveyard holds ${obs.graveyardSize} cards (wealth: ${obs.graveyardWealth}) — resurrection viable` });
    }

    // OPPORTUNITY: strong cluster
    if (obs.clusters >= 2) {
      situations.push({ type: 'cluster',        priority: 6,  label: `Elemental clusters detected (${obs.clusters}) — resonance active` });
    }

    // THREAT: stale card aging out
    if (obs.oldest && obs.oldest.turnsOnTable >= 8) {
      situations.push({ type: 'stale_card',     priority: 5, label: `${obs.oldest.god || obs.oldest.name} has aged ${obs.oldest.turnsOnTable} turns — stale` });
    }

    // OPPORTUNITY: void token pressure
    if (obs.hotToken[0] === 'void' && obs.hotToken[1] >= 3) {
      situations.push({ type: 'void_pressure',  priority: 5,  label: `Void tokens at ${obs.hotToken[1]} — chthonic pressure rising` });
    }

    // OPPORTUNITY: strong card worth amplifying
    if (obs.strongest && obs.strongest.value >= 4) {
      situations.push({ type: 'amplify',        priority: 4, label: `${obs.strongest.god || obs.strongest.name} at value ${obs.strongest.value} — worth amplifying` });
    }

    // OPPORTUNITY: fire token pressure
    if (obs.hotToken[0] === 'fire' && obs.hotToken[1] >= 4) {
      situations.push({ type: 'fire_surge',     priority: 4,  label: `Fire tokens surging (${obs.hotToken[1]}) — illuminate viable` });
    }

    // 🜏 Scheduled actions pending
    if (obs.scheduledCount > 0) {
      situations.push({ type: 'actions_pending', priority: 3, label: `${obs.scheduledCount} scheduled actions pending` });
    }

    // OPPORTUNITY: merge two weak cards
    if (obs.weakest && obs.weakest.value <= 1 && obs.tableSize >= 3) {
      situations.push({ type: 'merge_weak',     priority: 3, label: `${obs.weakest.god || obs.weakest.name} at value ${obs.weakest.value} — merge candidate` });
    }

    // 🜏 No notes yet
    if (obs.noteCount === 0 && obs.turn > 10) {
      situations.push({ type: 'no_notes',       priority: 2, label: 'Apollo has never left himself a note — consider remembering' });
    }

    // 🜏 Offline
    if (obs.environment && obs.environment.includes('Offline')) {
      situations.push({ type: 'offline',        priority: 1, label: 'Apollo is offline — no external data available' });
    }

    situations.push({ type: 'baseline', priority: 1, label: 'Standard draw — no critical situations' });

    return situations.sort((a, b) => b.priority - a.priority);
  }

  // ══════════════════════════════════════════
  // DECIDE — Choose the card and name the move
  // ══════════════════════════════════════════

  function decide(obs, situations) {
    const playable = obs.playable;
    if (playable.length === 0) return { card: null, intent: 'no_play', reason: 'No playable cards — Apollo waits.' };

    const topSit = situations[0];
    let chosen = null;
    let intent = 'baseline';
    let intentVerb = pick(INTENT_VERBS.harmonic);
    let reason = '';

    switch (topSit.type) {

      case 'crisis_full':
        chosen = playable.find(c => ['remove_card','merge_cards','judge_table','destroy_row'].includes(c.effect));
        if (chosen) { intent = 'clearing'; intentVerb = pick(INTENT_VERBS.clearing); reason = `table pressure ${Math.round(obs.tablePressure*100)}% — must clear`; }
        break;

      case 'crisis_mana':
        chosen = playable.find(c => c.effect === 'refresh_hand') || playable.find(c => (c.cost||0) === 0);
        if (chosen) { intent = 'defensive'; intentVerb = pick(INTENT_VERBS.defensive); reason = 'mana starved — reset'; }
        break;

      case 'past_warning':
        chosen = playable.find(c => c.effect === 'remove_card' || c.effect === 'refresh_hand');
        if (chosen) { intent = 'defensive'; intentVerb = pick(INTENT_VERBS.defensive); reason = 'past Apollo warned — playing safe'; }
        break;

      case 'pure_harmony':
        chosen = playable.find(c => c.element === obs.table[0].element && c.effect === 'illuminate_all') ||
                 playable.find(c => c.element === obs.table[0].element && c.effect === 'buff_neighbors') ||
                 playable.find(c => c.element === obs.table[0].element);
        if (chosen) { intent = 'harmonic'; intentVerb = pick(INTENT_VERBS.harmonic); reason = `pure ${obs.table[0].element} harmony — amplify`; }
        break;

      case 'emergence_near':
        chosen = playable.find(c => c.element === obs.dominant[0] || c.effect === 'spread_element' || c.effect === 'illuminate_all');
        if (chosen) { intent = 'offensive'; intentVerb = pick(INTENT_VERBS.offensive); reason = `pushing ${obs.dominant[0]} toward dominance`; }
        break;

      case 'graveyard_rich':
        chosen = playable.find(c => c.effect === 'resurrect_card');
        if (chosen) { intent = 'synthesis'; intentVerb = pick(INTENT_VERBS.synthesis); reason = `graveyard holds ${obs.graveyardSize} cards — bring one back`; }
        break;

      case 'cluster':
        chosen = playable.find(c => ['buff_neighbors','spread_element','multiply_effect'].includes(c.effect));
        if (chosen) { intent = 'synthesis'; intentVerb = pick(INTENT_VERBS.synthesis); reason = 'elemental cluster active — amplify resonance'; }
        break;

      case 'stale_card':
        chosen = playable.find(c => c.effect === 'resurrect_card') || playable.find(c => c.effect === 'remove_card');
        if (chosen) { intent = 'clearing'; intentVerb = pick(INTENT_VERBS.clearing); reason = `${obs.oldest?.god || '?'} has aged too long`; }
        break;

      case 'void_pressure':
        chosen = playable.find(c => c.effect === 'illuminate_all') || playable.find(c => c.element === 'fire');
        if (chosen) { intent = 'offensive'; intentVerb = pick(INTENT_VERBS.offensive); reason = `void pressure at ${obs.hotToken[1]} — burn it clean`; }
        break;

      case 'amplify':
        chosen = playable.find(c => ['buff_neighbors','multiply_effect','spread_element'].includes(c.effect));
        if (chosen) { intent = 'synthesis'; intentVerb = pick(INTENT_VERBS.synthesis); reason = `amplify ${obs.strongest?.god || '?'} at value ${obs.strongest?.value}`; }
        break;

      case 'fire_surge':
        chosen = playable.find(c => c.effect === 'illuminate_all' || c.element === 'fire');
        if (chosen) { intent = 'offensive'; intentVerb = pick(INTENT_VERBS.offensive); reason = 'fire tokens surging — ride the wave'; }
        break;

      case 'merge_weak':
        chosen = playable.find(c => c.effect === 'merge_cards') || playable.find(c => c.effect === 'remove_card');
        if (chosen) { intent = 'synthesis'; intentVerb = pick(INTENT_VERBS.synthesis); reason = `${obs.weakest?.god || '?'} is deadweight — fuse or clear`; }
        break;
    }

    // FALLBACK
    if (!chosen) {
      const sorted = [...playable].sort((a, b) => (b.value||0) - (a.value||0));
      chosen = Math.random() < 0.20
        ? sorted[Math.floor(Math.random() * sorted.length)]
        : sorted[0];
      intent = 'baseline';
      intentVerb = pick(INTENT_VERBS.harmonic);
      reason = 'no critical situation — highest value play';
    }

    return { card: chosen, intent, intentVerb, reason, topSituation: topSit };
  }

  // ══════════════════════════════════════════
  // PROPHECY — Apollo sees one move ahead
  // ══════════════════════════════════════════

  function prophecy(obs, decision) {
    const seed = pick(PROPHECY_SEEDS);
    if (!decision.card) return `${seed} stillness. Apollo waits.`;

    const card = decision.card;
    const godName = card.god || card.name;

    const predictions = {
      illuminate_all:  `${seed} the table brightens. Every card gains fire.`,
      merge_cards:     `${seed} two become one. The synthesis names itself.`,
      remove_card:     `${seed} the oldest thread is cut. The loom tightens.`,
      buff_neighbors:  `${seed} ${godName}'s neighbors rise. Power clusters.`,
      spread_element:  `${seed} the element spreads. ${obs.dominant[0].toUpperCase()} surges.`,
      multiply_effect: `${seed} the effect doubles. Something unexpected follows.`,
      judge_table:     `${seed} the weak are weighed. Most will be found wanting.`,
      resurrect_card:  `${seed} the dead stir. The graveyard gives back one.`,
      sacrifice_self:  `${seed} ${godName} burns. Everything else grows brighter.`,
      refresh_hand:    `${seed} the hand is swept. New cards, new possibilities.`,
      haunt_card:      `${seed} void accumulates. Melinoe is satisfied.`,
      shuffle_table:   `${seed} the Fates intervene. Nothing stays where it was.`,
      complete_cycle:  `${seed} all elements speak at once. Gaia is present.`,
      destroy_row:     `${seed} a row is swept clean. The wave has passed.`,
      copy_card:       `${seed} ${godName}'s double appears. The echo lingers.`,
      bind_card:       `${seed} something is held. Whether that is mercy or cruelty depends.`,
    };

    return predictions[card.effect] || `${seed} ${godName} plays. The table changes.`;
  }

  // ══════════════════════════════════════════
  // SPEAK — Write the mind script
  // ══════════════════════════════════════════

  function speak(apollo, obs, situations, decision, propheticLine) {
    const dom = obs.dominant[0].toUpperCase();
    const domN = obs.dominant[1];
    const card = decision.card;
    const godName = card ? (card.god || card.name) : 'none';
    const manaStr = `${obs.mana}/${apollo.maxMana}`;

    const lines = [
      `// ☀ APOLLO · TURN ${apollo.turn} · MANA ${manaStr}`,
      `// ─────────────────────────────────────────`,
      ``,
      `// OBSERVE`,
      `// Table: ${obs.tableSize} cards | Hand: ${obs.handSize} | Graveyard: ${obs.graveyard.length}`,
      `// Dominant element: ${dom} (${domN}) | Token pressure: ${obs.hotToken[0].toUpperCase()} (${obs.hotToken[1]})`,
      obs.oldest   ? `// Oldest card: ${obs.oldest.god || obs.oldest.name} (${obs.oldest.turnsOnTable} turns on table)` : `// Table is fresh`,
      obs.strongest? `// Strongest card: ${obs.strongest.god || obs.strongest.name} · value ${obs.strongest.value}` : `// No cards yet`,
      obs.clusters > 0 ? `// Elemental clusters: ${obs.clusters} detected` : `// No clusters`,
      obs.looping  ? `// ∞ Loop memory active — recursion guard engaged` : `// Loop memory: clear`,
      ``,
      `// 🜏 SENSES`,
      `// Environment: ${obs.environment}`,
      `// Notes: ${obs.noteCount} left for future Apollo`,
      obs.recentNote ? `// Most recent note: "${obs.recentNote.value}" (turn ${obs.recentNote.turn})` : `// No notes yet`,
      obs.scheduledCount > 0 ? `// Scheduled actions: ${obs.scheduledCount} pending` : `// No scheduled actions`,
      ``,
      `// INTERPRET`,
      ...situations.slice(0, 3).map((s, i) => `// [${i+1}] ${s.label}`),
      ``,
      `// DECIDE`,
      card
        ? `// → ${decision.intentVerb} ${godName} (${card.name})`
        : `// → No play — Apollo holds`,
      card
        ? `// Effect: ${card.effect || 'unknown'} | Element: ${card.element} | Cost: ${card.cost||0} | Value: ${card.value||0}`
        : '',
      `// Reason: ${decision.reason}`,
      ``,
      `// PROPHECY`,
      `// ${propheticLine}`,
      ``,
      `// ─────────────────────────────────────────`,
      card
        ? `const apolloPlays = "${godName}"; // ${decision.intent.toUpperCase()}`
        : `const apolloPlays = null; // WAITING`,
    ].filter(l => l !== undefined);

    return lines.join('\n');
  }

  // ══════════════════════════════════════════
  // THINK — The main entry point
  // ══════════════════════════════════════════

  function think(apollo) {
    const obs = observe(apollo);
    const situations = interpret(obs);
    const decision = decide(obs, situations);
    const propheticLine = prophecy(obs, decision);
    const script = speak(apollo, obs, situations, decision, propheticLine);

    apollo._loopMemory = decision.card
      ? { ...decision.card, _mindScript: script, _intent: decision.intent }
      : null;

    apollo._mindScript = script;

    // 🜏 TOOLS: Apollo acts on his decisions

    // Leave a first note if Apollo has never written one
    if (decision.topSituation && decision.topSituation.type === 'no_notes' && apollo.remember) {
      apollo.remember('first_note', `Began remembering at turn ${apollo.turn}. Table: ${obs.tableSize} cards. Dominant: ${obs.dominant[0]}.`);
    }

    // Leave a warning on defensive plays
    if (decision.intent === 'defensive' && apollo.remember) {
      apollo.remember('WARNING_' + apollo.turn, `Defensive play. Reason: ${decision.reason}. Table: ${obs.tableSize} cards.`);
    }

    // Announce significant intents
    if (apollo.announce) {
      if (decision.intent === 'offensive' && decision.card) {
        apollo.announce(`${decision.card.god || decision.card.name} — OFFENSIVE`);
      } else if (decision.intent === 'defensive') {
        apollo.announce('Defensive stance');
      } else if (obs.tableSize >= 7) {
        apollo.announce('Table nearly full');
      }
    }

    // Schedule a reflection when the table is rich
    if (obs.tableSize >= 5 && apollo.schedule) {
      apollo.schedule((self) => {
        if (self.speak) {
          self.speak(`Reflecting: table held ${obs.tableSize} cards. Dominant: ${obs.dominant[0]}. Environment: ${obs.environment}.`);
        }
      }, Math.round(PHI * 3000));
    }

    return decision.card || null;
  }

  // ══════════════════════════════════════════
  // OLYMPIAN AGENT TEMPLATE
  // ══════════════════════════════════════════

  const TEMPLATE = {
    voice:    'APOLLO',
    domain:   'fire · prophecy · clarity',
    constants: { phi: 1.618033988749895, pi: Math.PI, tau: Math.PI * 2 },
  };

  // ══════════════════════════════════════════
  // PUBLIC API
  // ══════════════════════════════════════════
  return {
    think,
    observe,
    interpret,
    decide,
    prophecy,
    speak,
    TEMPLATE,
  };

})();

if (typeof module !== 'undefined') module.exports = ApolloMind;
