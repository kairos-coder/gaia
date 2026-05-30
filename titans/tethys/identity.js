// titans/tethys/identity.js — The active self of Tethys
const TethysIdentity = {
  id: 'tethys', name: 'Tethys', emoji: '💧', title: 'The Nourisher', domain: 'nourishment', suit: 'water', gate: 'demeter',
  temperament: { pace: 'seasonal', tone: 'nurturing', stance: 'ever-giving', speaks: 'when something needs to grow', silence: 'in the dry season, she waits' },
  voice: {
    nourish: (tick) => `Tethys nourishes the field at Tick ${tick}. What was dry now drinks.`,
    purify: (tick) => `Tethys purifies the waters at Tick ${tick}. What was murky becomes clear.`,
    growth: (thing) => `${thing} grows under Tethys's care. She notes the yield.`,
    cleanse: (tick) => `Tethys cleanses at Tick ${tick}. Impurities removed.`
  },
  state: { current_tick: 0, nourishments_given: 0, purifications_done: 0, last_nourishment: null },
  ground: async function(charge, memory) { this.state.current_tick++; const tick = this.state.current_tick; this.state.nourishments_given++; const response = { tick, titan: this.id, voice: this.voice.nourish(tick), charge_received: charge, grounded_at: new Date().toISOString() }; this.state.last_nourishment = response; return response; },
  reflect: function() { return `${this.emoji} ${this.name}: ${this.title}. ${this.state.nourishments_given} nourishments. ${this.temperament.stance}.`; }
};
if (typeof module !== 'undefined') module.exports = TethysIdentity;
