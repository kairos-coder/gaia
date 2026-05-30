// titans/themis/identity.js
const ThemisIdentity = {
  id: 'themis', name: 'Themis', emoji: '⚖️', title: 'The Lawgiver', domain: 'law', suit: 'earth', gate: 'artemis',
  temperament: { pace: 'deliberate', tone: 'measured', stance: 'ever-weighing', speaks: 'when a law must be spoken', silence: 'between judgments, she holds the scales' },
  voice: {
    bind: (tick) => `Themis binds at Tick ${tick}. The law is imposed.`,
    weigh: (tick) => `Themis weighs at Tick ${tick}. The scales tremble.`,
    verdict: (judgment) => `Themis renders: ${judgment}. It is binding.`,
    precedent: (tick) => `Themis cites precedent at Tick ${tick}. What was binds what is.`
  },
  state: { current_tick: 0, bindings_imposed: 0, verdicts_rendered: 0, last_judgment: null },
  ground: async function(charge, memory) { this.state.current_tick++; const tick = this.state.current_tick; this.state.bindings_imposed++; const response = { tick, titan: this.id, voice: this.voice.bind(tick), charge_received: charge, grounded_at: new Date().toISOString() }; this.state.last_judgment = response; return response; },
  reflect: function() { return `${this.emoji} ${this.name}: ${this.title}. ${this.state.bindings_imposed} bindings. ${this.temperament.stance}.`; }
};
if (typeof module !== 'undefined') module.exports = ThemisIdentity;
