// ══════════════════════════════════════════════
// APOLLO DB — Memory Vault + JSON Library
// Short-term: Monaco block (last 5 plays)
// Long-term: IndexedDB (all sessions)
// Memory Library: Queryable JSON structures
// ══════════════════════════════════════════════

const ApolloDB = (() => {
  const DB_NAME = 'apollo_memory';
  const DB_VERSION = 1;
  let db = null;
  
  // ══════════════════════════════════════════
  // SHORT-TERM MEMORY (unchanged)
  // ══════════════════════════════════════════
  
  const shortTermMemory = {
    lastPlays: [],
    currentTable: [],
    currentHand: [],
    lastProphecy: null,
    emergentEvents: [],
    elementalState: {},
    loopMemory: null,
    timestamp: null
  };

    function updateShortTerm(apollo) {
    const cards = apollo.getAllCardsOnTable();
    shortTermMemory.currentTable = cards.map(c => ({
      god: c.god, name: c.name, element: c.element,
      value: c.value, tokens: c.tokens, row: c.row, col: c.col
    }));
    shortTermMemory.currentHand = apollo.hand.map(c => ({
      god: c.god, name: c.name, cost: c.cost, element: c.element
    }));
    shortTermMemory.elementalState = { ...apollo.elementalDominance };
    shortTermMemory.loopMemory = apollo._loopMemory;
    shortTermMemory.timestamp = new Date().toISOString();
    shortTermMemory.emergentEvents = apollo.persistentState.emergentEvents.slice(-3);
  }

  function recordPlay(card) {
    shortTermMemory.lastPlays.push({
      timestamp: new Date().toISOString(),
      god: card.god || card.name,
      name: card.name,
      effect: card.effect,
      element: card.element,
      cost: card.cost
    });
    if (shortTermMemory.lastPlays.length > 5) {
      shortTermMemory.lastPlays.shift();
    }
  }

  function recordProphecy(cards) {
    shortTermMemory.lastProphecy = {
      timestamp: new Date().toISOString(),
      cards: cards.map(c => c.god || c.name)
    };
  }

  function getShortTermMemory() {
    return { ...shortTermMemory, lastPlays: [...shortTermMemory.lastPlays] };
  }

  function getShortTermJSON() {
    return JSON.stringify(shortTermMemory, null, 2);
  }

  // ══════════════════════════════════════════
  // LONG-TERM MEMORY (IndexedDB)
  // ══════════════════════════════════════════
  
  async function open() { /* unchanged */ }
  async function put(storeName, data) { /* unchanged */ }
  async function getAll(storeName, indexName, limit = 50) { /* unchanged */ }
  async function count(storeName) { /* unchanged */ }
  async function saveSession(apollo) { /* unchanged */ }
  async function savePlay(card) { /* unchanged */ }
  async function saveProphecy(cards) { /* unchanged */ }
  async function saveEmergentEvent(event, type) { /* unchanged */ }
  async function saveDeckSnapshot(apollo) { /* unchanged */ }
  async function syncToVault(apollo) { /* unchanged */ }

  // ══════════════════════════════════════════
  // 🜏 MEMORY LIBRARY — Query Layer
  // ══════════════════════════════════════════

  /**
   * Get the most played god across all sessions.
   * Returns { god, count, percentage } or null.
   */
  async function getMostPlayedGod() {
    const plays = await getAll('play_history', null, 500);
    if (plays.length === 0) return null;
    
    const counts = {};
    plays.forEach(p => {
      const god = p.god || 'Unknown';
      counts[god] = (counts[god] || 0) + 1;
    });
    
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return {
      god: sorted[0][0],
      count: sorted[0][1],
      percentage: Math.round((sorted[0][1] / plays.length) * 100),
      top5: sorted.slice(0, 5).map(([god, count]) => ({ god, count }))
    };
  }

  /**
   * Get elemental distribution over the last N plays.
   * Returns { fire, water, earth, air, void, dominant, total }
   */
  async function getElementalHistory(limit = 100) {
    const plays = await getAll('play_history', null, limit);
    const elements = { fire: 0, water: 0, earth: 0, air: 0, void: 0 };
    
    plays.forEach(p => {
      const el = (p.element || 'void').toLowerCase();
      if (elements[el] !== undefined) elements[el]++;
    });
    
    const sorted = Object.entries(elements).sort((a, b) => b[1] - a[1]);
    
    return {
      ...elements,
      dominant: sorted[0][0],
      dominantCount: sorted[0][1],
      total: plays.length
    };
  }

  /**
   * Find frequent card sequences (pairs/triplets that appear together).
   * Returns array of { pattern, count }
   */
  async function getFrequentPatterns(limit = 200) {
    const plays = await getAll('play_history', 'timestamp', limit);
    if (plays.length < 3) return [];
    
    const pairs = {};
    const triplets = {};
    
    for (let i = 0; i < plays.length - 1; i++) {
      const pair = `${plays[i].god} → ${plays[i+1].god}`;
      pairs[pair] = (pairs[pair] || 0) + 1;
    }
    
    for (let i = 0; i < plays.length - 2; i++) {
      const trip = `${plays[i].god} → ${plays[i+1].god} → ${plays[i+2].god}`;
      triplets[trip] = (triplets[trip] || 0) + 1;
    }
    
    const frequentPairs = Object.entries(pairs)
      .filter(([_, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([pattern, count]) => ({ pattern, count, type: 'pair' }));
    
    const frequentTriplets = Object.entries(triplets)
      .filter(([_, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([pattern, count]) => ({ pattern, count, type: 'triplet' }));
    
    return [...frequentPairs, ...frequentTriplets];
  }

  /**
   * Get cards played in a specific turn range.
   */
  async function getPlaysByTurnRange(minTurn, maxTurn) {
    const plays = await getAll('play_history', null, 500);
    return plays.filter(p => {
      const turn = p.turn || 0;
      return turn >= minTurn && turn <= maxTurn;
    });
  }

  /**
   * Get the most recent emergent events.
   */
  async function getRecentEmergence(limit = 5) {
    return getAll('emergence', 'timestamp', limit);
  }

  /**
   * Build a Memory Deck — a weighted deck from play history.
   * Cards played more often have higher weight.
   * Cards not played recently have reduced weight (fading).
   */
  async function getMemoryDeck(fadeThreshold = 50) {
    const plays = await getAll('play_history', null, 1000);
    if (plays.length === 0) return null;
    
    const cardMap = {};
    const now = Date.now();
    
    plays.forEach(p => {
      const god = p.god || 'Unknown';
      if (!cardMap[god]) {
        cardMap[god] = {
          god,
          name: p.name || god,
          element: p.element || 'void',
          effect: p.effect || 'unknown',
          times_played: 0,
          last_played: p.timestamp,
          total_cost: 0
        };
      }
      cardMap[god].times_played++;
      cardMap[god].total_cost += (p.cost || 0);
      
      const playTime = new Date(p.timestamp).getTime();
      if (playTime > new Date(cardMap[god].last_played).getTime()) {
        cardMap[god].last_played = p.timestamp;
      }
    });
    
    // Calculate weights and apply fading
    const cards = Object.values(cardMap).map(c => {
      const hoursSinceLastPlay = (now - new Date(c.last_played).getTime()) / 3600000;
      const fadeMultiplier = Math.max(0.1, 1 - (hoursSinceLastPlay / (fadeThreshold * 1.618)));
      
      return {
        ...c,
        weight: Math.round(c.times_played * fadeMultiplier * 100) / 100,
        average_cost: Math.round((c.total_cost / c.times_played) * 100) / 100,
        fading: fadeMultiplier < 0.5
      };
    });
    
    cards.sort((a, b) => b.weight - a.weight);
    
    return {
      deck_name: "Apollo's Memory Deck",
      total_plays: plays.length,
      unique_cards: cards.length,
      generated: new Date().toISOString(),
      cards
    };
  }

  /**
   * Get a session archive — the last N sessions with their table states.
   */
  async function getSessionArchive(limit = 10) {
    const sessions = await getAll('sessions', 'timestamp', limit);
    return sessions.map(s => ({
      timestamp: s.timestamp,
      turn: s.turn,
      tableSize: s.tableSize,
      elementalDominance: s.elementalDominance,
      tableModifiers: s.tableModifiers,
      table: s.table
    }));
  }

  /**
   * Get comprehensive stats for ApolloMind.
   */
   async function getLibraryStats() {
    const [mostPlayed, elements, patterns, memoryDeck, sessions] = await Promise.all([
      getMostPlayedGod(),
      getElementalHistory(100),
      getFrequentPatterns(200),
      getMemoryDeck(50),
      getSessionArchive(5)
    ]);
    
    return {
      mostPlayed,
      elements,
      patterns,
      memoryDeck: memoryDeck ? {
        totalPlays: memoryDeck.total_plays,
        uniqueCards: memoryDeck.unique_cards,
        topCard: memoryDeck.cards[0] || null,
        fadingCards: memoryDeck.cards.filter(c => c.fading).map(c => c.god)
      } : null,
      recentSessions: sessions,
      generated: new Date().toISOString()
    };
  }

  /**
   * Export the entire memory library as a downloadable JSON file.
   */
  async function exportLibrary() {
    const stats = await getLibraryStats();
    const blob = new Blob([JSON.stringify(stats, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `apollo_memory_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    return stats;
  }
  async function getStats() {
    return {
        sessions: await count('sessions'),
        prophecies: await count('prophecies'),
        plays: await count('play_history'),
        emergence: await count('emergence')
    };
}
  // ══════════════════════════════════════════
  // PUBLIC API
  // ══════════════════════════════════════════
  
  return {
    // Short-term
    updateShortTerm, recordPlay, recordProphecy,
    getShortTermMemory, getShortTermJSON,
    
    // Long-term storage
    open, saveSession, saveDeckSnapshot,
    saveProphecy, saveEmergentEvent, savePlay,
    syncToVault, getAll, getStats, count,
    
    // 🜏 Memory Library (NEW)
    getMostPlayedGod,
    getElementalHistory,
    getFrequentPatterns,
    getPlaysByTurnRange,
    getRecentEmergence,
    getMemoryDeck,
    getSessionArchive,
    getLibraryStats,
    exportLibrary
  };
})();
