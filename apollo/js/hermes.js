// ══════════════════════════════════════════════════════
// APOLLO SHADOW · HERMES (Lightweight)
// Symbolic extraction: dictionaries + heuristics + SVO patterns.
// No AI models. Instant. Offline. Deterministic.
// ══════════════════════════════════════════════════════

// ── 12 Domain Seed Dictionaries (mythic mapping) ──
const DOMAINS = {
  signal: new Set(['message','signal','swift','trade','path','word','code','travel','cross','courier','speed','threshold','hello','world','data','network','node','link','route','packet','stream','pulse','beacon']),
  love:   new Set(['love','heart','desire','beauty','grace','tenderness','embrace','longing','bloom','devotion','soul','charm','kiss','warmth','soft','gentle','kind','sweet','adore','cherish']),
  war:    new Set(['battle','strike','clash','blade','shield','rage','force','conquest','enemy','siege','weapon','army','fight','destroy','break','shatter','crush','bleed','wound','scar']),
  wisdom: new Set(['truth','mind','pattern','knowledge','logic','reason','insight','clarity','thought','learning','vision','design','think','know','understand','wise','sage','ponder','reflect']),
  storm:  new Set(['thunder','lightning','decree','command','order','rule','wrath','judgment','authority','law','dominion','sky','power','might','sovereign','reign','govern','control']),
  tide:   new Set(['ocean','wave','current','depth','flow','sea','flood','salt','surge','abyss','drift','water','river','stream','tide','deep','shallow','drown','swim']),
  wild:   new Set(['hunt','beast','moon','forest','fang','claw','track','chase','instinct','roam','predator','wilderness','howl','growl','stalk','pounce','prey','den','lair']),
  vine:   new Set(['ecstasy','dance','madness','release','wine','frenzy','ritual','trance','abandon','revelry','intoxication','chaos','wild','frenzy','ecstatic','delirium','mania']),
  forge:  new Set(['hammer','fire','anvil','craft','iron','shape','creation','tool','metal','build','smelt','temper','steel','bronze','weld','cast','mold','harden','sharpen']),
  farm:   new Set(['seed','harvest','soil','grain','crop','cycle','growth','field','earth','cultivate','season','root','plant','grow','reap','sow','till','fertile','barren','yield']),
  crown:  new Set(['legacy','oath','throne','lineage','memory','law','reign','blood','honor','dynasty','covenant','stone','king','queen','prince','heir','inherit','succession','ancestor']),
  light:  new Set(['dawn','harmony','prophecy','song','balance','golden','lyre','oracle','radiance','healing','clarity','truth','bright','shine','glow','warm','illuminate','beacon','luminous'])
};

const ALL_WORDS = new Set(Object.values(DOMAINS).flatMap(s => [...s]));

// ── Heuristic Word Type Detection ──
// Common verb endings and patterns
const VERB_PATTERNS = [
  /ing$/, /ed$/, /ize$/, /ify$/, /ate$/,
  /^be/, /^de/, /^re/, /^dis/, /^over/, /^under/, /^out/
];

const VERB_HINTS = new Set([
  'is','are','was','were','be','been','being',
  'have','has','had','do','does','did',
  'can','will','shall','may','might','must','could','would','should',
  'go','come','make','take','give','get','put','see','know','think','say','tell','ask',
  'build','break','burn','buy','catch','choose','cut','dig','draw','drink','drive','eat',
  'fall','feel','fight','find','fly','forget','forgive','freeze','grow','hang','hear','hide',
  'hit','hold','hurt','keep','lay','lead','learn','leave','lend','lie','lift','lose',
  'mean','meet','pay','read','ride','ring','rise','run','seek','sell','send','set',
  'shake','shoot','show','shut','sing','sink','sit','sleep','speak','spend','stand','steal',
  'stick','strike','swear','sweep','swim','teach','tear','throw','wake','wear','win','write'
]);

const OBJECT_HINTS = new Set([
  'tool','weapon','shield','sword','stone','tree','river','mountain','sea','sky',
  'book','scroll','tablet','codex','map','chart','diagram','rune','sigil',
  'gate','door','threshold','bridge','wall','tower','temple','shrine','altar',
  'crown','throne','ring','gem','blade','armor','helm','cloak','staff','wand'
]);

// ── Classification ──

export function classifyDomain(word) {
  const lower = word.toLowerCase();
  for (const [domain, words] of Object.entries(DOMAINS)) {
    if (words.has(lower)) return domain;
  }
  return 'signal';
}

export function classifyWordType(word) {
  const lower = word.toLowerCase();
  
  // Check verb hints first (strongest signal)
  if (VERB_HINTS.has(lower)) return 'V';
  
  // Check object hints
  if (OBJECT_HINTS.has(lower)) return 'O';
  
  // Heuristic patterns
  for (const pattern of VERB_PATTERNS) {
    if (pattern.test(lower)) return 'V';
  }
  
  // Words ending in -tion, -ment, -ness, -ity are likely subjects/concepts
  if (/(tion|ment|ness|ity|ance|ence|ism|ogy)$/.test(lower)) return 'S';
  
  // Words ending in -er, -or are likely subjects (doer)
  if (/(er|or|ist|ian)$/.test(lower)) return 'S';
  
  // Default
  return 'S';
}

export function isKnownWord(word) {
  return ALL_WORDS.has(word.toLowerCase());
}

// ── Main Extraction (Symbolic, Instant) ──

/**
 * Extract tokens from raw text using dictionaries and heuristics.
 * No AI. No network. Instant and deterministic.
 * @param {string} text - Raw input text
 * @param {string} source - Source label
 * @returns {Array} - Tokens array
 */
export function extractTokens(text, source = 'manual') {
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  const seen = new Set();
  const tokens = [];

  for (const word of words) {
    if (seen.has(word)) continue;
    seen.add(word);

    const known = ALL_WORDS.has(word);
    const domain = known ? classifyDomain(word) : 'signal';
    const wordType = known ? classifyWordType(word) : classifyWordTypeHeuristic(word);
    const score = known ? 90 : classifyConfidence(word, wordType);

    tokens.push({
      body: word,
      domain,
      word_type: wordType,
      score,
      extracted_at: new Date().toISOString()
    });
  }

  return tokens;
}

/**
 * Heuristic word type for unknown words (no dictionary match).
 */
function classifyWordTypeHeuristic(word) {
  if (VERB_HINTS.has(word)) return 'V';
  if (OBJECT_HINTS.has(word)) return 'O';
  for (const pattern of VERB_PATTERNS) {
    if (pattern.test(word)) return 'V';
  }
  return 'S';
}

/**
 * Confidence score based on word type and dictionary presence.
 */
function classifyConfidence(word, wordType) {
  // Verbs with strong endings get higher confidence
  if (wordType === 'V' && /(ed|ing)$/.test(word)) return 80;
  // Objects from hints get high confidence
  if (wordType === 'O' && OBJECT_HINTS.has(word)) return 80;
  // Heuristic verbs get medium confidence
  if (wordType === 'V') return 65;
  // Default unknown
  return 50;
}

/**
 * Build a seeded text string from all 12 domains.
 * @returns {string}
 */
export function getSeedText() {
  return Object.values(DOMAINS).map(s => [...s].join(' ')).join(' ');
}

// PubMed-style query topics (for future external scraping)
export const PUBMED_QUERIES = [
  'neural network cognition',
  'language model attention mechanism',
  'memory consolidation brain hippocampus',
  'sentiment classification natural language',
  'cognitive architecture reasoning system',
  'artificial intelligence ethics safety',
  'deep learning embedding token representation',
  'consciousness neural correlates brain',
  'emotion recognition affective computing',
  'knowledge graph ontology semantic web'
];
