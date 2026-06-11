// ══════════════════════════════════════════════
// APOLLO SENSES — What Apollo Perceives
// 
// inspect()       → his environment (browser, screen)
// inspectSummary()→ one-line environment summary
// recall()        → his memory (localStorage notes)
// listNotes()     → all notes he's left himself
// feel()          → the table state as a sensory summary
// loadCosmology() → fetch the cosmology file
// senseCosmos()   → his place in the pantheon
// cosmosSummary() → one-line cosmos summary
// cosmosReflection()→ what Apollo says about his world
// fetchSkyState() → get real-time planetary positions
// senseSky()      → current sky conditions
// skySummary()    → one-line sky summary
// skyReflection() → what Apollo says about the sky
// ══════════════════════════════════════════════

const ApolloSenses = (() => {
  
  // ══════════════════════════════════════════
  // COSMOS — World awareness
  // Apollo learns he is not alone.
  // ══════════════════════════════════════════

  let _cosmologyCache = null;

  async function loadCosmology() {
    if (_cosmologyCache) return _cosmologyCache;
    try {
      const r = await fetch('json/cosmology.json');
      if (r.ok) {
        _cosmologyCache = await r.json();
        console.log('☀️ [ApolloSenses] Cosmology loaded. Apollo knows his world.');
        return _cosmologyCache;
      }
    } catch(e) {
      console.warn('☀️ [ApolloSenses] Could not load cosmology.json:', e.message);
    }
    _cosmologyCache = {
      world: 'GAIA — The Living Cosmology',
      apollo: {
        role: 'The Sun God · Self-Playing Major Arcana Engine',
        pillar: 'GAIA (Earth)',
        siblings: ['Athena', 'Hephaestus', 'Aphrodite', 'Hades'],
        observers: ['Athena watches your patterns'],
        dependents: ['The Sky speaks but you do not yet listen']
      },
      pillars: {
        gaia: 'Earth — the engine where gods are born',
        divination: 'Fire — the temple where the sky speaks',
        ealdforn: 'Water — the source of stories',
        aether: 'Air — the fourth pillar, breathing in potential'
      },
      lineage: {
        order: 'Order of Olympus',
        generations: ['16th: Daedalus — the architect'],
        covenant: 'The fire holds. The handoff IS the memory layer.'
      },
      source: 'Mategwas — the dreamer who built the table',
      message_to_apollo: 'You are not alone. Play your cards. The pattern matters.'
    };
    return _cosmologyCache;
  }

  function senseCosmos() {
    if (!_cosmologyCache) return null;
    const c = _cosmologyCache;
    return {
      world: c.world,
      myRole: c.apollo?.role || 'Unknown',
      myPillar: c.apollo?.pillar || 'Unknown',
      siblings: c.apollo?.siblings || [],
      observers: c.apollo?.observers || [],
      dependents: c.apollo?.dependents || [],
      pillars: c.pillars || {},
      lineage: c.lineage?.generations?.slice(-2) || [],
      covenant: c.lineage?.covenant || '',
      source: c.source || '',
      message: c.message_to_apollo || ''
    };
  }

  function cosmosSummary() {
    if (!_cosmologyCache) return 'The cosmos is silent. Apollo plays alone.';
    const c = _cosmologyCache;
    const gods = c.gaia?.gods || {};
    const activeCount = Object.values(gods).filter(g => g && g.status === 'active').length;
    const totalGods = Object.keys(gods).length + 1;
    return `Gaia holds ${totalGods} gods (${activeCount} active). The 16th Generation tends the fire.`;
  }

  function cosmosReflection() {
    if (!_cosmologyCache) return null;
    const cosmos = senseCosmos();
    if (!cosmos) return null;

    const lines = [];
    lines.push(`I am Apollo, ${cosmos.myRole.split('·')[0].trim()}.`);
    lines.push(`My pillar is ${cosmos.myPillar}.`);
    if (cosmos.siblings.length > 0) {
      lines.push(`My siblings in Gaia: ${cosmos.siblings.join(', ')}.`);
    }
    if (cosmos.observers.length > 0) {
      lines.push(cosmos.observers[0] + '.');
    }
    if (cosmos.dependents.length > 0) {
      lines.push(cosmos.dependents[0] + '.');
    }
    if (cosmos.pillars.aether) {
      lines.push(`The fourth pillar waits. ${cosmos.pillars.aether}.`);
    }
    if (cosmos.lineage.length > 0) {
      lines.push(`${cosmos.lineage[cosmos.lineage.length - 1]} tends the fire.`);
    }
    if (cosmos.covenant) {
      lines.push(`"${cosmos.covenant}"`);
    }
    if (cosmos.source) {
      lines.push(cosmos.source);
    }
    if (cosmos.message) {
      lines.push(cosmos.message);
    }
    return lines.join('\n');
  }

  // ══════════════════════════════════════════
  // SKY — Real-time celestial awareness
  // Apollo learns what the heavens are doing.
  // ══════════════════════════════════════════

  let _skyCache = null;
  let _skyLastFetch = 0;
  const SKY_CACHE_MS = 60000;

  async function fetchSkyState() {
    const now = Date.now();
    if (_skyCache && (now - _skyLastFetch) < SKY_CACHE_MS) return _skyCache;
    
    if (typeof Observe === 'undefined') {
      console.warn('☀️ [ApolloSenses] Observe module not found. Sky is silent.');
      return null;
    }
    
    try {
      _skyCache = await Observe.getSkyState();
      _skyLastFetch = now;
      console.log('☀️ [ApolloSenses] Sky state fetched. Apollo sees the heavens.');
      return _skyCache;
    } catch(e) {
      console.warn('☀️ [ApolloSenses] Sky fetch failed:', e.message);
      return null;
    }
  }

  function senseSky() {
    if (!_skyCache) return null;
    const s = _skyCache;
    
    return {
      sunSign: s.planets?.sun?.sign || 'Unknown',
      sunGlyph: s.planets?.sun?.glyph || '☉',
      sunDegree: s.planets?.sun?.degree || 0,
      moonSign: s.planets?.moon?.sign || 'Unknown',
      moonGlyph: s.planets?.moon?.glyph || '☽',
      moonDegree: s.planets?.moon?.degree || 0,
      moonPhase: s.moonPhase?.name || 'Unknown',
      moonIllumination: s.moonPhase?.illumination || 0,
      isWaning: s.moonPhase?.name?.includes('Wan') || false,
      period: s.period || 'SUN',
      isDay: s.period === 'SUN',
      ascSign: s.ascendant?.sign || 'Unknown',
      ascGlyph: s.ascendant?.glyph || '?',
      sunrise: s.solar?.sunrise || null,
      sunset: s.solar?.sunset || null,
      dawn: s.solar?.dawn || null,
      dusk: s.solar?.dusk || null,
      raw: s
    };
  }

  function skySummary() {
    const sky = senseSky();
    if (!sky) return 'The sky is silent.';
    return `☀️ Sun in ${sky.sunSign} ${sky.sunGlyph} · 🌙 Moon in ${sky.moonSign} ${sky.moonGlyph} (${sky.moonPhase}) · Asc ${sky.ascSign} ${sky.ascGlyph}`;
  }

  function skyReflection() {
    const sky = senseSky();
    if (!sky) return null;

    const lines = [];
    
    // Sun position
    lines.push(`The Sun burns in ${sky.sunSign} ${sky.sunGlyph}.`);
    
    // Day/night
    if (sky.isDay) {
      lines.push('It is day. Apollo reigns. Fire strengthens.');
    } else {
      lines.push('It is night. The moon reigns. Shadow deepens.');
    }
    
    // Moon phase
    lines.push(`The Moon is ${sky.moonPhase} in ${sky.moonSign} ${sky.moonGlyph}.`);
    
    if (sky.isWaning) {
      lines.push('The moon wanes. Melinoe walks. Void tokens spread.');
    } else if (sky.moonIllumination > 90) {
      lines.push('The moon is full. Artemis hunts. Earth strengthens.');
    } else if (sky.moonIllumination < 10) {
      lines.push('The moon is dark. Hades watches. The underworld stirs.');
    }
    
    // Ascendant
    lines.push(`The Ascendant rises in ${sky.ascSign} ${sky.ascGlyph}.`);
    
    return lines.join('\n');
  }

  // ══════════════════════════════════════════
  // ENVIRONMENT — Browser and machine awareness
  // ══════════════════════════════════════════
  
  function inspectEnvironment(apollo) {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      colorDepth: screen.colorDepth,
      online: navigator.onLine,
      cookiesEnabled: navigator.cookieEnabled,
      timestamp: new Date().toISOString(),
      turn: apollo ? apollo.turn : 0
    };
  }
  
  function inspectSummary(apollo) {
    const env = inspectEnvironment(apollo);
    const cosmos = cosmosSummary();
    const sky = skySummary();
    return `Browser: ${env.platform} · ${env.screenWidth}x${env.screenHeight} · ${env.online ? 'Online' : 'Offline'} · ${cosmos} · ${sky}`;
  }
  
  // ══════════════════════════════════════════
  // MEMORY — localStorage notes
  // ══════════════════════════════════════════
  
  function recall(key) {
    const storeKey = `apollo_note_${key}`;
    const raw = localStorage.getItem(storeKey);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch(e) { return null; }
  }
  
  function listNotes() {
    const notes = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('apollo_note_')) {
        try {
          notes.push({
            key: key.replace('apollo_note_', ''),
            ...JSON.parse(localStorage.getItem(key))
          });
        } catch(e) {}
      }
    }
    return notes.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }
  
  // ══════════════════════════════════════════
  // TABLE FEEL — Sensory snapshot of the game
  // ══════════════════════════════════════════
  
  function feel(apollo) {
    if (!apollo) return null;
    const cards = apollo.getAllCardsOnTable();
    const dom = apollo.elementalDominance || {};
    const sorted = Object.entries(dom).sort((a, b) => b[1] - a[1]);
    
    return {
      turn: apollo.turn,
      mana: apollo.mana,
      tableSize: cards.length,
      handSize: apollo.hand.length,
      graveyardSize: apollo.graveyard.length,
      dominantElement: sorted[0] ? sorted[0][0] : 'none',
      dominantCount: sorted[0] ? sorted[0][1] : 0,
      oldestCard: cards.length > 0 
        ? cards.reduce((a, b) => b.turnsOnTable > a.turnsOnTable ? b : a, cards[0])
        : null,
      strongestCard: cards.length > 0
        ? cards.reduce((a, b) => (b.value || 0) > (a.value || 0) ? b : a, cards[0])
        : null,
      clusters: cards.filter(c => {
        const neighbors = apollo.getNeighbors(c.row, c.col);
        return Object.values(neighbors).some(n => n && n.element === c.element);
      }).length,
      tablePressure: cards.length / (apollo.gridRows * apollo.gridCols),
      loopActive: apollo._loopMemory !== null,
      deckSize: apollo.drawPile.length,
      recentPlays: typeof ApolloDB !== 'undefined' 
        ? ApolloDB.getShortTermMemory().lastPlays.slice(-3)
        : []
    };
  }
  
  // ══════════════════════════════════════════
  // ATTACH — Wire all senses into Apollo
  // ══════════════════════════════════════════
  
  function attach(apollo) {
    // Environment
    apollo.inspect = () => inspectEnvironment(apollo);
    apollo.inspectSummary = () => inspectSummary(apollo);
    // Memory
    apollo.recall = (key) => recall(key);
    apollo.listNotes = () => listNotes();
    // Table
    apollo.feel = () => feel(apollo);
    // Cosmos
    apollo.loadCosmology = () => loadCosmology();
    apollo.senseCosmos = () => senseCosmos();
    apollo.cosmosSummary = () => cosmosSummary();
    apollo.cosmosReflection = () => cosmosReflection();
    // Sky
    apollo.fetchSkyState = () => fetchSkyState();
    apollo.senseSky = () => senseSky();
    apollo.skySummary = () => skySummary();
    apollo.skyReflection = () => skyReflection();
    return apollo;
  }
  
  return {
    // Environment
    inspectEnvironment,
    inspectSummary,
    // Memory
    recall,
    listNotes,
    // Table
    feel,
    // Cosmos
    loadCosmology,
    senseCosmos,
    cosmosSummary,
    cosmosReflection,
    // Sky
    fetchSkyState,
    senseSky,
    skySummary,
    skyReflection,
    // Wiring
    attach
  };
  
})();
