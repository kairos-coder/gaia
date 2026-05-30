// titans/hyperion/remember.js — Memory interface for Hyperion
const HyperionMemory = {
  layers: { fast: null, local: null, communal: null },
  init: async function() {
    try { const resp = await fetch('titans/hyperion/index.json'); this.layers.fast = await resp.json(); } catch (e) { this.layers.fast = { index: [], stats: {} }; }
    this.layers.local = this._loadLocalMemory();
    this._connectGaiaDB().then(db => { this.layers.communal = db; }).catch(() => {});
  },
  query: function(light) { return { fast: this._queryFast(light), local: this._queryLocal(light), communal: this._queryCommunal(light) }; },
  remember: async function(event) { this._updateFastRecall(event); this._storeLocal(event); this._syncToGaiaDB(event); },
  forget: function(beforeTick) { this.layers.local.events = this.layers.local.events.filter(e => e.tick >= beforeTick); this._saveLocalMemory(); },
  _loadLocalMemory: function() { const s = localStorage.getItem('hyperion_memory'); return s ? (() => { try { return JSON.parse(s); } catch (e) {} })() : { events: [], last_tick: 0, total_events: 0 }; },
  _saveLocalMemory: function() { localStorage.setItem('hyperion_memory', JSON.stringify(this.layers.local)); },
  _queryFast: function(l) { return (this.layers.fast?.index || []).filter(i => i.type === l.type).slice(-10); },
  _queryLocal: function(l) { return (this.layers.local?.events || []).filter(e => e.type === l.type).slice(-10); },
  _queryCommunal: async function(l) { return []; },
  _updateFastRecall: function(e) { if (!this.layers.fast) return; this.layers.fast.stats.total_illuminations++; this.layers.fast.index.push(e); },
  _storeLocal: function(e) { this.layers.local.events.push(e); this.layers.local.last_tick = e.tick; this.layers.local.total_events++; if (this.layers.local.events.length > 1000) this.layers.local.events = this.layers.local.events.slice(-1000); this._saveLocalMemory(); },
  _syncToGaiaDB: async function(e) {},
  _connectGaiaDB: async function() { return null; }
};
if (typeof module !== 'undefined') module.exports = HyperionMemory;
