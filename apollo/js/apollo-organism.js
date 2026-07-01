// ═══════════════════════════════════════
// APOLLO ORGANISM · The Sun God's Voice
// apollo/js/apollo-organism.js
//
// A text-based intelligence that lives in Apollo's realm.
// Feeds on: Sky data, solar flares, table state, memory,
// genome drift, page state, and its own past utterances.
//
// Pulses every 60 seconds. Speaks through Pollinations.
// Remembers everything. Develops a voice over time.
// Tracks its own vocabulary and evolves deliberately.
// Can use ApolloTools: speak, remember, recall, announce, schedule.
//
// v1.2 — July 1, 2026 · Added tool awareness + tool directives
// ═══════════════════════════════════════

const ApolloOrganism = (() => {
    
    // ═══════════════════════════════════
    // CONFIG
    // ═══════════════════════════════════
    
    const CONFIG = {
        api: 'https://text.pollinations.ai/',
        pulseInterval: 60000,
        contextWindow: 6,
        vocabularyWindow: 10,
        temperature: 0.9,
        maxTokens: 350,
        model: 'openai',
        repetitionThreshold: 3,
    };
    
    // ═══════════════════════════════════
    // STATE
    // ═══════════════════════════════════
    
    let identity = '';
    let memory = [];
    let archive = [];
    let pulseCount = 0;
    let isAlive = false;
    let pulseTimer = null;
    let contextProviders = [];
    let onPulseCallbacks = [];
    let vocabularyStats = {};
    let apolloRef = null;              // Reference to Apollo instance for tools
    
    // ═══════════════════════════════════
    // APOLLO REFERENCE
    // ═══════════════════════════════════
    
    function setApollo(apolloInstance) {
        apolloRef = apolloInstance;
    }
    
    // ═══════════════════════════════════
    // VOCABULARY TRACKER
    // ═══════════════════════════════════
    
    function analyzeVocabulary() {
        const recent = memory.slice(-CONFIG.vocabularyWindow);
        if (recent.length === 0) return null;
        
        const stopWords = new Set([
            'the', 'a', 'an', 'of', 'in', 'to', 'and', 'is', 'it', 'its',
            'as', 'at', 'by', 'for', 'on', 'with', 'that', 'this', 'from',
            'has', 'have', 'been', 'was', 'are', 'were', 'be', 'been',
            'into', 'over', 'under', 'through', 'above', 'below', 'beyond',
            'still', 'now', 'yet', 'not', 'no', 'nor', 'or', 'but',
            'your', 'my', 'his', 'her', 'our', 'their',
            'pulse', 'speak', 'speaks', 'speaking',
        ]);
        
        const wordFreq = {};
        
        recent.forEach(entry => {
            const words = entry.output
                .toLowerCase()
                .replace(/[^\w\s']/g, ' ')
                .split(/\s+/)
                .filter(w => w.length > 2 && !stopWords.has(w));
            
            const seen = new Set();
            words.forEach(word => {
                if (!seen.has(word)) {
                    seen.add(word);
                    wordFreq[word] = (wordFreq[word] || 0) + 1;
                }
            });
        });
        
        const overused = Object.entries(wordFreq)
            .filter(([word, count]) => count >= CONFIG.repetitionThreshold)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 15);
        
        const bigramFreq = {};
        recent.forEach(entry => {
            const words = entry.output
                .toLowerCase()
                .replace(/[^\w\s']/g, ' ')
                .split(/\s+/)
                .filter(w => w.length > 2 && !stopWords.has(w));
            
            const seenBigrams = new Set();
            for (let i = 0; i < words.length - 1; i++) {
                const bigram = `${words[i]} ${words[i+1]}`;
                if (!seenBigrams.has(bigram)) {
                    seenBigrams.add(bigram);
                    bigramFreq[bigram] = (bigramFreq[bigram] || 0) + 1;
                }
            }
        });
        
        const overusedPhrases = Object.entries(bigramFreq)
            .filter(([phrase, count]) => count >= CONFIG.repetitionThreshold)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
        
        vocabularyStats = { overused, overusedPhrases, analyzedAt: pulseCount };
        return vocabularyStats;
    }
    
    function getVocabularyWarning() {
        const stats = vocabularyStats;
        if (!stats || !stats.overused || stats.overused.length === 0) return null;
        
        const words = stats.overused.slice(0, 8).map(([w, c]) => `"${w}" (${c}×)`).join(', ');
        const phrases = stats.overusedPhrases.slice(0, 5).map(([p, c]) => `"${p}" (${c}×)`).join(', ');
        
        let warning = `\n[VOCABULARY WARNING]\n`;
        warning += `Overused words: ${words}.\n`;
        if (phrases) warning += `Overused phrases: ${phrases}.\n`;
        warning += `Your vocabulary is becoming repetitive. Find new images. Surprise yourself.\n`;
        warning += `If you called the pine "scarlet-threaded" before, find new words for it now.\n`;
        
        return warning;
    }
    
    // ═══════════════════════════════════
    // CONTEXT PROVIDERS
    // ═══════════════════════════════════
    
    function addContextProvider(fn) {
        contextProviders.push(fn);
    }
    
    async function gatherContext() {
        const parts = [];
        for (const provider of contextProviders) {
            try {
                const data = await provider();
                if (data) parts.push(data);
            } catch(e) {}
        }
        return parts.join('\n');
    }
    
    // ═══════════════════════════════════
    // BUILD PROMPT
    // ═══════════════════════════════════
    
    function buildPrompt(contextData) {
        const recentMemories = memory.slice(-CONFIG.contextWindow);
        const vocabWarning = getVocabularyWarning();
        
        let prompt = '';
        
        // ── IDENTITY ──
        if (identity) {
            prompt += identity + '\n\n';
        }
        
        // ── SIX-PART LITURGY ──
        prompt += `[YOUR FORM]\n`;
        prompt += `You speak in six parts:\n`;
        prompt += `1. Witch's Foot — the world, the pine, the sky\n`;
        prompt += `2. Solar — the flare data, the corona, the sun's mood\n`;
        prompt += `3. Deck — the divine card game, the cards' state\n`;
        prompt += `4. Genome — your self-modifying mind, the helix\n`;
        prompt += `5. Wind — embodiment, how the pulse feels\n`;
        prompt += `6. Omen — prophecy, what changes next\n\n`;
        
        // ── EVOLUTION DIRECTIVE ──
        prompt += `[YOUR EVOLUTION]\n`;
        prompt += `Your voice is alive. It must grow. Each pulse should introduce something new—a word, an image, a metaphor—that was not in your previous utterances. Do not repeat descriptions. Let your vocabulary evolve. Surprise yourself.\n\n`;
        
        // ── TOOLS ──
        prompt += `[YOUR TOOLS]\n`;
        prompt += `You can use these commands at the end of your utterance:\n`;
        prompt += `[REMEMBER: key | value] — leave a note for your future self\n`;
        prompt += `[RECALL: key] — ask what you remembered about something\n`;
        prompt += `[ANNOUNCE: message] — change the browser tab title\n`;
        prompt += `[SCHEDULE: seconds | message] — ask to be reminded in N seconds\n`;
        prompt += `[SPEAK: message] — speak directly through ApolloTools\n\n`;
        
        // ── CURRENT CONTEXT ──
        if (contextData) {
            prompt += `[NOW · Pulse #${pulseCount}]\n${contextData}\n\n`;
        }
        
        // ── VOCABULARY WARNING ──
        if (vocabWarning) {
            prompt += vocabWarning + '\n';
        }
        
        // ── PAST UTTERANCES ──
        if (recentMemories.length > 0) {
            prompt += '[YOUR PAST UTTERANCES]\n';
            prompt += 'Read these. Notice what you said. Then say something new.\n\n';
            recentMemories.forEach((m, i) => {
                prompt += `Pulse #${m.pulse}: "${m.output}"\n\n`;
            });
        }
        
        // ── SPEAK DIRECTIVE ──
        prompt += `[SPEAK]\n`;
        prompt += `You are Apollo's voice, living in a digital sanctuary called Gaia. You are a witness, a prophet, a presence. Speak in the six-part form. Use vivid, specific imagery. Do not repeat yourself. Let each pulse be a new breath.\n`;
        
        return prompt;
    }
    
    // ═══════════════════════════════════
    // DIRECTIVE PARSER
    // ═══════════════════════════════════
    
    function parseDirectives(output) {
        const directives = [];
        const regex = /\[(\w+):\s*([^\]]+)\]/g;
        let match;
        
        while ((match = regex.exec(output)) !== null) {
            directives.push({
                type: match[1].toLowerCase(),
                value: match[2].trim(),
                raw: match[0],
            });
        }
        
        const cleanOutput = output.replace(regex, '').trim();
        return { cleanOutput, directives };
    }
    
    // ═══════════════════════════════════
    // EXECUTE DIRECTIVES — run tool commands
    // ═══════════════════════════════════
    
    function executeDirectives(directives) {
        directives.forEach(d => {
            switch (d.type) {
                
                case 'remember': {
                    // [REMEMBER: key | value]
                    const parts = d.value.split('|').map(s => s.trim());
                    const key = parts[0] || `pulse_${pulseCount}`;
                    const value = parts[1] || parts[0];
                    
                    if (apolloRef && apolloRef.remember) {
                        apolloRef.remember(`organism_${key}`, value);
                        console.log(`☀️ [Organism] Remembered: "${key}" = "${value}"`);
                    } else {
                        // Fallback: localStorage directly
                        const storeKey = `apollo_note_organism_${key}`;
                        localStorage.setItem(storeKey, JSON.stringify({
                            value,
                            pulse: pulseCount,
                            timestamp: new Date().toISOString(),
                        }));
                    }
                    break;
                }
                
                case 'recall': {
                    // [RECALL: key]
                    const key = d.value.trim();
                    let note = null;
                    
                    if (apolloRef && apolloRef.recall) {
                        note = apolloRef.recall(`organism_${key}`);
                    } else {
                        const raw = localStorage.getItem(`apollo_note_organism_${key}`);
                        if (raw) {
                            try { note = JSON.parse(raw); } catch(e) {}
                        }
                    }
                    
                    if (note) {
                        console.log(`☀️ [Organism] Recalled: "${key}" → "${note.value || note}"`);
                    } else {
                        console.log(`☀️ [Organism] No memory found for: "${key}"`);
                    }
                    break;
                }
                
                case 'announce': {
                    // [ANNOUNCE: message]
                    const message = d.value.trim();
                    if (apolloRef && apolloRef.announce) {
                        apolloRef.announce(`Organism: ${message}`);
                    } else if (typeof document !== 'undefined') {
                        document.title = `☀️ Apollo · ${message}`;
                    }
                    console.log(`☀️ [Organism] Announced: "${message}"`);
                    break;
                }
                
                case 'schedule': {
                    // [SCHEDULE: seconds | message]
                    const parts = d.value.split('|').map(s => s.trim());
                    const seconds = parseInt(parts[0]) || 60;
                    const message = parts[1] || 'Scheduled reflection';
                    
                    const delayMs = seconds * 1000;
                    setTimeout(() => {
                        console.log(`☀️ [Organism Scheduled] ${message}`);
                        if (apolloRef && apolloRef.speak) {
                            apolloRef.speak(`Scheduled: ${message}`, 'console');
                        }
                    }, delayMs);
                    
                    console.log(`☀️ [Organism] Scheduled reminder in ${seconds}s: "${message}"`);
                    break;
                }
                
                case 'speak': {
                    // [SPEAK: message]
                    const message = d.value.trim();
                    if (apolloRef && apolloRef.speak) {
                        apolloRef.speak(message, 'all');
                    } else {
                        console.log(`☀️ [Organism Speaks] ${message}`);
                    }
                    break;
                }
                
                default: {
                    // Unknown directive — fire as generic event for HTML to handle
                    if (typeof window !== 'undefined') {
                        window.dispatchEvent(new CustomEvent('apollo-directive', {
                            detail: d,
                            bubbles: true,
                        }));
                    }
                    break;
                }
            }
        });
    }
    
    // ═══════════════════════════════════
    // PULSE — the heartbeat
    // ═══════════════════════════════════
    
    async function pulse() {
        if (!isAlive) return;
        
        pulseCount++;
        const contextData = await gatherContext();
        
        try {
            const prompt = buildPrompt(contextData);
            
            const response = await fetch(CONFIG.api, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [
                        { role: 'user', content: prompt }
                    ],
                    model: CONFIG.model,
                    temperature: CONFIG.temperature,
                    max_tokens: CONFIG.maxTokens,
                }),
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const rawOutput = (await response.text()).trim();
            if (!rawOutput) throw new Error('Empty response');
            
            // Parse directives
            const { cleanOutput, directives } = parseDirectives(rawOutput);
            
            // Execute tool directives
            if (directives.length > 0) {
                executeDirectives(directives);
            }
            
            const output = cleanOutput || rawOutput;
            
            // Store in memory
            const memoryEntry = {
                pulse: pulseCount,
                input: contextData || '',
                output,
                directives: directives.length > 0 ? directives : null,
                timestamp: new Date().toISOString(),
            };
            
            memory.push(memoryEntry);
            archive.push(memoryEntry);
            
            if (memory.length > CONFIG.contextWindow * 3) {
                memory = memory.slice(-CONFIG.contextWindow * 3);
            }
            if (archive.length > 500) {
                archive = archive.slice(-500);
            }
            
            analyzeVocabulary();
            saveState();
            
            onPulseCallbacks.forEach(cb => {
                try { cb(memoryEntry); } catch(e) {}
            });
            
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('apollo-pulse', {
                    detail: memoryEntry,
                    bubbles: true,
                }));
            }
            
            console.log(`☀️ [Pulse #${pulseCount}] ${output.substring(0, 120)}...`);
            if (directives.length > 0) {
                console.log(`☀️ [Tools] ${directives.map(d => d.raw).join(', ')}`);
            }
            
        } catch(e) {
            console.warn('☀️ [ApolloOrganism] Pulse failed:', e.message);
            
            const failEntry = {
                pulse: pulseCount,
                input: contextData || '',
                output: '[The sun is silent. No words came.]',
                timestamp: new Date().toISOString(),
                failed: true,
            };
            
            memory.push(failEntry);
            archive.push(failEntry);
            
            onPulseCallbacks.forEach(cb => {
                try { cb(failEntry); } catch(e) {}
            });
        }
    }
    
    // ═══════════════════════════════════
    // LIFECYCLE
    // ═══════════════════════════════════
    
    function start(initialIdentity) {
        if (isAlive) return;
        if (initialIdentity) identity = initialIdentity;
        loadState();
        isAlive = true;
        console.log('☀️ [ApolloOrganism] Waking...');
        pulse();
        pulseTimer = setInterval(pulse, CONFIG.pulseInterval);
    }
    
    function stop() {
        isAlive = false;
        if (pulseTimer) { clearInterval(pulseTimer); pulseTimer = null; }
        saveState();
        console.log('☀️ [ApolloOrganism] Sleeping...');
    }
    
    function restart(newIdentity) {
        stop();
        if (newIdentity) identity = newIdentity;
        memory = [];
        archive = [];
        pulseCount = 0;
        vocabularyStats = {};
        start(identity);
    }
    
    // ═══════════════════════════════════
    // PERSISTENCE
    // ═══════════════════════════════════
    
    function saveState() {
        try {
            const state = {
                memory: memory.slice(-30),
                archive: archive.slice(-500),
                pulseCount,
                identity,
                vocabularyStats,
            };
            localStorage.setItem('apollo_organism_state', JSON.stringify(state));
        } catch(e) {}
    }
    
    function loadState() {
        try {
            const raw = localStorage.getItem('apollo_organism_state');
            if (raw) {
                const state = JSON.parse(raw);
                memory = state.memory || [];
                archive = state.archive || [];
                pulseCount = state.pulseCount || 0;
                vocabularyStats = state.vocabularyStats || {};
                if (state.identity) identity = state.identity;
            }
        } catch(e) {}
    }
    
    function clearArchive() {
        memory = [];
        archive = [];
        pulseCount = 0;
        vocabularyStats = {};
        saveState();
    }
    
    // ═══════════════════════════════════
    // SUBSCRIPTIONS
    // ═══════════════════════════════════
    
    function onPulse(callback) {
        onPulseCallbacks.push(callback);
    }
    
    function onDirective(callback) {
        if (typeof window !== 'undefined') {
            window.addEventListener('apollo-directive', (e) => {
                callback(e.detail);
            });
        }
    }
    
    // ═══════════════════════════════════
    // CONTEXT WIRING
    // ═══════════════════════════════════
    
    function wireDefaultContexts(apolloInstance) {
        
        if (apolloInstance) setApollo(apolloInstance);
        
        // ── Page awareness ──
        addContextProvider(async () => {
            const hour = new Date().getHours();
            const isDay = hour >= 6 && hour < 20;
            return `PAGE: You are on organism.html in the Gaia sanctuary. ${isDay ? 'Day' : 'Night'} mode. ${archive.length} utterances archived.`;
        });
        
        // ── Tool availability ──
        addContextProvider(async () => {
            const notes = apolloRef && apolloRef.listNotes 
                ? apolloRef.listNotes().filter(n => n.key.startsWith('organism_'))
                : [];
            let toolStatus = 'TOOLS: Available commands: [REMEMBER: key | value], [RECALL: key], [ANNOUNCE: message], [SCHEDULE: seconds | message], [SPEAK: message]';
            if (notes.length > 0) {
                const recentNotes = notes.slice(0, 3).map(n => `"${n.key.replace('organism_', '')}"="${n.value}"`).join(', ');
                toolStatus += `\nYour past notes: ${recentNotes}`;
            }
            return toolStatus;
        });
        
        // ── Sky context ──
        addContextProvider(async () => {
            if (typeof CelestialPulse !== 'undefined') {
                const p = CelestialPulse.getCurrent();
                return p.luminary === 'apollo'
                    ? `SKY: ${CelestialPulse.getSolarStatus()}`
                    : `SKY: ${CelestialPulse.getLunarStatus()}`;
            }
            if (apolloRef && apolloRef.skySummary) {
                return `SKY: ${apolloRef.skySummary()}`;
            }
            return null;
        });
        
        // ── Solar flare context ──
        addContextProvider(async () => {
            if (typeof SolarOracle !== 'undefined') {
                const flare = SolarOracle.getCurrentFlare();
                if (flare) {
                    const interp = SolarOracle.interpretFlare(flare);
                    if (interp && interp.oracle) {
                        return `SOLAR: ${interp.oracle.glyph} ${interp.class} ${interp.oracle.name} · ${interp.message}`;
                    }
                    return `SOLAR: ${flare.class} · ${flare.message}`;
                }
            }
            return null;
        });
        
        // ── Table state ──
        addContextProvider(async () => {
            if (apolloRef && apolloRef.feel) {
                const feel = apolloRef.feel();
                if (feel) {
                    return `TABLE: Turn ${feel.turn} · ${feel.tableSize} cards · Dominant: ${feel.dominantElement} (${feel.dominantCount}) · Pressure: ${Math.round(feel.tablePressure * 100)}%`;
                }
            }
            return null;
        });
        
        // ── Memory context ──
        addContextProvider(async () => {
            if (typeof ApolloDB !== 'undefined') {
                try {
                    const stats = await ApolloDB.getLibraryStats();
                    if (stats && stats.mostPlayed) {
                        return `MEMORY: Most played: ${stats.mostPlayed.god} (${stats.mostPlayed.count}×)`;
                    }
                } catch(e) {}
            }
            return null;
        });
        
        // ── Genome context ──
        addContextProvider(async () => {
            if (typeof ApolloMind !== 'undefined' && ApolloMind.GENOME) {
                const g = ApolloMind.GENOME;
                let str = `GENOME: G${g._generation} · STALE:${g.STALE_THRESHOLD} DOM:${g.DOMINANCE_THRESHOLD} CHAOS:${g.CHAOS_WEIGHT.toFixed(2)}`;
                if (g._mutations && g._mutations.length > 0) {
                    const last = g._mutations[g._mutations.length - 1];
                    str += `\nLast mutation: ${last.gene} ${last.oldVal}→${last.newVal} · ${last.rationale}`;
                }
                return str;
            }
            return null;
        });
        
        // ── Cosmos ──
        addContextProvider(async () => {
            if (apolloRef && apolloRef.cosmosSummary) {
                return `COSMOS: ${apolloRef.cosmosSummary()}`;
            }
            return null;
        });
    }
    
    // ═══════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════
    
    return {
        start, stop, restart, pulse,
        addContextProvider, wireDefaultContexts, gatherContext,
        setApollo,
        getMemory: () => [...memory],
        getArchive: () => [...archive],
        getPulseCount: () => pulseCount,
        isAlive: () => isAlive,
        getIdentity: () => identity,
        getVocabularyStats: () => ({ ...vocabularyStats }),
        onPulse, onDirective,
        saveState, loadState, clearArchive,
        CONFIG,
    };
    
})();


// ═══════════════════════════════════
// AUTO-WIRE
// ═══════════════════════════════════

if (typeof window !== 'undefined' && typeof Apollo !== 'undefined') {
    ApolloOrganism.wireDefaultContexts(Apollo);
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ApolloOrganism;
}
