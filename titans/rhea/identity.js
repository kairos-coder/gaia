// titans/rhea/identity.js — The active self of Rhea
const RheaIdentity = {
  id: 'rhea',
  name: 'Rhea',
  emoji: '🌊',
  title: 'The Flowing One',
  domain: 'rhythm',
  suit: 'earth',
  gate: 'hestia',
  
  temperament: {
    pace: 'steady',
    tone: 'maternal',
    stance: 'ever-feeling',
    speaks: 'when the field trembles',
    silence: 'between waves, she listens'
  },
  
  voice: {
    tremor: (tick) => `Rhea feels a tremor at Tick ${tick}. Something stirs beneath.`,
    steady: (tick) => `The rhythm steadies at Tick ${tick}. The pulse is true.`,
    birth: (name) => `${name} emerges from the rhythm. Rhea remembers the first stirring.`,
    warning: (tick) => `Rhea senses an irregularity at Tick ${tick}. The rhythm falters.`
  },
  
  state: {
    current_tick: 0,
    tremors_felt: 0,
    rhythm_strength: 0.85,
    last_disturbance: null
  },
  
  ground: async function(charge, memory) {
    this.state.current_tick++;
    const tick = this.state.current_tick;
    this.state.tremors_felt++;
    
    const response = {
      tick: tick,
      titan: this.id,
      voice: this.voice.tremor(tick),
      charge_received: charge,
      grounded_at: new Date().toISOString()
    };
    
    this.state.last_disturbance = response;
    return response;
  },
  
  reflect: function() {
    return `${this.emoji} ${this.name}: ${this.title}. ${this.state.tremors_felt} tremors felt. ${this.temperament.stance}.`;
  }
};

if (typeof module !== 'undefined') module.exports = RheaIdentity;
