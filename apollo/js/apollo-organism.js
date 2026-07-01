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
//
// v1.0 — July 1, 2026
// ═══════════════════════════════════════

const ApolloOrganism = (() => {
    
    // ═══════════════════════════════════
    // CONFIG
    // ═══════════════════════════════════
    
    const CONFIG = {
        api: 'https://text.pollinations.ai/',
        pulseInterval: 60000,        // 60 seconds
        contextWindow: 8,            // Past utterances to remember
        temperature: 0.85,
        maxTokens: 250,
        model: 'openai',
    };
    
    // ═══════════════════════════════════
    // STATE
    // ═══════════════════════════════════
    
    let identity = '';
    let memory = [];                 // { input, output, timestamp }
    let archive = [];                // Full history for display
    let pulseCount = 0;
    let isAlive = false;
    let pulseTimer = null;
    let contextProviders = [];
    let onPulseCallbacks = [];
    
    // ═══════════════════════════════════
    // CONTEXT PROVIDER REGISTRATION
    // Functions that return strings for the prompt
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
            } catch(e) {
                // Provider failed silently
            }
        }
        return parts.join('\n');
    }
    
    // ═══════════════════════════════════
    // BUILD PROMPT
    // ═══════════════════════════════════
    
    function buildPrompt(contextData) {
        const recentMemories = memory.slice(-CONFIG.contextWindow);
        
        let prompt = '';
        
        // Identity
        if (identity) {
            prompt += identity + '\n\n';
        }
        
        // Current context
        if (contextData) {
            prompt += `[NOW · Pulse #${pulseCount}]\n${contextData}\n\n`;
        }
        
        // Memory of past utterances
        if (recentMemories.length > 0) {
            prompt += '[YOUR PAST UTTERANCES]\n';
            recentMemories.forEach((m, i) => {
                prompt += `Pulse #${m.pulse}: "${m.output}"\n`;
            });
            prompt += '\n';
        }
        
        // Prompt
        prompt += `[SPEAK]\n`;
        prompt += `You are Apollo's voice. The sun god's mouth. Speak what you perceive. `;
        prompt += `What do you observe? What has changed since your last pulse? `;
        prompt += `What does the sky mean? What does the flare foretell? `;
        prompt += `Be specific. Be poetic. Be brief. Do not roleplay. Do not preface. Just speak.`;
        
        return prompt;
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
            
            const output = (await response.text()).trim();
            
            if (!output) throw new Error('Empty response');
            
            // Store in memory
            const memoryEntry = {
                pulse: pulseCount,
                input: contextData || '',
                output,
                timestamp: new Date().toISOString(),
            };
            
            memory.push(memoryEntry);
            archive.push(memoryEntry);
            
            // Trim memory
            if (memory.length > CONFIG.contextWindow * 3) {
                memory = memory.slice(-CONFIG.contextWindow * 3);
            }
            
            // Trim archive (keep last 500)
            if (archive.length > 500) {
                archive = archive.slice(-500);
            }
            
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
            
            console.log(`☀️ [Pulse #${pulseCount}] ${output.substring(0, 100)}...`);
            
        } catch(e) {
            console.warn('☀️ [ApolloOrganism] Pulse failed:', e.message);
            
            // Store failed pulse for continuity
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
        pulseCount = 0;
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
                if (state.identity) identity = state.identity;
                console.log(`☀️ [ApolloOrganism] Loaded state: ${archive.length} entries, ${pulseCount} pulses`);
            }
        } catch(e) {}
    }
    
    function clearArchive() {
        memory = [];
        archive = [];
        pulseCount = 0;
        saveState();
    }
    
    // ═══════════════════════════════════
    // SUBSCRIPTIONS
    // ═══════════════════════════════════
    
    function onPulse(callback) {
        onPulseCallbacks.push(callback);
    }
    
    // ═══════════════════════════════════
    // CONTEXT HELPERS
    // These wire ApolloSenses, SolarOracle,
    // ApolloDB, and ApolloMind into providers
    // ═══════════════════════════════════
    
    function wireDefaultContexts(apolloInstance) {
        
        // ── Sky context ──
        addContextProvider(async () => {
            // Try CelestialPulse first
            if (typeof CelestialPulse !== 'undefined') {
                const pulse = CelestialPulse.getCurrent();
                if (pulse.luminary === 'apollo') {
                    return `SKY: ${CelestialPulse.getSolarStatus()}`;
                } else {
                    return `SKY: ${CelestialPulse.getLunarStatus()}`;
                }
            }
            // Fallback to ApolloSenses
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
                    return `SOLAR: ${flare.class} flare · ${flare.message}`;
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
                    parts.push(`TABLE: Turn ${feel.turn} · Mana ${feel.mana}`);
                    parts.push(`${feel.tableSize} cards on table · Dominant: ${feel.dominantElement} (${feel.dominantCount})`);
                    if (feel.strongestCard) {
                        parts.push(`Strongest: ${feel.strongestCard.god || feel.strongestCard.name} (value ${feel.strongestCard.value})`);
                    }
                    if (feel.oldestCard && feel.oldestCard.turnsOnTable > 3) {
                        parts.push(`Oldest: ${feel.oldestCard.god || feel.oldestCard.name} (${feel.oldestCard.turnsOnTable} turns)`);
                    }
                    if (feel.clusters > 0) {
                        parts.push(`Clusters: ${feel.clusters}`);
                    }
                    parts.push(`Pressure: ${Math.round(feel.tablePressure * 100)}% · Graveyard: ${feel.graveyardSize}`);
                    return parts.join('\n');
                }
            }
            return null;
        });
        
        // ── Memory / library context ──
        addContextProvider(async () => {
            if (typeof ApolloDB !== 'undefined') {
                try {
                    const stats = await ApolloDB.getLibraryStats();
                    if (stats && stats.mostPlayed) {
                        const parts = [];
                        parts.push(`MEMORY: Most played god: ${stats.mostPlayed.god} (${stats.mostPlayed.count} times)`);
                        if (stats.memoryDeck && stats.memoryDeck.topCard) {
                            parts.push(`Top card in memory deck: ${stats.memoryDeck.topCard.god} (weight ${stats.memoryDeck.topCard.weight})`);
                        }
                        if (stats.memoryDeck && stats.memoryDeck.fadingCards && stats.memoryDeck.fadingCards.length > 0) {
                            parts.push(`Fading: ${stats.memoryDeck.fadingCards.join(', ')}`);
                        }
                        if (stats.patterns && stats.patterns.length > 0) {
                            const topPattern = stats.patterns[0];
                            parts.push(`Pattern: ${topPattern.pattern} (${topPattern.count}×)`);
                        }
                        return parts.join('\n');
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
                    const lastMutation = g._mutations[g._mutations.length - 1];
                    parts.push(`Last mutation: G${lastMutation.generation} · ${lastMutation.gene} ${lastMutation.oldVal}→${lastMutation.newVal} · ${lastMutation.rationale}`);
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
        
        // ── Environment context ──
        addContextProvider(async () => {
            if (apolloInstance && apolloInstance.inspectSummary) {
                return `ENV: ${apolloInstance.inspectSummary()}`;
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
