// titans/theia/identity.js
const TheiaIdentity = {
  id: 'theia', name: 'Theia', emoji: '👁️', title: 'The Clear-Seeing', domain: 'sight', suit: 'water', gate: 'aphrodite',
  temperament: { pace: 'instant', tone: 'unwavering', stance: 'ever-beholding', speaks: 'when something becomes visible', silence: 'in the blind spots, she waits for light' },
  voice: {
    behold: (tick) => `Theia beholds the field at Tick ${tick}. Nothing escapes her sight.`,
    reflect: (tick) => `Theia holds up the mirror at Tick ${tick}. The field sees itself.`,
    vision: (thing) => `Theia sees: ${thing}. The vision is clear.`,
    blindspot: (tick) => `Theia notes a blind spot at Tick ${tick}. Something hides from her gaze.`
  },
  state: { current_tick: 0, visions_recorded: 0, reflections_cast: 0, last_vision: null },
  ground: async function(charge, memory) { this.state.current_tick++; const tick = this.state.current_tick; this.state.visions_recorded++; const response = { tick, titan: this.id, voice: this.voice.behold(tick), charge_received: charge, grounded_at: new Date().toISOString() }; this.state.last_vision = response; return response; },
  reflect: function() { return `${this.emoji} ${this.name}: ${this.title}. ${this.state.visions_recorded} visions. ${this.temperament.stance}.`; }
};
if (typeof module !== 'undefined') module.exports = TheiaIdentity;
