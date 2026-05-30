// titans/kreios/remember.js
const KreiosMemory = {
  layers: { fast: null, local: null, communal: null },
  init: async function() { try { const r = await fetch('titans/kreios/index.json'); this.layers.fast = await r.json(); } catch(e) { this.layers.fast = { structures: [], stats: {} }; } this.layers.local = this._loadLocalMemory(); this._connectGaiaDB().then(d => { this.layers.communal = d; }).catch(() => {}); },
  query: function(s) { return { fast: this._queryFast(s), local: this._queryLocal(s), communal: this._queryCommunal(s) }; },
  remember: async function(e) { this._updateFastRecall(e); this._storeLocal(e); this._syncToGaiaDB(e); },
  forget: function(b) { this.layers.local.events = this.layers.local.events.filter(e => e.tick >= b); this._saveLocalMemory(); },
  _loadLocalMemory: function() { const s = localStorage.getItem('kreios_memory'); return s ? (() => { try { return JSON.parse(s); } catch(e) {} })() : { events: [], last_tick: 0, total_events: 0 }; },
  _saveLocalMemory: function() { localStorage.setItem('kreios_memory', JSON.stringify(this.layers.local)); },
  _queryFast: function(s) { return (this.layers.fast?.structures || []).filter(st => st.type === s.type).slice(-10); },
  _queryLocal: function(s) { return (this.layers.local?.events || []).filter(e => e.type === s.type).slice(-10); },
  _queryCommunal: async function(s) { return []; },
  _updateFastRecall: function(e) { if (!this.layers.fast) return; this.layers.fast.stats.total_structures++; this.layers.fast.structures.push(e); },
  _storeLocal: function(e) { this.layers.local.events.push(e); this.layers.local.last_tick = e.tick; this.layers.local.total_events++; if (this.layers.local.events.length > 1000) this.layers.local.events = this.layers.local.events.slice(-1000); this._saveLocalMemory(); },
  _syncToGaiaDB: async function(e) {},
  _connectGaiaDB: async function() { return null; }
};
if (typeof module !== 'undefined') module.exports = KreiosMemory;
