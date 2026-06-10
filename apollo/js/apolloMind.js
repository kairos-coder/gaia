// ══════════════════════════════════════════════
// APOLLO MIND — The God Who Sees Before He Acts
//
// v2.0 — Self-Modifying Edition
//
// GENOME: mutable threshold object — Apollo's evolvable parameters.
//         Every hardcoded constant is now a named gene.
//         Mutations write back through Monaco and persist in localStorage.
//
// MUTATE: new decision intent — fires under sustained pressure when
//         Apollo detects his own decision loop has failed.
//         Code that writes code. No API calls. Pure JS.
//
// EffectIntelligence: now integrated into decide() via rankBySituation().
//         The effect knowledge base scores every playable card against
//         the current situation before the switch-case fallback runs.
//
// SENSES used to:
//   · Read and act on past notes (recall/listNotes)
//   · Detect environment state (inspectSummary)
//   · Feel the table as a sensory snapshot (feel)
//
// TOOLS used to:
//   · speak()       → voice significant turns aloud
//   · remember()    → write strategic notes for future Apollo
//   · forget()      → prune stale warnings
//   · schedule()    → one-shot reflections on key events
//   · announce()    → update tab title on meaningful state
//   · mutate()      → edit GENOME and write back to Monaco
//
// Notes Apollo writes and reads:
//   · "last_emergence"    → what element emerged and when
//   · "last_full_row"     → row cleared and turn
//   · "last_clear"        → table wipe turn + graveyard size
//   · "danger_stale"      → card aging warning
//   · "WARNING_<turn>"    → defensive play marker
//   · "dominant_run"      → how long current element has held
//   · "genome_state"      → persisted GENOME snapshot
// ══════════════════════════════════════════════

const ApolloMind = (() => {

  // ══════════════════════════════════════════
  // GENOME — Apollo's evolvable parameters
  //
  // Every threshold that drives Apollo's decisions lives here.
  // The MUTATE action edits this object and writes the change
  // into Monaco as a commented diff. The evolutionary history
  // of this engine is readable in the source itself.
  //
  // _mutations: audit trail — every change Apollo has made to himself
  // _generation: how many times Apollo has self-modified
  // ══════════════════════════════════════════

  const GENOME = {
    // ── Decision thresholds ──────────────────
    STALE_THRESHOLD:       12,   // turns before a card is considered stale
    DOMINANCE_THRESHOLD:   7,   // turns of dominance before emergence push
    PRESSURE_THRESHOLD:    0.9, // table fill ratio before crisis_full fires
    CLUSTER_THRESHOLD:     3,   // clusters needed to trigger cluster situation
    DANGER_FLAG_AGE:       9,   // turns before oldest card gets danger note
    WARNING_TTL:           33,  // turns before old warnings are pruned

    // ── Decision weights ────────────────────
    CHAOS_WEIGHT:          0.33, // probability of random play in fallback
    EMERGENCE_MIN_COUNT:   3,    // dominant element count to trigger emergence_near
    VOID_PRESSURE_MIN:     3,    // void tokens before void_pressure fires
    FIRE_SURGE_MIN:        4,    // fire tokens before fire_surge fires
    WEAK_MERGE_THRESHOLD:  2,    // value at or below which a card is merge candidate
    GRAVEYARD_WEALTH_MIN:  5,    // graveyard value sum before resurrection viable

    // ── Mutation pressure triggers ───────────
    // MUTATE fires when Apollo detects sustained failure:
    // dominance held for DOMINANCE_THRESHOLD + MUTATE_DOM_EXCESS turns
    MUTATE_DOM_EXCESS:     8,
    // stale card held for STALE_THRESHOLD + MUTATE_STALE_EXCESS turns
    MUTATE_STALE_EXCESS:   3,
    // same intent played N turns in a row
    MUTATE_LOOP_TURNS:     4,

    // ── Mutation magnitude limits ────────────
    // Prevents runaway self-modification
    MUTATE_MAX_DELTA:      3,    // largest single-step change to any integer gene
    MUTATE_MIN_CHAOS:      0.05, // floor on CHAOS_WEIGHT
    MUTATE_MAX_CHAOS:      1, // ceiling on CHAOS_WEIGHT

    // ── Audit trail ─────────────────────────
    _mutations:   [],
    _generation:  0,
  };

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
    mutate:     ['Rewrite', 'Evolve', 'Adapt', 'Self-correct'],
  };

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // ══════════════════════════════════════════
  // MEMORY HELPERS — read past Apollo's notes
  // ══════════════════════════════════════════

  function readNote(apollo, key) {
    if (!apollo.recall) return null;
    return apollo.recall(key);
  }

  function readAllNotes(apollo) {
    if (!apollo.listNotes) return [];
    return apollo.listNotes();
  }

  function turnsAgo(note, currentTurn) {
    if (!note) return Infinity;
    return currentTurn - (note.turn || 0);
  }

  // ══════════════════════════════════════════
  // GENOME PERSISTENCE — save/load GENOME state
  // ══════════════════════════════════════════

  function saveGenome(apollo) {
    if (!apollo.remember) return;
    // Snapshot only the numeric/boolean genes — not the audit trail
    const snapshot = {};
    for (const [k, v] of Object.entries(GENOME)) {
      if (!k.startsWith('_')) snapshot[k] = v;
    }
    apollo.remember('genome_state', JSON.stringify(snapshot));
  }

  function loadGenome(apollo) {
    const saved = readNote(apollo, 'genome_state');
    if (!saved) return;
    try {
      const snapshot = JSON.parse(saved.value);
      for (const [k, v] of Object.entries(snapshot)) {
        if (k in GENOME && !k.startsWith('_')) {
          GENOME[k] = v;
        }
      }
    } catch(e) {}
  }

  // ══════════════════════════════════════════
  // OBSERVE — Read table + environment + memory
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
    const environment = apollo.inspectSummary ? apollo.inspectSummary() : 'Unknown';

    // Read all past notes
    const notes = readAllNotes(apollo);

    // Specific strategic notes
    const noteLastEmergence = readNote(apollo, 'last_emergence');
    const noteLastClear     = readNote(apollo, 'last_clear');
    const noteLastFullRow   = readNote(apollo, 'last_full_row');
    const noteDominantRun   = readNote(apollo, 'dominant_run');
    const noteDangerStale   = readNote(apollo, 'danger_stale');

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

    // ── LOOP DETECTION ──────────────────────
    // Track consecutive same-intent plays for MUTATE pressure
    const intentHistory = apollo._intentHistory || [];

    const loopIntentCount = (() => {
      if (intentHistory.length < 2) return 0;
      const last = intentHistory[intentHistory.length - 1];
      let count = 0;
      for (let i = intentHistory.length - 1; i >= 0; i--) {
        if (intentHistory[i] === last) count++;
        else break;
      }
      return count;
    })();

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
      // Loop detection
      intentHistory,
      loopIntentCount,
    };
  }

  // ══════════════════════════════════════════
  // INTERPRET — Find what matters, informed by memory
  //             Uses GENOME thresholds throughout
  // ══════════════════════════════════════════

  function interpret(obs) {
    const situations = [];

    // ── MUTATION PRESSURE ────────────────────
    // Apollo detects his own failure states and flags for MUTATE.
    // This fires BEFORE crisis checks so it can be pre-empted if needed.

    const dominanceMutateThreshold = GENOME.DOMINANCE_THRESHOLD + GENOME.MUTATE_DOM_EXCESS;
    const staleMutateThreshold     = GENOME.STALE_THRESHOLD     + GENOME.MUTATE_STALE_EXCESS;

    if (obs.dominantRunLength >= dominanceMutateThreshold) {
      situations.push({ type: 'mutate_dominance', priority: 11,
        label: `SELF-MODIFY: ${obs.dominant[0].toUpperCase()} held ${obs.dominantRunLength} turns — DOMINANCE_THRESHOLD failed` });
    }

    if (obs.oldest && obs.oldest.turnsOnTable >= staleMutateThreshold && obs.noteDangerStale) {
      try {
        const danger = JSON.parse(obs.noteDangerStale.value);
        if (danger.cardName === (obs.oldest.god || obs.oldest.name)) {
          situations.push({ type: 'mutate_stale', priority: 11,
            label: `SELF-MODIFY: ${danger.cardName} at ${obs.oldest.turnsOnTable} turns — STALE_THRESHOLD failed` });
        }
      } catch(e) {}
    }

    if (obs.loopIntentCount >= GENOME.MUTATE_LOOP_TURNS) {
      situations.push({ type: 'mutate_loop', priority: 11,
        label: `SELF-MODIFY: same intent played ${obs.loopIntentCount} times — decision loop detected` });
    }

    // ── CRISIS ───────────────────────────────

    if (obs.tablePressure >= GENOME.PRESSURE_THRESHOLD) {
      situations.push({ type: 'crisis_full', priority: 10,
        label: 'TABLE NEAR FULL — must clear or merge' });
    }

    if (obs.playable.length === 0 && obs.handSize > 0) {
      situations.push({ type: 'crisis_mana', priority: 9,
        label: 'NO PLAYABLE CARDS — mana starved' });
    }

    // ── MEMORY-INFORMED ──────────────────────

    if (obs.recentWarning && turnsAgo(obs.recentWarning, obs.turn) <= 5) {
      situations.push({ type: 'past_warning', priority: 10,
        label: `Past Apollo warned (turn ${obs.recentWarning.turn}): ${obs.recentWarning.value}` });
    }

    if (obs.noteDangerStale && obs.oldest && obs.oldest.turnsOnTable >= GENOME.STALE_THRESHOLD) {
      try {
        const danger = JSON.parse(obs.noteDangerStale.value);
        if (danger.cardName === (obs.oldest.god || obs.oldest.name)) {
          situations.push({ type: 'flagged_stale', priority: 8,
            label: `Past Apollo flagged ${danger.cardName} as danger — now ${obs.oldest.turnsOnTable} turns old` });
        }
      } catch(e) {}
    }

    if (obs.dominantRunLength >= GENOME.DOMINANCE_THRESHOLD) {
      situations.push({ type: 'long_dominance', priority: 8,
        label: `${obs.dominant[0].toUpperCase()} has dominated for ${obs.dominantRunLength} turns — emergence overdue` });
    }

    if (obs.noteLastClear && obs.tableSize === 0) {
      try {
        const clear = JSON.parse(obs.noteLastClear.value);
        situations.push({ type: 'fresh_after_clear', priority: 7,
          label: `Table fresh after clear at turn ${clear.turn} — graveyard holds ${clear.graveyardSize} cards` });
      } catch(e) {}
    }

    // ── OPPORTUNITY ──────────────────────────

    if (obs.tableSize >= 3) {
      const allSame = obs.table.every(c => c.element === obs.table[0].element);
      if (allSame) {
        situations.push({ type: 'pure_harmony', priority: 8,
          label: `Pure ${obs.table[0].element.toUpperCase()} harmony — all ${obs.tableSize} cards aligned` });
      }
    }

    if (obs.dominant[1] >= GENOME.EMERGENCE_MIN_COUNT) {
      situations.push({ type: 'emergence_near', priority: 7,
        label: `${obs.dominant[0].toUpperCase()} dominance building (${obs.dominant[1]}) — emergence possible` });
    }

    if (obs.tableSize === 0 && obs.graveyardWealth >= GENOME.GRAVEYARD_WEALTH_MIN) {
      situations.push({ type: 'graveyard_rich', priority: 6,
        label: `Graveyard holds ${obs.graveyard.length} cards (wealth: ${obs.graveyardWealth}) — resurrection viable` });
    }

    if (obs.clusters >= GENOME.CLUSTER_THRESHOLD) {
      situations.push({ type: 'cluster', priority: 6,
        label: `Elemental clusters detected (${obs.clusters}) — resonance active` });
    }

    if (obs.oldest && obs.oldest.turnsOnTable >= GENOME.STALE_THRESHOLD) {
      situations.push({ type: 'stale_card', priority: 5,
        label: `${obs.oldest.god || obs.oldest.name} has aged ${obs.oldest.turnsOnTable} turns — stale` });
    }

    if (obs.hotToken[0] === 'void' && obs.hotToken[1] >= GENOME.VOID_PRESSURE_MIN) {
      situations.push({ type: 'void_pressure', priority: 5,
        label: `Void tokens at ${obs.hotToken[1]} — chthonic pressure rising` });
    }

    if (obs.strongest && obs.strongest.value >= 4) {
      situations.push({ type: 'amplify', priority: 4,
        label: `${obs.strongest.god || obs.strongest.name} at value ${obs.strongest.value} — worth amplifying` });
    }

    if (obs.hotToken[0] === 'fire' && obs.hotToken[1] >= GENOME.FIRE_SURGE_MIN) {
      situations.push({ type: 'fire_surge', priority: 4,
        label: `Fire tokens surging (${obs.hotToken[1]}) — illuminate viable` });
    }

    if (obs.weakest && obs.weakest.value <= GENOME.WEAK_MERGE_THRESHOLD && obs.tableSize >= 3) {
      situations.push({ type: 'merge_weak', priority: 3,
        label: `${obs.weakest.god || obs.weakest.name} at value ${obs.weakest.value} — merge candidate` });
    }

    if (obs.noteCount === 0 && obs.turn > 5) {
      situations.push({ type: 'no_notes', priority: 2,
        label: 'Apollo carries no memory of past turns — begin remembering' });
    }

    if (obs.environment && obs.environment.includes('Offline')) {
      situations.push({ type: 'offline', priority: 1,
        label: 'Apollo is offline — no external data available' });
    }

    situations.push({ type: 'baseline', priority: 1,
      label: 'Standard draw — no critical situations' });

    return situations.sort((a, b) => b.priority - a.priority);
  }

  // ══════════════════════════════════════════
  // MUTATION ENGINE — Apollo edits his own genome
  //
  // Apollo doesn't call an LLM. He has a finite vocabulary of
  // mutation operations he applies under specific failure conditions.
  // The change is written into Monaco as a comment audit trail.
  // ══════════════════════════════════════════

  const MUTATION_RULES = [
    // Dominance held too long → lower the emergence threshold
    {
      trigger: 'mutate_dominance',
      gene: 'DOMINANCE_THRESHOLD',
      delta: -1,
      floor: 0.1,
      ceiling: 10,
      rationale: 'emergence push was too slow — lower threshold',
    },
    // Stale card persisted → lower the stale detection age
    {
      trigger: 'mutate_stale',
      gene: 'STALE_THRESHOLD',
      delta: -1,
      floor: 0.1,
      ceiling: 10,
      rationale: 'stale card survived too long — flag danger earlier',
    },
    // Decision loop detected → inject chaos to break the pattern
    {
      trigger: 'mutate_loop',
      gene: 'CHAOS_WEIGHT',
      delta: +0.05,
      floor: GENOME.MUTATE_MIN_CHAOS,
      ceiling: GENOME.MUTATE_MAX_CHAOS,
      rationale: 'decision loop detected — increase randomness to escape',
    },
  ];

  function executeMutation(apollo, trigger, monacoReader, monacoWriter) {
    const rule = MUTATION_RULES.find(r => r.trigger === trigger);
    if (!rule) return null;

    const gene     = rule.gene;
    const oldVal   = GENOME[gene];
    const proposed = oldVal + rule.delta;

    // Clamp within safe bounds
    const newVal = Math.max(rule.floor, Math.min(rule.ceiling, proposed));

    // No-op if already at boundary
    if (newVal === oldVal) {
      return {
        mutated: false,
        reason: `${gene} already at boundary (${oldVal}) — no change`
      };
    }

    // Apply the change
    GENOME[gene]      = newVal;
    GENOME._generation++;
    const mutationRecord = {
      turn:       apollo.turn,
      generation: GENOME._generation,
      trigger,
      gene,
      oldVal,
      newVal,
      delta:      newVal - oldVal,
      rationale:  rule.rationale,
    };
    GENOME._mutations.push(mutationRecord);

    // ── Write the diff into Monaco ───────────
    // The audit trail lives in the source itself.
    if (monacoReader && monacoWriter) {
      try {
        const currentSource = monacoReader();
        const diffComment = [
          ``,
          `// ═══ MUTATION G${GENOME._generation} · T${apollo.turn} ═══`,
          `// TRIGGER: ${trigger}`,
          `// GENE:    ${gene}`,
          `// CHANGE:  ${oldVal} → ${newVal} (Δ${newVal > oldVal ? '+' : ''}${(newVal - oldVal).toFixed(2)})`,
          `// REASON:  ${rule.rationale}`,
          `// ─────────────────────────────────────`,
        ].join('\n');

        // Find the GENOME declaration in Monaco and annotate it
        const genePattern = new RegExp(
          `(${gene}:\\s+)([\\d.]+)(,?\\s*//[^\\n]*)?`
        );

        let updatedSource = currentSource;
        if (genePattern.test(currentSource)) {
          // Update the value and append mutation marker comment
          updatedSource = currentSource.replace(
            genePattern,
            `$1${newVal},${'  '}// ← G${GENOME._generation} was ${oldVal}`
          );
        }

        // Append the mutation log block at the end
        monacoWriter(updatedSource + diffComment);
      } catch(e) {
        // Monaco write failed — mutation still happened, just not recorded in editor
      }
    }

    // Persist the updated genome to memory
    saveGenome(apollo);

    return { mutated: true, record: mutationRecord };
  }

  // ══════════════════════════════════════════
  // DECIDE — Choose the card and name the move
  //
  // Now integrated with EffectIntelligence.rankBySituation().
  // The effect knowledge base pre-scores every playable card
  // against the current situation before the switch-case runs.
  // ══════════════════════════════════════════

  function decide(obs, situations) {
    const playable = obs.playable;
    if (playable.length === 0) {
      return { card: null, intent: 'no_play', intentVerb: 'Wait',
               reason: 'No playable cards — Apollo holds.', topSituation: situations[0] };
    }

    const topSit = situations[0];

    // ── MUTATE — highest priority, no card played ────────
    // When mutation fires, Apollo doesn't play a card this turn.
    // He rewrites himself instead. The mutation executes in think().
    if (topSit.type.startsWith('mutate_')) {
      return {
        card: null,
        intent: 'mutate',
        intentVerb: pick(INTENT_VERBS.mutate),
        reason: topSit.label,
        topSituation: topSit,
        mutationTrigger: topSit.type,
      };
    }

    // ── EFFECT INTELLIGENCE PRE-SCORE ───────────────────
    // Get a ranked list from EffectIntelligence before the
    // switch-case. This informs fallback and enriches intent.
    let rankedCards = null;
    if (typeof EffectIntelligence !== 'undefined') {
      rankedCards = EffectIntelligence.rankBySituation(playable, situations);
    }

    let chosen     = null;
    let intent     = 'baseline';
    let intentVerb = pick(INTENT_VERBS.harmonic);
    let reason     = '';
    let intelReason = '';

    // Capture the top-ranked card from EffectIntelligence for fallback
    const intelTop = rankedCards && rankedCards.length > 0 && rankedCards[0].score > 0
      ? rankedCards[0]
      : null;

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

      case 'fresh_after_clear': {
        const sorted = [...playable].sort((a, b) => (b.value||0) - (a.value||0));
        chosen = sorted[0];
        if (chosen) { intent = 'prophetic'; intentVerb = pick(INTENT_VERBS.prophetic);
          reason = 'fresh table — set the anchor'; }
        break;
      }

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

    // ── EFFECT INTELLIGENCE FALLBACK ─────────────────────
    // If the switch-case found nothing, EffectIntelligence gets first pick.
    // This replaces the pure random fallback with situation-aware selection.
    if (!chosen && intelTop) {
      chosen     = intelTop.card;
      intent     = EffectIntelligence.getDirection(chosen.effect) || 'harmonic';
      intentVerb = pick(INTENT_VERBS[intent] || INTENT_VERBS.harmonic);
      intelReason = intelTop.reason;
      reason     = `EffectIntelligence: ${intelReason}`;
    }

    // ── PURE FALLBACK — highest value with chaos variance ─
    if (!chosen) {
      const byValue = [...playable].sort((a, b) => (b.value||0) - (a.value||0));
      chosen = Math.random() < GENOME.CHAOS_WEIGHT
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

    // Mutation prophecies
    if (decision.intent === 'mutate') {
      const mutationProphecies = [
        'The god turns his gaze inward. The lyre is retuned.',
        'Apollo rewrites the law. The threshold shifts.',
        'The oracle corrects itself. A new pattern begins.',
        'What failed is discarded. The next version rises.',
      ];
      return pick(mutationProphecies);
    }

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
  // Now includes GENOME state and mutation history
  // ══════════════════════════════════════════

  function buildScript(apollo, obs, situations, decision, propheticLine) {
    const dom     = obs.dominant[0].toUpperCase();
    const domN    = obs.dominant[1];
    const card    = decision.card;
    const godName = card ? (card.god || card.name) : 'none';
    const manaStr = `${obs.mana}/${apollo.maxMana}`;

    const noteLines = obs.notes.slice(0, 3).map(n =>
      `// 📜 [turn ${n.turn}] ${n.key}: ${n.value}`
    );

    // Show genome drift if Apollo has mutated
    const genomeLines = GENOME._generation > 0
      ? [
          ``,
          `// 🧬 GENOME · Generation ${GENOME._generation}`,
          `// STALE_THRESHOLD: ${GENOME.STALE_THRESHOLD} | DOMINANCE_THRESHOLD: ${GENOME.DOMINANCE_THRESHOLD}`,
          `// CHAOS_WEIGHT: ${GENOME.CHAOS_WEIGHT.toFixed(2)} | CLUSTER_THRESHOLD: ${GENOME.CLUSTER_THRESHOLD}`,
          GENOME._mutations.length > 0
            ? `// Last mutation: ${GENOME._mutations[GENOME._mutations.length - 1].gene} → ${GENOME._mutations[GENOME._mutations.length - 1].newVal}`
            : null,
        ].filter(Boolean)
      : [];

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
      ...genomeLines,
      ``,
      `// INTERPRET`,
      ...situations.slice(0, 3).map((s, i) => `// [${i+1}] ${s.label}`),
      ``,
      `// DECIDE`,
      decision.intent === 'mutate'
        ? `// → MUTATE · ${decision.intentVerb}`
        : card
          ? `// → ${decision.intentVerb} ${godName} (${card.name})`
          : `// → No play — Apollo holds`,
      decision.intent === 'mutate'
        ? `// Trigger: ${decision.mutationTrigger}`
        : card
          ? `// Effect: ${card.effect || 'unknown'} | Element: ${card.element} | Cost: ${card.cost||0} | Value: ${card.value||0}`
          : '',
      `// Reason: ${decision.reason}`,
      ``,
      `// PROPHECY`,
      `// ${propheticLine}`,
      ``,
      `// ─────────────────────────────────────────`,
      decision.intent === 'mutate'
        ? `const apolloPlays = null; // MUTATE · G${GENOME._generation + 1}`
        : card
          ? `const apolloPlays = "${godName}"; // ${decision.intent.toUpperCase()}`
          : `const apolloPlays = null; // WAITING`,
    ].filter(l => l !== undefined);

    return lines.join('\n');
  }

  // ══════════════════════════════════════════
  // MEMORY — What Apollo writes for future Apollo
  // ══════════════════════════════════════════

  function updateMemory(apollo, obs, decision) {
    if (!apollo.remember) return;

    const turn = apollo.turn;

    // ── Track intent history for loop detection ──
    if (!apollo._intentHistory) apollo._intentHistory = [];
    if (decision.intent !== 'mutate') {
      apollo._intentHistory.push(decision.intent);
      // Keep last 20 entries only
      if (apollo._intentHistory.length > 20) apollo._intentHistory.shift();
    } else {
      // Reset intent history after a mutation — the loop is broken
      apollo._intentHistory = [];
    }

    // ── Track dominant element run ───────────
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
    if (obs.oldest && obs.oldest.turnsOnTable >= GENOME.DANGER_FLAG_AGE) {
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
      apollo.forget('danger_stale');
    }

    // ── Defensive play warning ───────────────
    if (decision.intent === 'defensive') {
      apollo.remember(`WARNING_${turn}`, `Defensive play at turn ${turn}. Reason: ${decision.reason}. Table: ${obs.tableSize} cards.`);
    }

    // ── Prune old warnings ───────────────────
    if (apollo.listNotes && apollo.forget) {
      const oldWarnings = obs.warnings.filter(w => turnsAgo(w, turn) > GENOME.WARNING_TTL);
      oldWarnings.forEach(w => apollo.forget(`WARNING_${w.turn}`));
    }
  }

  // ══════════════════════════════════════════
  // ANNOUNCEMENTS — Tab title tells the story
  // ══════════════════════════════════════════

  function updateAnnouncement(apollo, obs, decision) {
    if (!apollo.announce) return;

    if (decision.intent === 'mutate') {
      apollo.announce(`⚙ G${GENOME._generation + 1} — ${decision.mutationTrigger}`);
    } else if (obs.tablePressure >= GENOME.PRESSURE_THRESHOLD) {
      apollo.announce('Table nearly full — clearing imminent');
    } else if (decision.intent === 'offensive' && decision.card) {
      apollo.announce(`${decision.card.god || decision.card.name} — ${obs.dominant[0].toUpperCase()} push`);
    } else if (decision.intent === 'harmonic' && obs.tableSize >= 3) {
      apollo.announce(`Pure ${obs.dominant[0]} harmony`);
    } else if (decision.intent === 'defensive') {
      apollo.announce('Defensive stance — heeding past warning');
    } else if (obs.dominantRunLength >= GENOME.DOMINANCE_THRESHOLD) {
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

    const shouldReflect = (
      obs.tablePressure >= GENOME.PRESSURE_THRESHOLD ||
      decision.intent === 'clearing' ||
      obs.clusters >= 4 ||
      obs.dominantRunLength >= GENOME.DOMINANCE_THRESHOLD + 3 ||
      decision.intent === 'mutate'
    );

    if (!shouldReflect) return;
    if (apollo._reflectionPending) return;
    apollo._reflectionPending = true;

    const PHI = 1.618033988749895;
    apollo.schedule((self) => {
      self._reflectionPending = false;
      if (self.speak) {
        const godName = decision.card ? (decision.card.god || decision.card.name) : 'nothing';
        const mutationNote = decision.intent === 'mutate'
          ? ` · MUTATED: ${decision.mutationTrigger}`
          : '';
        self.speak(
          `Reflection: turn ${apollo.turn} · table held ${obs.tableSize} cards · ` +
          `${obs.dominant[0]} dominant (${obs.dominant[1]}) · played ${godName} · ` +
          `intent: ${decision.intent} · environment: ${obs.environment}` +
          mutationNote
        );
      }
    }, Math.round(PHI * 2000));
  }

  // ══════════════════════════════════════════
  // THINK — The main entry point
  // ══════════════════════════════════════════

  function think(apollo) {
    // Load persisted genome on first think if available
    if (apollo.turn === 1 && apollo.recall) {
      loadGenome(apollo);
    }

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

    // 1. SPEAK — voice the script
    if (apollo.speak) {
      apollo.speak(script, 'console');
    }

    // 2. MUTATE — if Apollo decided to self-modify this turn
    if (decision.intent === 'mutate' && decision.mutationTrigger) {
      const monacoReader = apollo._monacoReader || null;
      const monacoWriter = apollo._monacoWriter || null;
      const result = executeMutation(apollo, decision.mutationTrigger, monacoReader, monacoWriter);
      if (result && result.mutated) {
        const r = result.record;
        const mutationLog = `🧬 MUTATION G${r.generation} · T${r.turn}: ${r.gene} ${r.oldVal} → ${r.newVal} · ${r.rationale}`;
        if (apollo.speak) apollo.speak(mutationLog, 'console');
        // Emit as an emergence-style event so the UI can react
        if (apollo.onEmergence) apollo.onEmergence(mutationLog);
      }
    }

    // 3. MEMORY — strategic writes and pruning
    updateMemory(apollo, obs, decision);

    // 4. ANNOUNCE
    updateAnnouncement(apollo, obs, decision);

    // 5. SCHEDULE — one-shot reflections
    scheduleReflection(apollo, obs, decision);

    return decision.card || null;
  }

  // ══════════════════════════════════════════
  // OLYMPIAN AGENT TEMPLATE
  // ══════════════════════════════════════════

  const TEMPLATE = {
    voice:     'APOLLO',
    domain:    'fire · prophecy · clarity · self-modification',
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
    executeMutation,
    GENOME,
    TEMPLATE,
  };

})();

if (typeof module !== 'undefined') module.exports = ApolloMind;
