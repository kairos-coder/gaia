// titans/tethys/remember.js
const TethysMemory = {
  layers: { fast: null, local: null, communal: null },
  init: async function() { try { const r = await fetch('titans/tethys/index.json'); this.layers.fast = await r.json(); } catch(e) { this.layers.fast = { log: [], stats: {} }; } this.layers.local = this._loadLocalMemory(); this._connectGaiaDB().then(d => { this.layers.communal = d; }).catch(() => {}); },
  query: function(e) { return { fast: this._queryFast(e), local: this._queryLocal(e), communal: this._queryCommunal(e) }; },
  remember: async function(e) { this._updateFastRecall(e); this._storeLocal(e); this._syncToGaiaDB(e); },
  forget: function(b) { this.layers.local.events = this.layers.local.events.filter(e => e.tick >= b); this._saveLocalMemory(); },
  _loadLocalMemory: function() { const s = localStorage.getItem('tethys_memory'); return s ? (() => { try { return JSON.parse(s); } catch(e) {} })() : { events: [], last_tick: 0, total_events: 0 }; },
  _saveLocalMemory: function() { localStorage.setItem('tethys_memory', JSON.stringify(this.layers.local)); },
  _queryFast: function(e) { return (this.layers.fast?.log || []).filter(l => l.type === e.type).slice(-10); },
  _queryLocal: function(e) { return (this.layers.local?.events || []).filter(ev => ev.type === e.type).slice(-10); },
  _queryCommunal: async function(e) { return []; },
  _updateFastRecall: function(e) { if (!this.layers.fast) return; this.layers.fast.stats.total_events++; this.layers.fast.stats.by_type[e.type] = (this.layers.fast.stats.by_type[e.type] || 0) + 1; this.layers.fast.log.push(e); },
  _storeLocal: function(e) { this.layers.local.events.push(e); this.layers.local.last_tick = e.tick; this.layers.local.total_events++; if (this.layers.local.events.length > 1000) this.layers.local.events = this.layers.local.events.slice(-1000); this._saveLocalMemory(); },
  _syncToGaiaDB: async function(e) {},
  _connectGaiaDB: async function() { return null; }
};
if (typeof module !== 'undefined') module.exports = TethysMemory;
