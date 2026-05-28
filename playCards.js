// ═══════════════════════════════════════════
// playCards.js — GAIA Titan Card Sequencing Engine
// ═══════════════════════════════════════════

// ── CONFIGURATION ──
const TITAN_PIPELINE = [
    'kronos', 'rhea', 'hyperion', 'oceanus', 'tethys',
    'theia', 'phoibe', 'themis', 'mnemosyne', 'koios'
];

const TITAN_NAMES = {
    kronos: 'Kronos', rhea: 'Rhea', hyperion: 'Hyperion',
    oceanus: 'Oceanus', tethys: 'Tethys', theia: 'Theia',
    phoibe: 'Phoibe', themis: 'Themis', mnemosyne: 'Mnemosyne',
    koios: 'Koios'
};

const TITAN_EMOJIS = {
    kronos: '⏳', rhea: '🌊', hyperion: '🔆', oceanus: '🌀',
    tethys: '💧', theia: '👁️', phoibe: '🔮', themis: '⚖️',
    mnemosyne: '📜', koios: '⚗️'
};

const TITAN_SUITS = {
    kronos: 'fire', rhea: 'earth', hyperion: 'fire',
    oceanus: 'water', tethys: 'water', theia: 'water',
    phoibe: 'air', themis: 'earth', mnemosyne: 'air',
    koios: 'air'
};

const OLYMPIAN_GATES = {
    kronos: 'zeus', rhea: 'hestia', hyperion: 'apollo',
    oceanus: 'dionysus', tethys: 'demeter', theia: 'aphrodite',
    phoibe: 'hermes', themis: 'artemis', mnemosyne: 'hera',
    koios: 'athena'
};

// ── STATE ──
let GAIA_STATE = {
    tick: 0,
    band: 'torrent',
    coherence: 0.91,
    tension: 0.2,
    eros_k: 0.80,
    phase: 'still_night',
    pipeline_index: 0,          // which Titan is active (0-9)
    pipeline_completed: [],     // Titans that have played this pass
    hands: {},                 // { kronos: [...cards], rhea: [...cards], ... }
    selected_card: null,       // card id selected in hand
    chronicle: [],             // full play history
    active_output: null,       // current card's output for display
    gate_message: null,        // current Olympian gate response
    cards_played_total: 0,
    pass_number: 0
};

// ── CARD DEFINITIONS (loaded from cards.json at init) ──
let CARD_CATALOG = {};

// ── DECK DEFINITIONS (loaded from decks/ at init) ──
let TITAN_DECKS = {};

// ── SUB-DECKS (loaded from decks/sub/ at init) ──
let SUB_DECKS = {};

// ═══════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════

async function initPlayCards() {
    console.log('🃏 playCards.js initializing...');
    await loadCardCatalog();
    await loadDecks();
    initializeHands();
    renderAll();
    console.log('🃏 playCards.js ready. Pipeline:', TITAN_PIPELINE.join(' → '));
}

async function loadCardCatalog() {
    try {
        const resp = await fetch('cards.json');
        if (resp.ok) {
            const data = await resp.json();
            CARD_CATALOG = data.cards || {};
            GAIA_STATE.cards_played_total = data.totals?.total_cards_played || 0;
            console.log('📇 Card catalog loaded:', Object.keys(CARD_CATALOG).length, 'cards');
        }
    } catch (e) {
        console.warn('⚠️ Could not load cards.json, using embedded defaults');
        loadDefaultCards();
    }
}

function loadDefaultCards() {
    // Fallback: minimal card definitions if cards.json unavailable
    CARD_CATALOG = {
        kronos_mark_interval: {
            id: 'kronos_mark_interval',
            name: 'Mark Interval',
            titan: 'kronos',
            suit: 'fire',
            voice: 'The Accountant marks this interval precisely.',
            output_type: 'function',
            output_template: 'function markInterval(tick) {\n  // Marking tick {tick}\n  const interval = {tick};\n  console.log("The Accountant has marked Tick {tick}.");\n  return interval;\n}',
            pass_question: 'The interval is marked. What stirs within it?',
            gate: 'zeus',
            gate_voice: 'Zeus observes the mark. It is lawful. Let it stand.'
        },
        rhea_feel_tremor: {
            id: 'rhea_feel_tremor',
            name: 'Feel Tremor',
            titan: 'rhea',
            suit: 'earth',
            voice: 'Rhea feels the field for the first tremor.',
            output_type: 'narrative',
            output_template: 'Rhea places her hand upon the pulse-field. Beneath the still surface, something stirs — faint, rhythmic, not yet named. Tick {tick} carries a weight she has felt before.',
            pass_question: 'Something stirs. I cannot see it. Light the field.',
            gate: 'hestia',
            gate_voice: 'Hestia centers the tremor. What moves must find its hearth.'
        },
        hyperion_illuminate: {
            id: 'hyperion_illuminate',
            name: 'Illuminate',
            titan: 'hyperion',
            suit: 'fire',
            voice: 'Hyperion waits above the dark field, then casts light.',
            output_type: 'function',
            output_template: 'function illuminateField(target) {\n  // Hyperion casts light upon {target}\n  const light = { intensity: 0.9, spectrum: "full" };\n  return light;\n}',
            pass_question: 'The field is lit. What flows toward the light?',
            gate: 'apollo',
            gate_voice: 'Apollo clarifies the beam. Let it be readable, not blinding.'
        }
    };
}

async function loadDecks() {
    // Stub: in production, loads from decks/kronos_deck.json etc.
    // For now, build hands from CARD_CATALOG
    TITAN_DECKS = {};
    for (const titan of TITAN_PIPELINE) {
        const titanCards = Object.values(CARD_CATALOG).filter(c => c.titan === titan);
        TITAN_DECKS[titan] = {
            cards: titanCards.map(c => c.id),
            hand_size: Math.min(4, titanCards.length)
        };
    }
    console.log('🃏 Decks loaded for', Object.keys(TITAN_DECKS).length, 'Titans');
}

// ═══════════════════════════════════════════
// HAND MANAGEMENT
// ═══════════════════════════════════════════

function initializeHands() {
    for (const titan of TITAN_PIPELINE) {
        drawTitanHand(titan);
    }
}

function drawTitanHand(titan) {
    const deck = TITAN_DECKS[titan];
    if (!deck || !deck.cards.length) {
        GAIA_STATE.hands[titan] = [];
        return;
    }
    const handSize = deck.hand_size || 4;
    const available = [...deck.cards];
    // Shuffle and draw
    const hand = [];
    for (let i = 0; i < Math.min(handSize, available.length); i++) {
        const idx = Math.floor(Math.random() * available.length);
        hand.push(available.splice(idx, 1)[0]);
    }
    GAIA_STATE.hands[titan] = hand;
    console.log(`🂠 ${TITAN_NAMES[titan]} draws:`, hand);
}

function drawHand() {
    const titan = getCurrentTitan();
    if (titan) {
        drawTitanHand(titan);
        GAIA_STATE.selected_card = null;
        renderHand();
        renderPlayArea();
    }
}

function getCurrentTitan() {
    if (GAIA_STATE.pipeline_index >= TITAN_PIPELINE.length) return null;
    return TITAN_PIPELINE[GAIA_STATE.pipeline_index];
}

// ═══════════════════════════════════════════
// CARD PLAYING
// ═══════════════════════════════════════════

function selectCard(cardId) {
    const titan = getCurrentTitan();
    if (!titan) return;
    if (!GAIA_STATE.hands[titan]?.includes(cardId)) return;
    GAIA_STATE.selected_card = cardId;
    renderHand();
    renderPlayArea();
}

function playSelectedCard() {
    const titan = getCurrentTitan();
    if (!titan || !GAIA_STATE.selected_card) return;
    playCard(titan, GAIA_STATE.selected_card);
}

function autoPlay() {
    const titan = getCurrentTitan();
    if (!titan) return;
    const hand = GAIA_STATE.hands[titan] || [];
    if (hand.length === 0) {
        drawTitanHand(titan);
        return;
    }
    // Auto-select first card
    const cardId = hand[0];
    GAIA_STATE.selected_card = cardId;
    playCard(titan, cardId);
}

function vetoCard() {
    const titan = getCurrentTitan();
    if (!titan || !GAIA_STATE.selected_card) return;
    const hand = GAIA_STATE.hands[titan] || [];
    // Remove card from hand
    GAIA_STATE.hands[titan] = hand.filter(c => c !== GAIA_STATE.selected_card);
    GAIA_STATE.selected_card = null;
    // Draw replacement
    drawTitanHand(titan);
    renderHand();
    renderPlayArea();
}

function playCard(titan, cardId) {
    const card = CARD_CATALOG[cardId];
    if (!card) {
        console.warn('⚠️ Card not found:', cardId);
        return;
    }

    GAIA_STATE.tick++;
    const tick = GAIA_STATE.tick;

    // Build output from template
    const output = buildOutput(card, tick);

    // Apply Olympian gate
    const gateResult = applyGate(card, tick);

    // Build chronicle entry
    const entry = {
        timestamp: new Date().toISOString(),
        tick: tick,
        titan: titan,
        titan_emoji: TITAN_EMOJIS[titan],
        card_id: cardId,
        card_name: card.name,
        suit: card.suit,
        voice: card.voice,
        output: output,
        gate_olympian: gateResult.olympian,
        gate_verdict: gateResult.verdict,
        gate_voice: gateResult.voice,
        pass_question: card.pass_question || null
    };

    // Add to chronicle
    GAIA_STATE.chronicle.unshift(entry);
    if (GAIA_STATE.chronicle.length > 50) GAIA_STATE.chronicle.length = 50;
    GAIA_STATE.cards_played_total++;

    // Remove card from hand
    GAIA_STATE.hands[titan] = (GAIA_STATE.hands[titan] || []).filter(c => c !== cardId);
    GAIA_STATE.selected_card = null;

    // Set active display
    GAIA_STATE.active_output = entry;
    GAIA_STATE.gate_message = gateResult.voice;

    // Update cards.json ledger (async, non-blocking)
    updateCardLedger(cardId, tick, entry);

    // Mark Titan as completed in pipeline
    if (!GAIA_STATE.pipeline_completed.includes(titan)) {
        GAIA_STATE.pipeline_completed.push(titan);
    }

    // Advance pipeline
    GAIA_STATE.pipeline_index++;

    // Update field state
    updateFieldState(card);

    // Render everything
    renderAll();
}

function buildOutput(card, tick) {
    if (!card.output_template) return '[No output template]';
    return card.output_template
        .replace(/\{tick\}/g, tick)
        .replace(/\{titan\}/g, card.titan)
        .replace(/\{phase\}/g, GAIA_STATE.phase)
        .replace(/\{coherence\}/g, GAIA_STATE.coherence.toFixed(2));
}

function applyGate(card, tick) {
    const olympian = card.gate || OLYMPIAN_GATES[card.titan] || 'zeus';
    const defaultVoice = card.gate_voice || `${olympian.charAt(0).toUpperCase() + olympian.slice(1)} acknowledges the play.`;

    // Determine verdict based on coherence
    let verdict = 'acknowledged';
    if (GAIA_STATE.coherence > 0.9) verdict = 'harmonious';
    else if (GAIA_STATE.coherence > 0.7) verdict = 'lawful';
    else if (GAIA_STATE.coherence > 0.5) verdict = 'tolerated';
    else verdict = 'dissonant';

    return {
        olympian: olympian,
        verdict: verdict,
        voice: defaultVoice
    };
}

function updateFieldState(card) {
    // Adjust coherence based on card play
    const suitBonus = { fire: 0.02, earth: 0.01, water: 0.01, air: 0.02 };
    GAIA_STATE.coherence = Math.min(1, Math.max(0, GAIA_STATE.coherence + (suitBonus[card.suit] || 0)));
    GAIA_STATE.tension = Math.min(1, Math.max(0, GAIA_STATE.tension + (Math.random() * 0.1 - 0.03)));
    GAIA_STATE.eros_k = Math.min(1, Math.max(0, GAIA_STATE.eros_k + (Math.random() * 0.04 - 0.02)));

    // Phase changes occasionally
    const phases = ['still_night', 'first_light', 'gathering', 'torrent', 'ebb', 'deep_night'];
    if (Math.random() < 0.08) {
        GAIA_STATE.phase = phases[Math.floor(Math.random() * phases.length)];
    }
}

async function updateCardLedger(cardId, tick, entry) {
    try {
        // In browser: update local CARD_CATALOG
        if (CARD_CATALOG[cardId]) {
            if (!CARD_CATALOG[cardId].times_played) CARD_CATALOG[cardId].times_played = 0;
            CARD_CATALOG[cardId].times_played++;
            CARD_CATALOG[cardId].last_played = entry.timestamp;
            if (!CARD_CATALOG[cardId].play_history) CARD_CATALOG[cardId].play_history = [];
            CARD_CATALOG[cardId].play_history.push({
                timestamp: entry.timestamp,
                tick: tick,
                output_type: entry.output_type || 'generic',
                output_summary: (entry.voice || '').substring(0, 80),
                gate_verdict: entry.gate_verdict
            });
        }

        // Attempt to persist to cards.json via POST (if server supports it)
        // In static GitHub Pages, this will fail silently — that's OK
        // The in-memory catalog still tracks the session
        console.log('📇 Card ledger updated:', cardId, '→', CARD_CATALOG[cardId]?.times_played, 'plays');
    } catch (e) {
        console.warn('⚠️ Could not update card ledger:', e.message);
    }
}

// ═══════════════════════════════════════════
// PIPELINE MANAGEMENT
// ═══════════════════════════════════════════

function advancePipeline() {
    const titan = getCurrentTitan();
    if (titan) {
        // Auto-play if no card selected
        if (!GAIA_STATE.selected_card) {
            autoPlay();
        } else {
            playSelectedCard();
        }
    }

    // Check if pass is complete
    if (GAIA_STATE.pipeline_index >= TITAN_PIPELINE.length) {
        completePass();
    }
}

function completePass() {
    GAIA_STATE.pass_number++;
    GAIA_STATE.pipeline_index = 0;
    GAIA_STATE.pipeline_completed = [];
    GAIA_STATE.active_output = null;
    GAIA_STATE.gate_message = null;
    console.log(`🔄 Pass ${GAIA_STATE.pass_number} complete. New pass starting.`);
    initializeHands();
    renderAll();
}

async function runFullPass() {
    console.log('🔄 Running full Titan pass...');
    GAIA_STATE.pipeline_index = 0;
    GAIA_STATE.pipeline_completed = [];

    for (let i = 0; i < TITAN_PIPELINE.length; i++) {
        const titan = TITAN_PIPELINE[i];
        const hand = GAIA_STATE.hands[titan] || [];
        if (hand.length === 0) drawTitanHand(titan);

        const cardId = (GAIA_STATE.hands[titan] || [])[0];
        if (cardId) {
            playCard(titan, cardId);
        }
        await sleep(400); // brief pause for visual rhythm
    }

    completePass();
}

function resetTable() {
    GAIA_STATE.tick = 0;
    GAIA_STATE.pipeline_index = 0;
    GAIA_STATE.pipeline_completed = [];
    GAIA_STATE.chronicle = [];
    GAIA_STATE.active_output = null;
    GAIA_STATE.gate_message = null;
    GAIA_STATE.cards_played_total = 0;
    GAIA_STATE.pass_number = 0;
    GAIA_STATE.coherence = 0.91;
    GAIA_STATE.tension = 0.2;
    GAIA_STATE.eros_k = 0.80;
    GAIA_STATE.phase = 'still_night';
    initializeHands();
    renderAll();
}

function invokeOlympian() {
    const select = document.getElementById('olympian-select');
    const olympian = select.value;
    if (!olympian || !GAIA_STATE.active_output) return;

    // Add an additional gate response
    const extraVoices = {
        zeus: 'Zeus reviews the play from his throne. He nods — but his eye is watchful.',
        athena: 'Athena examines the logic. She finds it... acceptable. She adds a marginal note.',
        aphrodite: 'Aphrodite tilts her head. "Does it stir the heart?" She smiles, noncommittal.',
        apollo: 'Apollo reads the output aloud. Each word lands clear. No shadow remains.',
        hephaestus: 'Hephaestus tests it in the forge. It holds. Barely.',
        hermes: 'Hermes snatches the output and runs. By the time he returns, it has traveled far.'
    };

    GAIA_STATE.gate_message = extraVoices[olympian] || `${olympian.charAt(0).toUpperCase() + olympian.slice(1)} has witnessed the play.`;
    renderPlayArea();
}

// ═══════════════════════════════════════════
// RENDERING
// ═══════════════════════════════════════════

function renderAll() {
    renderPipeline();
    renderHand();
    renderPlayArea();
    renderChronicle();
    renderFieldBar();
    updateButtons();
}

function renderPipeline() {
    const container = document.getElementById('pipeline');
    let html = '';
    for (let i = 0; i < TITAN_PIPELINE.length; i++) {
        const titan = TITAN_PIPELINE[i];
        let cls = 'titan-node';
        if (GAIA_STATE.pipeline_completed.includes(titan)) cls += ' passed';
        else if (i === GAIA_STATE.pipeline_index) cls += ' active';
        else if (i > GAIA_STATE.pipeline_index) cls += ' pending';
        else cls += ' passed';

        html += `<div class="${cls}">
      <span class="emoji">${TITAN_EMOJIS[titan]}</span>
      <span>${TITAN_NAMES[titan]}</span>
    </div>`;
    }
    container.innerHTML = html;
}

function renderHand() {
    const titan = getCurrentTitan();
    document.getElementById('hand-titan-name').textContent = titan ? TITAN_NAMES[titan] : '—';

    const container = document.getElementById('hand-cards');
    if (!titan) {
        container.innerHTML = '<p style="color:var(--text-dim);font-style:italic;">Pipeline complete.</p>';
        return;
    }

    const hand = GAIA_STATE.hands[titan] || [];
    if (hand.length === 0) {
        container.innerHTML = '<p style="color:var(--text-dim);font-style:italic;">No cards in hand. Draw to refresh.</p>';
        return;
    }

    let html = '';
    for (const cardId of hand) {
        const card = CARD_CATALOG[cardId];
        if (!card) continue;
        const selected = GAIA_STATE.selected_card === cardId ? ' selected' : '';
        html += `
    <div class="hand-card${selected}" onclick="selectCard('${cardId}')">
      <div class="card-name">${card.name}</div>
      <div class="card-suit suit-${card.suit}">${card.suit}</div>
      <div class="card-desc">${(card.voice || '').substring(0, 60)}...</div>
    </div>`;
    }
    container.innerHTML = html;
}

function renderPlayArea() {
    const container = document.getElementById('active-card');
    const gateEl = document.getElementById('gate-response');

    if (!GAIA_STATE.active_output) {
        container.innerHTML = '<div id="no-card-message">The table awaits the first card.</div>';
        container.classList.remove('playing');
        gateEl.classList.remove('visible');
        return;
    }

    const entry = GAIA_STATE.active_output;
    container.classList.add('playing');
    setTimeout(() => container.classList.remove('playing'), 500);

    container.innerHTML = `
    <div class="card-titan">${entry.titan_emoji}</div>
    <div class="card-name-lg">${entry.card_name}</div>
    <div class="card-suit-lg suit-${entry.suit}" style="display:inline-block;padding:2px 12px;border-radius:12px;font-size:0.7rem;text-transform:uppercase;letter-spacing:0.1em;border:1px solid;">${entry.suit}</div>
    <div class="card-voice">"${entry.voice}"</div>
    <div class="card-output">${escapeHtml(entry.output || '')}</div>
  `;

    // Gate response
    gateEl.textContent = GAIA_STATE.gate_message || '';
    if (GAIA_STATE.gate_message) {
        gateEl.classList.add('visible');
    } else {
        gateEl.classList.remove('visible');
    }
}

function renderChronicle() {
    const container = document.getElementById('chronicle-entries');
    const entries = GAIA_STATE.chronicle.slice(0, 20);
    if (entries.length === 0) {
        container.innerHTML = '<p style="color:var(--text-dim);font-style:italic;">No cards played yet.</p>';
        return;
    }
    let html = '';
    for (const e of entries) {
        html += `
    <div class="chronicle-entry">
      <span class="ce-tick">Tick ${e.tick}</span>
      <span class="ce-titan">${e.titan_emoji}</span>
      <span class="ce-card">${e.card_name}</span>
      <span class="ce-summary">${(e.voice || '').substring(0, 70)}...</span>
    </div>`;
    }
    container.innerHTML = html;
}

function renderFieldBar() {
    document.getElementById('tick-number').textContent = GAIA_STATE.tick;
    document.getElementById('band-name').textContent = GAIA_STATE.band;
    document.getElementById('chronicle-count').textContent = GAIA_STATE.chronicle.length;

    const cohPct = Math.round(GAIA_STATE.coherence * 100);
    document.getElementById('coherence-fill').style.width = cohPct + '%';
    document.getElementById('coherence-val').textContent = GAIA_STATE.coherence.toFixed(2);
    document.getElementById('phase-val').textContent = GAIA_STATE.phase;
    document.getElementById('tension-val').textContent = GAIA_STATE.tension.toFixed(2);
    document.getElementById('eros-k-val').textContent = GAIA_STATE.eros_k.toFixed(2);
}

function updateButtons() {
    const titan = getCurrentTitan();
    const hasSelection = !!GAIA_STATE.selected_card;
    document.getElementById('btn-play').disabled = !hasSelection;
    document.getElementById('btn-veto').disabled = !hasSelection;
    document.getElementById('btn-next-titan').disabled = !titan;
}

// ═══════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ═══════════════════════════════════════════
// EXPORT TO WINDOW (for table.html access)
// ═══════════════════════════════════════════

window.GAIA_STATE = GAIA_STATE;
window.GAIA_ACTIONS = {
    selectCard,
    playSelectedCard,
    autoPlay,
    vetoCard,
    drawHand,
    advancePipeline,
    runFullPass,
    resetTable,
    invokeOlympian
};
window.TITAN_PIPELINE = TITAN_PIPELINE;
window.TITAN_NAMES = TITAN_NAMES;
window.TITAN_EMOJIS = TITAN_EMOJIS;
window.CARD_CATALOG = CARD_CATALOG;

// ═══════════════════════════════════════════
// BOOT
// ═══════════════════════════════════════════

document.addEventListener('DOMContentLoaded', initPlayCards);
