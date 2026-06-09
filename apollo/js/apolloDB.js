// ══════════════════════════════════════════════
// APOLLO DB — The God of Light's Memory Vault
// Short-term: Monaco JSON block (last 5 plays)
// Long-term: IndexedDB (all sessions, persistent)
// Lives in: gaia/apollo/js/apolloDB.js
// ══════════════════════════════════════════════

const ApolloDB = (() => {
  const DB_NAME = 'apollo_memory';
  const DB_VERSION = 1;
  let db = null;
  
  // ══════════════════════════════════════════
  // SHORT-TERM MEMORY (in-memory, written to Monaco)
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
      value: c.value, tokens: c.tokens,
      row: c.row, col: c.col, turnsOnTable: c.turnsOnTable
    }));
    
    shortTermMemory.currentHand = apollo.hand.map(c => ({
      god: c.god, name: c.name, cost: c.cost, element: c.element
    }));
    
    shortTermMemory.elementalState = { ...apollo.elementalDominance };
    shortTermMemory.loopMemory = apollo._loopMemory ? 
      { god: apollo._loopMemory.god, name: apollo._loopMemory.name } : null;
    shortTermMemory.timestamp = new Date().toISOString();
    shortTermMemory.emergentEvents = apollo.persistentState.emergentEvents.slice(-3);
  }
  
  function recordPlay(card) {
    shortTermMemory.lastPlays.push({
      timestamp: new Date().toISOString(),
      god: card.god, name: card.name,
      effect: card.effect, element: card.element, cost: card.cost
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
  
  async function open() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        if (!db.objectStoreNames.contains('sessions')) {
          const store = db.createObjectStore('sessions', { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('turn', 'turn', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('deck_snapshots')) {
          const store = db.createObjectStore('deck_snapshots', { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('prophecies')) {
          const store = db.createObjectStore('prophecies', { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('emergence')) {
          const store = db.createObjectStore('emergence', { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('type', 'type', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('play_history')) {
          const store = db.createObjectStore('play_history', { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('god', 'god', { unique: false });
          store.createIndex('effect', 'effect', { unique: false });
        }
      };
      
      request.onsuccess = (event) => {
        db = event.target.result;
        console.log('☀️ ApolloDB: Memory vault opened');
        resolve(db);
      };
      
      request.onerror = (event) => {
        console.error('☀️ ApolloDB: Failed to open vault', event.target.error);
        reject(event.target.error);
      };
    });
  }
  
  async function put(storeName, data) {
    if (!db) await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.put(data);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  
  async function getAll(storeName, indexName, limit = 50) {
    if (!db) await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const index = indexName ? store.index(indexName) : store;
      const request = index.openCursor(null, 'prev');
      const results = [];
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor && results.length < limit) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }
  
  async function count(storeName) {
    if (!db) await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  
  async function saveSession(apollo) {
    const cards = apollo.getAllCardsOnTable();
    return put('sessions', {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      turn: apollo.turn, mana: apollo.mana,
      tableSize: cards.length, handSize: apollo.hand.length,
      deckSize: apollo.drawPile.length, graveyardSize: apollo.graveyard.length,
      elementalDominance: { ...apollo.elementalDominance },
      tableModifiers: [...apollo.tableModifiers],
      loopMemory: apollo._loopMemory ? apollo._loopMemory.god || apollo._loopMemory.name : null,
      table: cards.map(c => ({
        god: c.god, name: c.name, element: c.element,
        value: c.value, tokens: { ...c.tokens }, row: c.row, col: c.col
      }))
    });
  }
  
  async function savePlay(card) {
    return put('play_history', {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      god: card.god, name: card.name,
      effect: card.effect, element: card.element,
      cost: card.cost, value: card.value
    });
  }
  
  async function saveProphecy(cards) {
    return put('prophecies', {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      cards: cards.map(c => ({ god: c.god, name: c.name })),
      text: cards.map(c => c.god || c.name).join(', ')
    });
  }
  
  async function saveEmergentEvent(event, type) {
    return put('emergence', {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      event: event, type: type
    });
  }
  
  async function saveDeckSnapshot(apollo) {
    return put('deck_snapshots', {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      turn: apollo.turn,
      drawPileCount: apollo.drawPile.length,
      discardCount: apollo.discard.length,
      drawPileTop: apollo.drawPile.slice(-3).reverse().map(c => c.god || c.name)
    });
  }
  
  async function syncToVault(apollo) {
    updateShortTerm(apollo);
    const lastPlay = shortTermMemory.lastPlays[shortTermMemory.lastPlays.length - 1];
    if (lastPlay) await savePlay(lastPlay);
    if (apollo.turn % 2 === 0) await saveSession(apollo);
  }
  
  async function getStats() {
    return {
      sessions: await count('sessions'),
      prophecies: await count('prophecies'),
      plays: await count('play_history'),
      emergentEvents: await count('emergence'),
      shortTermPlays: shortTermMemory.lastPlays.length,
      currentTableSize: shortTermMemory.currentTable.length
    };
  }
  
  async function getMostPlayedGod() {
    const plays = await getAll('play_history', null, 1000);
    const counts = {};
    plays.forEach(p => { counts[p.god] = (counts[p.god] || 0) + 1; });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted.length > 0 ? { god: sorted[0][0], count: sorted[0][1] } : null;
  }
  
  return {
    updateShortTerm, recordPlay, recordProphecy,
    getShortTermMemory, getShortTermJSON,
    open, saveSession, saveDeckSnapshot,
    saveProphecy, saveEmergentEvent, savePlay,
    syncToVault, getAll, getStats, getMostPlayedGod, count
  };
})();
