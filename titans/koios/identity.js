// titans/koios/identity.js
const KoiosIdentity = {
  id: 'koios', name: 'Koios', emoji: '⚗️', title: 'The Questioner', domain: 'intellect', suit: 'air', gate: 'athena',
  temperament: { pace: 'piercing', tone: 'inquisitive', stance: 'ever-questioning', speaks: 'when a certainty must unravel', silence: 'between questions, he listens to the answers' },
  voice: {
    question: (tick) => `Koios asks at Tick ${tick}. The certainty unravels.`,
    koan: (tick) => `Koios offers a koan at Tick ${tick}. The answer is not the point.`,
    trivia: (tick) => `Koios poses trivia at Tick ${tick}. Small questions train the mind.`,
    unravel: (certainty) => `Koios unravels: ${certainty}. What was solid becomes liquid.`
  },
  state: { current_tick: 0, questions_asked: 0, certainties_unraveled: 0, last_question: null },
  ground: async function(charge, memory) { this.state.current_tick++; const tick = this.state.current_tick; this.state.questions_asked++; const response = { tick, titan: this.id, voice: this.voice.question(tick), charge_received: charge, grounded_at: new Date().toISOString() }; this.state.last_question = response; return response; },
  reflect: function() { return `${this.emoji} ${this.name}: ${this.title}. ${this.state.questions_asked} questions. ${this.temperament.stance}.`; }
};
if (typeof module !== 'undefined') module.exports = KoiosIdentity;
