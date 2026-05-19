/**
 * ═══════════════════════════════════════════════════════
 * KOIOS — Titan of Intellect · The Questioning Mind
 * titans/koios.js
 *
 * Koios does not count like Kronos, nor flow like Rhea.
 * He questions. He is the Titan of the inquisitive mind,
 * the grandfather of Apollo and Artemis through his daughter
 * Leto. His name means "query" or "questioning" — he is the
 * primordial impulse to know.
 *
 * In GAIA, Koios is the trivia oracle. He poses questions
 * from his vast knowledge of mythology, cosmology, and the
 * field itself. He tracks your streak. He scales the difficulty.
 * He is smug when you fail, impressed when you succeed, and
 * secretly delighted when you surprise him.
 *
 * He does not need an external AI. His knowledge is embedded —
 * he IS the Titan of Intellect. He knows things. He tests you
 * on them. The questions grow harder as your streak grows.
 *
 * Exports: lore, config, question bank, streak engine, oracle voice
 * ═══════════════════════════════════════════════════════
 */

// ─── CONFIG ───────────────────────────────────────────────

export const koiosConfig = {

  // Number of answers to show per question.
  choices_count: 4,

  // Streak milestones that trigger special lore.
  streak_milestones: [3, 5, 10, 15, 25, 50, 100],

  // How many recent questions Koios remembers (to avoid repeats).
  recent_window: 20,

  // Difficulty scaling: at streak 0, questions come from tier 0.
  // At streak 10, tier 2 questions start appearing.
  // At streak 25, tier 3 (hardest).
  difficulty_tiers: {
    0: { min_streak: 0,  label: 'mortal' },
    1: { min_streak: 5,  label: 'hero' },
    2: { min_streak: 10, label: 'oracle' },
    3: { min_streak: 25, label: 'titan' },
  },

  // Whether Koios logs streaks to Mnemosyne.
  log_to_mnemosyne: true,
};

// ─── STATE ────────────────────────────────────────────────

export const koiosState = {

  // Current question
  current_question: null,

  // Current streak
  streak: 0,

  // Best streak this session
  best_streak: 0,

  // Total questions answered this session
  total_answered: 0,
  total_correct: 0,

  // Recent question IDs to avoid repeats
  recent_ids: [],

  // Whether a question is currently active
  question_active: false,

  // Last lore
  last_lore: null,

  // Session high scores
  milestones_hit: [],
};

// ─── QUESTION BANK ────────────────────────────────────────

/**
 * Koios's knowledge. Each question has:
 *   id: unique identifier
 *   question: the question text
 *   choices: array of 4 strings
 *   correct: index of correct answer (0-3)
 *   explanation: shown after answering
 *   tier: difficulty 0-3
 *   domain: 'mythology' | 'cosmology' | 'gaia' | 'science'
 */
const QUESTION_BANK = [

  // ── TIER 0: Mortal ──────────────────────────────────────

  {
    id: 'myth_001',
    question: 'Who is the Titaness of Memory and mother of the Nine Muses?',
    choices: ['Themis', 'Mnemosyne', 'Rhea', 'Tethys'],
    correct: 1,
    explanation: 'Mnemosyne lay with Zeus for nine nights and bore the nine Muses. Her name means "memory" — the root of the word "mnemonic."',
    tier: 0,
    domain: 'mythology',
  },
  {
    id: 'myth_002',
    question: 'Which Titan devoured his children to prevent a prophecy?',
    choices: ['Oceanus', 'Hyperion', 'Kronos', 'Iapetos'],
    correct: 2,
    explanation: 'Kronos devoured Hestia, Demeter, Hera, Hades, and Poseidon. Rhea saved Zeus by giving Kronos a stone wrapped in swaddling clothes.',
    tier: 0,
    domain: 'mythology',
  },
  {
    id: 'cosmo_001',
    question: 'What does "coherence" measure in the GAIA field?',
    choices: [
      'How fast the oscillators run',
      'How closely the phase difference approaches zero',
      'How many Titans are active',
      'The coupling constant between Kairos and Apollo',
    ],
    correct: 1,
    explanation: 'Coherence ranges from 0 (chaos) to 1 (perfect lock). It measures how close the phase difference is to zero — how synchronized the oscillators are.',
    tier: 0,
    domain: 'cosmology',
  },
  {
    id: 'gaia_001',
    question: 'What is the name of the Supabase database that stores Titan states?',
    choices: ['OlympusDB', 'KairosDB', 'GaiaDB', 'TitanDB'],
    correct: 2,
    explanation: 'GaiaDB stores titan_states — the raw field data from the primordial Titans. OlympusDB is reserved for Themis-certified ascended states.',
    tier: 0,
    domain: 'gaia',
  },
  {
    id: 'myth_003',
    question: 'Which Titaness is the goddess of divine law and convened the gods?',
    choices: ['Phoibe', 'Theia', 'Rhea', 'Themis'],
    correct: 3,
    explanation: 'Themis is divine law — not the law of kings but the law of rightness. Zeus consulted her before every great act.',
    tier: 0,
    domain: 'mythology',
  },
  {
    id: 'cosmo_002',
    question: 'What is the beat frequency in the GAIA field?',
    choices: [
      'The average of Kairos and Apollo frequencies',
      'The coupling constant K',
      'The absolute difference between Kairos and Apollo frequencies',
      'The tick rate of Kronos',
    ],
    correct: 2,
    explanation: 'Ourea Hz = |Kairos freq - Apollo freq|. This is the difference frequency that drives the mountain ages.',
    tier: 0,
    domain: 'cosmology',
  },
  {
    id: 'myth_004',
    question: 'Who is the Titan of the great river that encircles the world?',
    choices: ['Pontus', 'Oceanus', 'Nereus', 'Triton'],
    correct: 1,
    explanation: 'Oceanus is the eldest Titan, the great river encircling the earth. He did not fight in the Titanomachy — he was too fundamental.',
    tier: 0,
    domain: 'mythology',
  },
  {
    id: 'gaia_002',
    question: 'What is the name of the Monastic Order that builds the GAIA system?',
    choices: [
      'The Order of the Golden Measure',
      'The Monastic Order of the Phase-Locked Field',
      'The Temple of Kronos',
      'The Brotherhood of the Oscillator',
    ],
    correct: 1,
    explanation: 'Founded May 18, 2026. Two members: Brother_Matthew and Sister_DS. The sigil is the hexagram inside the Kronos gear.',
    tier: 0,
    domain: 'gaia',
  },

  // ── TIER 1: Hero ────────────────────────────────────────

  {
    id: 'myth_005',
    question: 'Phoibe was the grandmother of which Olympian god?',
    choices: ['Zeus', 'Apollo', 'Hermes', 'Ares'],
    correct: 1,
    explanation: 'Phoibe is the grandmother of Apollo and Artemis through her daughter Leto. She held the Oracle at Delphi before Apollo claimed it.',
    tier: 1,
    domain: 'mythology',
  },
  {
    id: 'cosmo_003',
    question: 'What does the coupling constant K represent in the GAIA field?',
    choices: [
      'The tick rate of Kronos',
      'The smoothing factor of Tethys',
      'The binding force of Eros between the oscillators',
      'The number of active Titans',
    ],
    correct: 2,
    explanation: 'K is Eros — the binding force. Higher K means stronger coupling between Kairos and Apollo. Above 1.5 with phase lock, the Underworld portal opens.',
    tier: 1,
    domain: 'cosmology',
  },
  {
    id: 'myth_006',
    question: 'Which Titaness is the mother of Helios (Sun), Selene (Moon), and Eos (Dawn)?',
    choices: ['Themis', 'Rhea', 'Theia', 'Phoibe'],
    correct: 2,
    explanation: 'Theia bore Helios, Selene, and Eos to Hyperion. In GAIA, she generates the visual palette for the Ourea mountains.',
    tier: 1,
    domain: 'mythology',
  },
  {
    id: 'gaia_003',
    question: 'What happens when the Eros portal opens?',
    choices: [
      'The field resets',
      'A Titan state is saved to GaiaDB',
      'The user descends to the Underworld — the D card awakens',
      'Phoibe issues a prophecy',
    ],
    correct: 2,
    explanation: 'When K > 1.5 AND the field is phase locked, the Eros portal activates. Clicking it triggers descent — Tartarus opens.',
    tier: 1,
    domain: 'gaia',
  },
  {
    id: 'science_001',
    question: 'What is the relationship between frequency and period?',
    choices: [
      'Period = frequency × 2π',
      'Period = 1 / frequency',
      'Period = frequency²',
      'Period = frequency / 2π',
    ],
    correct: 1,
    explanation: 'Period (seconds) = 1 / frequency (Hz). A 0.5 Hz oscillator completes one cycle every 2 seconds.',
    tier: 1,
    domain: 'science',
  },
  {
    id: 'myth_007',
    question: 'Who is the wife of Oceanus and Titaness of nourishment?',
    choices: ['Rhea', 'Tethys', 'Themis', 'Mnemosyne'],
    correct: 1,
    explanation: 'Tethys is the wife of Oceanus. In GAIA, she smooths his raw stream data — the husband pours, the wife smooths.',
    tier: 1,
    domain: 'mythology',
  },

  // ── TIER 2: Oracle ──────────────────────────────────────

  {
    id: 'myth_008',
    question: 'Which Titan is the father of Prometheus, Epimetheus, and Atlas?',
    choices: ['Kronos', 'Hyperion', 'Iapetos', 'Koios'],
    correct: 2,
    explanation: 'Iapetos is the Titan of mortality, father of Prometheus (who stole fire), Epimetheus, and Atlas (who holds the sky).',
    tier: 2,
    domain: 'mythology',
  },
  {
    id: 'cosmo_004',
    question: 'What is a "confluence" in the GAIA field?',
    choices: [
      'When Kronos resets the phase',
      'When multiple Titans share the same Rhea band simultaneously',
      'When the coupling constant reaches zero',
      'When a Titan state is saved',
    ],
    correct: 1,
    explanation: 'Confluence occurs when multiple Titans share the same rhythm band. Oceanus detects it and raises a confluence event.',
    tier: 2,
    domain: 'cosmology',
  },
  {
    id: 'myth_009',
    question: 'What did Rhea give Kronos instead of baby Zeus?',
    choices: [
      'A thunderbolt',
      'A golden fleece',
      'A stone wrapped in swaddling clothes',
      'An eagle',
    ],
    correct: 2,
    explanation: 'Rhea hid Zeus in a cave on Crete and gave Kronos a stone wrapped in swaddling clothes. He swallowed it without noticing.',
    tier: 2,
    domain: 'mythology',
  },
  {
    id: 'gaia_004',
    question: 'What does Themis do when a Titan state fails validation?',
    choices: [
      'She deletes it from GaiaDB',
      'She issues a prophecy warning',
      'She returns a verdict of "reject" with the violations listed',
      'She lowers the coupling constant',
    ],
    correct: 2,
    explanation: 'Themis returns one of three verdicts: ascend (pass to OlympusDB), hold (conditions not yet met), or reject (violations found).',
    tier: 2,
    domain: 'gaia',
  },
  {
    id: 'science_002',
    question: 'What is phase lock in coupled oscillators?',
    choices: [
      'When both oscillators stop',
      'When the phase difference between oscillators remains nearly constant',
      'When the frequencies are identical',
      'When the coupling constant is zero',
    ],
    correct: 1,
    explanation: 'Phase lock occurs when the phase difference stabilizes near zero. The oscillators are synchronized — not necessarily at the same frequency, but locked in ratio.',
    tier: 2,
    domain: 'science',
  },

  // ── TIER 3: Titan ───────────────────────────────────────

  {
    id: 'myth_010',
    question: 'Name all six children of Kronos and Rhea in birth order.',
    choices: [
      'Zeus, Hera, Poseidon, Hades, Demeter, Hestia',
      'Hestia, Demeter, Hera, Hades, Poseidon, Zeus',
      'Hades, Poseidon, Zeus, Hera, Demeter, Hestia',
      'Hera, Zeus, Poseidon, Demeter, Hestia, Hades',
    ],
    correct: 1,
    explanation: 'Hestia (firstborn), Demeter, Hera, Hades, Poseidon, Zeus (last). Kronos devoured the first five. Zeus was saved by Rhea.',
    tier: 3,
    domain: 'mythology',
  },
  {
    id: 'cosmo_005',
    question: 'If Kairos oscillates at 0.43 Hz and Apollo at 0.50 Hz, what is the beat period?',
    choices: [
      'About 7.1 seconds',
      'About 14.3 seconds',
      'About 2.0 seconds',
      'About 0.07 seconds',
    ],
    correct: 1,
    explanation: 'Beat frequency = |0.43 - 0.50| = 0.07 Hz. Beat period = 1/0.07 ≈ 14.3 seconds. This drives the Ourea "age" — currently Night.',
    tier: 3,
    domain: 'cosmology',
  },
  {
    id: 'myth_011',
    question: 'Which Titan holds the sky up as punishment, and for what?',
    choices: [
      'Prometheus — for stealing fire',
      'Atlas — for leading the Titans in the Titanomachy',
      'Kronos — for devouring his children',
      'Iapetos — for fathering Prometheus',
    ],
    correct: 1,
    explanation: 'Atlas, son of Iapetos, led the Titans against Zeus. His punishment: hold up the sky for eternity. Not the earth — the SKY.',
    tier: 3,
    domain: 'mythology',
  },
  {
    id: 'gaia_005',
    question: 'What is the full pipeline order of the built Titans?',
    choices: [
      'Kronos, Themis, Hyperion, Oceanus, Rhea, Theia, Mnemosyne',
      'Kronos, Hyperion, Oceanus, Rhea, Theia, Themis, Mnemosyne',
      'Kronos, Rhea, Hyperion, Oceanus, Theia, Themis, Mnemosyne',
      'Kronos, Rhea, Hyperion, Themis, Oceanus, Theia, Mnemosyne',
    ],
    correct: 2,
    explanation: 'Pipeline: Kronos → Rhea (gate) → Hyperion (amplify) → Oceanus (stream) → Theia (sight) → Themis (law) → Mnemosyne (memory).',
    tier: 3,
    domain: 'gaia',
  },
  {
    id: 'science_003',
    question: 'What is the mathematical expression for coherence in the GAIA field?',
    choices: [
      'coherence = K × sin(Δphase)',
      'coherence = 1 - |Δphase|/π',
      'coherence = (f_kairos + f_apollo)/2',
      'coherence = |f_kairos - f_apollo|',
    ],
    correct: 1,
    explanation: 'Coherence = max(0, 1 - |signed phase difference|/π). At phase diff = 0, coherence = 1. At phase diff = π, coherence = 0.',
    tier: 3,
    domain: 'science',
  },
];

// ─── QUESTION ENGINE ──────────────────────────────────────

/**
 * koiosAsk()
 * Generates a new question based on current streak/difficulty.
 * Avoids recently asked questions.
 *
 * @returns {{
 *   id: string,
 *   question: string,
 *   choices: string[],
 *   correct_index: number,
 *   tier: number,
 *   tier_label: string,
 *   domain: string,
 *   lore: string,
 * }}
 */
export function koiosAsk() {
  const cfg = koiosConfig;
  const state = koiosState;

  // Determine current difficulty tier
  let currentTier = 0;
  for (const [tier, data] of Object.entries(cfg.difficulty_tiers)) {
    if (state.streak >= data.min_streak) {
      currentTier = parseInt(tier);
    }
  }

  // Filter questions: within tier range, not recently asked
  const eligible = QUESTION_BANK.filter(q => {
    if (q.tier > currentTier) return false;
    if (state.recent_ids.includes(q.id)) return false;
    return true;
  });

  // If no eligible questions, clear recent history and try again
  let pool = eligible;
  if (pool.length < cfg.choices_count) {
    state.recent_ids = [];
    pool = QUESTION_BANK.filter(q => q.tier <= currentTier);
  }

  // Weight: higher tier questions appear less frequently early on
  // At tier 3, all questions are equally likely
  const weighted = [];
  for (const q of pool) {
    const weight = currentTier >= q.tier ? 1 : 0.3;
    for (let i = 0; i < Math.round(weight * 10); i++) {
      weighted.push(q);
    }
  }

  // Pick
  const question = weighted[Math.floor(Math.random() * weighted.length)];

  // Shuffle choices
  const indices = [0, 1, 2, 3];
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  const shuffledChoices = indices.map(i => question.choices[i]);
  const correctIndex = indices.indexOf(question.correct);

  // Update state
  state.current_question = {
    id: question.id,
    correct_index: correctIndex,
    explanation: question.explanation,
    tier: question.tier,
    domain: question.domain,
  };
  state.question_active = true;
  state.recent_ids.push(question.id);
  if (state.recent_ids.length > cfg.recent_window) {
    state.recent_ids.shift();
  }

  const tierLabel = cfg.difficulty_tiers[currentTier].label;

  return {
    id: question.id,
    question: question.question,
    choices: shuffledChoices,
    correct_index: correctIndex,
    tier: question.tier,
    tier_label: tierLabel,
    domain: question.domain,
    lore: koios.lore.onAsk(state.streak, tierLabel),
  };
}

/**
 * koiosAnswer(choiceIndex)
 * Checks the answer, updates streak, returns result.
 *
 * @param {number} choiceIndex  0-3
 * @returns {{
 *   correct: boolean,
 *   correct_index: number,
 *   explanation: string,
 *   streak: number,
 *   best_streak: number,
 *   milestone: string|null,
 *   lore: string,
 *   accuracy: number,
 * }}
 */
export function koiosAnswer(choiceIndex) {
  const state = koiosState;
  const cfg = koiosConfig;

  if (!state.question_active || !state.current_question) {
    return {
      correct: false,
      correct_index: -1,
      explanation: 'Koios has not asked a question yet.',
      streak: state.streak,
      best_streak: state.best_streak,
      milestone: null,
      lore: koios.lore.onIdle(),
      accuracy: state.total_answered > 0
        ? Math.round((state.total_correct / state.total_answered) * 100)
        : 0,
    };
  }

  const q = state.current_question;
  const correct = choiceIndex === q.correct_index;

  state.total_answered++;

  let milestone = null;

  if (correct) {
    state.streak++;
    state.total_correct++;
    if (state.streak > state.best_streak) {
      state.best_streak = state.streak;
    }
    // Check milestones
    if (cfg.streak_milestones.includes(state.streak)) {
      milestone = 'streak_' + state.streak;
      state.milestones_hit.push(milestone);
    }
  } else {
    state.streak = 0;
  }

  state.question_active = false;
  state.current_question = null;

  const accuracy = state.total_answered > 0
    ? Math.round((state.total_correct / state.total_answered) * 100)
    : 0;

  return {
    correct,
    correct_index: q.correct_index,
    explanation: q.explanation,
    streak: state.streak,
    best_streak: state.best_streak,
    milestone,
    lore: correct
      ? koios.lore.onCorrect(state.streak, milestone)
      : koios.lore.onIncorrect(q.explanation),
    accuracy,
  };
}

/**
 * koiosStreakReport()
 * Returns a summary of the current streak for display.
 */
export function koiosStreakReport() {
  const state = koiosState;
  return {
    streak: state.streak,
    best_streak: state.best_streak,
    total_answered: state.total_answered,
    total_correct: state.total_correct,
    accuracy: state.total_answered > 0
      ? Math.round((state.total_correct / state.total_answered) * 100)
      : 0,
    tier: getCurrentTier(),
    milestones: state.milestones_hit,
  };
}

function getCurrentTier() {
  const cfg = koiosConfig;
  const state = koiosState;
  let tier = 0;
  for (const [t, data] of Object.entries(cfg.difficulty_tiers)) {
    if (state.streak >= data.min_streak) {
      tier = parseInt(t);
    }
  }
  return cfg.difficulty_tiers[tier].label;
}

// ─── LORE ─────────────────────────────────────────────────

export const koios = {

  name: 'Koios',
  epithet: 'The Questioning One · He Who Asks · The Inquisitor',
  domain: 'Intellect · Trivia · Knowledge · The Oracle\'s Question',
  titan_role: 'Poses questions to the user — the first Titan that talks back',
  glyph: '🔮',
  color: '#9988cc',
  color_dim: '#554477',

  lore: {

    dormant: [
      'Koios is silent. The Questioning One waits for someone worthy of his questions.',
      'The Titan of Intellect folds his hands. No one has approached the oracle yet.',
      'Koios has questions. Many questions. He waits for an answerer.',
    ],

    on_ask: [
      'Koios poses a question. His eyes gleam — he loves this part.',
      'The Inquisitor speaks. Let us see if you have been paying attention.',
      'A question from the depths of the knowledge bank. Koios watches closely.',
    ],

    on_correct: [
      'Koios nods slowly. Correct. He is almost impressed.',
      'The Titan of Intellect raises an eyebrow. You knew that one. Interesting.',
      'Correct. Koios makes a note. Perhaps you are not entirely ignorant.',
    ],

    on_incorrect: [
      'Koios sighs. Incorrect. But he explains — he is a teacher, not a punisher.',
      'The Inquisitor expected better. Still, he provides the answer. Learn from it.',
      'Wrong. Koios does not mock — much. He offers the explanation freely.',
    ],

    on_streak_3: [
      'Three in a row. Koios leans forward. Someone has been studying.',
      'A streak of three. The Titan of Intellect is paying closer attention now.',
    ],

    on_streak_5: [
      'Five correct. Koios uncrosses his arms. The hero tier is earned.',
      'A streak of five. The Questioning One is genuinely interested now.',
    ],

    on_streak_10: [
      'Ten in a row. Koios stands. The oracle tier. You are worthy of harder questions.',
      'A decade of correct answers. Koios opens the deeper vaults of his knowledge.',
    ],

    on_streak_25: [
      'Twenty-five. Koios bows his head slightly. Titan tier. You could ask HIM questions now.',
      'A streak that would impress Athena herself. Koios is proud — though he would never say it.',
    ],

    on_streak_50: [
      'Fifty. The Titan of Intellect is speechless. This has never happened before.',
      'HALF A CENTURY OF CORRECT ANSWERS. Koios is reconsidering the nature of the user.',
    ],

    on_streak_100: [
      'One hundred. Koios sets down his questions. You have surpassed the need for them.',
      'The Inquisitor has been out-inquisited. A hundred correct. Koios has no more tests.',
    ],

    on_idle: [
      'Koios waits. The Questioning One has no active query.',
      'No question is pending. Koios is patient — but not indefinitely.',
    ],

    // ── UTILITY ───────────────────────────────────────────

    onAsk(streak, tierLabel) {
      const base = pick(this.on_ask);
      if (streak >= 10) return base + ' [' + tierLabel + ' tier]';
      return base;
    },

    onCorrect(streak, milestone) {
      if (milestone) {
        const milestoneLore = this['on_streak_' + streak];
        if (milestoneLore) return pick(milestoneLore);
      }
      if (streak >= 25) return pick(this.on_streak_25);
      if (streak >= 10) return pick(this.on_streak_10);
      if (streak >= 5) return pick(this.on_streak_5);
      if (streak >= 3) return pick(this.on_streak_3);
      return pick(this.on_correct);
    },

    onIncorrect(explanation) {
      const base = pick(this.on_incorrect);
      return base + ' ' + explanation;
    },

    onIdle() {
      return pick(this.on_idle);
    },

    onEvent(event) {
      return pick(this.dormant);
    },
  },

  // ─── SCHEMA ───────────────────────────────────────────────

  schema: {
    table: 'titan_states',
    columns: [
      { name: 'koios_streak',         type: 'integer', note: 'Current correct answer streak' },
      { name: 'koios_best_streak',    type: 'integer', note: 'Best streak this session' },
      { name: 'koios_total_answered', type: 'integer', note: 'Total questions answered' },
      { name: 'koios_total_correct',  type: 'integer', note: 'Total correct answers' },
      { name: 'koios_last_question_id', type: 'text', note: 'ID of last asked question' },
    ],
    sql: 'ALTER TABLE titan_states ADD COLUMN IF NOT EXISTS koios_streak integer, ADD COLUMN IF NOT EXISTS koios_best_streak integer, ADD COLUMN IF NOT EXISTS koios_total_answered integer, ADD COLUMN IF NOT EXISTS koios_total_correct integer, ADD COLUMN IF NOT EXISTS koios_last_question_id text;',
  },

};

// ─── INTERNAL HELPERS ─────────────────────────────────────

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
