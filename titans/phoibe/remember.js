// titans/phoibe/remember.js
const PhoibeMemory = {
  layers: { fast: null, local: null, communal: null },
  init: async function() { try { const r = await fetch('titans/phoibe/index.json'); this.layers.fast = await r.json(); } catch(e) { this.layers.fast = { prophecies: [], stats: {} }; } this.layers.local = this._loadLocalMemory(); this._connectGaiaDB().then(d => { this.layers.communal = d; }).catch(() => {}); },
  query: function(p) { return { fast: this._queryFast(p), local: this._queryLocal(p), communal: this._queryCommunal(p) }; },
  remember: async function(e) { this._updateFastRecall(e); this._storeLocal(e); this._syncToGaiaDB(e); },
  forget: function(b) { this.layers.local.events = this.layers.local.events.filter(e => e.tick >= b); this._saveLocalMemory(); },
  _loadLocalMemory: function() { const s = localStorage.getItem('phoibe_memory'); return s ? (() => { try { return JSON.parse(s); } catch(e) {} })() : { events: [], last_tick: 0, total_events: 0 }; },
  _saveLocalMemory: function() { localStorage.setItem('phoibe_memory', JSON.stringify(this.layers.local)); },
  _queryFast: function(p) { return (this.layers.fast?.prophecies || []).filter(pr => pr.type === p.type).slice(-10); },
  _queryLocal: function(p) { return (this.layers.local?.events || []).filter(e => e.type === p.type).slice(-10); },
  _queryCommunal: async function(p) { return []; },
  _updateFastRecall: function(e) { if (!this.layers.fast) return; this.layers.fast.stats.total_prophecies++; this.layers.fast.prophecies.push(e); },
  _storeLocal: function(e) { this.layers.local.events.push(e); this.layers.local.last_tick = e.tick; this.layers.local.total_events++; if (this.layers.local.events.length > 1000) this.layers.local.events = this.layers.local.events.slice(-1000); this._saveLocalMemory(); },
  _syncToGaiaDB: async function(e) {},
  _connectGaiaDB: async function() { return null; }
};
if (typeof module !== 'undefined') module.exports = PhoibeMemory;
