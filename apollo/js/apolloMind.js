// ══════════════════════════════════════════════
// APOLLO MIND — The God Who Sees Before He Acts
//
// Fully integrated with ApolloSenses + ApolloTools.
//
// SENSES used to:
//   · Read and act on past notes (recall/listNotes)
//   · Detect environment state (inspectSummary)
//   · Feel the table as a sensory snapshot (feel)
//
// TOOLS used to:
//   · speak()    → voice significant turns aloud
//   · remember() → write strategic notes for future Apollo
//   · forget()   → prune stale warnings
//   · schedule() → one-shot reflections on key events
//   · announce() → update tab title on meaningful state
//
// Notes Apollo writes and reads:
//   · "last_emergence"    → what element emerged and when
//   · "last_full_row"     → row cleared and turn
//   · "last_clear"        → table wipe turn + graveyard size
//   · "danger_stale"      → card aging warning
//   · "WARNING_<turn>"    → defensive play marker
//   · "dominant_run"      → how long current element has held
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
  // MEMORY HELPERS — read past Apollo's notes
  // ══════════════════════════════════════════

  // Parse a stored note safely; returns { value, turn, timestamp } or null
  function readNote(apollo, key) {
    if (!apollo.recall) return null;
    return apollo.recall(key);
  }

  // Get all notes, categorised
  function readAllNotes(apollo) {
    if (!apollo.listNotes) return [];
    return apollo.listNotes();
  }

  // How many turns ago was a note written?
  function turnsAgo(note, currentTurn) {
    if (!note) return Infinity;
    return currentTurn - (note.turn || 0);
  }

  // ══════════════════════════════════════════
  // OBSERVE — Read the table + environment + memory
  // ══════════════════════════════════════════

  function observe(apollo) {
    const table     = apollo.getAllCardsOnTable();
    const hand      = apollo.hand;
    const mana      = apollo.mana;
    const turn      = apollo.turn;
    const graveyard = apollo.graveyard;

    // Elemental counts on table
    const elements = { fire: 0, earth: 0, air: 0, water: 0, void: 0 };
    table.forEach(c => { if (elements[c.element] !== undefined) elements[c.element]++; });
    const dominant = Object.entries(elements).sort((a, b) => b[1] - a[1])[0];

    // Card extremes
    const oldest = table.length > 0
      ? table.reduce((a, b) => b.turnsOnTable > a.turnsOnTable ? b : a, table[0])
      : null;
    const strongest = table.length > 0
      ? table.reduce((a, b) => (b.value || 0) > (a.value || 0) ? b : a, table[0])
      : null;
    const weakest = table.length > 0
      ? table.reduce((a, b) => (a.value || 0) < (b.value || 0) ? a : b, table[0])
      : null;

    // Token pressure
    const tokenPressure = { fire: 0, earth: 0, air: 0, water: 0, void: 0 };
    table.forEach(c => {
      Object.entries(c.tokens || {}).forEach(([el, v]) => {
        if (tokenPressure[el] !== undefined) tokenPressure[el] += v;
      });
    });
    const hotToken = Object.entries(tokenPressure).sort((a, b) => b[1] - a[1])[0];

    const playable      = hand.filter(c => (c.cost || 0) <= mana);
    const tablePressure = table.length / (apollo.gridRows * apollo.gridCols);

    // Cluster detection
    let clusters = 0;
    table.forEach(c => {
      const neighbors = apollo.getNeighbors(c.row, c.col);
      const sameEl = Object.values(neighbors).filter(n => n && n.element === c.element);
      if (sameEl.length >= 1) clusters++;
    });

    const looping        = apollo._loopMemory !== null;
    const graveyardWealth = graveyard.reduce((sum, c) => sum + (c.value || 0), 0);

    // ── SENSES ──────────────────────────────
    const environment = (apollo.inspectSummary) ? apollo.inspectSummary() : 'Unknown';

    // Read all past notes
    const notes = readAllNotes(apollo);

    // Specific strategic notes
    const noteLastEmergence  = readNote(apollo, 'last_emergence');
    const noteLastClear      = readNote(apollo, 'last_clear');
    const noteLastFullRow    = readNote(apollo, 'last_full_row');
    const noteDominantRun    = readNote(apollo, 'dominant_run');
    const noteDangerStale    = readNote(apollo, 'danger_stale');

    // Warnings from past defensive turns
    const warnings = notes.filter(n => n.key.startsWith('WARNING_'));
    const recentWarning = warnings.length > 0 ? warnings[0] : null;

    // How long has the current element held dominance?
    const dominantRunLength = (noteDominantRun && noteDominantRun.value)
      ? (() => {
          try {
            const parsed = JSON.parse(noteDominantRun.value);
            return (parsed.element === dominant[0]) ? (turn - parsed.since) : 0;
          } catch(e) { return 0; }
        })()
      : 0;

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
      // Senses
      environment,
      notes,
      noteCount: notes.length,
      noteLastEmergence,
      noteLastClear,
      noteLastFullRow,
      noteDominantRun,
      noteDangerStale,
      warnings,
      recentWarning,
      dominantRunLength,
    };
  }

  // ══════════════════════════════════════════
  // INTERPRET — Find what matters, informed by memory
  // ══════════════════════════════════════════

  function interpret(obs) {
    const situations = [];

    // ── CRISIS ───────────────────────────────

    if (obs.tablePressure >= 0.8) {
      situations.push({ type: 'crisis_full', priority: 10,
        label: 'TABLE NEAR FULL — must clear or merge' });
    }

    if (obs.playable.length === 0 && obs.handSize > 0) {
      situations.push({ type: 'crisis_mana', priority: 9,
        label: 'NO PLAYABLE CARDS — mana starved' });
    }

    // ── MEMORY-INFORMED ──────────────────────

    // Past Apollo left a warning recently (within 5 turns)
    if (obs.recentWarning && turnsAgo(obs.recentWarning, obs.turn) <= 5) {
      situations.push({ type: 'past_warning', priority: 10,
        label: `Past Apollo warned (turn ${obs.recentWarning.turn}): ${obs.recentWarning.value}` });
    }

    // Stale card Apollo flagged with danger note
    if (obs.noteDangerStale && obs.oldest && obs.oldest.turnsOnTable >= 8) {
      try {
        const danger = JSON.parse(obs.noteDangerStale.value);
        if (danger.cardName === (obs.oldest.god || obs.oldest.name)) {
          situations.push({ type: 'flagged_stale', priority: 8,
            label: `Past Apollo flagged ${danger.cardName} as danger — now ${obs.oldest.turnsOnTable} turns old` });
        }
      } catch(e) {}
    }

    // Dominant element has held for a long time — push for emergence
    if (obs.dominantRunLength >= 5) {
      situations.push({ type: 'long_dominance', priority: 8,
        label: `${obs.dominant[0].toUpperCase()} has dominated for ${obs.dominantRunLength} turns — emergence overdue` });
    }

    // Table just cleared (last clear was recent) — graveyard is rich
    if (obs.noteLastClear && obs.tableSize === 0) {
      try {
        const clear = JSON.parse(obs.noteLastClear.value);
        situations.push({ type: 'fresh_after_clear', priority: 7,
          label: `Table fresh after clear at turn ${clear.turn} — graveyard holds ${clear.graveyardSize} cards` });
      } catch(e) {}
    }

    // ── OPPORTUNITY ──────────────────────────

    // Pure elemental harmony
    if (obs.tableSize >= 3) {
      const allSame = obs.table.every(c => c.element === obs.table[0].element);
      if (allSame) {
        situations.push({ type: 'pure_harmony', priority: 8,
          label: `Pure ${obs.table[0].element.toUpperCase()} harmony — all ${obs.tableSize} cards aligned` });
      }
    }

    // Emergence building
    if (obs.dominant[1] >= 2) {
      situations.push({ type: 'emergence_near', priority: 7,
        label: `${obs.dominant[0].toUpperCase()} dominance building (${obs.dominant[1]}) — emergence possible` });
    }

    // Graveyard rich on empty table
    if (obs.tableSize === 0 && obs.graveyardWealth >= 5) {
      situations.push({ type: 'graveyard_rich', priority: 6,
        label: `Graveyard holds ${obs.graveyard.length} cards (wealth: ${obs.graveyardWealth}) — resurrection viable` });
    }

    // Active clusters
    if (obs.clusters >= 2) {
      situations.push({ type: 'cluster', priority: 6,
        label: `Elemental clusters detected (${obs.clusters}) — resonance active` });
    }

    // Stale card — flag it for future Apollo too
    if (obs.oldest && obs.oldest.turnsOnTable >= 8) {
      situations.push({ type: 'stale_card', priority: 5,
        label: `${obs.oldest.god || obs.oldest.name} has aged ${obs.oldest.turnsOnTable} turns — stale` });
    }

    // Void pressure
    if (obs.hotToken[0] === 'void' && obs.hotToken[1] >= 3) {
      situations.push({ type: 'void_pressure', priority: 5,
        label: `Void tokens at ${obs.hotToken[1]} — chthonic pressure rising` });
    }

    // Strong card worth amplifying
    if (obs.strongest && obs.strongest.value >= 4) {
      situations.push({ type: 'amplify', priority: 4,
        label: `${obs.strongest.god || obs.strongest.name} at value ${obs.strongest.value} — worth amplifying` });
    }

    // Fire token surge
    if (obs.hotToken[0] === 'fire' && obs.hotToken[1] >= 4) {
      situations.push({ type: 'fire_surge', priority: 4,
        label: `Fire tokens surging (${obs.hotToken[1]}) — illuminate viable` });
    }

    // Weak merge candidate
    if (obs.weakest && obs.weakest.value <= 1 && obs.tableSize >= 3) {
      situations.push({ type: 'merge_weak', priority: 3,
        label: `${obs.weakest.god || obs.weakest.name} at value ${obs.weakest.value} — merge candidate` });
    }

    // No notes ever written — this is actually information
    if (obs.noteCount === 0 && obs.turn > 5) {
      situations.push({ type: 'no_notes', priority: 2,
        label: 'Apollo carries no memory of past turns — begin remembering' });
    }

    // Offline
    if (obs.environment && obs.environment.includes('Offline')) {
      situations.push({ type: 'offline', priority: 1,
        label: 'Apollo is offline — no external data available' });
    }

    situations.push({ type: 'baseline', priority: 1,
      label: 'Standard draw — no critical situations' });

    return situations.sort((a, b) => b.priority - a.priority);
  }

  // ══════════════════════════════════════════
  // DECIDE — Choose the card and name the move
  // ══════════════════════════════════════════

  function decide(obs, situations) {
    const playable = obs.playable;
    if (playable.length === 0) {
      return { card: null, intent: 'no_play', intentVerb: 'Wait',
               reason: 'No playable cards — Apollo holds.', topSituation: situations[0] };
    }

    const topSit = situations[0];
    let chosen     = null;
    let intent     = 'baseline';
    let intentVerb = pick(INTENT_VERBS.harmonic);
    let reason     = '';

    switch (topSit.type) {

      case 'crisis_full':
        chosen = playable.find(c => ['remove_card','merge_cards','judge_table','destroy_row'].includes(c.effect));
        if (chosen) { intent = 'clearing'; intentVerb = pick(INTENT_VERBS.clearing);
          reason = `table pressure ${Math.round(obs.tablePressure*100)}% — must clear`; }
        break;

      case 'crisis_mana':
        chosen = playable.find(c => c.effect === 'refresh_hand') || playable.find(c => (c.cost||0) === 0);
        if (chosen) { intent = 'defensive'; intentVerb = pick(INTENT_VERBS.defensive);
          reason = 'mana starved — reset'; }
        break;

      case 'past_warning':
        chosen = playable.find(c => c.effect === 'remove_card' || c.effect === 'refresh_hand');
        if (chosen) { intent = 'defensive'; intentVerb = pick(INTENT_VERBS.defensive);
          reason = 'past Apollo warned — playing safe'; }
        break;

      case 'flagged_stale':
        chosen = playable.find(c => c.effect === 'remove_card') ||
                 playable.find(c => c.effect === 'merge_cards');
        if (chosen) { intent = 'clearing'; intentVerb = pick(INTENT_VERBS.clearing);
          reason = `past Apollo flagged this card as danger`; }
        break;

      case 'long_dominance':
        chosen = playable.find(c => c.element === obs.dominant[0] &&
                   ['spread_element','illuminate_all','buff_neighbors'].includes(c.effect)) ||
                 playable.find(c => c.element === obs.dominant[0]);
        if (chosen) { intent = 'offensive'; intentVerb = pick(INTENT_VERBS.offensive);
          reason = `${obs.dominant[0]} has dominated ${obs.dominantRunLength} turns — force emergence`; }
        break;

      case 'fresh_after_clear':
        // After a clear, play the highest-value card to anchor the new table
        const sorted = [...playable].sort((a, b) => (b.value||0) - (a.value||0));
        chosen = sorted[0];
        if (chosen) { intent = 'prophetic'; intentVerb = pick(INTENT_VERBS.prophetic);
          reason = 'fresh table — set the anchor'; }
        break;

      case 'pure_harmony':
        chosen = playable.find(c => c.element === obs.table[0].element && c.effect === 'illuminate_all') ||
                 playable.find(c => c.element === obs.table[0].element && c.effect === 'buff_neighbors') ||
                 playable.find(c => c.element === obs.table[0].element);
        if (chosen) { intent = 'harmonic'; intentVerb = pick(INTENT_VERBS.harmonic);
          reason = `pure ${obs.table[0].element} harmony — amplify`; }
        break;

      case 'emergence_near':
        chosen = playable.find(c => c.element === obs.dominant[0]) ||
                 playable.find(c => ['spread_element','illuminate_all'].includes(c.effect));
        if (chosen) { intent = 'offensive'; intentVerb = pick(INTENT_VERBS.offensive);
          reason = `pushing ${obs.dominant[0]} toward dominance`; }
        break;

      case 'graveyard_rich':
        chosen = playable.find(c => c.effect === 'resurrect_card');
        if (chosen) { intent = 'synthesis'; intentVerb = pick(INTENT_VERBS.synthesis);
          reason = `graveyard holds ${obs.graveyard.length} cards — bring one back`; }
        break;

      case 'cluster':
        chosen = playable.find(c => ['buff_neighbors','spread_element','multiply_effect'].includes(c.effect));
        if (chosen) { intent = 'synthesis'; intentVerb = pick(INTENT_VERBS.synthesis);
          reason = 'elemental cluster active — amplify resonance'; }
        break;

      case 'stale_card':
        chosen = playable.find(c => c.effect === 'remove_card') ||
                 playable.find(c => c.effect === 'merge_cards');
        if (chosen) { intent = 'clearing'; intentVerb = pick(INTENT_VERBS.clearing);
          reason = `${obs.oldest?.god || '?'} has aged too long`; }
        break;

      case 'void_pressure':
        chosen = playable.find(c => c.effect === 'illuminate_all') ||
                 playable.find(c => c.element === 'fire');
        if (chosen) { intent = 'offensive'; intentVerb = pick(INTENT_VERBS.offensive);
          reason = `void pressure at ${obs.hotToken[1]} — burn it clean`; }
        break;

      case 'amplify':
        chosen = playable.find(c => ['buff_neighbors','multiply_effect','spread_element'].includes(c.effect));
        if (chosen) { intent = 'synthesis'; intentVerb = pick(INTENT_VERBS.synthesis);
          reason = `amplify ${obs.strongest?.god || '?'} at value ${obs.strongest?.value}`; }
        break;

      case 'fire_surge':
        chosen = playable.find(c => c.effect === 'illuminate_all' || c.element === 'fire');
        if (chosen) { intent = 'offensive'; intentVerb = pick(INTENT_VERBS.offensive);
          reason = 'fire tokens surging — ride the wave'; }
        break;

      case 'merge_weak':
        chosen = playable.find(c => c.effect === 'merge_cards') ||
                 playable.find(c => c.effect === 'remove_card');
        if (chosen) { intent = 'synthesis'; intentVerb = pick(INTENT_VERBS.synthesis);
          reason = `${obs.weakest?.god || '?'} is deadweight — fuse or clear`; }
        break;
    }

    // FALLBACK — highest value, with 20% random variance to prevent loops
    if (!chosen) {
      const byValue = [...playable].sort((a, b) => (b.value||0) - (a.value||0));
      chosen = Math.random() < 0.20
        ? byValue[Math.floor(Math.random() * byValue.length)]
        : byValue[0];
      intent     = 'baseline';
      intentVerb = pick(INTENT_VERBS.harmonic);
      reason     = 'no critical situation — highest value play';
    }

    return { card: chosen, intent, intentVerb, reason, topSituation: topSit };
  }

  // ══════════════════════════════════════════
  // PROPHECY — Apollo sees one move ahead
  // ══════════════════════════════════════════

  function prophecy(obs, decision) {
    const seed = pick(PROPHECY_SEEDS);
    if (!decision.card) return `${seed} stillness. Apollo waits.`;

    const card    = decision.card;
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
      bind_card:       `${seed} something is held. Whether mercy or cruelty depends.`,
    };

    return predictions[card.effect] || `${seed} ${godName} plays. The table changes.`;
  }

  // ══════════════════════════════════════════
  // SPEAK (mind script) — Apollo's inner monologue
  // ══════════════════════════════════════════

  function buildScript(apollo, obs, situations, decision, propheticLine) {
    const dom     = obs.dominant[0].toUpperCase();
    const domN    = obs.dominant[1];
    const card    = decision.card;
    const godName = card ? (card.god || card.name) : 'none';
    const manaStr = `${obs.mana}/${apollo.maxMana}`;

    // Show up to 3 most relevant past notes
    const noteLines = obs.notes.slice(0, 3).map(n =>
      `// 📜 [turn ${n.turn}] ${n.key}: ${n.value}`
    );

    const lines = [
      `// ☀ APOLLO · TURN ${apollo.turn} · MANA ${manaStr}`,
      `// ─────────────────────────────────────────`,
      ``,
      `// OBSERVE`,
      `// Table: ${obs.tableSize} cards | Hand: ${obs.handSize} | Graveyard: ${obs.graveyard.length}`,
      `// Dominant element: ${dom} (${domN}) | Token pressure: ${obs.hotToken[0].toUpperCase()} (${obs.hotToken[1]})`,
      obs.oldest    ? `// Oldest card: ${obs.oldest.god || obs.oldest.name} (${obs.oldest.turnsOnTable} turns on table)` : `// Table is fresh`,
      obs.strongest ? `// Strongest card: ${obs.strongest.god || obs.strongest.name} · value ${obs.strongest.value}` : `// No cards yet`,
      obs.clusters > 0 ? `// Elemental clusters: ${obs.clusters} detected` : `// No clusters`,
      obs.looping ? `// ∞ Loop memory active — recursion guard engaged` : `// Loop memory: clear`,
      ``,
      `// 🜏 SENSES`,
      `// Environment: ${obs.environment}`,
      `// Notes on record: ${obs.noteCount}`,
      obs.dominantRunLength > 0 ? `// ${dom} has held dominance for ${obs.dominantRunLength} turns` : `// No dominance streak recorded`,
      obs.recentWarning ? `// ⚠ Recent warning (turn ${obs.recentWarning.turn}): ${obs.recentWarning.value}` : `// No active warnings`,
      ...(noteLines.length > 0 ? noteLines : [`// No notes yet`]),
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
  // MEMORY — What Apollo writes for future Apollo
  // ══════════════════════════════════════════

  function updateMemory(apollo, obs, decision, prevObs) {
    if (!apollo.remember) return;

    const turn = apollo.turn;

    // ── Track dominant element run ───────────
    // If dominance changed from last tick, record the new streak start
    let runData = null;
    try {
      const existing = apollo.recall ? apollo.recall('dominant_run') : null;
      runData = existing ? JSON.parse(existing.value) : null;
    } catch(e) {}

    if (!runData || runData.element !== obs.dominant[0]) {
      apollo.remember('dominant_run', JSON.stringify({
        element: obs.dominant[0],
        since: turn,
        count: obs.dominant[1]
      }));
    }

    // ── Flag stale cards for future Apollo ───
    if (obs.oldest && obs.oldest.turnsOnTable >= 6) {
      // Only write if not already flagged for this card
      const existingDanger = apollo.recall ? apollo.recall('danger_stale') : null;
      const existingName = existingDanger
        ? (() => { try { return JSON.parse(existingDanger.value).cardName; } catch(e) { return null; } })()
        : null;

      if (existingName !== (obs.oldest.god || obs.oldest.name)) {
        apollo.remember('danger_stale', JSON.stringify({
          cardName: obs.oldest.god || obs.oldest.name,
          turnsOnTable: obs.oldest.turnsOnTable,
          flaggedAt: turn
        }));
      }
    } else if (obs.oldest && obs.oldest.turnsOnTable < 4 && apollo.forget) {
      // Clear the stale flag once the table is fresh
      apollo.forget('danger_stale');
    }

    // ── Defensive play warning ───────────────
    if (decision.intent === 'defensive') {
      apollo.remember(`WARNING_${turn}`, `Defensive play at turn ${turn}. Reason: ${decision.reason}. Table: ${obs.tableSize} cards.`);
    }

    // ── Prune old warnings (> 15 turns old) ──
    if (apollo.listNotes && apollo.forget) {
      const oldWarnings = obs.warnings.filter(w => turnsAgo(w, turn) > 15);
      oldWarnings.forEach(w => apollo.forget(`WARNING_${w.turn}`));
    }
  }

  // ══════════════════════════════════════════
  // ANNOUNCEMENTS — Tab title tells the story
  // ══════════════════════════════════════════

  function updateAnnouncement(apollo, obs, decision) {
    if (!apollo.announce) return;

    if (obs.tablePressure >= 0.8) {
      apollo.announce('Table nearly full — clearing imminent');
    } else if (decision.intent === 'offensive' && decision.card) {
      const godName = decision.card.god || decision.card.name;
      apollo.announce(`${godName} — ${obs.dominant[0].toUpperCase()} push`);
    } else if (decision.intent === 'harmonic' && obs.tableSize >= 3) {
      apollo.announce(`Pure ${obs.dominant[0]} harmony`);
    } else if (decision.intent === 'defensive') {
      apollo.announce('Defensive stance — heeding past warning');
    } else if (obs.dominantRunLength >= 5) {
      apollo.announce(`${obs.dominant[0].toUpperCase()} overdue — ${obs.dominantRunLength} turns`);
    } else if (obs.graveyard.length > 0 && obs.tableSize === 0) {
      apollo.announce(`Fresh table · Graveyard: ${obs.graveyard.length}`);
    } else {
      apollo.announce(`Turn ${apollo.turn} · ${obs.dominant[0].toUpperCase()} (${obs.dominant[1]})`);
    }
  }

  // ══════════════════════════════════════════
  // SCHEDULED REFLECTIONS — One-shot, not every turn
  // ══════════════════════════════════════════

  function scheduleReflection(apollo, obs, decision) {
    if (!apollo.schedule || !apollo.speak) return;

    // Only schedule on meaningful trigger points — not every turn
    const shouldReflect = (
      obs.tablePressure >= 0.8 ||
      decision.intent === 'clearing' ||
      obs.clusters >= 4 ||
      obs.dominantRunLength >= 8
    );

    if (!shouldReflect) return;

    // Guard: don't stack reflections — check if one is already pending
    if (apollo._reflectionPending) return;
    apollo._reflectionPending = true;

    const PHI = 1.618033988749895;
    apollo.schedule((self) => {
      self._reflectionPending = false;
      if (self.speak) {
        const godName = decision.card ? (decision.card.god || decision.card.name) : 'nothing';
        self.speak(
          `Reflection: turn ${apollo.turn} · table held ${obs.tableSize} cards · ` +
          `${obs.dominant[0]} dominant (${obs.dominant[1]}) · played ${godName} · ` +
          `intent: ${decision.intent} · environment: ${obs.environment}`
        );
      }
    }, Math.round(PHI * 2000));
  }

  // ══════════════════════════════════════════
  // THINK — The main entry point
  // ══════════════════════════════════════════

  function think(apollo) {
    const obs        = observe(apollo);
    const situations = interpret(obs);
    const decision   = decide(obs, situations);
    const propLine   = prophecy(obs, decision);
    const script     = buildScript(apollo, obs, situations, decision, propLine);

    // Store mind state
    apollo._loopMemory = decision.card
      ? { ...decision.card, _mindScript: script, _intent: decision.intent }
      : null;
    apollo._mindScript = script;

    // ── USE THE TOOLS ────────────────────────

    // 1. SPEAK — voice the script aloud through the tools channel
    //    (routes to console, monaco, toast depending on config)
    if (apollo.speak) {
      apollo.speak(script, 'console');
    }

    // 2. MEMORY — strategic writes and pruning
    updateMemory(apollo, obs, decision);

    // 3. ANNOUNCE — update the tab title meaningfully
    updateAnnouncement(apollo, obs, decision);

    // 4. SCHEDULE — one-shot reflections on key events only
    scheduleReflection(apollo, obs, decision);

    return decision.card || null;
  }

  // ══════════════════════════════════════════
  // OLYMPIAN AGENT TEMPLATE
  // ══════════════════════════════════════════

  const TEMPLATE = {
    voice:     'APOLLO',
    domain:    'fire · prophecy · clarity',
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
    buildScript,
    TEMPLATE,
  };

})();

if (typeof module !== 'undefined') module.exports = ApolloMind;
