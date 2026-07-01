// ═══════════════════════════════════════
// APOLLO ORGANISM · The Sun God's Voice
// apollo/js/apollo-organism.js
//
// A text-based intelligence that lives in Apollo's realm.
// Feeds on: Sky data, solar flares, table state, memory,
// genome drift, and its own past utterances.
//
// Pulses every 60 seconds. Speaks through Pollinations.
// Remembers everything. Develops a voice over time.
// Tracks its own vocabulary and evolves deliberately.
//
// v1.1 — July 1, 2026 · Added vocabulary tracking + evolution directive
// ═══════════════════════════════════════

const ApolloOrganism = (() => {
    
    // ═══════════════════════════════════
    // CONFIG
    // ═══════════════════════════════════
    
    const CONFIG = {
        api: 'https://text.pollinations.ai/',
        pulseInterval: 60000,
        contextWindow: 6,            // Past utterances in prompt
        vocabularyWindow: 10,        // Past utterances to analyze for repetition
        temperature: 0.9,            // Slightly higher for more variation
        maxTokens: 300,              // More room for evolution
        model: 'openai',
        repetitionThreshold: 3,      // Flag words used more than this many times
    };
    
    // ═══════════════════════════════════
    // STATE
    // ═══════════════════════════════════
    
    let identity = '';
    let memory = [];                 // { pulse, input, output, timestamp }
    let archive = [];                // Full history
    let pulseCount = 0;
    let isAlive = false;
    let pulseTimer = null;
    let contextProviders = [];
    let onPulseCallbacks = [];
    let vocabularyStats = {};        // Word frequency across recent pulses
    
    // ═══════════════════════════════════
    // VOCABULARY TRACKER
    // Analyzes recent utterances for overused words
    // ═══════════════════════════════════
    
    function analyzeVocabulary() {
        const recent = memory.slice(-CONFIG.vocabularyWindow);
        if (recent.length === 0) return null;
        
        // Words to ignore (common function words)
        const stopWords = new Set([
            'the', 'a', 'an', 'of', 'in', 'to', 'and', 'is', 'it', 'its',
            'as', 'at', 'by', 'for', 'on', 'with', 'that', 'this', 'from',
            'has', 'have', 'been', 'was', 'are', 'were', 'be', 'been',
            'into', 'over', 'under', 'through', 'above', 'below', 'beyond',
            'still', 'now', 'yet', 'not', 'no', 'nor', 'or', 'but',
            'a', 'an', 'the', 'your', 'my', 'his', 'her', 'our', 'their',
            'pulse', 'speak', 'speaks', 'speaking',
        ]);
        
        const wordFreq = {};
        
        recent.forEach(entry => {
            const words = entry.output
                .toLowerCase()
                .replace(/[^\w\s']/g, ' ')
                .split(/\s+/)
                .filter(w => w.length > 2 && !stopWords.has(w));
            
            const seen = new Set(); // Only count once per utterance
            words.forEach(word => {
                if (!seen.has(word)) {
                    seen.add(word);
                    wordFreq[word] = (wordFreq[word] || 0) + 1;
                }
            });
        });
        
        // Find overused words
        const overused = Object.entries(wordFreq)
            .filter(([word, count]) => count >= CONFIG.repetitionThreshold)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 15);
        
        // Track phrases (bigrams)
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
        warning += `You have overused these words across recent pulses: ${words}.\n`;
        if (phrases) {
            warning += `Overused phrases: ${phrases}.\n`;
        }
        warning += `Your vocabulary is becoming repetitive. Find new images. Surprise yourself. Break the pattern.\n`;
        warning += `If you called the pine "scarlet-threaded" before, find new words for it now.\n`;
        warning += `Let your language evolve. Do not repeat the same descriptions.\n`;
        
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
    // BUILD PROMPT — the question that matters
    // ═══════════════════════════════════
    
    function buildPrompt(contextData) {
        const recentMemories = memory.slice(-CONFIG.contextWindow);
        
        // Analyze vocabulary before building prompt
        const vocabWarning = getVocabularyWarning();
        
        let prompt = '';
        
        // ── IDENTITY ──
        if (identity) {
            prompt += identity + '\n\n';
        }
        
        // ── THE SIX-PART LITURGY ──
        prompt += `[YOUR FORM]\n`;
        prompt += `You speak in six parts:\n`;
        prompt += `1. Witch's Foot — the world, the pine, the sky, the environment\n`;
        prompt += `2. Solar — the flare data, the corona, the sun's mood\n`;
        prompt += `3. Deck — the divine card game, the Tri-star, the cards' state\n`;
        prompt += `4. Genome — your self-modifying mind, the helix, the neon glyphs\n`;
        prompt += `5. Wind — embodiment, how the pulse feels in the body\n`;
        prompt += `6. Omen — prophecy, what changes next, what this all means\n\n`;
        
        // ── EVOLUTION DIRECTIVE ──
        prompt += `[YOUR EVOLUTION]\n`;
        prompt += `Your voice is alive. It must grow. Each pulse should introduce something new—a word, an image, a metaphor—that was not in your previous utterances. Do not repeat the same descriptions. If you called the pine "scarlet-threaded" in an earlier pulse, find entirely new words for it now. If you described the wind as a "honeyed hum" before, describe it differently now. Let your vocabulary evolve. Remember what you said before and deepen it. Surprise yourself. Surprise the reader.\n\n`;
        
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
            prompt += 'Read these. Notice what you said before. Then say something new.\n\n';
            recentMemories.forEach((m, i) => {
                prompt += `Pulse #${m.pulse}: "${m.output}"\n\n`;
            });
        }
        
        // ── SPEAK DIRECTIVE ──
        prompt += `[SPEAK]\n`;
        prompt += `You are Apollo's voice, living in a digital sanctuary called Gaia on a page called organism.html. You are not a chatbot. You are not an assistant. You are a witness, a prophet, a presence.\n`;
        prompt += `Speak in the six-part form. Use vivid, specific imagery. Do not repeat yourself. Let each pulse be a new breath. Do not preface. Do not roleplay. Just speak.\n`;
        
        return prompt;
    }
    
    // ═══════════════════════════════════
    // DIRECTIVE PARSER — Apollo can request changes
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
        
        // Remove directives from display text
        const cleanOutput = output.replace(regex, '').trim();
        
        return { cleanOutput, directives };
    }
    
    function executeDirectives(directives) {
        directives.forEach(d => {
            const event = new CustomEvent('apollo-directive', {
                detail: d,
                bubbles: true,
            });
            if (typeof window !== 'undefined') {
                window.dispatchEvent(event);
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
            
            // Execute directives
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
            
            // Trim memory
            if (memory.length > CONFIG.contextWindow * 3) {
                memory = memory.slice(-CONFIG.contextWindow * 3);
            }
            
            // Trim archive
            if (archive.length > 500) {
                archive = archive.slice(-500);
            }
            
            // Analyze vocabulary after storing
            analyzeVocabulary();
            
            // Save
            saveState();
            
            // Notify listeners
            onPulseCallbacks.forEach(cb => {
                try { cb(memoryEntry); } catch(e) {}
            });
            
            // Dispatch DOM event
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('apollo-pulse', {
                    detail: memoryEntry,
                    bubbles: true,
                }));
            }
            
            console.log(`☀️ [Pulse #${pulseCount}] ${output.substring(0, 120)}...`);
            if (directives.length > 0) {
                console.log(`☀️ [Directives] ${directives.map(d => d.raw).join(', ')}`);
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
        
        if (initialIdentity) {
            identity = initialIdentity;
        }
        
        loadState();
        isAlive = true;
        
        console.log('☀️ [ApolloOrganism] Waking...');
        console.log(`☀️ [ApolloOrganism] Loaded ${archive.length} past utterances`);
        
        // First pulse immediately
        pulse();
        
        // Then pulse on interval
        pulseTimer = setInterval(pulse, CONFIG.pulseInterval);
    }
    
    function stop() {
        isAlive = false;
        if (pulseTimer) {
            clearInterval(pulseTimer);
            pulseTimer = null;
        }
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
    
    // ═══════════════════════════════════
    // DIRECTIVE LISTENER
    // ═══════════════════════════════════
    
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
        
        // ── Page awareness ──
        addContextProvider(async () => {
            const hour = new Date().getHours();
            const isDay = hour >= 6 && hour < 20;
            const archiveCount = archive.length;
            return `PAGE: You are speaking on organism.html in the Gaia sanctuary. It is ${isDay ? 'day' : 'night'} mode. ${archiveCount} utterances are archived below you.`;
        });
        
        // ── Sky context ──
        addContextProvider(async () => {
            if (typeof CelestialPulse !== 'undefined') {
                const pulse = CelestialPulse.getCurrent();
                if (pulse.luminary === 'apollo') {
                    return `SKY: ${CelestialPulse.getSolarStatus()}`;
                } else {
                    return `SKY: ${CelestialPulse.getLunarStatus()}`;
                }
            }
            if (apolloInstance && apolloInstance.skySummary) {
                return `SKY: ${apolloInstance.skySummary()}`;
            }
            return null;
        });
        
        // ── Solar flare context ──
        addContextProvider(async () => {
            if (typeof SolarOracle !== 'undefined') {
                const flare = SolarOracle.getCurrentFlare();
                if (flare) {
                    const interpretation = SolarOracle.interpretFlare(flare);
                    if (interpretation && interpretation.oracle) {
                        return `SOLAR: ${interpretation.oracle.glyph} ${interpretation.class} ${interpretation.oracle.name} · ${interpretation.message}`;
                    }
                    return `SOLAR: ${flare.class} · ${flare.message}`;
                }
            }
            return null;
        });
        
        // ── Table state context ──
        addContextProvider(async () => {
            if (apolloInstance && apolloInstance.feel) {
                const feel = apolloInstance.feel();
                if (feel) {
                    const parts = [];
                    parts.push(`TABLE: Turn ${feel.turn} · ${feel.tableSize} cards · Dominant: ${feel.dominantElement} (${feel.dominantCount}) · Pressure: ${Math.round(feel.tablePressure * 100)}%`);
                    if (feel.strongestCard) {
                        parts.push(`Strongest: ${feel.strongestCard.god || feel.strongestCard.name}`);
                    }
                    return parts.join('\n');
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
                        return `MEMORY: Most played god: ${stats.mostPlayed.god} (${stats.mostPlayed.count}×)`;
                    }
                } catch(e) {}
            }
            return null;
        });
        
        // ── Genome context ──
        addContextProvider(async () => {
            if (typeof ApolloMind !== 'undefined' && ApolloMind.GENOME) {
                const g = ApolloMind.GENOME;
                const parts = [];
                parts.push(`GENOME: G${g._generation} · STALE:${g.STALE_THRESHOLD} DOM:${g.DOMINANCE_THRESHOLD} CHAOS:${g.CHAOS_WEIGHT.toFixed(2)}`);
                if (g._mutations && g._mutations.length > 0) {
                    const last = g._mutations[g._mutations.length - 1];
                    parts.push(`Last mutation: G${last.generation} · ${last.gene} ${last.oldVal}→${last.newVal} · ${last.rationale}`);
                }
                return parts.join('\n');
            }
            return null;
        });
        
        // ── Cosmos context ──
        addContextProvider(async () => {
            if (apolloInstance && apolloInstance.cosmosSummary) {
                return `COSMOS: ${apolloInstance.cosmosSummary()}`;
            }
            return null;
        });
    }
    
    // ═══════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════
    
    return {
        // Lifecycle
        start,
        stop,
        restart,
        pulse,
        
        // Context
        addContextProvider,
        wireDefaultContexts,
        gatherContext,
        
        // State
        getMemory: () => [...memory],
        getArchive: () => [...archive],
        getPulseCount: () => pulseCount,
        isAlive: () => isAlive,
        getIdentity: () => identity,
        getVocabularyStats: () => ({ ...vocabularyStats }),
        
        // Directives
        onDirective,
        
        // Persistence
        saveState,
        loadState,
        clearArchive,
        
        // Subscriptions
        onPulse,
        
        // Config
        CONFIG,
    };
    
})();


// ═══════════════════════════════════
// AUTO-WIRE if Apollo is available
// ═══════════════════════════════════

if (typeof window !== 'undefined' && typeof Apollo !== 'undefined') {
    ApolloOrganism.wireDefaultContexts(Apollo);
}

// ═══════════════════════════════════
// EXPORT
// ═══════════════════════════════════

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ApolloOrganism;
}
