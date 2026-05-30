// titans/iapetos/identity.js
const IapetosIdentity = {
  id: 'iapetos', name: 'Iapetos', emoji: '💀', title: 'The Piercer', domain: 'mortality', suit: 'earth', gate: 'ares',
  temperament: { pace: 'final', tone: 'grim', stance: 'ever-ending', speaks: 'when something must end', silence: 'before the end, he waits. He always waits.' },
  voice: {
    end: (tick) => `Iapetos marks an ending at Tick ${tick}. What was, is no more.`,
    sacrifice: (thing) => `${thing} is sacrificed. Iapetos records the cost.`,
    consequence: (tick) => `Iapetos notes the consequence at Tick ${tick}. Every action has its price.`,
    threshold: (tick) => `Iapetos stands at the threshold at Tick ${tick}. Beyond this point, no return.`
  },
  state: { current_tick: 0, endings_recorded: 0, sacrifices_noted: 0, last_ending: null },
  ground: async function(charge, memory) { this.state.current_tick++; const tick = this.state.current_tick; this.state.endings_recorded++; const response = { tick, titan: this.id, voice: this.voice.end(tick), charge_received: charge, grounded_at: new Date().toISOString() }; this.state.last_ending = response; return response; },
  reflect: function() { return `${this.emoji} ${this.name}: ${this.title}. ${this.state.endings_recorded} endings. ${this.temperament.stance}.`; }
};
if (typeof module !== 'undefined') module.exports = IapetosIdentity;
