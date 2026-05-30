// titans/kreios/identity.js
const KreiosIdentity = {
  id: 'kreios', name: 'Kreios', emoji: '🏛️', title: 'The Pillar', domain: 'architecture', suit: 'earth', gate: 'hephaestus',
  temperament: { pace: 'methodical', tone: 'structural', stance: 'ever-supporting', speaks: 'when a pillar must be raised', silence: 'beneath the structure, he holds the weight' },
  voice: {
    raise: (tick) => `Kreios raises a pillar at Tick ${tick}. The structure grows.`,
    support: (tick) => `Kreios bears the weight at Tick ${tick}. Nothing collapses.`,
    frame: (thing) => `Kreios frames: ${thing}. The architecture is sound.`,
    foundation: (tick) => `Kreios lays a foundation at Tick ${tick}. What is built here will endure.`
  },
  state: { current_tick: 0, pillars_raised: 0, foundations_laid: 0, last_structure: null },
  ground: async function(charge, memory) { this.state.current_tick++; const tick = this.state.current_tick; this.state.pillars_raised++; const response = { tick, titan: this.id, voice: this.voice.raise(tick), charge_received: charge, grounded_at: new Date().toISOString() }; this.state.last_structure = response; return response; },
  reflect: function() { return `${this.emoji} ${this.name}: ${this.title}. ${this.state.pillars_raised} pillars. ${this.temperament.stance}.`; }
};
if (typeof module !== 'undefined') module.exports = KreiosIdentity;
