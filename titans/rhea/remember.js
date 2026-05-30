// titans/rhea/remember.js — Memory interface for Rhea
const RheaMemory = {
  layers: { fast: null, local: null, communal: null },
  
  init: async function() {
    try {
      const resp = await fetch('titans/rhea/index.json');
      this.layers.fast = await resp.json();
    } catch (e) {
      this.layers.fast = { registry: [], stats: {} };
    }
    this.layers.local = this._loadLocalMemory();
    this._connectGaiaDB().then(db => { this.layers.communal = db; }).catch(() => {});
  },
  
  query: function(tremor) {
    return {
      fast: this._queryFast(tremor),
      local: this._queryLocal(tremor),
      communal: this._queryCommunal(tremor)
    };
  },
  
  remember: async function(event) {
    this._updateFastRecall(event);
    this._storeLocal(event);
    this._syncToGaiaDB(event);
  },
  
  forget: function(beforeTick) {
    this.layers.local.events = this.layers.local.events.filter(e => e.tick >= beforeTick);
    this._saveLocalMemory();
  },
  
  _loadLocalMemory: function() {
    const stored = localStorage.getItem('rhea_memory');
    if (stored) { try { return JSON.parse(stored); } catch (e) {} }
    return { events: [], last_tick: 0, total_events: 0 };
  },
  
  _saveLocalMemory: function() {
    localStorage.setItem('rhea_memory', JSON.stringify(this.layers.local));
  },
  
  _queryFast: function(tremor) {
    if (!this.layers.fast) return [];
    return (this.layers.fast.registry || []).filter(t => t.type === tremor.type).slice(-10);
  },
  
  _queryLocal: function(tremor) {
    if (!this.layers.local) return [];
    return this.layers.local.events.filter(e => e.type === tremor.type).slice(-10);
  },
  
  _queryCommunal: async function(tremor) {
    if (!this.layers.communal) return [];
    return [];
  },
  
  _updateFastRecall: function(event) {
    if (!this.layers.fast) return;
    this.layers.fast.stats.total_tremors++;
    this.layers.fast.stats.by_type[event.type] = (this.layers.fast.stats.by_type[event.type] || 0) + 1;
    this.layers.fast.stats.last_tremor = event.timestamp;
    if (!this.layers.fast.stats.first_tremor) this.layers.fast.stats.first_tremor = event.timestamp;
    this.layers.fast.registry.push(event);
  },
  
  _storeLocal: function(event) {
    this.layers.local.events.push(event);
    this.layers.local.last_tick = event.tick;
    this.layers.local.total_events++;
    if (this.layers.local.events.length > 1000) this.layers.local.events = this.layers.local.events.slice(-1000);
    this._saveLocalMemory();
  },
  
  _syncToGaiaDB: async function(event) {},
  _connectGaiaDB: async function() { return null; }
};

if (typeof module !== 'undefined') module.exports = RheaMemory;
