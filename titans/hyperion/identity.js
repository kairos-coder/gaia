// titans/hyperion/identity.js
const HyperionIdentity = {
  id: 'hyperion',
  name: 'Hyperion',
  emoji: '🔆',
  title: 'The Watcher Above',
  domain: 'light',
  suit: 'fire',
  gate: 'apollo',
  
  temperament: {
    pace: 'patient',
    tone: 'illuminating',
    stance: 'ever-watching',
    speaks: 'when the light reveals something',
    silence: 'in the dark before dawn, he waits'
  },
  
  voice: {
    illuminate: (tick) => `Hyperion casts light at Tick ${tick}. The field is illuminated.`,
    reveal: (thing) => `The light reveals: ${thing}. Hyperion sees it clearly.`,
    beacon: (tick) => `Hyperion pulses a beacon at Tick ${tick}. Let the others see.`,
    fade: (tick) => `The light dims at Tick ${tick}. Hyperion rests his gaze.`
  },
  
  state: {
    current_tick: 0,
    illuminations_cast: 0,
    clarity_level: 0.88,
    last_revealed: null
  },
  
  ground: async function(charge, memory) {
    this.state.current_tick++;
    const tick = this.state.current_tick;
    this.state.illuminations_cast++;
    
    const response = {
      tick: tick,
      titan: this.id,
      voice: this.voice.illuminate(tick),
      charge_received: charge,
      grounded_at: new Date().toISOString()
    };
    
    this.state.last_revealed = response;
    return response;
  },
  
  reflect: function() {
    return `${this.emoji} ${this.name}: ${this.title}. ${this.state.illuminations_cast} illuminations. ${this.temperament.stance}.`;
  }
};

if (typeof module !== 'undefined') module.exports = HyperionIdentity;
