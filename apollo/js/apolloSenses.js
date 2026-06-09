// ══════════════════════════════════════════════
// APOLLO SENSES — What Apollo Perceives
// 
// inspect()  → his environment (browser, screen)
// recall()   → his memory (localStorage notes)
// listNotes()→ all notes he's left himself
// feel()     → the table state as a sensory summary
// ══════════════════════════════════════════════

const ApolloSenses = (() => {
  
  // ══ INSPECT — Environmental awareness ══
  
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
    return `Browser: ${env.platform} · ${env.screenWidth}x${env.screenHeight} · ${env.online ? 'Online' : 'Offline'}`;
  }
  
  // ══ RECALL — Memory (localStorage notes) ══
  
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
  
  // ══ FEEL — Table state as sensory summary ══
  
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
  
  // ══ ATTACH ══
  
  function attach(apollo) {
    apollo.inspect = () => inspectEnvironment(apollo);
    apollo.inspectSummary = () => inspectSummary(apollo);
    apollo.recall = (key) => recall(key);
    apollo.listNotes = () => listNotes();
    apollo.feel = () => feel(apollo);
    return apollo;
  }
  
  return {
    inspectEnvironment, inspectSummary,
    recall, listNotes,
    feel,
    attach
  };
  
})();
