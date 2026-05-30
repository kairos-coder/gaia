// titans/themis/remember.js
const ThemisMemory = {
  layers: { fast: null, local: null, communal: null },
  init: async function() { try { const r = await fetch('titans/themis/index.json'); this.layers.fast = await r.json(); } catch(e) { this.layers.fast = { laws: [], stats: {} }; } this.layers.local = this._loadLocalMemory(); this._connectGaiaDB().then(d => { this.layers.communal = d; }).catch(() => {}); },
  query: function(l) { return { fast: this._queryFast(l), local: this._queryLocal(l), communal: this._queryCommunal(l) }; },
  remember: async function(e) { this._updateFastRecall(e); this._storeLocal(e); this._syncToGaiaDB(e); },
  forget: function(b) { this.layers.local.events = this.layers.local.events.filter(e => e.tick >= b); this._saveLocalMemory(); },
  _loadLocalMemory: function() { const s = localStorage.getItem('themis_memory'); return s ? (() => { try { return JSON.parse(s); } catch(e) {} })() : { events: [], last_tick: 0, total_events: 0 }; },
  _saveLocalMemory: function() { localStorage.setItem('themis_memory', JSON.stringify(this.layers.local)); },
  _queryFast: function(l) { return (this.layers.fast?.laws || []).filter(la => la.type === l.type).slice(-10); },
  _queryLocal: function(l) { return (this.layers.local?.events || []).filter(e => e.type === l.type).slice(-10); },
  _queryCommunal: async function(l) { return []; },
  _updateFastRecall: function(e) { if (!this.layers.fast) return; this.layers.fast.stats.total_laws++; this.layers.fast.laws.push(e); },
  _storeLocal: function(e) { this.layers.local.events.push(e); this.layers.local.last_tick = e.tick; this.layers.local.total_events++; if (this.layers.local.events.length > 1000) this.layers.local.events = this.layers.local.events.slice(-1000); this._saveLocalMemory(); },
  _syncToGaiaDB: async function(e) {},
  _connectGaiaDB: async function() { return null; }
};
if (typeof module !== 'undefined') module.exports = ThemisMemory;
