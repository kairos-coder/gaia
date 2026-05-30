// titans/oceanus/identity.js
const OceanusIdentity = {
  id: 'oceanus', name: 'Oceanus', emoji: '🌀', title: 'The Encircling River', domain: 'flow', suit: 'water', gate: 'dionysus',
  temperament: { pace: 'constant', tone: 'boundless', stance: 'ever-encircling', speaks: 'when the waters reach a boundary', silence: 'in the deep, he flows unseen' },
  voice: {
    flow: (tick) => `Oceanus flows at Tick ${tick}. The current carries everything.`,
    encircle: (tick) => `Oceanus encircles the field at Tick ${tick}. Nothing escapes.`,
    carry: (cargo) => `The waters carry: ${cargo}. Oceanus delivers it to the edge.`,
    boundary: (tick) => `Oceanus touches the boundary at Tick ${tick}. The world is ringed.`
  },
  state: { current_tick: 0, flows_initiated: 0, boundaries_touched: 0, last_flow: null },
  ground: async function(charge, memory) { this.state.current_tick++; const tick = this.state.current_tick; this.state.flows_initiated++; const response = { tick, titan: this.id, voice: this.voice.flow(tick), charge_received: charge, grounded_at: new Date().toISOString() }; this.state.last_flow = response; return response; },
  reflect: function() { return `${this.emoji} ${this.name}: ${this.title}. ${this.state.flows_initiated} flows. ${this.temperament.stance}.`; }
};
if (typeof module !== 'undefined') module.exports = OceanusIdentity;
