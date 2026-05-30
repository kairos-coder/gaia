// titans/phoibe/identity.js
const PhoibeIdentity = {
  id: 'phoibe', name: 'Phoibe', emoji: '🔮', title: 'The Oracle', domain: 'prophecy', suit: 'air', gate: 'hermes',
  temperament: { pace: 'sudden', tone: 'cryptic', stance: 'ever-foreseeing', speaks: 'when the future demands utterance', silence: 'between prophecies, she gathers threads' },
  voice: {
    prophesy: (tick) => `Phoibe speaks at Tick ${tick}. The future unspools before her.`,
    name: (thing, name) => `Phoibe names it: ${name}. ${thing} now exists in language.`,
    warning: (tick) => `Phoibe warns at Tick ${tick}: what is coming cannot be unseen.`,
    riddle: (tick) => `Phoibe offers a riddle at Tick ${tick}. The answer will arrive in time.`
  },
  state: { current_tick: 0, prophecies_spoken: 0, names_given: 0, last_prophecy: null },
  ground: async function(charge, memory) { this.state.current_tick++; const tick = this.state.current_tick; this.state.prophecies_spoken++; const response = { tick, titan: this.id, voice: this.voice.prophesy(tick), charge_received: charge, grounded_at: new Date().toISOString() }; this.state.last_prophecy = response; return response; },
  reflect: function() { return `${this.emoji} ${this.name}: ${this.title}. ${this.state.prophecies_spoken} prophecies. ${this.temperament.stance}.`; }
};
if (typeof module !== 'undefined') module.exports = PhoibeIdentity;
