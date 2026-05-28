// ═══════════════════════════════════════════════
// kronos/remember.js — Memory interface for Kronos
// Queries across all memory layers: fast recall, local long-term, and communal GaiaDB
// ═══════════════════════════════════════════════

const KronosMemory = {
  
  // ── MEMORY LAYERS ──
  layers: {
    fast: null,        // identity.json loaded into memory
    local: null,       // memory.json loaded from localStorage
    communal: null     // GaiaDB connection (if available)
  },
  
  // ── INITIALIZE ──
  // Load all memory layers. Called once when Kronos wakes.
  init: async function() {
    // Layer 1: Fast recall (identity.json — abstracted past)
    try {
      const resp = await fetch('titans/kronos/identity.json');
      this.layers.fast = await resp.json();
      console.log('⏳ Kronos fast recall loaded:', this.layers.fast.lessons.length, 'lessons');
    } catch (e) {
      console.warn('⏳ Kronos fast recall unavailable, using defaults');
      this.layers.fast = { lessons: [], patterns: [], totals: {} };
    }
    
    // Layer 2: Local long-term (memory.json via localStorage)
    this.layers.local = this._loadLocalMemory();
    console.log('⏳ Kronos local memory loaded:', this.layers.local.events.length, 'events');
    
    // Layer 3: Communal (GaiaDB — async, non-blocking)
    this._connectGaiaDB().then(db => {
      this.layers.communal = db;
      console.log('⏳ Kronos connected to GaiaDB');
    }).catch(() => {
      console.log('⏳ Kronos running without GaiaDB — local memory only');
    });
  },
  
  // ── QUERY ──
  // The main interface. Charge asks memory: "What do you know about this?"
  query: function(charge) {
    return {
      fast: this._queryFast(charge),
      local: this._queryLocal(charge),
      communal: this._queryCommunal(charge) // Returns promise
    };
  },
  
  // ── REMEMBER ──
  // Store a new grounding event across all layers
  remember: async function(event) {
    // Update fast recall patterns
    this._updateFastRecall(event);
    
    // Store in local memory
    this._storeLocal(event);
    
    // Sync to GaiaDB (async)
    this._syncToGaiaDB(event);
    
    console.log('⏳ Kronos remembers:', event.voice?.substring(0, 50));
  },
  
  // ── FORGET ──
  // Prune old memories (called when localStorage nears limit)
  forget: function(beforeTick) {
    this.layers.local.events = this.layers.local.events.filter(
      e => e.tick >= beforeTick
    );
    this._saveLocalMemory();
    console.log('⏳ Kronos has forgotten events before Tick', beforeTick);
  },
  
  // ═══════════════════════════════════════
  // PRIVATE METHODS
  // ═══════════════════════════════════════
  
  _loadLocalMemory: function() {
    const stored = localStorage.getItem('kronos_memory');
    if (stored) {
      try { return JSON.parse(stored); } catch (e) { /* corrupted, rebuild */ }
    }
    return { events: [], last_tick: 0, total_events: 0 };
  },
  
  _saveLocalMemory: function() {
    localStorage.setItem('kronos_memory', JSON.stringify(this.layers.local));
  },
  
  _queryFast: function(charge) {
    if (!this.layers.fast) return null;
    
    // Find matching patterns
    const matchingPatterns = (this.layers.fast.patterns || [])
      .filter(p => p.charge_type === charge.type);
    
    // Find relevant lessons
    const matchingLessons = (this.layers.fast.lessons || [])
      .filter(l => l.charge_type === charge.type);
    
    return {
      patterns: matchingPatterns,
      lessons: matchingLessons,
      totals: this.layers.fast.totals
    };
  },
  
  _queryLocal: function(charge) {
    if (!this.layers.local) return [];
    
    // Find similar past events
    return this.layers.local.events
      .filter(e => e.charge_type === charge.type)
      .slice(-10); // Last 10 similar events
  },
  
  _queryCommunal: async function(charge) {
    if (!this.layers.communal) return [];
    
    // Query GaiaDB for events from all Titans with similar charge
    try {
      // Stub: actual Supabase query goes here
      return [];
    } catch (e) {
      return [];
    }
  },
  
  _updateFastRecall: function(event) {
    if (!this.layers.fast) return;
    
    // Increment totals
    this.layers.fast.totals.ticks_marked++;
    this.layers.fast.totals.charges_grounded++;
    
    // Update or create pattern
    const pattern = (this.layers.fast.patterns || []).find(
      p => p.charge_type === event.charge_type
    );
    if (pattern) {
      pattern.frequency++;
      pattern.typical_coherence = 
        (pattern.typical_coherence * (pattern.frequency - 1) + event.coherence) / pattern.frequency;
    }
    
    this.layers.fast.last_updated = new Date().toISOString();
  },
  
  _storeLocal: function(event) {
    this.layers.local.events.push(event);
    this.layers.local.last_tick = event.tick;
    this.layers.local.total_events++;
    
    // Keep last 1000 events in local memory
    if (this.layers.local.events.length > 1000) {
      this.layers.local.events = this.layers.local.events.slice(-1000);
    }
    
    this._saveLocalMemory();
  },
  
  _syncToGaiaDB: async function(event) {
    if (!this.layers.communal) return;
    // Stub: INSERT into Supabase
    console.log('⏳ Syncing to GaiaDB:', event.tick);
  },
  
  _connectGaiaDB: async function() {
    // Stub: Supabase connection
    // Returns null if no connection available
    return null;
  }
};

// Export
if (typeof module !== 'undefined') module.exports = KronosMemory;
